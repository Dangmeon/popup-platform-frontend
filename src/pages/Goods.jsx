import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPopups, getPopupProducts } from '../api/popupApi.js'
import { useApp } from '../context/AppContext.jsx'
import { addCartItem } from '../api/cartApi'
import '../styles/Goods.css'

const PAGE_SIZE = 20

function formatPrice(price) {
  return price > 0 ? `${price.toLocaleString()}원` : '가격 미정'
}

function resolveDbPrdId(g) {
  const candidate = g.prdId ?? g.serverId ?? g.productId ?? g.id
  if (candidate === undefined || candidate === null || candidate === '') return null
  const num = typeof candidate === 'number' ? candidate : Number(candidate)
  return Number.isSafeInteger(num) && num >= 1 ? num : null
}

function parseSaleDateMs(value, isEnd = false) {
  if (!value) return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  if (value instanceof Date) {
    const ms = value.getTime()
    return Number.isFinite(ms) ? ms : NaN
  }

  const str = String(value).trim()
  if (!str) return NaN

  const isoMatch = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?(?:Z|[+-]\d{2}:?\d{2})?$/
  )
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    const hasTime = isoMatch[4] !== undefined
    const hour = hasTime ? Number(isoMatch[4]) : isEnd ? 23 : 0
    const min = hasTime ? Number(isoMatch[5]) : isEnd ? 59 : 0
    const sec = hasTime ? Number(isoMatch[6]) : isEnd ? 59 : 0
    const ms = hasTime ? 0 : isEnd ? 999 : 0

    if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(str)) {
      const tzMs = new Date(str).getTime()
      return Number.isFinite(tzMs) ? tzMs : NaN
    }
    return new Date(year, month, day, hour, min, sec, ms).getTime()
  }

  const yyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/)
  if (yyMatch) {
    const year = 2000 + Number(yyMatch[1])
    const month = Number(yyMatch[2]) - 1
    const day = Number(yyMatch[3])
    const hasTime = yyMatch[4] !== undefined
    const hour = hasTime ? Number(yyMatch[4]) : isEnd ? 23 : 0
    const min = hasTime ? Number(yyMatch[5]) : isEnd ? 59 : 0
    const sec = hasTime ? Number(yyMatch[6]) : isEnd ? 59 : 0
    const ms = hasTime ? 0 : isEnd ? 999 : 0
    return new Date(year, month, day, hour, min, sec, ms).getTime()
  }

  const fallback = new Date(str).getTime()
  return Number.isFinite(fallback) ? fallback : NaN
}

