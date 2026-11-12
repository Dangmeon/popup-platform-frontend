import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PopqIcon from '../components/common/PopqIcon.jsx'
import HomeBanner from './HomeBanner.jsx'
import HomeGoods from './HomeGoods.jsx'
import HomeEvents from './HomeEvents.jsx'
import { areaDemoPopups } from '../data/areaDemoPopups.js'
import OpeningDayBadge from '../components/common/OpeningDayBadge.jsx'
import { featuredCards, featuredGoods } from '../data/featuredPopups.js'
import { usePopups } from '../hooks/usePopups'
import '../styles/Home.css'
import '../styles/FeaturedPopupDetail.css'
import '../styles/HomeSections.css'
import '../components/common/OpeningDayBadge.css'
import '../styles/HomeRefresh.css'

// 메인에 표시할 굿즈
const GOODS_IDS = [
  'loopy-1', 'chiikawa-1', 'gal-1', 'kinetic-shoe',
  'loopy-4', 'chiikawa-3', 'gal-6', 'kinetic-bag',
]

// 중간 바로가기
const QUICK_MENUS = [
  { icon: 'calendar', label: '전체 팝업', to: '/popups' },
  { icon: 'location', label: '주변 팝업', to: '/nearby' },
  { icon: 'bag', label: '굿즈샵', to: '/goods' },
  { icon: 'ticket', label: '내 예약·웨이팅', to: '/my-activities' },
]

// 장소 문구를 기준으로 지역 분류
const AREAS = [
  { label: '성수', keywords: ['성수'] },
  { label: '더현대', keywords: ['더현대'] },
  { label: '잠실', keywords: ['잠실', '롯데월드몰'] },
  { label: '여의도', keywords: ['여의도', 'IFC'] },
  { label: '홍대', keywords: ['홍대'] },
  { label: '강남', keywords: ['강남'] },
  { label: '한남', keywords: ['한남'] },
  { label: '북촌', keywords: ['북촌'] },
]

// 한국의 오늘 날짜를 일 단위 비교값으로 변환
function getToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  )

  return Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day)
  )
}

// 행사 날짜 변환 및 유효성 검사
function getDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null
  }

  return date.getTime()
}

function formatDate(value) {
  return getDate(value) === null
    ? ''
    : String(value).slice(5, 10).replace('-', '.')
}

// 오픈 예정 목록에 사용할 문구
function getOpeningLabel(startDate, today) {
  const start = getDate(startDate)
  if (start === null) return ''

  const days = Math.round((start - today) / 86400000)
  return days === 0 ? 'Today' : `D-${days}`
}

// 공통 섹션 제목
function SectionHeading({ eyebrow, title, to = '/popups', more = '전체 보기' }) {
  return (
    <div className="hm-head">
      <div>
        {eyebrow && <span className="hm-eyebrow">{eyebrow}</span>}
        <h2 className="hm-title">{title}</h2>
      </div>
      <Link to={to} className="hm-more">
        {more}
        <PopqIcon name="arrow" size={17} />
      </Link>
    </div>
  )
}

