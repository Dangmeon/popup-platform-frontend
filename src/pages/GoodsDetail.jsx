import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProduct, getPopup } from '../api/popupApi.js'
import { getProductSaleInfo } from '../utils/productSaleState.js'
import { useApp } from '../context/AppContext.jsx'
import { addCartItem } from '../api/cartApi'

function formatPrice(price) {
  return price > 0 ? `${price.toLocaleString()}원` : '가격 미정'
}

function resolveDbPrdId(g) {
  const candidate = g?.prdId ?? g?.serverId ?? g?.productId ?? g?.id
  if (candidate === undefined || candidate === null || candidate === '') return null
  const num = typeof candidate === 'number' ? candidate : Number(candidate)
  return Number.isSafeInteger(num) && num >= 1 ? num : null
}

function getAddCartErrorMessage(error) {
  const data = error?.response?.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    const fieldMsgs = Object.values(data).filter((v) => typeof v === 'string' && v.trim())
    if (fieldMsgs.length > 0) return fieldMsgs.join('\n')
  }
  return error?.message || '장바구니에 담지 못했습니다. 다시 시도해 주세요.'
}

export default function GoodsDetail() {
  const { prdId } = useParams()
  const navigate = useNavigate()
  const app = useApp()

  const [goods, setGoods] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const lockRef = useRef(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [prdId])

  useEffect(() => {
    let alive = true
    setQty(1)
    setGoods(null)
    setLoading(true)
    setError('')
    async function load() {
      try {
        const id = Number(prdId)
        if (!Number.isSafeInteger(id) || id < 1) throw new Error('상품 번호를 확인해 주세요.')
        const product = await getProduct(id)
        if (Number(product.id) !== id) throw new Error('상품 정보를 확인하지 못했습니다.')
        let popup = null
        if (product.popupId) {
          try { popup = await getPopup(product.popupId) } catch { /* 상품 정보는 표시하고 팝업명은 대체 문구로 표시합니다. */ }
        }
        if (alive) setGoods({...product, popupName:popup?.title || ''})
      } catch (e) {
        if (alive) setError(e.response?.status === 404 ? '상품을 찾을 수 없어요.' : '상품 상세 정보를 불러오지 못했어요.')
      } finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [prdId])

  const saleInfo = useMemo(() => getProductSaleInfo(goods), [goods])
  const detail = { summary:goods?.description || '등록된 상품 설명이 없습니다.' }

  const maxStock = typeof goods?.stock === 'number' && goods.stock > 0 ? goods.stock : 99
  const maxByRule = typeof goods?.maxQty === 'number' && goods.maxQty > 0 ? goods.maxQty : maxStock
  const maxSelectable = Math.max(1, Math.min(maxStock, maxByRule))

  const handleAddToCart = async () => {
    if (!goods || !saleInfo.canPurchase || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 담을 수 있어요')
      navigate('/login')
      return
    }

    const dbPrdId = resolveDbPrdId(goods)
    if (!dbPrdId) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    lockRef.current = true
    setAdding(true)
    try {
      await addCartItem(dbPrdId, qty)
      app.showToast?.('장바구니에 담았어요')
    } catch (err) {
      const status = err?.response?.status
      if (status === 401 || status === 403) {
        app.showToast?.('로그인 인증을 확인하지 못했습니다. 다시 로그인해 주세요.')
        navigate('/login')
      } else {
        alert(getAddCartErrorMessage(err))
      }
    } finally {
      lockRef.current = false
      setAdding(false)
    }
  }

  const handleBuyNow = () => {
    if (!goods || !saleInfo.canPurchase || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 구매할 수 있어요')
      navigate('/login')
      return
    }

    const dbPrdId = resolveDbPrdId(goods)
    if (!dbPrdId) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    navigate('/checkout', {
      state: {
        items: [
          {
            prdId: dbPrdId,
            quantity: qty,
            name: goods.name,
            price: goods.price,
            image: goods.image,
          },
        ],
      },
    })
  }

  if (loading || (goods && String(goods.id) !== String(prdId))) {
    return (
      <div className="container" style={{ padding: '48px 16px' }}>
        <div className="empty-state" role="status">상품 상세 정보를 불러오고 있어요.</div>
      </div>
    )
  }

  if (error || !goods) {
    return (
      <div className="container" style={{ padding: '48px 16px' }}>
        <div className="empty-state" role="alert">
          {error || '상품을 찾을 수 없어요.'}
          <div style={{ marginTop: '14px' }}>
            <button type="button" className="gs-reset" onClick={() => navigate('/goods')}>
              굿즈 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const unitPrice = Number(goods.price) || 0
  const totalPrice = unitPrice * qty

  return (
    <div className="container" style={{ padding: '32px 16px 72px', maxWidth: '1080px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← 뒤로 가기
        </button>

        {goods.popupId && (
          <Link
            to={`/popups/${goods.popupId}`}
            style={{ fontSize: '14px', color: '#68754B', fontWeight: 700, textDecoration: 'none' }}
          >
            {goods.popupName || '팝업스토어'} 상세 보기 →
          </Link>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            aspectRatio: '1 / 1',
            borderRadius: '18px',
            overflow: 'hidden',
            backgroundColor: '#f9f5f0',
            position: 'relative',
          }}
        >
          {saleInfo.badge ? (
            <span
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                zIndex: 1,
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                backgroundColor: saleInfo.badge === '판매예정' ? '#4b5563' : '#9ca3af',
                color: '#fff',
              }}
            >
              {saleInfo.badge}
            </span>
          ) : (
            goods.limited && (
              <span
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  zIndex: 1,
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  backgroundColor: '#1c1917',
                  color: '#fff',
                }}
              >
                한정판
              </span>
            )
          )}
          <img
            src={goods.image}
            alt={goods.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: goods.imageFit || 'cover',
              display: 'block',
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
            {goods.popupName || '팝업스토어'}
            {goods.category ? ` · ${goods.category}` : ''}
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: '26px', lineHeight: 1.35, color: '#1c1917' }}>
            {goods.name}
          </h1>

          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1c1917', marginBottom: '14px' }}>
            {formatPrice(unitPrice)}
          </div>

          {typeof goods.stock === 'number' && (
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '18px' }}>
              남은 재고: <strong>{goods.stock > 0 ? `${goods.stock}개` : '품절'}</strong>
              {maxSelectable < 99 && saleInfo.canPurchase ? ` · 선택 가능 수량 최대 ${maxSelectable}개` : ''}
            </div>
          )}

          <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.7, color: '#374151' }}>
            {detail.summary}
          </p>

          {saleInfo.canPurchase && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderTop: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '20px',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={adding || qty <= 1}
                  style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                >
                  -
                </button>
                <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxSelectable, q + 1))}
                  disabled={adding || qty >= maxSelectable}
                  style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                >
                  +
                </button>
              </div>

              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1c1917' }}>
                총 금액: {formatPrice(totalPrice)}
              </div>
            </div>
          )}

          {saleInfo.canPurchase ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                disabled={adding}
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  height: '44px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: adding ? 'not-allowed' : 'pointer',
                }}
              >
                {adding ? '담는 중…' : '장바구니'}
              </button>
              <button
                type="button"
                disabled={adding}
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  height: '44px',
                  backgroundColor: '#68754B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: adding ? 'not-allowed' : 'pointer',
                }}
              >
                구매하기
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              style={{
                width: '100%',
                height: '44px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'not-allowed',
              }}
            >
              {saleInfo.buttonLabel || '구매 불가'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
