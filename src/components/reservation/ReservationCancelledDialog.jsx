import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './PopupReservationPanel.css'

export default function ReservationCancelledDialog({ onClose }) {
  const dialog=useRef(null)
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow
    document.body.style.overflow='hidden';dialog.current?.focus()
    return()=>{document.body.style.overflow=overflow;previous?.focus()}
  },[])
  return createPortal(<div className="rp-modal-backdrop"><section ref={dialog} className="rp-modal" role="dialog" aria-modal="true" aria-labelledby="cancelled-title" tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();onClose()}if(event.key==='Tab'){event.preventDefault();dialog.current?.querySelector('button')?.focus()}}}><span className="rp-eyebrow">RESERVATION</span><h2 id="cancelled-title">예약이 취소되었습니다.</h2><p>다음에 새로운 팝업에서 만나요.</p><button type="button" className="rp-primary rp-full" onClick={onClose}>확인</button></section></div>,document.body)
}
