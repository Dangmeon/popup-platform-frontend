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
  }, [popup, category, sort])

  const setPopup = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('popup')
    else next.set('popup', id)
    setParams(next)
    setPage(1)
  }

  const categories = useMemo(() => {
    const map = new Map()
    goods.forEach((g) => map.set(g.category, (map.get(g.category) || 0) + 1))
    return [...map.entries()].map(([label, count]) => ({ label, count }))
  }, [goods])

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

  const heroGoods = useMemo(
    () => popups.slice(0, 3).map((p) => goods.find((g) => g.popupId === p.id)).filter(Boolean),
    [popups, goods]
  )

  const list = useMemo(() => {
    let result = goods.filter(
      (g) =>
        (category === '전체' || g.category === category) &&
        (popup === 'all' || g.popupId === popup)
    )
    if (sort === 'low') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'high') result = [...result].sort((a, b) => b.price - a.price)
    return result
  }, [goods, category, popup, sort])

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

  return (
    <div className="container gs-page">
      <section className="gs-hero">
        <div className="gs-hero-text">
          <div className="gs-eyebrow">GOODS SHOP</div>
          <h1 className="gs-hero-title">팝업의 설렘을<br />집까지 가져가요</h1>
          <p className="gs-hero-sub">팝업에서만 만날 수 있는 한정 굿즈를 모아봤어요.</p>
          <button
            type="button"
            className="gs-hero-btn"
            onClick={() => document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            전체 굿즈 보기 →
          </button>
        </div>
        <div className="gs-hero-stack">
          {heroGoods.map(g => (
            <div key={g.id} className="gs-hero-img">
              <img src={g.image} alt={g.name} style={g.imageFit ? { objectFit: g.imageFit } : undefined} />
            </div>
          ))}
          <span className="gs-hero-badge">NEW<br />DROP</span>
        </div>
      </section>

      <section className="gs-layout" id="gs-list">
        <aside className="gs-side">
          <div className="gs-side-block">
            <div className="gs-eyebrow">CATEGORY</div>
            <div className="gs-side-title">굿즈 카테고리</div>
            <ul className="gs-side-list">
              <li>
                <button
                  type="button"
                  className={category === '전체' ? 'on' : ''}
                  onClick={() => {
                    setCategory('전체')
                    setPage(1)
                  }}
                >
                  전체 <span>{goods.length}</span>
                </button>
              </li>
              {categories.map(c => (
                <li key={c.label}>
                  <button
                    type="button"
                    className={category === c.label ? 'on' : ''}
                    onClick={() => {
                      setCategory(c.label)
                      setPage(1)
                    }}
                  >
                    {c.label} <span>{c.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="gs-side-block">
            <div className="gs-eyebrow">POP-UP STORE</div>
            <div className="gs-side-title">팝업스토어별</div>
            <ul className="gs-side-list">
              <li>
                <button type="button" className={popup === 'all' ? 'on' : ''} onClick={() => setPopup('all')}>
                  전체 팝업
                </button>
              </li>
              {popups.map(p => (
                <li key={p.id}>
                  <button type="button" className={popup === p.id ? 'on' : ''} onClick={() => setPopup(p.id)}>
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="gs-main">
          <div className="gs-toolbar">
            <div className="gs-count">
              <h2>
                {popup === 'all'
                  ? category === '전체'
                    ? '전체 굿즈'
                    : category
                  : `${popups.find((p) => p.id === popup)?.name || '선택한 팝업'} 굿즈`}
              </h2>
              <span>
                {list.length}개 / 전체 {goods.length}개 (페이지 {safePage}/{totalPages})
              </span>
            </div>
            <div className="gs-tools">
              <select
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
                          g.limited && <span className="gs-badge">한정판</span>
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
                                  color: '#374151',
                                  border: '1px solid #d1d5db',
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
                      border: '1px solid #eadfd5',
                      background: '#fff',
                      color: safePage <= 1 ? '#c4b8ad' : '#2b2118',
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
                          border: active ? 'none' : '1px solid #eadfd5',
                          background: active ? '#68754B' : '#fff',
                          color: active ? '#fff' : '#2b2118',
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
                      border: '1px solid #eadfd5',
                      background: '#fff',
                      color: safePage >= totalPages ? '#c4b8ad' : '#2b2118',
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
