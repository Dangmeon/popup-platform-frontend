import { useEffect, useState } from 'react'
import { getPopupLifecycle } from '../../utils/popupLifecycle.js'
import './PopupLifecycleBadge.css'

export default function PopupLifecycleBadge({popup}) {
  const [now,setNow]=useState(Date.now)
  useEffect(()=>{
    const refresh=()=>setNow(Date.now())
    const timer=setInterval(refresh,60000)
    document.addEventListener('visibilitychange',refresh)
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}
  },[])
  const status=getPopupLifecycle(popup,now)
  return status?<span className={`popup-status-chip ${status.className}`}>{status.label}</span>:null
}
