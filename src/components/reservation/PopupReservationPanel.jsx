import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRealtimeTopics } from '../../hooks/useRealtimeTopics.js'
import { useApp } from '../../context/AppContext.jsx'
import { getTimeSlots } from '../../api/timeSlotApi.js'
import { getSlotUnavailableReason } from '../../utils/reservationAvailability.js'
import ReservationCalendar from './ReservationCalendar.jsx'
import TimeSlotSelector from './TimeSlotSelector.jsx'
import ReservationReviewModal from './ReservationReviewModal.jsx'
import PopupWaitingPanel from './PopupWaitingPanel.jsx'
import './PopupReservationPanel.css'

// 더미 팝업의 일정 확인용 회차. 서버에 없는 slug를 실제 ID로 바꾸지 않습니다.
function demoSlots(popup) {
  const match = String(popup.startDate || popup.period || '').match(/(\d{4})[-.](\d{2})[-.](\d{2})/)
  const first = match ? `${match[1]}-${match[2]}-${match[3]}` : new Date(Date.now()+86400000).toISOString().slice(0,10)
  const start = new Date(`${first}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return []
  return Array.from({length:7}, (_,day) => [10,11,14,16].map((hour,index) => ({
    timeSlotId:day*4+index+1, slotDate:new Date(start.getTime()+day*86400000).toISOString().slice(0,10),
    startTime:`${hour}:00`,endTime:`${hour+1}:00`,capacity:10,remaining:10,reservedCount:0,
    reservOpenAt:'2000-01-01T00:00:00+09:00',reservCloseAt:'2099-01-01T00:00:00+09:00',
  }))).flat()
}
function message(error) {
  if (error.response?.status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if (error.response?.status === 403) return '회차 조회 또는 예약 권한을 확인하지 못했습니다.'
  return error.response?.data?.message || error.message || '회차를 불러오지 못했습니다.'
}

export default function PopupReservationPanel({ popup, onCreateHold }) {
  const app = useApp()
  const id = popup.popId ?? popup.id
  const real = /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id)>0
  const scope = `${id}:${app.currentUser?.username || app.currentUser?.email || 'guest'}`
  return <Panel key={scope} popup={popup} popId={real ? Number(id) : null} demo={!real} onCreateHold={onCreateHold} />
}

function Panel({ popup, popId, demo, onCreateHold }) {
  const app = useApp()
  const [mode,setMode] = useState('reservation')
  const [people,setPeople] = useState(1)
  const [date,setDate] = useState(null)
  const [slotId,setSlotId] = useState(null)
  const [slots,setSlots] = useState(() => demo ? demoSlots(popup) : [])
  const [loading,setLoading] = useState(!demo)
  const [error,setError] = useState('')
  const [retry,setRetry] = useState(0)
  const [now,setNow] = useState(Date.now)
  const [review,setReview] = useState(false)
  const [busy,setBusy] = useState(false)
  const [submitError,setSubmitError] = useState('')
  const [notice,setNotice] = useState('')
  const lock = useRef(false)
  const alive = useRef(false)
  useEffect(() => {alive.current=true;return () => {alive.current=false}},[])
  useEffect(() => { const timer=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(timer) },[])

  // 새로고침 없이 5초 간격 조회. 숨겨진 탭에서는 대기하고 요청을 겹치지 않습니다.
  useEffect(() => {
    if (demo || !app.isAuthenticated) return
    let active=true, timer, running=false
    async function load() {
      if (!active || running || document.hidden) return
      running=true
      try {const rows=await getTimeSlots({popId});if(active){setSlots(rows);setError('')}}
      catch (requestError) {if(active)setError(message(requestError))}
      finally {running=false;if(active){setLoading(false);timer=setTimeout(load,5000)}}
    }
    function resume() { clearTimeout(timer);load() }
    setLoading(true);load()
    document.addEventListener('visibilitychange',resume)
    return ()=>{active=false;clearTimeout(timer);document.removeEventListener('visibilitychange',resume)}
  },[demo,popId,app.isAuthenticated,retry])

  const connection=useRealtimeTopics(slots.map(slot=>`/topic/timeSlot/${slot.timeSlotId}`), !demo && app.isAuthenticated, ()=>setRetry(v=>v+1))
  const selected=slots.find(slot=>slot.timeSlotId===slotId && slot.slotDate===date)
  const reason=selected ? getSlotUnavailableReason(selected,people,now) : ''
  // 회차 마감 시 선택을 해제합니다. 전송 중에는 선택을 유지합니다.
  useEffect(()=>{
    if (busy || !slotId || loading || error) return
    if (!selected || reason) {setSlotId(null);setReview(false);setNotice(`${reason || '회차가 변경되었습니다.'} 다른 회차를 선택해 주세요.`)}
  },[selected,reason,slotId,busy,loading,error])

  async function confirm() {
    if(lock.current || !selected || demo) return
    const latestReason=getSlotUnavailableReason(selected,people,Date.now())
    if(latestReason){setSubmitError(latestReason);return}
    if(typeof onCreateHold!=='function'){setSubmitError('현재 예약을 진행할 수 없습니다. 잠시 후 다시 시도해 주세요.');return}
    lock.current=true;setBusy(true);setSubmitError('')
    try {await onCreateHold({popId,timeSlotId:selected.timeSlotId,peopleCount:people,slotDate:selected.slotDate,startTime:selected.startTime,endTime:selected.endTime,autoConfirm:true})}
    catch(requestError){if(alive.current)setSubmitError(message(requestError))}
    finally {lock.current=false;if(alive.current)setBusy(false)}
  }

  return <div className="rp-panel">
    <div className="rp-mode" aria-label="방문 방식"><button type="button" aria-pressed={mode==='reservation'} disabled={busy} onClick={()=>setMode('reservation')}>방문 예약</button><button type="button" aria-pressed={mode==='waiting'} disabled={busy} onClick={()=>setMode('waiting')}>현장 웨이팅</button></div>
    {mode==='waiting' ? <PopupWaitingPanel popup={popup} popId={popId} demo={demo} /> : <>
      <div className="rp-panel-heading"><span className="rp-eyebrow">VISIT RESERVATION</span><h2>방문할 날짜를 선택하세요</h2><p>날짜와 회차를 고르면 마지막에 한 번 더 확인해요.</p></div>
      {!demo && !app.isAuthenticated ? <div className="rp-login"><p>예약 회차는 로그인 후 확인할 수 있어요.</p><Link className="rp-primary" to="/login">로그인하기</Link></div> : <>
        {error && <div className="rp-error" role="alert">{error}<button type="button" className="rp-secondary" disabled={busy} onClick={()=>setRetry(v=>v+1)}>다시 조회</button></div>}
        <ReservationCalendar selectedDate={date} onDateSelect={value=>{setDate(value);setSlotId(null);setNotice('')}} timeSlots={error ? [] : slots} peopleCount={people} now={now} loading={loading} disabled={busy || Boolean(error)} />
        <TimeSlotSelector selectedDate={date} selectedTimeSlotId={slotId} onTimeSelect={slot=>{setSlotId(slot.timeSlotId);setNotice('')}} timeSlots={slots} peopleCount={people} now={now} loading={loading} disabled={busy || Boolean(error)} />
        <div className="rp-people"><div><strong>예약 인원</strong><small>본인 포함 최대 3명</small></div><div><button type="button" aria-label="예약 인원 줄이기" disabled={people<=1||busy} onClick={()=>setPeople(v=>v-1)}>−</button><span>{people}</span><button type="button" aria-label="예약 인원 늘리기" disabled={people>=3||busy} onClick={()=>setPeople(v=>v+1)}>+</button></div></div>
        {notice && <p className="rp-message" role="status">{notice}</p>}
        <button className="rp-primary rp-full" type="button" disabled={!selected||Boolean(reason)||Boolean(error)||loading||busy} onClick={()=>{setSubmitError('');setReview(true)}}>{selected ? `${selected.slotDate.slice(5).replace('-','/')} ${selected.startTime} · ${people}명 ${demo?'선택 확인':'예약하기'}` : '날짜와 회차를 선택해 주세요'}</button>
      </>}
      {review && selected && <ReservationReviewModal title={popup.title} slot={selected} peopleCount={people} demo={demo} busy={busy} error={submitError} onClose={()=>{if(!busy)setReview(false)}} onConfirm={confirm} />}
    </>}
  </div>
}
