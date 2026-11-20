import { useEffect, useRef } from 'react'
import './AdminDetailModal.css'
export default function AdminDetailModal({ title, onClose, children, busy = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current, previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return <dialog ref={ref} className="admin-detail-modal" aria-label={title} aria-busy={busy} onCancel={e => { e.preventDefault(); if (!busy) onClose() }}>
    <header><h3>{title}</h3><button type="button" disabled={busy} onClick={onClose} autoFocus>닫기</button></header>{children}
  </dialog>
}
