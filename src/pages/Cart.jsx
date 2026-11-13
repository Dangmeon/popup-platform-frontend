import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/Cart.css'
import { useApp } from '../context/AppContext.jsx'
import { getCart, deleteCartItem, updateCartItem } from '../api/cartApi'
import { featuredGoods } from '../data/featuredPopups.js'

function getErrorMessage(error) {
  const status = error.response?.status
  if (status === 401 || status === 403) {
    return '로그인 인증을 확인하지 못했습니다. 다시 로그인해 주세요.'
  }
  const message = error.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  return error.response
    ? '요청을 처리하지 못했습니다. 다시 시도해 주세요.'
    : error.message || '장바구니를 불러오지 못했습니다.'
}

function formatPrice(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('ko-KR')}원`
    : '가격 확인 필요'
}

function lineTotal(item) {
  if (typeof item.itemTotalPrice === 'number') return item.itemTotalPrice
  if (typeof item.price === 'number') return item.price * item.quantity
  return 0
}

const isBuyable = (item) => item.purchasable !== false

export default function Cart() {
  const app = useApp()
  const owner = app.currentUser?.username || app.currentUser?.email || 'guest'
  return <CartPage key={owner} authed={Boolean(app.isAuthenticated)} />
}

function CartPage({ authed }) {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const mounted = useRef(false)
  const lock = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setActionError('')

      try {
        let list = []
        if (authed) {
          try {
            const data = await getCart()
            list = Array.isArray(data) ? data : []
          } catch (apiErr) {
            const localData = JSON.parse(localStorage.getItem('popq_cart') || '[]')
            list = localData.map((it, idx) => ({
              cartId: it.id || idx,
              productId: it.id,
              productName: it.name,
              productImg: it.image,
              price: it.price,
              quantity: it.qty || 1,
              purchasable: true,
            }))
          }
        } else {
          const localData = JSON.parse(localStorage.getItem('popq_cart') || '[]')
          list = localData.map((it, idx) => ({
            cartId: it.id || idx,
            productId: it.id,
            productName: it.name,
            productImg: it.image,
            price: it.price,
            quantity: it.qty || 1,
            purchasable: true,
          }))
        }

        if (!active) return

        setItems(list)
        setSelected(new Set(list.filter(isBuyable).map((i) => i.cartId)))
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [authed, reloadKey])

  const buyable = items.filter(isBuyable)
  const selectedItems = items.filter((i) => selected.has(i.cartId))
  const allChecked = buyable.length > 0 && buyable.every((i) => selected.has(i.cartId))
  const selectedCount = selectedItems.length
  const productTotal = selectedItems.reduce((sum, i) => sum + lineTotal(i), 0)

  function toggleOne(cartId) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cartId)) next.delete(cartId)
      else next.add(cartId)
      return next
    })
  }

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(buyable.map((i) => i.cartId)))
  }

  async function changeQty(item, delta) {
    const next = item.quantity + delta
    if (next < 1 || lock.current) return

    lock.current = true
    setBusy(true)
    setActionError('')

    try {
      if (authed) {
        await updateCartItem(item.cartId, next)
      } else {
        const localData = JSON.parse(localStorage.getItem('popq_cart') || '[]')
        const updated = localData.map(it => (it.id === item.productId || it.id === item.cartId) ? { ...it, qty: next } : it)
        localStorage.setItem('popq_cart', JSON.stringify(updated))
      }

      if (mounted.current) {
        setItems((prev) =>
          prev.map((i) =>
            i.cartId === item.cartId
              ? {
                  ...i,
                  quantity: next,
                  itemTotalPrice:
                    typeof i.price === 'number' ? i.price * next : i.itemTotalPrice,
                }
              : i
          )
        )
      }
    } catch (requestError) {
      if (mounted.current) setActionError(getErrorMessage(requestError))
    } finally {
      lock.current = false
      if (mounted.current) setBusy(false)
    }
  }

  async function removeItems(cartIds) {
    if (cartIds.length === 0 || lock.current) return

    lock.current = true
    setBusy(true)
    setActionError('')

    if (authed) {
      const results = await Promise.allSettled(cartIds.map((id) => deleteCartItem(id)))
      if (mounted.current) {
        const removed = new Set(cartIds.filter((_, idx) => results[idx].status === 'fulfilled'))
        const failed = results.find((r) => r.status === 'rejected')

        setItems((prev) => prev.filter((i) => !removed.has(i.cartId)))
        setSelected((prev) => new Set([...prev].filter((id) => !removed.has(id))))
        if (failed) setActionError(getErrorMessage(failed.reason))
        setBusy(false)
      }
    } else {
      const localData = JSON.parse(localStorage.getItem('popq_cart') || '[]')
      const removedSet = new Set(cartIds)
      const updated = localData.filter((it, idx) => !removedSet.has(it.id || idx))
      localStorage.setItem('popq_cart', JSON.stringify(updated))

      if (mounted.current) {
        setItems((prev) => prev.filter((i) => !removedSet.has(i.cartId)))
        setSelected((prev) => new Set([...prev].filter((id) => !removedSet.has(id))))
        setBusy(false)
      }
    }

    lock.current = false
  }

  function deleteSelected() {
    if (selectedCount === 0) return
    if (!window.confirm(`선택한 ${selectedCount}개 상품을 삭제할까요?`)) return
    removeItems(selectedItems.map((i) => i.cartId))
  }

  function deleteOne(item) {
    if (!window.confirm('이 상품을 장바구니에서 삭제할까요?')) return
    removeItems([item.cartId])
  }

  function goCheckout() {
    if (selectedCount === 0) return

    navigate('/checkout', {
      state: {
        items: selectedItems.map((i) => ({
          cartId: i.cartId,
          productId: i.productId,
          quantity: i.quantity,
          name: i.productName,
          price: i.price,
          image: i.productImg,
        })),
      },
    })
  }

  // 추천 상품 목록 (다양한 팝업 상품이 골고루 섞이도록 랜덤 추출)
  const recommendedGoods = useMemo(() => {
    if (!Array.isArray(featuredGoods) || featuredGoods.length === 0) return []
    const shuffled = [...featuredGoods].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 4)
  }, [])

  let body
  if (loading) {
    body = <p role="status" className="cp-status">장바구니를 불러오는 중입니다.</p>
  } else if (error) {
    body = (
      <div className="cp-empty">
        <p role="alert">{error}</p>
        <button type="button" className="cp-btn-sub cp-btn-inline" onClick={() => setReloadKey((k) => k + 1)}>
          다시 불러오기
        </button>
      </div>
    )
  } else if (items.length === 0) {
    body = (
      <div className="cp-empty">
        <p>장바구니가 비어있어요.</p>
        <Link to="/goods" className="cp-btn-main cp-btn-inline" style={{ backgroundColor: '#293323' }}>
          굿즈 구경하러 가기
        </Link>
      </div>
    )
  } else {
    body = (
      <ul className="cp-items">
        {items.map((item) => {
          const ok = isBuyable(item)
          return (
            <li className={`cp-item${ok ? '' : ' is-disabled'}`} key={item.cartId} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f3f5' }}>
              <input
                type="checkbox"
                className="cp-check"
                checked={selected.has(item.cartId)}
                disabled={!ok || busy}
                onChange={() => toggleOne(item.cartId)}
                aria-label={`${item.productName || '상품'} 선택`}
                style={{ marginRight: '16px' }}
              />
              <img
                className="cp-thumb"
                src={item.productImg || '/mascot-empty.png'}
                alt=""
                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', marginRight: '16px' }}
              />
              <div className="cp-info" style={{ flex: 1 }}>
                <div className="cp-name" style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{item.productName || '상품 정보 없음'}</div>
                <div className="cp-unit" style={{ color: '#4b5563', fontSize: '14px' }}>{formatPrice(item.price)}</div>
                {!ok && <p className="cp-warn" style={{ color: '#e11d48', fontSize: '12px' }}>{item.unavailableReason || '현재 구매할 수 없는 상품입니다.'}</p>}
              </div>

              <div className="cp-qty" style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden', marginRight: '24px' }}>
                <button type="button" disabled={busy || item.quantity <= 1} onClick={() => changeQty(item, -1)} style={{ padding: '6px 12px', background: '#fff', border: 'none', cursor: 'pointer' }}>−</button>
                <span style={{ padding: '0 10px', fontSize: '14px', fontWeight: '600' }}>{item.quantity}</span>
                <button type="button" disabled={busy} onClick={() => changeQty(item, 1)} style={{ padding: '6px 12px', background: '#fff', border: 'none', cursor: 'pointer' }}>+</button>
              </div>

              <div className="cp-line" style={{ fontWeight: '700', fontSize: '15px', width: '90px', textAlign: 'right', marginRight: '20px' }}>{formatPrice(lineTotal(item))}</div>

              <button type="button" className="cp-x" disabled={busy} onClick={() => deleteOne(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9ca3af' }}>✕</button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="container cp-page" aria-busy={loading} style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <nav className="cp-crumb" aria-label="현재 위치" style={{ marginBottom: '16px', fontSize: '13px', color: '#6b7684' }}>
        <Link to="/">홈</Link> <span style={{ margin: '0 4px' }}>›</span> <span>장바구니</span>
      </nav>

      <h1 className="cp-title" style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>장바구니</h1>

      <div className="cp-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* 왼쪽: 장바구니 목록 카드 박스 */}
        <section className="cp-panel" style={{ background: '#fff', border: '1px solid #e5e8eb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="cp-panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e8eb', paddingBottom: '16px', marginBottom: '16px' }}>
            <label className="cp-all" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
              <input
                type="checkbox"
                className="cp-check"
                checked={allChecked}
                disabled={buyable.length === 0 || busy}
                onChange={toggleAll}
              />
              <span>전체 선택 ({selectedCount}/{items.length})</span>
            </label>

            <button
              type="button"
              className="cp-del"
              disabled={selectedCount === 0 || busy}
              onClick={deleteSelected}
              style={{ background: 'none', border: 'none', color: '#6b7684', cursor: 'pointer', fontSize: '13px' }}
            >
              선택 삭제
            </button>
          </div>

          {actionError && <p className="cp-error" role="alert" style={{ color: '#e11d48', fontSize: '13px', marginBottom: '12px' }}>{actionError}</p>}

          {body}
        </section>

        {/* 오른쪽: 주문 요약 카드 박스 */}
        <aside className="cp-summary" style={{ background: '#fff', border: '1px solid #e5e8eb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid #e5e8eb', paddingBottom: '12px' }}>주문 요약</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '15px', color: '#4b5563' }}>
            <span>상품 금액 ({selectedCount}개)</span>
            <span>{formatPrice(productTotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e8eb', paddingTop: '16px', marginBottom: '24px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700' }}>총 결제 금액</span>
            <strong style={{ fontSize: '20px', fontWeight: '800', color: '#293323' }}>{formatPrice(productTotal)}</strong>
          </div>

          <button
            type="button"
            className="cp-btn-main cp-order"
            disabled={selectedCount === 0 || busy || loading}
            onClick={goCheckout}
            style={{
              width: '100%',
              padding: '16px 0',
              backgroundColor: '#293323', // #293323 색상 적용
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedCount === 0 ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(41, 51, 35, 0.25)',
              marginBottom: '16px'
            }}
          >
            주문하기 ›
          </button>

          <p style={{ fontSize: '12px', color: '#6b7684', textAlign: 'center', background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
            ✓ 결제는 토스페이먼츠(Toss Payments)로 안전하게 진행됩니다.
          </p>
        </aside>
      </div>

      {/* 하단: 함께 보면 좋은 상품 추천 영역 */}
      <section style={{ marginTop: '48px', background: '#fff', border: '1px solid #e5e8eb', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>함께 보면 좋은 상품</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {recommendedGoods.map((g) => (
            <Link key={g.id} to={`/popups/${g.popupId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #f1f3f5', borderRadius: '12px', overflow: 'hidden', background: '#fafafa' }}>
                <img src={g.image} alt={g.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#293323' }}>{formatPrice(g.price)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ marginTop: '24px' }}>
        <Link to="/goods" style={{ color: '#4b5563', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          ← 계속 쇼핑하기
        </Link>
      </div>
    </div>
  )
}