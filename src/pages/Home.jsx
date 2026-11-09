import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import HeroWide from '../components/common/HeroWide.jsx'
import { featuredCards, featuredGoods } from '../data/featuredPopups.js'
import { usePopups } from '../hooks/usePopups'
import '../styles/Home.css'
import '../styles/FeaturedPopupDetail.css'
import '../styles/HomeSections.css'

// 인기 굿즈로 보여줄 상품 id (원하는 대로 바꾸세요)
// 팝업이 번갈아 보이도록 섞어 두었습니다. (8개)
const POPULAR_GOODS_IDS = [
  'loopy-1', 'chiikawa-1', 'gal-1', 'kinetic-shoe',
  'loopy-4', 'chiikawa-3', 'gal-6', 'kinetic-bag',
]

// 포스터 팝업 id (인기 팝업에 노출)
const POSTER_POPUP_IDS = ['loopy', 'chiikawa', 'gal', 'kinetic']

// 바로가기 메뉴 (to: 페이지 이동, scroll: 같은 화면의 섹션으로 스크롤)
const QUICK_MENUS = [
  { icon: '🗓️', label: '전체 팝업', to: '/popups' },
  { icon: '📍', label: '동네별 탐색', scroll: 'hm-explore' },
  { icon: '🛍️', label: '인기 굿즈', scroll: 'hm-goods' },
  { icon: '🎟️', label: '내 예약·웨이팅', to: '/mypage' },
]

// 동네 탭: 장소 문구에 keys 중 하나가 들어 있으면 그 동네로 묶는다
const AREAS = [
  { label: '성수', keys: ['성수'] },
  { label: '더현대', keys: ['더현대'] },
  { label: '잠실', keys: ['잠실', '롯데월드몰'] },
  { label: '여의도', keys: ['여의도', 'IFC'] },
  { label: '홍대', keys: ['홍대'] },
  { label: '강남', keys: ['강남'] },
  { label: '한남', keys: ['한남'] },
  { label: '북촌', keys: ['북촌'] },
]

