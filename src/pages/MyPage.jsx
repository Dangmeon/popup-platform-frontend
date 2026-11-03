import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePopups } from '../hooks/usePopups'
import { getMyReservations } from '../api/mypageApi.js'
import { getWaiting, cancelWaiting as cancelWaitingApi } from '../api/waitingApi.js'
import { loadWaitingIds } from '../utils/waitingStore.js'

export default function MyPage(){
  const app = useApp()
  const [tab, setTab] = useState('reservations')

  // 팝업 이름·이미지를 찾기 위한 서버 팝업 목록
  const { data: popupList } = usePopups({})
  const popups = Array.isArray(popupList) ? popupList : []
  const findPopup = (id) => popups.find(p => String(p.id) === String(id))

  // 서버 예약 목록 (서버 로그인일 때만)
  const [serverReservations, setServerReservations] = useState([])
  const [rsvLoading, setRsvLoading] = useState(false)
  const [rsvError, setRsvError] = useState('')

  // 내 웨이팅 목록 (등록할 때 저장해 둔 waitingId로 하나씩 조회)
  const [waitings, setWaitings] = useState([])
  const [waitLoading, setWaitLoading] = useState(false)
  const [waitError, setWaitError] = useState('')

  const useServer = Boolean(app?.isAuthenticated)

  useEffect(() => {
    if (!app?.currentUser || !useServer) return
    setRsvLoading(true)
    setRsvError('')
    getMyReservations()
      .then(setServerReservations)
      .catch(() => setRsvError('예약 내역을 불러오지 못했어요'))
      .finally(() => setRsvLoading(false))
  }, [app?.currentUser, useServer])

  useEffect(() => {
    if (!app?.currentUser) return
    const ids = loadWaitingIds()
    if (ids.length === 0) { setWaitings([]); return }
    setWaitLoading(true)
    setWaitError('')
    Promise.allSettled(ids.map(getWaiting)).then(results => {
      const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value)
      setWaitings(ok)
      if (ok.length < ids.length) setWaitError('일부 웨이팅을 불러오지 못했어요')
    }).finally(() => setWaitLoading(false))
  }, [app?.currentUser])

  async function handleCancelWaiting(waitingId){
    try {
      const data = await cancelWaitingApi(waitingId)
      setWaitings(prev => prev.map(w => w.waitingId === waitingId ? data : w))
      app.showToast('대기가 취소되었어요')
    } catch (err) {
      app.showToast(err.response?.data?.message || '취소에 실패했어요')
    }
  }

  if(!app.currentUser){
    return (
      <div className="container empty-state">
        <p>로그인이 필요합니다.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop:16, display:'inline-block' }}>
          로그인하기
        </Link>
      </div>
    )
  }

  // 서버 예약 응답 필드명은 확정 전이라 후보 이름을 함께 받습니다.
  // 화면에 빈 값이 나오면 Network 탭의 reservations 응답을 보고 여기를 맞추세요.
  function normalizeReservation(r){
    return {
      id: r.reservationId ?? r.id,
      popId: r.popId ?? r.popupId,
      peopleCount: r.peopleCount ?? r.headcount ?? r.people,
      status: r.status ?? r.reservationStatus,
      when: r.visitDate ?? r.reservationDate ?? r.slotStartTime ?? r.startTime ?? r.timeSlot ?? '',
    }
  }

  return (
    <div className="container">
      <div className="page-title">마이페이지</div>
      <p className="card-sub">{app.currentUser.name}님 ({app.currentUser.email ?? app.currentUser.username})</p>
      <Link to="/mypage/account" className="btn btn-outline" style={{ display:'inline-block', marginTop:12 }}>
        내 정보 관리
      </Link>

      <div className="tabs" style={{marginTop:24}}>
        <button className={'tab-btn'+(tab==='reservations'?' active':'')} onClick={()=>setTab('reservations')}>내 예약</button>
        <button className={'tab-btn'+(tab==='waitings'?' active':'')} onClick={()=>setTab('waitings')}>내 웨이팅</button>
      </div>

      {/* 내 예약 */}
      {tab==='reservations' && (
        useServer ? (
          rsvLoading ? <div className="empty-state">불러오는 중이에요</div> :
          rsvError ? <div className="empty-state">{rsvError}</div> :
          serverReservations.length===0 ? <div className="empty-state">예약 내역이 없어요.</div> :
          serverReservations.map(raw => {
            const r = normalizeReservation(raw)
            const popup = findPopup(r.popId)
            return (
              <div className="cart-row" key={r.id}>
                <img src={popup?.image} alt="" />
                <div style={{flex:1}}>
                  <div className="card-title">{popup?.title ?? `팝업 ${r.popId ?? ''}`}</div>
                  <div className="card-sub">{r.when} · {r.peopleCount}명 · 상태: {r.status}</div>
                </div>
              </div>
            )
          })
        ) : (
          // 데모 로그인: 기존 샘플 예약
          app.reservations.length===0 ? <div className="empty-state">예약 내역이 없어요.</div> :
          app.reservations.map(r => {
            const popup = findPopup(r.popupId) ?? app.popups.find(p=>p.id===r.popupId)
            return (
              <div className="cart-row" key={r.id}>
                <img src={popup?.image} alt="" />
                <div style={{flex:1}}>
                  <div className="card-title">{popup?.title}</div>
                  <div className="card-sub">{r.peopleCount}명 · 상태: {r.status}</div>
                </div>
                {r.status==='HOLD' && <button className="btn btn-outline" onClick={()=>app.cancelReservation(r.id)}>취소</button>}
              </div>
            )
          })
        )
      )}

      {/* 내 웨이팅 */}
      {tab==='waitings' && (
        waitLoading ? <div className="empty-state">불러오는 중이에요</div> :
        waitings.length===0 ? <div className="empty-state">{waitError || '웨이팅 내역이 없어요.'}</div> :
        <>
          {waitError && <div className="form-error">{waitError}</div>}
          {waitings.map(w => {
            const popup = findPopup(w.popId)
            return (
              <div className="cart-row" key={w.waitingId}>
                <img src={popup?.image} alt="" />
                <div style={{flex:1}}>
                  <div className="card-title">{popup?.title ?? `팝업 ${w.popId}`}</div>
                  <div className="card-sub">대기번호 {w.queueNumber}번 · 상태: {w.status}</div>
                  {w.status==='WAITING' && (
                    <div className="card-sub">앞에 {w.teamsAhead}팀 · 약 {w.estimatedWaitMins}분</div>
                  )}
                </div>
                {w.status==='WAITING' && (
                  <button className="btn btn-outline" onClick={()=>handleCancelWaiting(w.waitingId)}>취소</button>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}