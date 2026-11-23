import { getProductSaleInfo } from '../../utils/productSaleState.js'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addCartItem } from '../../api/cartApi.js'
import { useApp } from '../../context/AppContext.jsx'
import './ShopGoodsCard.css'

// 서버 상품·프론트 임시 굿즈 둘 다 받는다. 필드명이 다르면 이 함수만 고친다
function normalize(g) {
  return {
    id: g.prdId ?? g.serverId ?? g.id,
    name: g.productName ?? g.name ?? '상품',
    price: typeof g.price === 'number' ? g.price : null,
    image: g.productImg ?? g.imageUrl ?? g.image ?? '',
    popupName: g.popupName ?? g.popup ?? '',
    badge: g.badge ?? (g.limited ? 'LIMITED' : ''),
    stock: typeof g.stock === 'number' ? g.stock : null,
    saleStatus: g.saleStatus ?? null,
    saleStart: g.saleStart ?? g.sale_start ?? null,
    saleEnd: g.saleEnd ?? g.sale_end ?? null,
  }
}

function getErrorMessage(e) {
  const data = e?.response?.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    const fieldMsgs = Object.values(data).filter((v) => typeof v === 'string' && v.trim())
    if (fieldMsgs.length > 0) return fieldMsgs.join(' ')
  }
  return e?.message || '장바구니에 담지 못했어요'
}

export default function ShopGoodsCard({ goods, to, state }) {
  const app = useApp()
  const nav = useNavigate()
  const [adding, setAdding] = React.useState(false)
  const lockRef = React.useRef(false)
  const g = normalize(goods)

  const saleState = getProductSaleInfo(g)
  const disabled = adding || !saleState.canPurchase
  const statusLabel = adding ? '담는 중…' : saleState.statusText

  async function handleAdd() {
    if (disabled || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 담을 수 있어요')
      nav('/login')
      return
    }

    const prdId = Number(g.id)
    if (!Number.isSafeInteger(prdId) || prdId < 1) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    lockRef.current = true
    setAdding(true)
    try {
      await addCartItem(prdId, 1)
      app.showToast?.('장바구니에 담았어요')
    } catch (e) {
      const status = e?.response?.status
      if (status === 401 || status === 403) {
        app.showToast?.('로그인이 필요해요')
        nav('/login')
      } else {
        app.showToast?.(getErrorMessage(e))
      }
    } finally {
      lockRef.current = false
      setAdding(false)
    }
  }

  function handleBuy() {
    if (disabled || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 구매할 수 있어요')
      nav('/login')
      return
    }

    const prdId = Number(g.id)
    if (!Number.isSafeInteger(prdId) || prdId < 1) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    nav('/checkout', {
      state: {
        items: [
          {
            prdId,
            quantity: 1,
            name: g.name,
            price: g.price ?? 0,
            image: g.image,
          },
        ],
      },
    })
  }

  return (
    <article className="sg-card">
      <Link to={to || '#'} state={state} className="sg-img">
        {saleState.statusText ? (
          <span className="sg-badge">{saleState.statusText}</span>
        ) : (
          g.badge && <span className="sg-badge">{g.badge}</span>
        )}
        {g.image ? <img src={g.image} alt={g.name} /> : <div className="sg-noimg">이미지 없음</div>}
      </Link>

      <div className="sg-body">
        <div className="sg-popup">{g.popupName || '\u00A0'}</div>
        <div className="sg-name">{g.name}</div>
        <div className="sg-price">{g.price !== null ? `${g.price.toLocaleString()}원` : '가격 미정'}</div>
        <div className={`sg-stock${saleState.isSoldOut ? ' is-out' : ''}`}>
          {g.stock !== null ? (saleState.isSoldOut ? '품절' : `재고 ${g.stock}개`) : '\u00A0'}
        </div>

        <div className="sg-actions">
          {saleState.canPurchase ? (
            <>
              <button
                type="button"
                className="sg-btn sg-btn-cart"
                onClick={handleAdd}
                disabled={disabled}
              >
                {adding ? '담는 중…' : '장바구니'}
              </button>
              <button
                type="button"
                className="sg-btn sg-btn-buy"
                onClick={handleBuy}
                disabled={disabled}
              >
                구매하기
              </button>
            </>
          ) : (
            <button
              type="button"
              className="sg-btn sg-btn-disabled"
              disabled
            >
              {statusLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
