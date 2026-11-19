import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPopups, getPopupProducts } from '../api/popupApi.js'
import '../styles/Goods.css'

function formatPrice(price) { return price > 0 ? `${price.toLocaleString()}원` : '가격 미정' }

export default function Goods() {
  const [params, setParams] = useSearchParams()
  const popup = params.get('popup') || 'all'
  const [category, setCategory] = useState('전체')
  const [goods, setGoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true); setError(''); setGoods([])
    async function load() {
      try {
        const stores = await getPopups()
        const batches = await Promise.all(stores.map(async store =>
          (await getPopupProducts(store.id)).map(item => ({...item, popupId:String(store.id), popupName:store.title}))
        ))
        if(alive) setGoods(batches.flat())
      } catch { if(alive) setError('상품을 불러오지 못했어요. 다시 시도해 주세요.') }
      finally { if(alive) setLoading(false) }
    }
    load()
  return () => { alive = false }
  }, [retry])
  const [sort, setSort] = useState('default')

  const setPopup = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('popup')
    else next.set('popup', id)
    setParams(next)
  }

  // 사이드바: 카테고리별 개수
  const categories = useMemo(() => {
    const map = new Map()
    goods.forEach(g => map.set(g.category, (map.get(g.category) || 0) + 1))
    return [...map.entries()].map(([label, count]) => ({ label, count }))
  }, [goods])

  // 사이드바: 팝업 목록
  const popups = useMemo(() => {
    const ids = []
    goods.forEach(g => { if (!ids.includes(g.popupId)) ids.push(g.popupId) })
    return ids.map(id => ({ id, name: goods.find(g => g.popupId === id)?.popupName || '팝업스토어' }))
  }, [goods])

  // 히어로에 보여줄 대표 상품 (팝업마다 1개씩, 최대 3개)
  const heroGoods = useMemo(
    () => popups.slice(0, 3).map(p => goods.find(g => g.popupId === p.id)).filter(Boolean),
    [popups, goods]
  )

  const list = useMemo(() => {
    let result = goods.filter(g =>
      (category === '전체' || g.category === category) &&
      (popup === 'all' || g.popupId === popup)
    )
    if (sort === 'low') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'high') result = [...result].sort((a, b) => b.price - a.price)
    return result
  }, [goods, category, popup, sort])

  const resetAll = () => {
    setCategory('전체')
    setSort('default')
    setPopup('all')
  }

  // 장바구니 담기 핸들러 함수
  const handleAddToCart = (g) => {
    const existingCart = JSON.parse(localStorage.getItem('popq_cart') || '[]')
    const itemIndex = existingCart.findIndex(cartItem => cartItem.id === g.id)

    if (itemIndex > -1) {
      existingCart[itemIndex].qty = (existingCart[itemIndex].qty || 1) + 1
    } else {
      existingCart.push({
        id: g.id,
        name: g.name,
        price: g.price,
        image: g.image,
        option: g.option || '기본',
        qty: 1
      })
    }
    localStorage.setItem('popq_cart', JSON.stringify(existingCart))
    alert(`'${g.name}' 상품이 장바구니에 담겼어요!`)
  }

  return (
    <div className="container gs-page">
      {/* 히어로 */}
      <section className="gs-hero">
        <div className="gs-hero-text">
          <div className="gs-eyebrow">GOODS SHOP</div>
          <h1 className="gs-hero-title">팝업의 설렘을<br />집까지 가져가요</h1>
          <p className="gs-hero-sub">팝업에서만 만날 수 있는 한정 굿즈를 모아봤어요.</p>
          <button type="button" className="gs-hero-btn" onClick={() => document.getElementById('gs-list')?.scrollIntoView({ behavior: 'smooth' })}>
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

      {/* 목록 */}
      <section className="gs-layout" id="gs-list">
        <aside className="gs-side">
          <div className="gs-side-block">
            <div className="gs-eyebrow">CATEGORY</div>
            <div className="gs-side-title">굿즈 카테고리</div>
            <ul className="gs-side-list">
              <li>
                <button type="button" className={category === '전체' ? 'on' : ''} onClick={() => setCategory('전체')}>
                  전체 <span>{goods.length}</span>
                </button>
              </li>
              {categories.map(c => (
                <li key={c.label}>
                  <button type="button" className={category === c.label ? 'on' : ''} onClick={() => setCategory(c.label)}>
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
              <h2>{popup === 'all' ? (category === '전체' ? '전체 굿즈' : category) : `${popups.find(p => p.id === popup)?.name || '선택한 팝업'} 굿즈`}</h2>
              <span>{list.length}개 / 전체 {goods.length}개</span>
            </div>
            <div className="gs-tools">
              <select className="gs-sort" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="default">기본순</option>
                <option value="low">낮은 가격순</option>
                <option value="high">높은 가격순</option>
              </select>
            </div>
          </div>

          {loading ? <div className="empty-state" role="status">상품을 불러오고 있어요.</div> : error ? <div className="empty-state" role="alert">{error}<div><button type="button" className="gs-reset" onClick={()=>setRetry(v=>v+1)}>다시 시도</button></div></div> : list.length > 0 ? (
            <div className="gs-grid">
              {list.map(g => (
                <article key={g.id} className="gs-card">
                  <Link to={`/popups/${g.popupId}`} className="gs-card-img">
                    {g.limited && <span className="gs-badge">한정판</span>}
                    <img src={g.image} alt={g.name} style={g.imageFit ? { objectFit: g.imageFit } : undefined} />
                  </Link>
                  <div className="gs-card-body">
                    <div className="gs-card-popup">{g.popupName}</div>
                    <div className="gs-card-name">{g.name}</div>
                    <div className="gs-card-price">{formatPrice(g.price)}</div>

                    {/* 상세보기(좌측) 및 장바구니 담기(우측) 버튼 영역 */}
                    <div className="gs-card-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <Link
                        to={`/popups/${g.popupId}`}
                        className="gs-btn"
                        style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', padding: '8px 0', textDecoration: 'none', border: '1px solid #d1d5db', color: '#374151' }}
                      >
                        상세보기
                      </Link>
                      <button
                        type="button"
                        className="gs-btn"
                        style={{ flex: 1, backgroundColor: '#293323', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '8px 0', fontWeight: '600' }}
                        onClick={() => handleAddToCart(g)}
                      >
                        장바구니 담기
                      </button>
                    </div>

                  </div>
                </article>
              ))}
            </div>
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