// 'YYYY-MM-DD...' 문자열을 로컬 날짜로 바꾼다 (시간대 때문에 하루 어긋나는 것을 막음)
function toDate(s) {
  if (!s) return null
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const fmt = (s) => (s ? String(s).slice(5, 10).replace('-', '.') : '')

function SectionHead({ eyebrow, title, to, more }) {
  return (
    <div className="hm-head">
      <div>
        <div className="hm-eyebrow">{eyebrow}</div>
        <h2 className="hm-title">{title}</h2>
      </div>
      {to && <Link to={to} className="hm-more">{more} →</Link>}
    </div>
  )
}

// 메인용 팝업 카드 (포스터 팝업과 서버 팝업 모두 같은 모양)
function HomeCard({ popup: p, rank, today }) {
  const start = toDate(p.startDate)
  const end = toDate(p.endDate)
  let badge = ''
  if (start && start > today) badge = `D-${Math.round((start - today) / 86400000)}`
  else if (start && end && start <= today && end >= today) badge = '진행중'

  return (
    <Link to={`/popups/${p.id}`} className="hm-card">
      <div className="hm-card-img">
        {rank && <span className="hm-rank">{String(rank).padStart(2, '0')}</span>}
        {p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : <div className="hm-card-noimg" />}
        {badge && <span className="hm-badge">{badge}</span>}
      </div>
      <div className="hm-card-body">
        {p.category && <span className="hm-card-cat">{p.category}</span>}
        <div className="hm-card-title">{p.title}</div>
        {p.location && <div className="hm-card-sub">{p.location}</div>}
        {start && end && <div className="hm-card-date">{fmt(p.startDate)} - {fmt(p.endDate)}</div>}
      </div>
    </Link>
  )
}

export default function Home(){
  // 서버에서 진행 중인 팝업 목록 (GET /api/popups?status=ONGOING)
  const { data, loading, error } = usePopups({ status: 'ONGOING' })
  const serverPopups = Array.isArray(data) ? data : []

  const [area, setArea] = useState('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dday = (s) => Math.round((toDate(s) - today) / 86400000)

  // 배너: 루피, 치이카와, GAL, KINETIC (포스터는 프론트 임시 데이터)
  const heroSlides = [
    {
      id: 'loopy',
      image: '/poster-loopy.png',
      poster: true,
      tag: '잔망루피 POP-UP STORE',
      title: '잔망루피는 못 말려!',
      place: '롯데월드몰 1F 아트리움 팝업존',
      period: '2026.12.01 ~ 12.31 · 10:00 ~ 20:00',
      to: '/popups/loopy',
    },
    {
      id: 'chiikawa',
      image: '/chiikawa/poster.png',
      poster: true,
      tag: '치이카와 POP-UP STORE',
      title: '치이카와는 귀여워!',
      place: 'IFC몰 서울 L1 팝업존',
      period: '2027.02.02 ~ 02.28 · 10:00 ~ 20:00',
      to: '/popups/chiikawa',
    },
    {
      id: 'gal',
      image: '/gal/poster.png',
      poster: true,
      tag: 'GAL POP-UP STORE',
      title: 'GAL POP-UP STORE',
      place: '장소 미정',                         // TODO: 실제 장소
      period: '2027.03.01 ~ 03.31 · 10:00 ~ 20:00', // TODO: 실제 일정
      to: '/popups/gal',
    },
    {
      id: 'kinetic',
      image: '/kinetic/poster-kinetic.png',
      poster: true,
      tag: 'KINETIC POP-UP STORE',
      title: 'KINETIC 팝업스토어',
      place: '서울 성수 팝업존',                    // TODO: 임시값 (가상 브랜드)
      period: '2026.12.01 ~ 12.31 · 10:00 ~ 20:00', // TODO: 임시값
      to: '/popups/kinetic',
    },
  ]

  // 포스터 팝업 + 서버 팝업을 한 묶음으로 (id가 겹치면 한 번만)
  const seen = new Set()
  const pool = [...featuredCards, ...serverPopups].filter((p) => {
    const key = String(p.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // 지금 인기 있는 팝업: 포스터 4개 + 서버 팝업 (최대 8개)
  const featured = featuredCards.filter((c) => POSTER_POPUP_IDS.includes(c.id))
  const popular = [...featured, ...serverPopups.slice(0, 4)].slice(0, 8)

  // 오픈 예정: 시작일이 오늘 이후인 것, 빠른 순 (첫 번째는 큰 카드, 나머지 3개는 목록)
  const upcoming = pool
    .filter((p) => toDate(p.startDate) && toDate(p.startDate) > today)
    .sort((a, b) => toDate(a.startDate) - toDate(b.startDate))
    .slice(0, 4)

  // 동네별 탐색: 팝업이 하나라도 있는 동네만 탭으로 보여 준다
  const areaList = AREAS
    .map((a) => ({
      ...a,
      items: pool.filter((p) => a.keys.some((k) => (p.location || '').includes(k))),
    }))
    .filter((a) => a.items.length > 0)
  const currentArea = areaList.find((a) => a.label === area) || areaList[0]

  // 마감 임박: 지금 진행 중인 팝업 중 종료일이 빠른 순으로 4개
  const soon = pool
    .filter((p) => {
      const s = toDate(p.startDate)
      const e = toDate(p.endDate)
      return s && e && s <= today && e >= today
    })
    .sort((a, b) => toDate(a.endDate) - toDate(b.endDate))
    .slice(0, 4)

  // 인기 굿즈: 위 id 순서대로 (서버 굿즈는 팝업별 조회라 임시 데이터 유지)
  const goods = POPULAR_GOODS_IDS
    .map((id) => featuredGoods.find((g) => g.id === id))
    .filter(Boolean)

  function goTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <HeroWide slides={heroSlides} />

      <div className="container">
        {/* 바로가기 */}
        <div className="hm-quick">
          {QUICK_MENUS.map((m) => {
            const inner = (
              <>
                <span className="hm-quick-icon">{m.icon}</span>
                <span className="hm-quick-label">{m.label}</span>
              </>
            )
            return m.to ? (
              <Link key={m.label} to={m.to} className="hm-quick-item">{inner}</Link>
            ) : (
              <button key={m.label} type="button" className="hm-quick-item" onClick={() => goTo(m.scroll)}>{inner}</button>
            )
          })}
        </div>

        {/* 지금 인기 있는 팝업 */}
        <section className="hm-sec">
          <SectionHead eyebrow="WEEKLY HOT" title="지금 가장 인기 있는 팝업" to="/popups" more="전체보기" />
          <div className="hm-grid">
            {popular.map((p, i) => <HomeCard key={p.id} popup={p} rank={i + 1} today={today} />)}
          </div>
          {loading && <div className="empty-state">팝업 목록을 불러오는 중이에요</div>}
          {error && <div className="empty-state">{error}</div>}
        </section>

        {/* 오픈 예정 팝업 */}
        {upcoming.length > 0 && (
          <section className="hm-sec hm-band">
            <SectionHead eyebrow="COMING SOON" title="곧 만나요, 오픈 예정 팝업" to="/popups" more="전체보기" />
            <div className="hm-soon">
              <Link to={`/popups/${upcoming[0].id}`} className="hm-soon-hero">
                {upcoming[0].image && <img className="hm-soon-bg" src={upcoming[0].image} alt="" />}
                <span className="hm-soon-dday">D-{dday(upcoming[0].startDate)}</span>
                <div className="hm-soon-title">{upcoming[0].title}</div>
                {upcoming[0].location && <div className="hm-soon-sub">{upcoming[0].location}</div>}
                <span className="hm-soon-btn">자세히 보기 →</span>
              </Link>

              <div className="hm-soon-list">
                {upcoming.slice(1, 4).map((p) => (
                  <Link key={p.id} to={`/popups/${p.id}`} className="hm-soon-item">
                    <div className="hm-soon-thumb">
                      {p.image && <img src={p.image} alt={p.title} loading="lazy" />}
                    </div>
                    <div className="hm-soon-text">
                      <span className="hm-soon-d">D-{dday(p.startDate)}</span>
                      <div className="hm-soon-name">{p.title}</div>
                      {p.location && <div className="hm-card-sub">{p.location}</div>}
                      <div className="hm-card-date">{fmt(p.startDate)} - {fmt(p.endDate)}</div>
                    </div>
                    <span className="hm-soon-arrow">›</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 동네별 탐색 */}
        {areaList.length > 0 && currentArea && (
          <section className="hm-sec" id="hm-explore">
            <SectionHead eyebrow="EXPLORE SEOUL" title="동네마다 새로운 취향을 발견해요" to="/popups" more="전체보기" />
            <div className="hm-tabs">
              {areaList.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className={'hm-tab' + (a.label === currentArea.label ? ' active' : '')}
                  onClick={() => setArea(a.label)}
                >{a.label}</button>
              ))}
            </div>
            <div className="hm-explore">
              <div className="hm-explore-panel">
                <div className="hm-explore-eyebrow">THIS WEEK IN</div>
                <div className="hm-explore-name">{currentArea.label}</div>
                <p className="hm-explore-desc">{currentArea.label}에서 지금 만날 수 있는<br />취향 가득한 팝업을 모았어요.</p>
                <div className="hm-explore-count">총 {currentArea.items.length}개의 팝업</div>
              </div>
              {currentArea.items.slice(0, 3).map((p, i) => (
                <HomeCard key={p.id} popup={p} rank={i + 1} today={today} />
              ))}
            </div>
          </section>
        )}

        {/* 마감 임박 */}
        <section className="hm-sec">
          <SectionHead eyebrow="LAST CALL" title="놓치기 전에, 마감 임박 팝업" to="/popups" more="전체보기" />
          {soon.length > 0 ? (
            <div className="hm-grid">
              {soon.map((p) => <HomeCard key={p.id} popup={p} today={today} />)}
            </div>
          ) : (
            <div className="empty-state">
              {loading ? '불러오는 중이에요' : '마감 임박 팝업이 없어요'}
            </div>
          )}
        </section>

        {/* 인기 굿즈 */}
        <section className="hm-sec" id="hm-goods">
          <SectionHead eyebrow="TRENDING GOODS" title="지금 가장 사랑받는 굿즈" />
          <div className="grid-4">
            {goods.map((g) => (
              <Link key={g.id} to={`/popups/${g.popupId}`} className="fpd-good" style={{ display:'block' }}>
                <div className="fpd-good-img">
                  {g.limited && <span className="fpd-good-badge">한정판</span>}
                  <img src={g.image} alt={g.name} style={g.imageFit ? { objectFit: g.imageFit } : undefined} />
                </div>
                <div className="fpd-good-body">
                  <div className="hm-good-from">{g.popupTitle}</div>
                  <div className="fpd-good-name">{g.name}</div>
                  <div className="fpd-good-price">{g.price > 0 ? `${g.price.toLocaleString()}원` : '가격 미정'}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
