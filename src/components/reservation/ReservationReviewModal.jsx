import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// 확인창을 닫거나 다시 선택해도 HOLD를 만들지 않습니다.
export default function ReservationReviewModal({ title, slot, peopleCount, demo, busy, error, onClose, onConfirm }) {
  const dialog = useRef(null)
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
    <h3>{title}</h3><dl><div><dt>방문 날짜</dt><dd>{slot.slotDate}</dd></div><div><dt>회차</dt><dd>{slot.startTime}–{slot.endTime}</dd></div><div><dt>방문 인원</dt><dd>{peopleCount}명</dd></div></dl>
    {demo && <p className="rp-message">현재 이 팝업은 예약을 준비 중입니다.</p>}
    {error && <p className="rp-error" role="alert">{error}</p>}
    <div className="rp-modal-actions"><button type="button" className="rp-secondary" disabled={busy} onClick={onClose}>{demo ? '닫기' : '다시 선택'}</button>{!demo && <button type="button" className="rp-primary" disabled={busy} onClick={onConfirm}>{busy ? '예약 처리 중…' : '예, 예약 확정하기'}</button>}</div>
  </section></div>, document.body)
}
