import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { selectCategoryBanners } from '../utils/categoryBanners.js'
import PopqIcon from '../components/common/PopqIcon.jsx'
import './HomeBanner.css'

export default function HomeBanner({ popups = [] }) {
  const banners = selectCategoryBanners(popups)
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [visible, setVisible] = useState(true)
  const activeIndex = banners.length ? index % banners.length : 0
  const popup = banners[activeIndex]

  // 화면을 보지 않거나 움직임 줄이기를 설정하면 자동 넘김 중지
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    function updateMotion() { setReducedMotion(preference.matches) }
    function updateVisibility() { setVisible(!document.hidden) }
    updateMotion()
    updateVisibility()
    preference.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      preference.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  // 5초마다 다음 배너로 이동. 수동 이동 후에는 5초를 다시 계산
  useEffect(() => {
    if (banners.length < 2 || hovered || focused || reducedMotion || !visible) return
    const timer = setTimeout(() => {
      setIndex((previous) => (previous + 1) % banners.length)
    }, 5000)
    return () => clearTimeout(timer)
  }, [index, hovered, focused, reducedMotion, visible, banners.length])

  if (!popup) return null

  // 마지막 배너 다음에는 첫 배너로 이동
  function moveBanner(direction) {
    setIndex((previous) =>
      (previous + direction + banners.length) % banners.length
    )
  }

  // 배너에 키보드 초점이 있을 때 방향키로 이동
  function handleKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveBanner(-1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveBanner(1)
    }
  }

  return (
    <section
      className="pq-banner"
      aria-label="추천 팝업 배너"
      aria-roledescription="캐러셀"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      {/* 현재 팝업의 소개와 포스터 */}
      <div className="pq-banner-slide">
        <div className="pq-banner-copy">
          <span className="pq-banner-tag">{popup.bannerCategory}</span>
          <h1>{popup.title}</h1>
          <p className="pq-banner-description">
            {popup.description || '팝업의 공간과 굿즈를 만나보세요.'}
          </p>
          <dl className="pq-banner-details">
            <div><dt>일정</dt><dd>{popup.startDate} ~ {popup.endDate}</dd></div>
            <div><dt>장소</dt><dd>{popup.location}</dd></div>
          </dl>
          <Link to={`/popups/${popup.id}`} className="pq-banner-link">
            팝업 자세히 보기
            <PopqIcon name="arrow" size={19} />
          </Link>
        </div>

        <Link
          to={`/popups/${popup.id}`}
          className="pq-banner-poster"
          aria-label={`${popup.title} 상세 보기`}
        >
          <img src={popup.image} alt={popup.title} />
        </Link>
      </div>

      {/* 현재 배너 번호와 전체 개수 */}
      <p className="pq-banner-count" aria-live="off">
        <span className="pq-banner-sr-only">현재 배너 </span>
        <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
        <span aria-hidden="true">/</span>
        <span className="pq-banner-sr-only">전체 </span>
        <span>{String(banners.length).padStart(2, '0')}</span>
      </p>

      {/* 마우스 또는 키보드 사용 시 나타나는 좌우 버튼 */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            className="pq-banner-arrow pq-banner-prev"
            aria-label="이전 배너"
            onClick={() => moveBanner(-1)}
          >
            <PopqIcon name="arrow" size={23} />
          </button>
          <button
            type="button"
            className="pq-banner-arrow pq-banner-next"
            aria-label="다음 배너"
            onClick={() => moveBanner(1)}
          >
            <PopqIcon name="arrow" size={23} />
          </button>
        </>
      )}
    </section>
  )
}
