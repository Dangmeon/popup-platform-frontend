import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { featuredGoods } from '../data/featuredPopups.js'
import '../styles/Goods.css'

// 팝업 id → 화면에 보여줄 이름 (TODO: 서버 연동 시 팝업 제목으로 교체)
const POPUP_NAMES = {
  loopy: '잔망루피',
  chiikawa: '치이카와',
  gal: 'GAL',
  kinetic: 'KINETIC',
}

// 상품 이름에 들어 있는 단어로 카테고리를 자동 분류 (위에서부터 먼저 맞는 것)
const CATEGORY_RULES = [
  { label: '가방', words: ['가방', '백', '토트'] },
  { label: '패션', words: ['티셔츠', '후드', '집업', '스커트', '바지', '캡', '선글라스', '러닝화', '맨투맨'] },
  { label: '인형·키링', words: ['인형', '키링'] },
  { label: '문구', words: ['캘린더', '달력', '노트', '스티커', '포스터'] },
]

function getCategory(name = '') {
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some(w => name.includes(w))) return rule.label
  }
  return '리빙·소품'
}

// 전체 상품 (카테고리·팝업 이름을 붙여 둔다)
const ALL_GOODS = (Array.isArray(featuredGoods) ? featuredGoods : []).map(g => ({
  ...g,
  category: getCategory(g.name),
  popupName: POPUP_NAMES[g.popupId] || g.popupId,
}))

function formatPrice(price) {
  return price > 0 ? `${price.toLocaleString()}원` : '가격 미정'
}

export default function Goods() {
  const [params, setParams] = useSearchParams()
  const popup = params.get('popup') || 'all' 
  const [category, setCategory] = useState('전체')
  const [collection, setCollection] = useState('all')
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
    ALL_GOODS.forEach(g => map.set(g.category, (map.get(g.category) || 0) + 1))
    return [...map.entries()].map(([label, count]) => ({ label, count }))
  }, [])

  // 사이드바: 팝업 목록
  const popups = useMemo(() => {
    const ids = []
    ALL_GOODS.forEach(g => { if (!ids.includes(g.popupId)) ids.push(g.popupId) })
    return ids.map(id => ({ id, name: POPUP_NAMES[id] || id }))
  }, [])

  // 히어로에 보여줄 대표 상품 (팝업마다 1개씩, 최대 3개)
  const heroGoods = useMemo(
    () => popups.slice(0, 3).map(p => ALL_GOODS.find(g => g.popupId === p.id)).filter(Boolean),
    [popups]
  )

  const list = useMemo(() => {
    let result = ALL_GOODS.filter(g =>
      (category === '전체' || g.category === category) &&
      (popup === 'all' || g.popupId === popup)
    )
    if (sort === 'low') result = [...result].sort((a, b) => a.price - b.price)
    if (sort === 'high') result = [...result].sort((a, b) => b.price - a.price)
    return result
  }, [category, popup, sort])

  const resetAll = () => {
    setCategory('전체')
    setCollection('all')
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
                  전체 <span>{ALL_GOODS.length}</span>
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
              <h2>전체 굿즈</h2>
              <span>총 {list.length}개</span>
            </div>
            <div className="gs-tools">
              <select className="gs-sort" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="default">기본순</option>
                <option value="low">낮은 가격순</option>
                <option value="high">높은 가격순</option>
              </select>
            </div>
          </div>

          {list.length > 0 ? (
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