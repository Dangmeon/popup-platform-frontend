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

// 날짜/날짜시간 값을 로컬/KST 기준으로 파싱 (isEnd=true면 날짜만 있을 때 23:59:59.999)
function parseDateMs(value, isEnd = false) {
  if (!value) return NaN
  if (typeof value === 'number') return value

  const str = String(value).trim()

  // 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:mm:ss' / 'YYYY-MM-DDTHH:mm:ss' 형태
  const isoMatch = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?(?:Z|[+-]\d{2}:?\d{2})?$/
  )
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    const hasTime = isoMatch[4] !== undefined
    const hour = hasTime ? Number(isoMatch[4]) : (isEnd ? 23 : 0)
    const min = hasTime ? Number(isoMatch[5]) : (isEnd ? 59 : 0)
    const sec = hasTime ? Number(isoMatch[6]) : (isEnd ? 59 : 0)
    const ms = hasTime ? 0 : (isEnd ? 999 : 0)

    // 타임존 표기가 명시된 ISO 문자열은 표준 Date 파싱 사용
    if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(str)) {
      const parsedWithTz = new Date(str).getTime()
      return Number.isFinite(parsedWithTz) ? parsedWithTz : NaN
    }
    return new Date(year, month, day, hour, min, sec, ms).getTime()
  }

  // Oracle 기본 출력 형식 'YY/MM/DD' 또는 'YY/MM/DD HH:mm:ss' 형태
  const yyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/)
  if (yyMatch) {
    const year = 2000 + Number(yyMatch[1])
    const month = Number(yyMatch[2]) - 1
    const day = Number(yyMatch[3])
    const hasTime = yyMatch[4] !== undefined
    const hour = hasTime ? Number(yyMatch[4]) : (isEnd ? 23 : 0)
    const min = hasTime ? Number(yyMatch[5]) : (isEnd ? 59 : 0)
    const sec = hasTime ? Number(yyMatch[6]) : (isEnd ? 59 : 0)
    const ms = hasTime ? 0 : (isEnd ? 999 : 0)
    return new Date(year, month, day, hour, min, sec, ms).getTime()
  }

  const parsed = new Date(str).getTime()
  return Number.isFinite(parsed) ? parsed : NaN
}

// 굿즈 판매 기간 및 재고에 따라 상태 결정
function getSaleState(g) {
  const now = Date.now()
  const startMs = parseDateMs(g.saleStart, false)
  const endMs = parseDateMs(g.saleEnd, true)
  const rawStatus = String(g.saleStatus ?? '').trim().toUpperCase()

  // 1. 재고 소진 우선 확인
  if (g.stock !== null && g.stock <= 0) {
    return { canPurchase: false, statusText: '품절', isSoldOut: true }
  }

  // 2. 판매 시작일 이전이면 '판매예정'
  if (Number.isFinite(startMs) && now < startMs) {
    return { canPurchase: false, statusText: '판매예정', isSoldOut: false }
  }

  // 3. 판매 종료일 이후면 '판매종료'
  if (Number.isFinite(endMs) && now > endMs) {
    return { canPurchase: false, statusText: '판매종료', isSoldOut: false }
  }

  // 4. 날짜 정보가 없을 때만 서버 상태 문자열 보조 반영
  if (!Number.isFinite(startMs) && !Number.isFinite(endMs) && rawStatus) {
    if (['UPCOMING', 'SCHEDULED', 'BEFORE_SALE', '판매예정'].includes(rawStatus)) {
      return { canPurchase: false, statusText: '판매예정', isSoldOut: false }
    }
    if (['ENDED', 'CLOSED', '판매종료'].includes(rawStatus)) {
      return { canPurchase: false, statusText: '판매종료', isSoldOut: false }
    }
    if (['SOLD_OUT', 'OUT_OF_STOCK', '품절'].includes(rawStatus)) {
      return { canPurchase: false, statusText: '품절', isSoldOut: true }
    }
  }

  return { canPurchase: true, statusText: null, isSoldOut: false }
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

export default function ShopGoodsCard({ goods, to }) {
  const app = useApp()
  const nav = useNavigate()
  const [adding, setAdding] = React.useState(false)
  const lockRef = React.useRef(false)
  const g = normalize(goods)

  const saleState = getSaleState(g)
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
      <Link to={to || '#'} className="sg-img">
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