// 팝업 카드와 가운데 원형 D-DAY
function PopupCard({ popup, today, rank }) {
  return (
    <Link to={popup.isDemo ? `/nearby?area=${encodeURIComponent(popup.area)}` : `/popups/${popup.id}`} className="hm-card">
      <div className="hm-card-img">
        {popup.image ? (
          <img src={popup.image} alt={popup.title} loading="lazy" />
        ) : (
          <div className="hm-card-noimg">POPQ</div>
        )}

        {rank && (
          <span className="hm-rank">{String(rank).padStart(2, '0')}</span>
        )}

        <OpeningDayBadge startDate={popup.startDate} endDate={popup.endDate} today={today} />
      </div>

      <div className="hm-card-body">
        <span className="hm-card-cat">{popup.isDemo ? '예시 팝업' : (popup.category || '팝업스토어')}</span>
        <h3 className="hm-card-title">{popup.title}</h3>
        <p className="hm-card-sub">{popup.location || '장소 안내 예정'}</p>
        {getDate(popup.startDate) !== null && getDate(popup.endDate) !== null && (
          <p className="hm-card-date">
            {formatDate(popup.startDate)} — {formatDate(popup.endDate)}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function Home() {
  const { data, loading, error } = usePopups({ status: 'ONGOING' })
  const [area, setArea] = useState('')
  const [today, setToday] = useState(getToday)

  // 날짜가 바뀌면 D-DAY도 갱신
  useEffect(() => {
    const timer = setInterval(() => setToday(getToday()), 60000)
    return () => clearInterval(timer)
  }, [])

  const serverPopups = Array.isArray(data) ? data : []
  const seen = new Set()

  // 추천 콘텐츠와 서버 목록의 중복 제거
  const pool = [...featuredCards, ...serverPopups].filter((popup) => {
    const key = String(popup.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const recommended = pool
    .filter((popup) => {
      const end = getDate(popup.endDate)
      const start = getDate(popup.startDate)
      return (end === null || end >= today) && (start === null || start <= today + 30 * 86400000)
    })
    .slice(0, 5)

  // 행사 시작일 기준 오늘부터 30일 이내 오픈 예정 팝업
  const upcoming = pool
    .filter((popup) => {
      const start = getDate(popup.startDate)
      const end = getDate(popup.endDate)
      return (
        start !== null &&
        start >= today &&
        start <= today + 30 * 86400000 &&
        (end === null || end >= today)
      )
    })
    .sort((a, b) => getDate(a.startDate) - getDate(b.startDate))
    .slice(0, 4)

  const areaList = AREAS.map((item) => ({
    ...item,
    items: [...pool, ...areaDemoPopups].filter((popup) => {
      const end = getDate(popup.endDate)
      return (
        (end === null || end >= today) &&
        item.keywords.some((keyword) =>
          (popup.location || '').includes(keyword)
        )
      )
    }),
  })).filter((item) => item.items.length > 0)

  const currentArea =
    areaList.find((item) => item.label === area) || areaList[0]

  const goods = GOODS_IDS.map((id) =>
    featuredGoods.find((item) => item.id === id)
  ).filter(Boolean)


  function scrollToSection(id) {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    document.getElementById(id)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="popq-home">
      <div className="container">
        {/* 팝업별 설명과 수동 배너 이동 */}
        <HomeBanner />

        {/* 중간 아이콘 바로가기 */}
        <nav className="hm-quick" aria-label="주요 기능 바로가기">
          {QUICK_MENUS.map((menu) => {
            const content = (
              <>
                <span className="hm-quick-icon">
                  <PopqIcon name={menu.icon} size={25} />
                </span>
                <span className="hm-quick-label">{menu.label}</span>
              </>
            )

            return menu.to ? (
              <Link key={menu.label} to={menu.to} className="hm-quick-item">
                {content}
              </Link>
            ) : (
              <button
                key={menu.label}
                type="button"
                className="hm-quick-item"
                onClick={() => scrollToSection(menu.section)}
              >
                {content}
              </button>
            )
          })}
        </nav>

        {/* 추천 팝업 최대 5개 */}
        <section className="hm-sec">
          <SectionHeading eyebrow="POPQ PICKS" title="지금 눈여겨볼 팝업" />
          <div className="hm-grid">
            {recommended.map((popup, index) => (
              <PopupCard
                key={popup.id}
                popup={popup}
                rank={index + 1}
                today={today}
              />
            ))}
          </div>
          {loading && <p role="status">팝업을 불러오는 중이에요.</p>}
          {error && (
            <p role="alert" className="hm-data-message">
              서버 팝업을 불러오지 못했어요. 현재 추천 콘텐츠를 표시합니다.
            </p>
          )}
          {!loading && !error && recommended.length === 0 && (
            <p>현재 표시할 팝업이 없어요.</p>
          )}
        </section>
      </div>

      {/* 오픈 예정 행사가 있을 때 표시 */}
      {upcoming.length > 0 && (
        <section className="hm-upcoming-band">
          <div className="container">
            <SectionHeading
              eyebrow="COMING SOON"
              title="기다리는 즐거움, 오픈 예정 팝업"
            />

            <div
              className="hm-soon"
              style={upcoming.length === 1 ? { gridTemplateColumns: '1fr' } : undefined}
            >
              <Link to={`/popups/${upcoming[0].id}`} className="hm-soon-hero">
                {upcoming[0].image && (
                  <img
                    className="hm-soon-bg"
                    src={upcoming[0].image}
                    alt=""
                    loading="lazy"
                  />
                )}
                <OpeningDayBadge startDate={upcoming[0].startDate} endDate={upcoming[0].endDate} today={today} />
                <h3 className="hm-soon-title">{upcoming[0].title}</h3>
                <p className="hm-soon-sub">{upcoming[0].location}</p>
                <span className="hm-soon-btn">
                  팝업 둘러보기 <PopqIcon name="arrow" size={18} />
                </span>
              </Link>

              {upcoming.length > 1 && (
                <div className="hm-soon-list">
                  {upcoming.slice(1).map((popup) => (
                    <Link
                      key={popup.id}
                      to={`/popups/${popup.id}`}
                      className="hm-soon-item"
                    >
                      <div className="hm-soon-thumb">
                        {popup.image && (
                          <img src={popup.image} alt="" loading="lazy" />
                        )}
                      </div>
                      <div className="hm-soon-text">
                        <span className="hm-soon-d">
                          {getOpeningLabel(popup.startDate, today)}
                        </span>
                        <h3 className="hm-soon-name">{popup.title}</h3>
                        <p className="hm-card-sub">{popup.location}</p>
                        <p className="hm-card-date">
                          {formatDate(popup.startDate)} — {formatDate(popup.endDate)}
                        </p>
                      </div>
                      <PopqIcon name="arrow" size={19} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="container">
        {/* POPQ 소개·생일 혜택·광고 시안 배너 */}
        <HomeEvents />

        {/* 지역별 팝업 탐색 */}
        {currentArea && (
          <section className="hm-sec" id="hm-explore">
            <SectionHeading
              eyebrow="EXPLORE YOUR AREA"
              title="추천 팝업"
            />
            <div className="hm-tabs" aria-label="지역 선택">
              {areaList.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`hm-tab${currentArea.label === item.label ? ' active' : ''}`}
                  aria-pressed={currentArea.label === item.label}
                  onClick={() => setArea(item.label)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="hm-explore">
              <div className="hm-explore-panel">
                <span className="hm-explore-eyebrow">AROUND YOU</span>
                <h3 className="hm-explore-name">{currentArea.label}</h3>
                <p className="hm-explore-desc">
                  이 동네에서 발견하는<br />취향 가득한 팝업
                </p>
                <span className="hm-explore-count">
                  진행 중·오픈 예정 {currentArea.items.length}개
                </span>
              </div>
              <div className="hm-area-cards">
              {currentArea.items.slice(0, 3).map((popup) => (
                <PopupCard key={popup.id} popup={popup} today={today} />
              ))}
              </div>
            </div>
          </section>
        )}

        {/* 추천 굿즈 가로 한 줄 */}
        <section className="hm-sec" id="hm-goods">
          <SectionHeading
            eyebrow=""
            title="굿즈"
            to="/goods"
            more="굿즈샵 보기"
          />
          <HomeGoods goods={goods} />
        </section>
      </div>
    </div>
  )
}
