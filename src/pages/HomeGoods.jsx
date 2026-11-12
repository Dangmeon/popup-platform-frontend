import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function HomeGoods({ goods }) {
  const row = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  // 움직임 줄이기 설정을 선택한 경우 자동 넘김 중지
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    function applyPreference() {
      if (preference.matches) setPlaying(false)
    }
    applyPreference()
    preference.addEventListener('change', applyPreference)
    return () => preference.removeEventListener('change', applyPreference)
  }, [])

  // 굿즈 위의 세로 휠을 가로 이동으로 변환합니다.
  // 양 끝에서는 기본 페이지 스크롤을 허용하고 확대 제스처는 유지합니다.
  useEffect(() => {
    const element = row.current
    if (!element) return
    function handleWheel(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? element.clientWidth : 1
      const delta = event.deltaY * unit
      const max = element.scrollWidth - element.clientWidth
      if (max <= 1 || (delta < 0 && element.scrollLeft <= 1) || (delta > 0 && element.scrollLeft >= max - 1)) return
      event.preventDefault()
      element.scrollLeft = Math.max(0, Math.min(max, element.scrollLeft + delta))
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [])

  // 화면을 보고 있을 때만 4초 간격으로 카드 한 칸 이동
  useEffect(() => {
    if (!playing || hovered || focused) return

    const timer = setInterval(() => {
      const element = row.current
      if (!element || document.hidden) return

      const remaining = element.scrollWidth - element.clientWidth
      if (remaining <= 1) return

      const cardWidth = element.firstElementChild?.getBoundingClientRect().width || 0
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0
      const destination = element.scrollLeft >= remaining - 2
        ? 0
        : Math.min(remaining, element.scrollLeft + cardWidth + gap)

      element.scrollTo({ left: destination, behavior: 'smooth' })
    }, 4000)

    return () => clearInterval(timer)
  }, [playing, hovered, focused, goods.length])

  return (
    <>
<div
        ref={row}
        className="hm-goods-row"
        role="region"
        aria-label="굿즈 목록, 좌우로 스크롤 가능"
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setPlaying(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
        }}
      >
        {goods.map((item) => (
          <Link key={item.id} to={`/popups/${item.popupId}`} className="hm-goods-card">
            <div className="hm-goods-image">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                style={{ objectFit: item.imageFit || 'contain' }}
              />
              {item.limited && <span>LIMITED</span>}
            </div>
            <div className="hm-goods-info">
              <p className="hm-good-from">{item.popupTitle}</p>
              <h3>{item.name}</h3>
              <strong>
                {item.price > 0
                  ? `${item.price.toLocaleString('ko-KR')}원`
                  : '가격 안내 예정'}
              </strong>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
