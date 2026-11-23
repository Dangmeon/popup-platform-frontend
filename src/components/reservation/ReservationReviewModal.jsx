import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { parseReservationDateTime } from '../../utils/reservationAvailability.js'

// 서버 HOLD의 만료 시각으로 표시하며 클라이언트에서 기한을 연장하지 않습니다.
export default function ReservationReviewModal({ title, slot, peopleCount, expiresAt, demo, busy, error, onClose, onConfirm }) {
  const dialog = useRef(null)
  const [now,setNow] = useState(Date.now)
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])
  const deadline = parseReservationDateTime(expiresAt)?.getTime()
  const seconds = deadline ? Math.max(0,Math.ceil((deadline-now)/1000)) : null
  const countdown = seconds === null ? '확인 중' : `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`
  useEffect(() => {
    const previous = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()
    return () => { document.body.style.overflow = originalOverflow; previous?.focus() }
  }, [])
  function keyboard(event) {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose() }
    if (event.key !== 'Tab') return
    const items = [...dialog.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled)')]
    if (!items.length) { event.preventDefault(); return }
    const first = items[0], last = items[items.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus() }
  }
  return createPortal(<div className="rp-modal-backdrop"><section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="rp-review-title" aria-describedby="rp-review-description" className="rp-modal" onKeyDown={keyboard}>
    <span className="rp-eyebrow">RESERVATION</span><h2 id="rp-review-title">{demo ? '선택한 방문 일정' : '이 일정으로 예약할까요?'}</h2><p id="rp-review-description">선택한 날짜와 인원을 확인해 주세요.</p>
    <h3>{title}</h3>{!demo && expiresAt && <div className="rp-message" style={{display:'flex',justifyContent:'space-between',gap:12}}><span>예약 자동취소까지 남은 시간</span><strong role="timer" aria-live="off">{countdown}</strong></div>}{seconds===0&&<p className="rp-message" role="status">확정 시간이 지났습니다. 예약 상태를 확인해 주세요.</p>}<dl><div><dt>방문 날짜</dt><dd>{slot.slotDate}</dd></div><div><dt>회차</dt><dd>{slot.startTime}–{slot.endTime}</dd></div><div><dt>방문 인원</dt><dd>{peopleCount}명</dd></div></dl>
    {demo && <p className="rp-message">현재 이 팝업은 예약을 준비 중입니다.</p>}
    {error && <p className="rp-error" role="alert">{error}</p>}
    <div className="rp-modal-actions"><button type="button" className="rp-secondary" disabled={busy} onClick={onClose}>{demo || expiresAt ? '닫기' : '다시 선택'}</button>{!demo && <button type="button" className="rp-primary" disabled={busy} onClick={onConfirm}>{busy ? '예약 처리 중…' : seconds === 0 ? '예약 상태 확인' : '예, 예약 확정하기'}</button>}</div>
  </section></div>, document.body)
}
