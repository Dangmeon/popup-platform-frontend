import React from 'react'
import { Link } from 'react-router-dom'
import PopupCard from '../components/common/PopupCard.jsx'
import HeroWide from '../components/common/HeroWide.jsx'
import { featuredCards, featuredGoods } from '../data/featuredPopups.js'
import { usePopups } from '../hooks/usePopups'
import '../styles/Home.css'
import '../styles/FeaturedPopupDetail.css'

// 인기 굿즈로 보여줄 상품 id (원하는 대로 바꾸세요)
const POPULAR_GOODS_IDS = [
  'loopy-1', 'loopy-4',
  'chiikawa-1', 'chiikawa-3',
  'gal-1', 'gal-6', 'gal-4', 'gal-8',
]

export default function Home(){
  // 서버에서 진행 중인 팝업 목록 (GET /api/popups?status=ONGOING)
  const { data, loading, error } = usePopups({ status: 'ONGOING' })
  const serverPopups = Array.isArray(data) ? data : []

  // 배너: 루피, 치이카와, GAL (포스터는 프론트 임시 데이터)
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
  ]

  // 지금 인기 있는 팝업: 포스터 3개 + 서버 팝업 (최대 4개)
  const featured = featuredCards.filter(c => ['loopy', 'chiikawa', 'gal'].includes(c.id))
  const popular = [...featured, ...serverPopups.slice(0, 4)]

  // 마감 임박: 서버 팝업 중 아직 안 끝난 것을 종료일 빠른 순으로 4개
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const soon = serverPopups
    .filter(p => p.endDate && new Date(p.endDate) >= today)
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .slice(0, 4)

  // 인기 굿즈: 위 id 순서대로 (서버 굿즈는 팝업별 조회라 임시 데이터 유지)
  const goods = POPULAR_GOODS_IDS
    .map(id => featuredGoods.find(g => g.id === id))
    .filter(Boolean)

  return (
    <div>
      <HeroWide slides={heroSlides} />

      <div className="container">
        <div className="section-title">🔥 지금 인기 있는 팝업</div>
        <div className="grid-4">
          {popular.map(p => <PopupCard key={p.id} popup={p} />)}
        </div>
        {loading && <div className="empty-state">팝업 목록을 불러오는 중이에요</div>}
        {error && <div className="empty-state">{error}</div>}

        <div className="section-title">⏰ 마감 임박 팝업</div>
        {soon.length > 0 ? (
          <div className="grid-4">
            {soon.map(p => <PopupCard key={p.id} popup={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            {loading ? '불러오는 중이에요' : '마감 임박 팝업이 없어요'}
          </div>
        )}

        <div className="section-title">🛍️ 인기 굿즈</div>
        <div className="grid-4">
          {goods.map(g => (
            <Link key={g.id} to={`/popups/${g.popupId}`} className="fpd-good" style={{ display:'block' }}>
              <div className="fpd-good-img">
                {g.limited && <span className="fpd-good-badge">한정판</span>}
                <img src={g.image} alt={g.name} style={g.imageFit ? { objectFit: g.imageFit } : undefined} />
              </div>
              <div className="fpd-good-body">
                <div className="fpd-good-name">{g.name}</div>
                <div className="fpd-good-price">{g.price > 0 ? `${g.price.toLocaleString()}원` : '가격 미정'}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}