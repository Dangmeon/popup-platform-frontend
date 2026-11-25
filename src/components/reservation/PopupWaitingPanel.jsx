import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRealtimeTopics } from '../../hooks/useRealtimeTopics.js'
import { useApp } from '../../context/AppContext.jsx'
import { createWaiting, createWaitingPoll, cancelWaiting } from '../../api/waitingApi.js'
import { getPopup } from '../../api/popupApi.js'
import { loadWaitingIds, addWaitingId } from '../../utils/waitingStore.js'
import { getWaitingUnavailableReason, getWaitingOpeningState } from '../../utils/popupWaitingAvailability.js'

const labels={WAITING:'대기 중',CALLED:'입장 호출',ENTERED:'입장 완료',CANCELLED:'대기 취소',EXPIRED:'호출 만료'}
const isActive = row => row && ['WAITING','CALLED'].includes(row.status)
function errorText(error) {return error.response?.data?.message || (error.response?.status===401 ? '다시 로그인해 주세요.' : '서버에서 처리 결과를 확인하지 못했습니다. 내역을 다시 확인해 주세요.')}

export default function PopupWaitingPanel({popup,popId,demo}) {
  const app=useApp()
  const owner=app.isAuthenticated ? app.currentUser?.username || app.currentUser?.email : null
  const key=`popQ_waiting_request:${encodeURIComponent(owner || '')}:${popId}`
  const [phone,setPhone]=useState(app.currentUser?.phone || '')
  const [people,setPeople]=useState(1)
  const [record,setRecord]=useState(null)
  const [currentPopup,setCurrentPopup]=useState(popup)
  const [ready,setReady]=useState(false)
  const [uncertain,setUncertain]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [busy,setBusy]=useState(false)
  const [retry,setRetry]=useState(0)
  const [now,setNow]=useState(Date.now)
  const active=useRef(false), lock=useRef(false), mutationVersion=useRef(0)
  useEffect(()=>{active.current=true;return()=>{active.current=false}},[])
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])

  // 저장된 접수 복원 후에만 신규 등록 허용. 새로고침 뒤 중복 접수를 방지합니다.
  useEffect(()=>{
    if(demo || !owner)return
    let alive=true,timer,running=false
    const pollWaiting = createWaitingPoll()
    async function refresh(){
      if(!alive || running || document.hidden)return
      if(lock.current){timer=setTimeout(refresh,1000);return}
      running=true
      const version=mutationVersion.current
      try {
        const saved=JSON.parse(sessionStorage.getItem(key) || 'null')
        const ids=[...new Set([...loadWaitingIds(owner), ...(saved?.waitingId ? [saved.waitingId] : [])])]
        const results=await Promise.allSettled(ids.map(pollWaiting))
        const failure=results.find(result=>result.status==='rejected')
        const rows=results.filter(result=>result.status==='fulfilled').map(result=>result.value)
        if(rows.some(row=>!Number.isSafeInteger(row?.waitingId)||typeof row?.status!=='string'))throw new Error('Invalid response')
        const mine=rows.find(row=>Number(row.popId)===popId && isActive(row))
        const latestPopup=await getPopup(popId)
        if(!alive || lock.current || version!==mutationVersion.current)return
        setCurrentPopup(latestPopup)
        if(mine){setRecord(mine);setUncertain(false);sessionStorage.setItem(key,JSON.stringify({waitingId:mine.waitingId}))}
        else if(saved?.pending){setUncertain(true)}
        else {setRecord(previous=>previous && rows.find(row=>row.waitingId===previous.waitingId) || previous)}
        setReady(!failure)
        setError(failure ? '일부 접수 내역을 확인하지 못했습니다. 중복 접수 방지를 위해 다시 확인해 주세요.' : '')
      } catch(requestError){if(alive){setReady(false);setError(errorText(requestError))}}
      finally{running=false;if(alive)timer=setTimeout(refresh,5000)}
    }
    function resume(){clearTimeout(timer);refresh()}
    refresh();document.addEventListener('visibilitychange',resume)
    return()=>{alive=false;clearTimeout(timer);document.removeEventListener('visibilitychange',resume)}
  },[owner,popId,demo,key,retry])

  const connection=useRealtimeTopics(record && isActive(record) ? [`/topic/waitings/${record.waitingId}`] : [], !demo && Boolean(owner), ()=>setRetry(v=>v+1))
  const opening=getWaitingOpeningState(now)
  const calledNotice=useRef(null)
  useEffect(()=>{
    if(record?.status==='CALLED' && calledNotice.current!==record.waitingId){
      calledNotice.current=record.waitingId
      app.showToast('입장 호출을 받았어요. 현장 직원에게 확인해 주세요.')
    }
  },[record,app.showToast])
  const reason=demo ? '현장 접수를 준비 중입니다.' : getWaitingUnavailableReason(currentPopup,now)
  async function register(event){
    event.preventDefault()
    if(lock.current || !owner || demo || getWaitingUnavailableReason(currentPopup,Date.now()) || !ready || uncertain || isActive(record))return
    if(!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone.trim())){setError('휴대폰 번호를 올바르게 입력해 주세요.');return}
    if(!Number.isSafeInteger(people)||people<1){setError('대기 인원은 1명 이상이어야 합니다.');return}
    mutationVersion.current+=1;lock.current=true;setBusy(true);setError('');setNotice('')
    let started=false, received=false
    try {
      sessionStorage.setItem(key,JSON.stringify({pending:true}))
      started=true
      const result=await createWaiting({popId,phone:phone.trim(),peopleCount:people})
      received=true
      if(!Number.isSafeInteger(result?.waitingId)||Number(result.popId)!==popId||typeof result.status!=='string')throw new Error('Invalid response')
      // 응답 번호를 먼저 보관한 뒤 내 예약·웨이팅 목록에 연결합니다.
      sessionStorage.setItem(key,JSON.stringify({waitingId:result.waitingId}))
      let saved=true
      try{addWaitingId(result.waitingId,owner)}catch{saved=false}
      if(!active.current)return
      setRecord(result);setUncertain(false)
      setNotice(saved ? '접수되었습니다. 내 예약·웨이팅에서 확인하거나 취소할 수 있어요.' : `서버 접수 완료 · 접수 ID ${result.waitingId}를 기록해 주세요. 브라우저 목록 저장에 실패했습니다.`)
    } catch(requestError){
      if(!active.current)return
      const unknown=started && (received || !requestError.response && Boolean(requestError.request) || requestError.response?.status>=500)
      setUncertain(Boolean(unknown))
      if(!unknown){try{sessionStorage.removeItem(key)}catch{}}
      setError(unknown ? '접수 결과가 불확실해 재등록을 막았습니다. 내역 또는 현장 담당자를 통해 확인해 주세요.' : errorText(requestError))
    }finally{lock.current=false;if(active.current)setBusy(false)}
  }
  async function cancel(){
    if(lock.current || record?.status!=='WAITING' || !window.confirm('현장 대기를 취소하시겠습니까?'))return
    mutationVersion.current+=1;lock.current=true;setBusy(true);setError('')
    try{
      const result=await cancelWaiting(record.waitingId)
      if(result?.waitingId!==record.waitingId||typeof result.status!=='string')throw new Error('Invalid response')
      if(active.current){setRecord(result);setNotice(result.status==='CANCELLED'?'대기가 취소되었습니다.':'대기 상태가 변경되었습니다. 최신 상태를 확인해 주세요.')}
    }catch(requestError){if(active.current)setError(errorText(requestError))}
    finally{lock.current=false;if(active.current)setBusy(false)}
  }
  return <div className="rp-waiting"><div className="rp-panel-heading"><span className="rp-eyebrow">ON-SITE WAITING</span><h2>현장에서 편하게 기다리세요</h2><p>휴대폰 번호와 인원을 입력해 주세요.</p></div>
    {!isActive(record) && !opening.isOpen && <p className="rp-message" role="status"><strong style={{color:'#465235'}}>현재 예약 가능한 시간이 아닙니다.</strong><br />현장 웨이팅은 오후 3시부터 접수할 수 있어요.</p>}
    {!owner && !demo ? <div className="rp-login"><p>내 대기 내역을 관리하려면 먼저 로그인해 주세요.</p><Link className="rp-primary" to="/login">로그인하기</Link></div> : <>
      {!isActive(record) && !opening.isOpen && <div className="rp-opening" role="timer" aria-label="현장 웨이팅 오픈까지 남은 시간"><span>현장 웨이팅 · 오후 3시 오픈</span>{opening.showCountdown ? <strong>{opening.countdown}</strong> : <strong>15:00</strong>}<small>{opening.showCountdown ? '잠시 후 접수가 열려요' : '오후 2시 50분부터 카운트다운이 시작돼요'}</small></div>}
      {reason && !isActive(record) && (opening.isOpen || String(currentPopup.opStatus || "").toUpperCase() !== "OPEN") && <p className="rp-message">{reason}</p>}
      {record ? <section className="rp-waiting-ticket"><span>{labels[record.status] || record.status}</span><strong>{record.queueNumber}번</strong><p>방문 인원 {record.peopleCount}명</p>{record.status==='WAITING'&&<dl><div><dt>앞 대기</dt><dd>{record.teamsAhead??'—'}팀</dd></div><div><dt>예상 대기</dt><dd>{record.estimatedWaitMins??'—'}분</dd></div></dl>}{record.status==='CALLED'&&<p role="alert" className="rp-called">입장 호출을 받았어요. 현장 직원에게 확인해 주세요.</p>}<small>체크인 코드 {record.checkInCode || '확인 필요'}</small>{record.status==='WAITING'&&<button type="button" disabled={busy} className="rp-secondary rp-full" onClick={cancel}>{busy?'처리 중…':'대기 취소'}</button>}</section> : <form onSubmit={register}>
        <label htmlFor="rp-wait-phone">휴대폰 번호</label><input id="rp-wait-phone" type="tel" autoComplete="tel" placeholder="010-1234-5678" value={phone} disabled={busy||demo} onChange={e=>setPhone(e.target.value)} required />
        <label htmlFor="rp-wait-people">방문 인원</label><input id="rp-wait-people" type="number" min="1" step="1" value={people} disabled={busy||demo} onChange={e=>setPeople(Number(e.target.value))} required />
        <button type="submit" className="rp-primary rp-full" disabled={busy||demo||Boolean(reason)||!ready||uncertain}>{busy?'접수 중…':!opening.isOpen?'오후 3시에 접수가 열려요':demo?'접수 준비 중':!ready?'접수 상태 확인 중':'대기번호 발급받기'}</button>
      </form>}
      {notice&&<p className="rp-message" role="status">{notice}</p>}{error&&<div className="rp-error" role="alert">{error}<button type="button" className="rp-secondary" disabled={busy} onClick={()=>setRetry(v=>v+1)}>상태 다시 확인</button></div>}
      <Link to="/my-activities" className="rp-waiting-link">내 예약·웨이팅에서 확인 →</Link>
    </>}
  </div>
}