function getProductSaleInfo(g) {
  const now = Date.now()
  const rawStart = g.saleStart ?? g.sale_start ?? g.startDate ?? g.start_date
  const rawEnd = g.saleEnd ?? g.sale_end ?? g.endDate ?? g.end_date
  const status = String(g.saleStatus ?? g.status ?? '').trim().toUpperCase()

  const startMs = parseSaleDateMs(rawStart, false)
  const endMs = parseSaleDateMs(rawEnd, true)

  const isSoldOut =
    g.soldOut === true ||
    (typeof g.stock === 'number' && g.stock <= 0)

  if (isSoldOut) {
    return { phase: 'ENDED', canPurchase: false, badge: '품절', buttonLabel: '품절' }
  }

  if (
    Number.isFinite(startMs)
      ? now < startMs
      : ['UPCOMING', 'SCHEDULED', 'BEFORE_SALE', '판매예정'].includes(status)
  ) {
    return { phase: 'UPCOMING', canPurchase: false, badge: '판매예정', buttonLabel: '판매예정' }
  }

  if (
    Number.isFinite(endMs)
      ? now > endMs
      : ['ENDED', 'CLOSED', '판매종료'].includes(status)
  ) {
    return { phase: 'ENDED', canPurchase: false, badge: '판매종료', buttonLabel: '판매종료' }
  }

  return { phase: 'ON_SALE', canPurchase: true, badge: null, buttonLabel: null }
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

export default function Goods() {
  const app = useApp()
  const navigate = useNavigate()
  const [addingId, setAddingId] = useState(null)
  const lockRef = useRef(false)
  const [params, setParams] = useSearchParams()
  const popup = params.get('popup') || 'all'
  const [category, setCategory] = useState('전체')
  const [saleFilter, setSaleFilter] = useState('ON_SALE')
  const [bannerIdx, setBannerIdx] = useState(0)
  const [goods, setGoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('default')
  const isFirstFilterRender = useRef(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    setGoods([])
    async function load() {
      try {
        const stores = await getPopups()
        const batches = await Promise.all(
          stores.map(async (store) =>
            (await getPopupProducts(store.id)).map((item) => ({
              ...item,
              popupId: String(store.id),
              popupName: store.title,
            }))
          )
        )
        if (alive) setGoods(batches.flat())
      } catch {
        if (alive) setError('상품을 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [retry])

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % 3)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false
      return
    }
    const target = document.getElementById('gs-list')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [popup, category, sort, saleFilter])

  const setPopup = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('popup')
    else next.set('popup', id)
    setParams(next)
    setPage(1)
  }

  // 판매 상태 필터를 먼저 적용한 기준 상품 목록 (카테고리 카운트와 일치)
  const statusScopedGoods = useMemo(() => {
    if (saleFilter === 'ALL') return goods
    return goods.filter((g) => getProductSaleInfo(g).phase === saleFilter)
  }, [goods, saleFilter])

  const categories = useMemo(() => {
    const map = new Map()
    statusScopedGoods.forEach((g) => map.set(g.category, (map.get(g.category) || 0) + 1))
    return [...map.entries()].map(([label, count]) => ({ label, count }))
  }, [statusScopedGoods])

  const popups = useMemo(() => {
    const ids = []
    goods.forEach((g) => {
      if (!ids.includes(g.popupId)) ids.push(g.popupId)
    })
    return ids.map((id) => ({
      id,
      name: goods.find((g) => g.popupId === id)?.popupName || '팝업스토어',
    }))
  }, [goods])

  const rescenePopup = useMemo(
    () => popups.find((p) => p.name.includes('리센느') || p.name.toUpperCase().includes('RESCENE')),
    [popups]
  )

  const heroGoods = useMemo(() => {
    const onSalePool = goods.filter((g) => getProductSaleInfo(g).canPurchase)
    const source = onSalePool.length > 0 ? onSalePool : goods
    if (bannerIdx >= 1 && rescenePopup) {
      const resceneItems = source.filter((g) => g.popupId === rescenePopup.id)
      if (resceneItems.length > 0) return resceneItems.slice(0, 3)
    }
    const picked = popups
      .slice(0, 3)
      .map((p) => source.find((g) => g.popupId === p.id))
      .filter(Boolean)
    return picked.length > 0 ? picked : source.slice(0, 3)
  }, [popups, goods, bannerIdx, rescenePopup])

  const banners = useMemo(
    () => [
      {
        eyebrow: "THIS WEEK'S DROP",
        title: '이번 주 인기 굿즈\n지금 바로 만나보세요',
        sub: '팝업 종료 후에도\n온라인 판매는 계속됩니다.',
        period: null,
        cta: '판매중 굿즈 보기 →',
        badgeTop: 'WEEKLY',
        badgeBottom: 'PICK',
        onAction: () => {
          setSaleFilter('ON_SALE')
          setPopup('all')
          setCategory('전체')
          document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        },
      },
      {
        eyebrow: 'NOW OPEN',
        title: '리센느 팝업 굿즈\n온라인 판매 시작',
        sub: '현장에서 놓친 한정 굿즈를\n지금 온라인에서 만나보세요.',
        period: null,
        cta: '리센느 굿즈 보러가기 →',
        badgeTop: 'NOW',
        badgeBottom: 'OPEN',
        onAction: () => {
          setSaleFilter('ON_SALE')
          setCategory('전체')
          if (rescenePopup) setPopup(rescenePopup.id)
          document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        },
      },
      {
        eyebrow: 'NOW OPEN',
        title: '리센느 굿즈\n온라인 판매 시작',
        sub: null,
        period: '11.18 - 12.02',
        cta: '지금 쇼핑하기 →',
        badgeTop: 'LIMITED',
        badgeBottom: 'EDITION',
        onAction: () => {
          setSaleFilter('ON_SALE')
          setCategory('전체')
          if (rescenePopup) setPopup(rescenePopup.id)
          document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        },
      },
    ],
    [rescenePopup]
  )

  const currentBanner = banners[bannerIdx]

  const list = useMemo(() => {
    let result = statusScopedGoods.filter(
      (g) =>
        (category === '전체' || g.category === category) &&
        (popup === 'all' || g.popupId === popup)
    )
    if (sort === 'low') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'high') result = [...result].sort((a, b) => b.price - a.price)
    return result
  }, [statusScopedGoods, category, popup, sort])

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pagedList = useMemo(() => {
    const startIdx = (safePage - 1) * PAGE_SIZE
    return list.slice(startIdx, startIdx + PAGE_SIZE)
  }, [list, safePage])

  const goToPage = (nextPage) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages)
    setPage(clamped)
    document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resetAll = () => {
    setCategory('전체')
    setSort('default')
    setSaleFilter('ON_SALE')
    setPopup('all')
    setPage(1)
  }

  const goToGoodsDetail = (g) => {
    const targetId = resolveDbPrdId(g) ?? g.id
    if (!targetId) return
    navigate(`/goods/${targetId}`, { state: { goods: g } })
  }

  const handleAddToCart = async (g) => {
    const saleInfo = getProductSaleInfo(g)
    if (!saleInfo.canPurchase || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 담을 수 있어요')
      navigate('/login')
      return
    }

    const dbPrdId = resolveDbPrdId(g)
    if (!dbPrdId) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    lockRef.current = true
    setAddingId(g.id)
    try {
      await addCartItem(dbPrdId, 1)
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
      setAddingId(null)
    }
  }

  const handleBuyNow = (g) => {
    const saleInfo = getProductSaleInfo(g)
    if (!saleInfo.canPurchase || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 구매할 수 있어요')
      navigate('/login')
      return
    }

    const dbPrdId = resolveDbPrdId(g)
    if (!dbPrdId) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    navigate('/checkout', {
      state: {
        items: [
          {
            prdId: dbPrdId,
            quantity: 1,
            name: g.name,
            price: g.price,
            image: g.image,
          },
        ],
      },
    })
  }

  const saleStatusLabel =
    saleFilter === 'ON_SALE'
      ? '판매중'
      : saleFilter === 'UPCOMING'
      ? '판매예정'
      : saleFilter === 'ENDED'
      ? '판매종료'
      : '전체'

  return (
    <div className="container gs-page">
      {/* 개편된 굿즈샵 배너 */}
      <section className="gs-hero" style={{ position: 'relative' }}>
        <div className="gs-hero-text">
          <div className="gs-eyebrow" style={{ color: '#68754B', fontWeight: 800 }}>
            {currentBanner.eyebrow}
          </div>
          <h1 className="gs-hero-title" style={{ whiteSpace: 'pre-line' }}>
            {currentBanner.title}
          </h1>
          {currentBanner.sub && (
            <p className="gs-hero-sub" style={{ whiteSpace: 'pre-line' }}>
              {currentBanner.sub}
            </p>
          )}
          {currentBanner.period && (
            <div
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: '#eef2ea',
                color: '#293323',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.04em',
                marginBottom: '18px',
              }}
            >
              {currentBanner.period}
            </div>
          )}
          <div>
            <button
              type="button"
              className="gs-hero-btn"
              style={{ backgroundColor: '#293323', color: '#fff' }}
              onClick={currentBanner.onAction}
            >
              {currentBanner.cta}
            </button>
          </div>

          {/* 배너 슬라이드 인디케이터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
            {banners.map((b, idx) => (
              <button
                key={b.title + idx}
                type="button"
                aria-label={`${idx + 1}번 배너 보기`}
                onClick={() => setBannerIdx(idx)}
                style={{
                  width: bannerIdx === idx ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: bannerIdx === idx ? '#68754B' : '#d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        <div className="gs-hero-stack">
          {heroGoods.map((g) => (
            <div
              key={g.id}
              className="gs-hero-img"
              style={{ cursor: 'pointer' }}
              onClick={() => goToGoodsDetail(g)}
            >
              <img
                src={g.image}
                alt={g.name}
                style={g.imageFit ? { objectFit: g.imageFit } : undefined}
              />
            </div>
          ))}
          <span className="gs-hero-badge" style={{ backgroundColor: '#68754B' }}>
            {currentBanner.badgeTop}
            <br />
            {currentBanner.badgeBottom}
          </span>
        </div>
      </section>

      <section className="gs-layout" id="gs-list">
        <aside className="gs-side">
          <div className="gs-side-block">
            <div className="gs-eyebrow" style={{ color: '#68754B' }}>CATEGORY</div>
            <div className="gs-side-title">굿즈 카테고리</div>
            <ul className="gs-side-list">
              <li>
                <button
                  type="button"
                  className={category === '전체' ? 'on' : ''}
                  style={
                    category === '전체'
                      ? {
                          backgroundColor: '#eef2ea',
                          color: '#293323',
                          fontWeight: 800,
                          borderLeft: '3px solid #68754B',
                          borderRadius: '8px',
                          paddingLeft: '10px',
                        }
                      : undefined
                  }
                  onClick={() => {
                    setCategory('전체')
                    setPage(1)
                  }}
                >
                  전체 <span style={category === '전체' ? { color: '#68754B', fontWeight: 800 } : undefined}>{statusScopedGoods.length}</span>
                </button>
              </li>
              {categories.map((c) => {
                const active = category === c.label
                return (
                  <li key={c.label}>
                    <button
                      type="button"
                      className={active ? 'on' : ''}
                      style={
                        active
                          ? {
                              backgroundColor: '#eef2ea',
                              color: '#293323',
                              fontWeight: 800,
                              borderLeft: '3px solid #68754B',
                              borderRadius: '8px',
                              paddingLeft: '10px',
                            }
                          : undefined
                      }
                      onClick={() => {
                        setCategory(c.label)
                        setPage(1)
                      }}
                    >
                      {c.label}{' '}
                      <span style={active ? { color: '#68754B', fontWeight: 800 } : undefined}>
                        {c.count}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="gs-side-block">
            <div className="gs-eyebrow" style={{ color: '#68754B' }}>POP-UP STORE</div>
            <div className="gs-side-title">팝업스토어별</div>
            <ul className="gs-side-list">
              <li>
                <button
                  type="button"
                  className={popup === 'all' ? 'on' : ''}
                  style={
                    popup === 'all'
                      ? {
                          backgroundColor: '#eef2ea',
                          color: '#293323',
                          fontWeight: 800,
                          borderLeft: '3px solid #68754B',
                          borderRadius: '8px',
                          paddingLeft: '10px',
                        }
                      : undefined
                  }
                  onClick={() => setPopup('all')}
                >
                  전체 팝업
                </button>
              </li>
              {popups.map((p) => {
                const active = popup === p.id
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={active ? 'on' : ''}
                      style={
                        active
                          ? {
                              backgroundColor: '#eef2ea',
                              color: '#293323',
                              fontWeight: 800,
                              borderLeft: '3px solid #68754B',
                              borderRadius: '8px',
                              paddingLeft: '10px',
                            }
                          : undefined
                      }
                      onClick={() => setPopup(p.id)}
                    >
                      {p.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>

        <div className="gs-main">
          <div className="gs-toolbar">
            <div className="gs-count">
              <h2>
                {popup === 'all'
                  ? category === '전체'
                    ? `${saleStatusLabel} 굿즈`
                    : category
                  : `${popups.find((p) => p.id === popup)?.name || '선택한 팝업'} 굿즈`}
              </h2>
              <span>
                {list.length}개 / {saleStatusLabel} {statusScopedGoods.length}개 (페이지 {safePage}/{totalPages})
              </span>
            </div>

            <div className="gs-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* 판매 상태 셀렉트 필터 (기본값: 판매중) */}
              <select
                aria-label="상품 판매 상태 필터"
                className="gs-sort"
                value={saleFilter}
                onChange={(e) => {
                  setSaleFilter(e.target.value)
                  setCategory('전체')
                  setPage(1)
                }}
                style={{
                  borderColor: '#68754B',
                  backgroundColor: '#f5f7f3',
                  color: '#293323',
                  fontWeight: 700,
                }}
              >
                <option value="ON_SALE">판매중</option>
                <option value="UPCOMING">판매예정</option>
                <option value="ENDED">판매종료</option>
                <option value="ALL">전체 상태</option>
              </select>

              <select
                aria-label="상품 정렬"
                className="gs-sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value)
                  setPage(1)
                }}
              >
                <option value="default">기본순</option>
                <option value="low">낮은 가격순</option>
                <option value="high">높은 가격순</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="empty-state" role="status">상품을 불러오고 있어요.</div>
          ) : error ? (
            <div className="empty-state" role="alert">
              {error}
              <div>
                <button type="button" className="gs-reset" onClick={() => setRetry((v) => v + 1)}>다시 시도</button>
              </div>
            </div>
          ) : pagedList.length > 0 ? (
            <>
              <div className="gs-grid">
                {pagedList.map((g) => {
                  const saleInfo = getProductSaleInfo(g)
                  const isDisabled = !saleInfo.canPurchase || addingId !== null

                  return (
                    <article
                      key={g.id}
                      className="gs-card"
                      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                    >
                      <div
                        className="gs-card-img"
                        style={{ cursor: 'pointer' }}
                        onClick={() => goToGoodsDetail(g)}
                      >
                        {saleInfo.badge ? (
                          <span
                            className="gs-badge"
                            style={{
                              backgroundColor: saleInfo.badge === '판매예정' ? '#4b5563' : '#9ca3af',
                              color: '#fff',
                            }}
                          >
                            {saleInfo.badge}
                          </span>
                        ) : (
                          g.limited && (
                            <span className="gs-badge" style={{ backgroundColor: '#68754B', color: '#fff' }}>
                              한정판
                            </span>
                          )
                        )}
                        <img src={g.image} alt={g.name} style={g.imageFit ? { objectFit: g.imageFit } : undefined} />
                      </div>
                      <div
                        className="gs-card-body"
                        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                      >
                        <div className="gs-card-popup">{g.popupName}</div>
                        <div
                          className="gs-card-name"
                          style={{
                            lineHeight: 1.35,
                            minHeight: 'calc(1.35em * 2)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            cursor: 'pointer',
                          }}
                          onClick={() => goToGoodsDetail(g)}
                        >
                          {g.name}
                        </div>
                        <div className="gs-card-price">{formatPrice(g.price)}</div>

                        <div
                          className="gs-card-actions"
                          style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}
                        >
                          {saleInfo.canPurchase ? (
                            <>
                              <button
                                type="button"
                                className="gs-btn"
                                style={{
                                  flex: 1,
                                  height: '40px',
                                  backgroundColor: '#ffffff',
                                  color: '#293323',
                                  border: '1px solid #cfd6c9',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                }}
                                disabled={isDisabled}
                                onClick={() => handleAddToCart(g)}
                              >
                                {addingId === g.id ? '담는 중…' : '장바구니'}
                              </button>
                              <button
                                type="button"
                                className="gs-btn"
                                style={{
                                  flex: 1,
                                  height: '40px',
                                  backgroundColor: '#68754B',
                                  color: '#fff',
                                  border: 'none',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                }}
                                disabled={isDisabled}
                                onClick={() => handleBuyNow(g)}
                              >
                                구매하기
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="gs-btn"
                              disabled
                              style={{
                                width: '100%',
                                height: '40px',
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280',
                                border: '1px solid #e5e7eb',
                                cursor: 'not-allowed',
                                borderRadius: '8px',
                                fontWeight: '600',
                              }}
                            >
                              {saleInfo.buttonLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="굿즈 페이지 이동"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '40px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => goToPage(safePage - 1)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '1px solid #d6dcd2',
                      background: '#fff',
                      color: safePage <= 1 ? '#c4b8ad' : '#293323',
                      fontWeight: 700,
                      cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ‹ 이전
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                    const active = pageNum === safePage
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => goToPage(pageNum)}
                        style={{
                          minWidth: '38px',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '10px',
                          border: active ? 'none' : '1px solid #d6dcd2',
                          background: active ? '#68754B' : '#fff',
                          color: active ? '#fff' : '#293323',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => goToPage(safePage + 1)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '1px solid #d6dcd2',
                      background: '#fff',
                      color: safePage >= totalPages ? '#c4b8ad' : '#293323',
                      fontWeight: 700,
                      cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    다음 ›
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="empty-state">
              조건에 맞는 굿즈가 없어요
              <div style={{ marginTop: 12 }}>
                <button type="button" className="gs-reset" onClick={resetAll}>필터 초기화</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}