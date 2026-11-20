import { useEffect, useRef, useState } from 'react'
import './PopupLoop.css'

export default function PopupLoop({ children }) {
  const viewport = useRef(null)
  const group = useRef(null)
  const duplicate = useRef(null)
  const paused = useRef(false)
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const element = viewport.current
    const resize = new ResizeObserver(() => {
      const visible = window.innerWidth <= 390 ? 2.15 : window.innerWidth <= 768 ? 2.5 : 5
      const gap = window.innerWidth <= 768 ? 12 : 20
      element.style.setProperty('--loop-gap', gap + 'px')
      element.style.setProperty('--loop-card-width', ((element.clientWidth - gap * (visible - 1)) / visible) + 'px')
    })
    resize.observe(element)
    return () => resize.disconnect()
  }, [])

  useEffect(() => {
    duplicate.current?.querySelectorAll('a, button').forEach(element => {
      element.tabIndex = -1
    })
    if (reducedMotion) return
    let frame
    let previous
    let position = viewport.current.scrollLeft
    function advance(time) {
      const element = viewport.current
      const distance = group.current?.getBoundingClientRect().width
      const elapsed = previous === undefined ? 0 : Math.min(time - previous, 50)
      previous = time
      if (paused.current || document.hidden) {
        position = element.scrollLeft
      } else if (distance) {
        position = (position + elapsed * 0.028) % distance
        element.scrollLeft = position
      }
      frame = requestAnimationFrame(advance)
    }
    frame = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion, children])

  return <div ref={viewport} className="pq-popup-loop" role="region" aria-label="추천 팝업 목록" tabIndex={0}
    onMouseEnter={() => { paused.current = true }}
    onMouseLeave={event => { paused.current = event.currentTarget.contains(document.activeElement) }}
    onFocusCapture={() => { paused.current = true }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) paused.current = false }}
    onTouchStart={() => { paused.current = true }}
    onTouchEnd={() => { paused.current = false }}
    onTouchCancel={() => { paused.current = false }}>
    <div ref={group} className="pq-popup-loop-group">{children}</div>
    {!reducedMotion && <div ref={duplicate} className="pq-popup-loop-group" aria-hidden="true">{children}</div>}
  </div>
}
