import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Cart.css'
import { useApp } from '../context/AppContext.jsx'
import { getCart, deleteCartItem } from '../api/cartApi'

// 오류 안내
function getErrorMessage(error) {
  const status = error.response?.status

  if (status === 401 || status === 403) {
    return '로그인 인증을 확인하지 못했습니다. 다시 로그인해 주세요.'
  }

  const message = error.response?.data?.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (!error.response && error.request) {
    return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return error.response
    ? '요청을 처리하지 못했습니다. 다시 시도해 주세요.'
    : error.message || '장바구니를 불러오지 못했습니다.'
}

// 금액 표시
function formatPrice(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('ko-KR')}원`
    : '가격 확인 필요'
}

// 회원 변경 시 화면 초기화
export default function Cart() {
  const app = useApp()

  if (!app.isAuthenticated) {
    return (
      <div className="container">
        <h1 className="page-title" style={{ margin: '32px 0' }}>
          장바구니
        </h1>

        <div className="empty-state cart-empty">
          <p>로그인 후 장바구니를 확인해 주세요.</p>
          <Link to="/login" className="btn btn-primary">
            로그인
          </Link>
        </div>
      </div>
    )
  }

  const owner =
    app.currentUser?.username || app.currentUser?.email

  return <CartContents key={owner} />
}

function CartContents() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const deleteLock = useRef(false)
  const mounted = useRef(false)

  // 화면 종료 후 응답 반영 방지
  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  // 실제 목록 조회
  useEffect(() => {
    let active = true

    async function loadCart() {
      setLoading(true)
      setError('')
      setActionError('')

      try {
        const data = await getCart()

        if (active) {
          setItems(data)
        }
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadCart()

    return () => {
      active = false
    }
  }, [reloadKey])

  // 서버 삭제 성공 후 화면 반영
  async function handleDelete(cartId) {
    if (deleteLock.current) return
    if (!window.confirm('이 상품을 장바구니에서 삭제할까요?')) {
      return
    }

    deleteLock.current = true
    setDeletingId(cartId)
    setActionError('')

    try {
      await deleteCartItem(cartId)

      if (mounted.current) {
        setItems((previous) =>
          previous.filter((item) => item.cartId !== cartId)
        )
      }
    } catch (requestError) {
      if (mounted.current) {
        setActionError(getErrorMessage(requestError))
      }
    } finally {
      deleteLock.current = false

      if (mounted.current) {
        setDeletingId(null)
      }
    }
  }

  const hasValidPrices = items.every(
    (item) =>
      typeof item.itemTotalPrice === 'number' &&
      Number.isFinite(item.itemTotalPrice) &&
      item.itemTotalPrice >= 0
  )

  const total = hasValidPrices
    ? items.reduce((sum, item) => sum + item.itemTotalPrice, 0)
    : null

  return (
    <div className="container" aria-busy={loading}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 className="page-title" style={{ margin: '32px 0' }}>
          장바구니
        </h1>

        {!loading && !error && items.length > 0 && (
          <img
            src="/mascot-cart.png"
            alt="쇼핑 중인 너구리"
            className="cart-mascot-bounce"
          />
        )}
      </div>

      <button
        type="button"
        className="btn btn-outline"
        style={{ marginBottom: 20 }}
        disabled={loading || deletingId !== null}
        onClick={() => setReloadKey((previous) => previous + 1)}
      >
        목록 다시 조회
      </button>

      {loading ? (
        <p role="status">장바구니를 불러오는 중입니다.</p>
      ) : error ? (
        <div className="empty-state cart-empty">
          <p role="alert">{error}</p>
          <p>위의 목록 다시 조회 버튼으로 재시도해 주세요.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state cart-empty">
          <img
            src="/mascot-empty.png"
            alt="빈 장바구니 너구리"
            className="cart-empty-mascot"
          />

          <p>장바구니가 비어있어요.</p>

          <Link
            to="/popups"
            className="btn btn-primary"
            style={{ marginTop: 16, display: 'inline-block' }}
          >
            상품 구경하러 가기
          </Link>
        </div>
      ) : (
        <>
          {actionError && (
            <p className="form-error" role="alert">
              {actionError}
            </p>
          )}

          {items.map((item) => (
            <div className="cart-row" key={item.cartId}>
              <img
                src={item.productImg || '/mascot-empty.png'}
                alt=""
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="card-title">
                  {item.productName || '상품 정보 없음'}
                </div>

                <div className="card-sub">
                  {formatPrice(item.price)}
                </div>

                {item.purchasable === false && (
                  <p className="form-error">
                    {item.unavailableReason ||
                      '현재 구매할 수 없는 상품입니다.'}
                  </p>
                )}
              </div>

              <div className="qty-box">
                <span>{item.quantity}개</span>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                disabled={deletingId !== null}
                aria-label={`${item.productName || '상품'} 삭제`}
                onClick={() => handleDelete(item.cartId)}
              >
                {deletingId === item.cartId ? '삭제 중…' : '삭제'}
              </button>
            </div>
          ))}

          <div className="cart-summary">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              <span>담은 상품 합계</span>
              <span>{formatPrice(total)}</span>
            </div>

            <p style={{ marginTop: 12 }}>
              구매 불가 상품도 합계에 포함됩니다.
              최종 주문 금액은 주문 시 다시 확인합니다.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 16 }}
              disabled
            >
              주문 기능 준비 중
            </button>
          </div>
        </>
      )}
    </div>
  )
}