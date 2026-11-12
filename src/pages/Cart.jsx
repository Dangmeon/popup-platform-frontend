import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/Cart.css'
import { useApp } from '../context/AppContext.jsx'
import { getCart, deleteCartItem } from '../api/cartApi'
import axiosInstance from '../api/axiosInstance.js'

// 수량 변경: PATCH /api/cart/items/{cartItemId}  (body: { quantity })
// TODO: cartApi.js 로 옮겨도 된다. axiosInstance import 형태는 cartApi.js 와 똑같이 맞출 것
async function updateCartItemQuantity(cartItemId, quantity) {
  const res = await axiosInstance.patch(`/api/cart/items/${cartItemId}`, { quantity })
  return res.data?.data ?? res.data
}

const won = n => `₩${Math.round(n).toLocaleString('ko-KR')}`

// 오류 안내
function getErrorMessage(error) {
  const status = error.response?.status

  if (status === 401 || status === 403) {
    return '로그인 인증을 확인하지 못했습니다. 다시 로그인해 주세요.'
  }

  const message = error.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message

  if (!error.response && error.request) {
    return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return error.response
    ? '요청을 처리하지 못했습니다. 다시 시도해 주세요.'
    : error.message || '장바구니를 불러오지 못했습니다.'
}

// 서버 상품 ID (주문 생성에 필요). 응답 필드명이 다르면 여기만 고친다
function getProductId(item) {
  return item.productId ?? item.product?.productId ?? item.product?.id ?? null
}

// 한 줄 금액: 서버가 준 itemTotalPrice 우선, 없으면 단가 x 수량
function lineTotal(item) {
  if (typeof item.itemTotalPrice === 'number' && Number.isFinite(item.itemTotalPrice)) {
    return item.itemTotalPrice
  }
  if (typeof item.price === 'number' && typeof item.quantity === 'number') {
    return item.price * item.quantity
  }
  return null
}

const isBuyable = item => item.purchasable !== false

// 로그인 여부 확인 + 회원이 바뀌면 화면 초기화
export default function Cart() {
  const app = useApp()

  if (!app.isAuthenticated) {
    return (
      <div className="ct-page">
        <h1 className="ct-title">장바구니</h1>
        <div className="ct-empty">
          <p>로그인 후 장바구니를 확인해 주세요.</p>
          <Link to="/login" className="ct-btn-primary">로그인</Link>
        </div>
      </div>
    )
  }

  const owner = app.currentUser?.username || app.currentUser?.email
  return <CartContents key={owner} />
}

function CartContents() {
  const nav = useNavigate()

  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const lock = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // 목록 조회
  useEffect(() => {
    let active = true

    async function loadCart() {
      setLoading(true)
      setError('')
      setActionError('')

      try {
        const data = await getCart()
        if (!active) return
        const list = Array.isArray(data) ? data : []
        setItems(list)
        // 구매 가능한 상품은 처음에 모두 선택
        setSelected(new Set(list.filter(isBuyable).map(i => i.cartId)))
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCart()
    return () => { active = false }
  }, [reloadKey])

  const buyableItems = useMemo(() => items.filter(isBuyable), [items])
  const allChecked = buyableItems.length > 0 && buyableItems.every(i => selected.has(i.cartId))

  const pickedItems = items.filter(i => selected.has(i.cartId))
  const pickedTotal = pickedItems.reduce((sum, i) => sum + (lineTotal(i) ?? 0), 0)
  const hasUnknownPrice = pickedItems.some(i => lineTotal(i) === null)

  function toggleOne(cartId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(cartId)) next.delete(cartId)
      else next.add(cartId)
      return next
    })
  }

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(buyableItems.map(i => i.cartId)))
  }

  // 수량 변경 (서버 성공 후 화면 반영)
  async function changeQty(item, delta) {
    const next = item.quantity + delta
    if (next < 1 || lock.current) return

    lock.current = true
    setBusy(true)
    setActionError('')

    try {
      await updateCartItemQuantity(item.cartId, next)
      if (!mounted.current) return
      setItems(prev => prev.map(i => {
        if (i.cartId !== item.cartId) return i
        const unit = typeof i.price === 'number' ? i.price : null
        return {
          ...i,
          quantity: next,
          itemTotalPrice: unit !== null ? unit * next : i.itemTotalPrice,
        }
      }))
    } catch (requestError) {
      if (mounted.current) setActionError(getErrorMessage(requestError))
    } finally {
      lock.current = false
      if (mounted.current) setBusy(false)
    }
  }

  // 삭제 (한 개 또는 선택한 여러 개)
  async function removeItems(cartIds) {
    if (cartIds.length === 0 || lock.current) return

    lock.current = true
    setBusy(true)
    setActionError('')

    const removed = []
    try {
      for (const cartId of cartIds) {
        await deleteCartItem(cartId)
        removed.push(cartId)
      }
    } catch (requestError) {
      if (mounted.current) setActionError(getErrorMessage(requestError))
    } finally {
      lock.current = false
      if (mounted.current) {
        setItems(prev => prev.filter(i => !removed.includes(i.cartId)))
        setSelected(prev => {
          const next = new Set(prev)
          removed.forEach(id => next.delete(id))
          return next
        })
        setBusy(false)
      }
    }
  }

  function handleDeleteOne(cartId) {
    if (!window.confirm('이 상품을 장바구니에서 삭제할까요?')) return
    removeItems([cartId])
  }

  function handleDeleteSelected() {
    if (selected.size === 0) {
      setActionError('삭제할 상품을 선택해 주세요.')
      return
    }
    if (!window.confirm(`선택한 ${selected.size}개 상품을 삭제할까요?`)) return
    removeItems([...selected])
  }

  // 주문하기: 선택한 상품을 결제 화면으로 넘긴다
  function handleOrder() {
    setActionError('')

    if (pickedItems.length === 0) {
      setActionError('주문할 상품을 선택해 주세요.')
      return
    }

    const missing = pickedItems.filter(i => getProductId(i) == null)
    if (missing.length > 0) {
      console.warn('장바구니 응답에서 상품 ID(productId)를 찾지 못했어요', missing)
      setActionError('상품 정보를 확인하지 못했어요. 관리자에게 문의해 주세요.')
      return
    }

    nav('/checkout', {
      state: {
        items: pickedItems.map(i => ({
          id: getProductId(i),
          productId: getProductId(i),
          name: i.productName || '상품',
          option: '',
          price: typeof i.price === 'number' ? i.price : (lineTotal(i) ?? 0) / i.quantity,
          qty: i.quantity,
          quantity: i.quantity,
          image: i.productImg || '',
        })),
      },
    })
  }

  return (
    <div className="ct-page" aria-busy={loading}>
      <nav className="ct-crumb" aria-label="현재 위치">
        <Link to="/">홈</Link>
        <span>›</span>
        <span>장바구니</span>
      </nav>

      <div className="ct-title-row">
        <h1 className="ct-title">장바구니</h1>
        {!loading && !error && items.length > 0 && (
          <img src="/mascot-cart.png" alt="쇼핑 중인 너구리" className="cart-mascot-bounce" />
        )}
      </div>

      {loading ? (
        <p role="status" className="ct-status">장바구니를 불러오는 중입니다.</p>
      ) : error ? (
        <div className="ct-empty">
          <p role="alert">{error}</p>
          <button type="button" className="ct-btn-line" onClick={() => setReloadKey(k => k + 1)}>
            다시 조회
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="ct-empty">
          <img src="/mascot-empty.png" alt="빈 장바구니 너구리" className="cart-empty-mascot" />
          <p>장바구니가 비어있어요.</p>
          <Link to="/goods" className="ct-btn-primary">상품 구경하러 가기</Link>
        </div>
      ) : (
        <>
          <div className="ct-layout">
            <section className="ct-card">
              <div className="ct-head">
                <label className="ct-check-label">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    disabled={busy || buyableItems.length === 0}
                  />
                  <span>전체 선택 ({items.length}개)</span>
                </label>
                <button type="button" className="ct-text-btn" onClick={handleDeleteSelected} disabled={busy}>
                  🗑 선택 삭제
                </button>
              </div>

              {items.map(item => {
                const buyable = isBuyable(item)
                const total = lineTotal(item)
                return (
                  <div className={`ct-row${buyable ? '' : ' ct-row-off'}`} key={item.cartId}>
                    <input
                      type="checkbox"
                      className="ct-row-check"
                      checked={selected.has(item.cartId)}
                      onChange={() => toggleOne(item.cartId)}
                      disabled={busy || !buyable}
                      aria-label={`${item.productName || '상품'} 선택`}
                    />

                    <img className="ct-thumb" src={item.productImg || '/mascot-empty.png'} alt="" />

                    <div className="ct-info">
                      <div className="ct-name">{item.productName || '상품 정보 없음'}</div>
                      <div className="ct-unit">
                        {typeof item.price === 'number' ? won(item.price) : '가격 확인 필요'}
                      </div>
                      {!buyable && (
                        <p className="ct-warn">
                          {item.unavailableReason || '현재 구매할 수 없는 상품입니다.'}
                        </p>
                      )}
                    </div>

                    <div className="ct-qty" aria-label="수량">
                      <button
                        type="button"
                        onClick={() => changeQty(item, -1)}
                        disabled={busy || item.quantity <= 1}
                        aria-label="수량 줄이기"
                      >−</button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(item, 1)}
                        disabled={busy}
                        aria-label="수량 늘리기"
                      >+</button>
                    </div>

                    <div className="ct-line">{total === null ? '가격 확인 필요' : won(total)}</div>

                    <button
                      type="button"
                      className="ct-del"
                      onClick={() => handleDeleteOne(item.cartId)}
                      disabled={busy}
                      aria-label={`${item.productName || '상품'} 삭제`}
                    >×</button>
                  </div>
                )
              })}
            </section>

            <aside className="ct-summary">
              <h2>주문 요약</h2>

              <div className="ct-sum-row">
                <span>상품 금액 ({pickedItems.length}개)</span>
                <span>{won(pickedTotal)}</span>
              </div>

              <div className="ct-sum-total">
                <span>총 결제 금액</span>
                <strong>{won(pickedTotal)}</strong>
              </div>

              {hasUnknownPrice && (
                <p className="ct-warn">가격을 확인하지 못한 상품이 있어요. 최종 금액은 주문 시 다시 확인돼요.</p>
              )}
              {actionError && <p className="ct-error" role="alert">{actionError}</p>}

              <button
                type="button"
                className="ct-order"
                onClick={handleOrder}
                disabled={busy || pickedItems.length === 0}
              >
                주문하기 &nbsp;›
              </button>

              <div className="ct-notice">
                🛡 결제는 토스페이먼츠(Toss Payments)로 안전하게 진행될 수 있습니다.
              </div>
            </aside>
          </div>

          <Link to="/goods" className="ct-continue">← 계속 쇼핑하기</Link>
        </>
      )}
    </div>
  )
}