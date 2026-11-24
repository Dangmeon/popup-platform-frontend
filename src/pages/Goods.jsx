import { getProductSaleInfo } from '../utils/productSaleState.js'
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

function resolveSalePhase(g) {
  const info = getProductSaleInfo(g)
  if (info?.phase === 'ON_SALE' || info?.phase === 'UPCOMING' || info?.phase === 'ENDED') {
    return info.phase
  }
  const raw = String(g?.saleStatus ?? g?.status ?? g?.phase ?? '').trim().toUpperCase()
  if (['UPCOMING', 'SCHEDULED', 'READY', '판매예정', '판매 예정'].includes(raw)) return 'UPCOMING'
  if (['ENDED', 'SOLD_OUT', 'CLOSED', '판매종료', '판매 종료', '품절'].includes(raw)) return 'ENDED'
  return 'ON_SALE'
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

function pickDiverseGoods(pool, { mode = 'popup', excludeIds = new Set(), count = 3 } = {}) {
  if (!Array.isArray(pool) || pool.length === 0) return []

  const picked = []
  const usedIds = new Set(excludeIds)
  const usedGroups = new Set()

  const groupKey = (item) =>
    mode === 'category'
      ? String(item.category || item.popupId || '')
      : String(item.popupId || item.category || '')

  // 1차: 서로 다른 팝업 또는 카테고리에서 1개씩 선택
  for (const item of pool) {
    if (picked.length >= count) break
    if (usedIds.has(item.id)) continue
    const gk = groupKey(item)
    if (gk && usedGroups.has(gk)) continue
    picked.push(item)
    usedIds.add(item.id)
    if (gk) usedGroups.add(gk)
  }

  // 2차: 부족하면 아직 안 뽑힌 상품 중 채우기
  if (picked.length < count) {
    for (const item of pool) {
      if (picked.length >= count) break
      if (usedIds.has(item.id)) continue
      picked.push(item)
      usedIds.add(item.id)
    }
  }

  // 3차: 전체 상품 수가 적을 경우 기존 풀에서라도 count개 채우기
  if (picked.length < count) {
    for (const item of pool) {
      if (picked.length >= count) break
      picked.push(item)
    }
  }

  return picked.slice(0, count)
}

export default function Goods() {
  const app = useApp()
  const navigate = useNavigate()
  const [addingId, setAddingId] = useState(null)
  const lockRef = useRef(false)
  const [params, setParams] = useSearchParams()
  const popup = params.get('popup') || 'all'
  const [category, setCategory] = useState('전체')
  const [saleFilter, setSaleFilter] = useState('ALL')
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
        const storeList = Array.isArray(stores) ? stores : []
        const batches = await Promise.all(
          storeList.map(async (store) => {
            const items = await getPopupProducts(store.id)
            const listItems = Array.isArray(items) ? items : []
            return listItems.map((item) => ({
              ...item,
              popupId: String(store.id),
              popupName: store.title,
            }))
          })
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

  const statusScopedGoods = useMemo(() => {
    if (saleFilter === 'ALL') return goods
    return goods.filter((g) => resolveSalePhase(g) === saleFilter)
  }, [goods, saleFilter])

  const categories = useMemo(() => {
    const map = new Map()
    statusScopedGoods.forEach((g) => {
      if (!g.category) return
      map.set(g.category, (map.get(g.category) || 0) + 1)
    })
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

  const banners = useMemo(
    () => [
      {
        eyebrow: "THIS WEEK'S DROP",
        title: '이번 주 인기 굿즈\n지금 바로 만나보세요',
        sub: '다양한 팝업스토어의\n주목할 만한 굿즈를 모았습니다.',
        period: null,
        cta: '전체 굿즈 보기 →',
        badgeTop: 'WEEKLY',
        badgeBottom: 'PICK',
        onAction: () => {
          setSaleFilter('ALL')
          setPopup('all')
          setCategory('전체')
          document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        },
      },
      {
        eyebrow: 'CATEGORY PICKS',
        title: '카테고리별 추천 굿즈\n취향대로 골라보세요',
        sub: '패션·캐릭터·푸드·엔터테인먼트\n각 분야 인기 굿즈를 한눈에.',
        period: null,
        cta: '굿즈 목록 보기 →',
        badgeTop: 'CURATED',
        badgeBottom: 'ITEMS',
        onAction: () => {
          setSaleFilter('ALL')
          setPopup('all')
          setCategory('전체')
          document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        },
      },
      {
        eyebrow: 'NEW ARRIVALS',
        title: '새롭게 만나는 굿즈\n지금 바로 확인하세요',
        sub: '현장과 온라인에서 만나는\n다채로운 굿즈 라인업',
        period: '11.18 - 12.02',
        cta: '지금 쇼핑하기 →',
        badgeTop: 'NEW',
        badgeBottom: 'DROP',
        onAction: () => {
          setSaleFilter('ALL')
          setPopup('all')
          setCategory('전체')
          document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        },
      },
    ],
    []
  )

  const currentBanner = banners[bannerIdx]

  const heroGoods = useMemo(() => {
    const onSalePool = goods.filter((g) => getProductSaleInfo(g).canPurchase)
    const source = onSalePool.length >= 3 ? onSalePool : goods
    if (!source.length) return []

    const slide0 = pickDiverseGoods(source, { mode: 'popup', count: 3 })
    if (bannerIdx === 0) return slide0

    const slide0Ids = new Set(slide0.map((item) => item.id))
    const slide1 = pickDiverseGoods(source, { mode: 'category', excludeIds: slide0Ids, count: 3 })
    if (bannerIdx === 1) return slide1

    const combinedExcluded = new Set([
      ...slide0.map((item) => item.id),
      ...slide1.map((item) => item.id),
    ])
    const reversedPool = [...source].reverse()
    return pickDiverseGoods(reversedPool, {
      mode: 'popup',
      excludeIds: combinedExcluded,
      count: 3,
    })
  }, [goods, bannerIdx])

  const list = useMemo(() => {
    let result = statusScopedGoods.filter(
      (g) =>
        (category === '전체' || g.category === category) &&
        (popup === 'all' || String(g.popupId) === String(popup))
    )
    if (sort === 'low') result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0))
    if (sort === 'high') result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0))
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
    setSaleFilter('ALL')
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
      {/* 색상 통일 + 다양한 상품 노출 굿즈샵 배너 */}
      <section
        className="gs-hero"
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #eef2ea 0%, #dce4d4 100%)',
        }}
      >
        <div className="gs-hero-text">
          <div className="gs-eyebrow" style={{ color: '#68754B', fontWeight: 800 }}>
            {currentBanner.eyebrow}
          </div>
          <h1 className="gs-hero-title" style={{ whiteSpace: 'pre-line', color: '#293323' }}>
            {currentBanner.title}
          </h1>
          {currentBanner.sub && (
            <p className="gs-hero-sub" style={{ whiteSpace: 'pre-line', color: '#525d49' }}>
              {currentBanner.sub}
            </p>
          )}
          {currentBanner.period && (
            <div
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                border: '1px solid #cfd6c9',
                color: '#293323',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.04em',
                marginTop: '14px',
              }}
            >
              {currentBanner.period}
            </div>
          )}
          <div>
            <button
              type="button"
              className="gs-hero-btn"
              style={{ backgroundColor: '#293323', color: '#ffffff' }}
              onClick={currentBanner.onAction}
            >
              {currentBanner.cta}
            </button>
          </div>

          {/* 배너 전환 + 인디케이터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              aria-label="이전 배너"
              onClick={() => setBannerIdx((prev) => (prev + 2) % 3)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid #cfd6c9',
                backgroundColor: '#ffffff',
                color: '#293323',
                fontWeight: 800,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ‹
            </button>

            {banners.map((b, idx) => (
              <button
                key={b.eyebrow + idx}
                type="button"
                aria-label={`${idx + 1}번 배너 보기`}
                onClick={() => setBannerIdx(idx)}
                style={{
                  width: bannerIdx === idx ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: bannerIdx === idx ? '#68754B' : '#c4ccbc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              />
            ))}

            <button
              type="button"
              aria-label="다음 배너"
              onClick={() => setBannerIdx((prev) => (prev + 1) % 3)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid #cfd6c9',
                backgroundColor: '#ffffff',
                color: '#293323',
                fontWeight: 800,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ›
            </button>
          </div>
        </div>

        <div className="gs-hero-stack">
          {heroGoods.map((g) => (
            <div
              key={`${bannerIdx}-${g.id}`}
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
          <span className="gs-hero-badge" style={{ backgroundColor: '#68754B', color: '#ffffff' }}>
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
                  전체{' '}
                  <span style={category === '전체' ? { color: '#68754B', fontWeight: 800 } : undefined}>
                    {statusScopedGoods.length}
                  </span>
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
                {list.length}개 / {saleStatusLabel} {statusScopedGoods.length}개 (페이지 {safePage}/
                {totalPages})
              </span>
            </div>

            <div className="gs-tools" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                <option value="ALL">전체 상태</option>
                <option value="ON_SALE">판매중</option>
                <option value="UPCOMING">판매예정</option>
                <option value="ENDED">판매종료</option>
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
            <div className="empty-state" role="status">
              상품을 불러오고 있어요.
            </div>
          ) : error ? (
            <div className="empty-state" role="alert">
              {error}
              <div>
                <button
                  type="button"
                  className="gs-reset"
                  style={{
                    backgroundColor: '#68754B',
                    color: '#ffffff',
                    border: '1px solid #68754B',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => setRetry((v) => v + 1)}
                >
                  다시 시도
                </button>
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
                            <span
                              className="gs-badge"
                              style={{ backgroundColor: '#68754B', color: '#fff' }}
                            >
                              한정판
                            </span>
                          )
                        )}
                        <img
                          src={g.image}
                          alt={g.name}
                          style={g.imageFit ? { objectFit: g.imageFit } : undefined}
                        />
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
                <button
                  type="button"
                  className="gs-reset"
                  style={{
                    backgroundColor: '#68754B',
                    color: '#ffffff',
                    border: '1px solid #68754B',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={resetAll}
                >
                  필터 초기화
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}