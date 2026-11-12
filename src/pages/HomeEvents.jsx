import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PopqIcon from '../components/common/PopqIcon.jsx'
import './HomeEvents.css'

// 쿠폰 발급·광고 API 연결 전의 시안 데이터입니다.
const events = [
  { type: 'brand', label: 'MEET POPQ', title: '취향이 모이는 곳, POPQ', description: '가고 싶은 팝업을 발견하고, 나만의 하루를 계획해 보세요.', action: '팝업 둘러보기', to: '/popups' },
  { type: 'birthday', label: 'HAPPY BIRTHDAY', title: '생일의 설렘에, 굿즈를 더해요', description: '생일자 굿즈 10% 할인쿠폰 · 혜택 미리보기', action: '혜택 안내 보기' },
  { type: 'sponsor', label: 'AD · 광고 시안', title: '다음 러닝의 시작, KINETIC', description: '러닝의 순간을 채우는 스포츠 굿즈와 팝업 공간.', action: '팝업 자세히 보기', to: '/popups/kinetic' },
]

export default function HomeEvents() {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [notice, setNotice] = useState(false)
  const [motion, setMotion] = useState(false)
  const [visible, setVisible] = useState(true)
  const event = events[index]

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setMotion(!preference.matches)
    const updateVisibility = () => setVisible(!document.hidden)
    updateMotion(); updateVisibility()
    preference.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      preference.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  // 마우스·키보드로 이용 중이거나 탭이 숨겨지면 자동 넘김 중지
  useEffect(() => {
    if (!motion || !visible || hovered || focused || notice) return
    const timer = setTimeout(() => setIndex(value => (value + 1) % events.length), 6000)
    return () => clearTimeout(timer)
  }, [index, motion, visible, hovered, focused, notice])


  return <section className="pq-events" aria-label="POPQ 이벤트 안내"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false) }}>
    <div className={`pq-event-slide pq-event-${event.type}`}>
      <div className="pq-event-copy">
        <span className="pq-event-label">{event.label}</span>
        <h2>{event.title}</h2><p>{event.description}</p>
        {event.to ? <Link className="pq-event-cta" to={event.to}>{event.action}<PopqIcon name="arrow" size={17} /></Link>
          : <button className="pq-event-cta" type="button" aria-expanded={notice} aria-controls="birthday-preview" onClick={() => setNotice(value => !value)}>{event.action}<PopqIcon name="arrow" size={17} /></button>}
      </div>
      {/* 이미지를 늘리지 않고 CSS로 표현한 브랜드·쿠폰 장식 */}
      <div className="pq-event-art" aria-hidden="true">
        {event.type === 'brand' && <><span className="pq-event-orbit" /><div className="pq-event-brandmark"><img src="/logo.png" alt="" /><span>DISCOVER YOUR NEXT POP-UP</span></div></>}
        {event.type === 'birthday' && <div className="pq-event-coupon"><span>BIRTHDAY GIFT</span><strong>10<span>%</span></strong><small>GOODS COUPON · 예시</small></div>}
        {event.type === 'sponsor' && <><img className="pq-event-ad-image" src="/kinetic/kinetic-shoe.png" alt="" /><span className="pq-event-ad-caption">KINETIC / LIMITED DROP</span></>}
      </div>
      <div className="pq-event-controls">
        <span aria-live="off">{String(index + 1).padStart(2, '0')} / 03</span>
      </div>
    </div>
    {notice && <div className="pq-event-notice" id="birthday-preview" role="status"><strong>생일자 쿠폰 혜택 미리보기</strong><p>디자인 확인용 10% 할인쿠폰입니다. 실제 발급·결제 할인은 적용되지 않습니다. 대상·기간·할인 한도는 추후 확정됩니다.</p><button type="button" onClick={() => setNotice(false)}>닫기</button></div>}
  </section>
}
