import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import CongestionBar from '../components/common/CongestionBar.jsx'
import GoodsCard from '../components/common/GoodsCard.jsx'
import FeaturedPopupDetail from './FeaturedPopupDetail.jsx'
import { featuredPopups } from '../data/featuredPopups.js'
import { usePopup, usePopupProducts } from '../hooks/usePopups'
import { createWaiting, cancelWaiting as cancelWaitingApi } from '../api/waitingApi.js'
import { addWaitingId } from '../utils/waitingStore.js'

const TIME_SLOTS = ['11:00', '13:00', '15:00', '17:00']

function BasicPopupDetail(){
  const params = useParams()
  const id = params.popupId ?? params.id
  const app = useApp()

  // 서버에서 팝업 상세와 굿즈 조회 (GET /api/popups/{popId}, /api/popups/{popId}/products)
  const { data: popup, loading, error } = usePopup(id)
  const { data: productsData } = usePopupProducts(id)
  const popupGoods = Array.isArray(productsData) ? productsData : []

  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0])
  const [peopleCount, setPeopleCount] = useState(1)
  const [myReservationId, setMyReservationId] = useState(null)
  const [myWaiting, setMyWaiting] = useState(null) // 서버 응답(WaitingStatusResponse)을 그대로 저장
  const [phone, setPhone] = useState('')
  const [waitingError, setWaitingError] = useState('')
  const [waitingLoading, setWaitingLoading] = useState(false)

  if(loading){
    return <div className="container empty-state">팝업 정보를 불러오는 중이에요</div>
  }

  if(error || !popup){
    return (
      <div className="container empty-state">
        {error || '존재하지 않는 팝업입니다.'} <Link to="/popups">목록으로</Link>
      </div>
    )
  }

  const myReservation = app.reservations.find(r => r.id === myReservationId)

  // TODO: 예약은 팀장님이 이슈 #4에서 통합. 지금은 기존 샘플 동작 유지
  function handleReserve(){
    if(!app.currentUser){ app.showToast('로그인이 필요합니다'); return }
    const rid = app.createReservation(popup.id, selectedTime, peopleCount)
    setMyReservationId(rid)
    app.showToast('예약이 임시 선점되었어요. 10분 내 확정해주세요')
  }

  async function handleWaiting(){
    if(!app.currentUser){ app.showToast('로그인이 필요합니다'); return }
    if(!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim())){
      setWaitingError('휴대폰 번호를 올바르게 입력해주세요 (예: 010-1234-5678)')
      return
    }
    setWaitingError('')
    setWaitingLoading(true)
    try {
      const data = await createWaiting({
        popId: Number(popup.id),
        phone: phone.trim(),
        peopleCount,
      })
      addWaitingId(data.waitingId)
      setMyWaiting(data)
      app.showToast('현장 대기열에 등록되었어요')
    } catch (err) {
      setWaitingError(err.response?.data?.message || '대기 등록에 실패했어요. 잠시 후 다시 시도해주세요')
    } finally {
      setWaitingLoading(false)
    }
  }

  async function handleCancelWaiting(){
    setWaitingLoading(true)
    try {
      const data = await cancelWaitingApi(myWaiting.waitingId)
      setMyWaiting(data)
      app.showToast('대기가 취소되었어요')
    } catch (err) {
      setWaitingError(err.response?.data?.message || '취소에 실패했어요')
    } finally {
      setWaitingLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, marginTop:24 }}>
        <img src={popup.image} alt={popup.title} style={{ width:'100%', borderRadius:'var(--radius)', aspectRatio:'4/3', objectFit:'cover' }} />

        <div>
          <span className="badge">{popup.category}</span>
          <h1 style={{ fontSize:28, fontWeight:800, margin:'12px 0 8px' }}>{popup.title}</h1>
          <p className="card-sub">{popup.location}</p>
          <p className="card-sub">{popup.startDate} ~ {popup.endDate}</p>

          <div style={{ marginTop:24 }}>
            <div className="card-sub" style={{ marginBottom:6 }}>현재 혼잡도</div>
            <CongestionBar reserved={popup.reserved ?? 0} capacity={popup.capacity ?? 0} />
            <div className="card-sub">{popup.reserved ?? 0} / {popup.capacity ?? 0}명 예약</div>
          </div>

          {/* 예약 섹션 */}
          <div className="form-box" style={{ margin:'24px 0 0', maxWidth:'100%' }}>
            <h2 style={{ fontSize:18 }}>예약하기</h2>
            <div className="tabs">
              {TIME_SLOTS.map(t => (
                <button key={t} className={'tab-btn'+(selectedTime===t?' active':'')} onClick={()=>setSelectedTime(t)}>{t}</button>
              ))}
            </div>
            <div className="form-group">
              <label>인원수</label>
              <div className="qty-box">
                <button onClick={()=>setPeopleCount(c=>Math.max(1,c-1))}>-</button>
                <span>{peopleCount}명</span>
                <button onClick={()=>setPeopleCount(c=>c+1)}>+</button>
              </div>
            </div>

            {!myReservation ? (
              <button className="btn btn-primary btn-block" onClick={handleReserve}>예약 선점하기</button>
            ) : myReservation.status === 'HOLD' ? (
              <div>
                <p className="card-sub">선점됨 · 10분 내 확정해주세요</p>
                <button className="btn btn-primary btn-block" onClick={()=>app.confirmReservation(myReservation.id)}>예약 확정</button>
                <button className="btn btn-outline btn-block" style={{marginTop:8}} onClick={()=>app.cancelReservation(myReservation.id)}>취소</button>
              </div>
            ) : myReservation.status === 'CONFIRMED' ? (
              <p style={{ color:'var(--primary-dark)', fontWeight:700 }}>✅ 예약이 확정되었습니다</p>
            ) : (
              <p className="card-sub">예약이 취소되었습니다</p>
            )}
          </div>

          {/* 웨이팅 섹션 */}
          <div className="form-box" style={{ margin:'16px 0 0', maxWidth:'100%' }}>
            <h2 style={{ fontSize:18 }}>현장 대기 등록</h2>
            {!myWaiting ? (
              <>
                <div className="form-group">
                  <label>휴대폰 번호</label>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-1234-5678" />
                </div>
                {waitingError && <div className="form-error">{waitingError}</div>}
                <button className="btn btn-outline btn-block" onClick={handleWaiting} disabled={waitingLoading}>
                  {waitingLoading ? '등록 중...' : '현장 대기 등록하기'}
                </button>
              </>
            ) : myWaiting.status === 'WAITING' ? (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:36, fontWeight:800, color:'var(--primary)' }}>{myWaiting.queueNumber}번</div>
                <p className="card-sub">앞에 {myWaiting.teamsAhead}팀 · 약 {myWaiting.estimatedWaitMins}분</p>
                <p className="card-sub">체크인 코드: <strong>{myWaiting.checkInCode}</strong></p>
                {waitingError && <div className="form-error">{waitingError}</div>}
                <button className="btn btn-outline btn-block" style={{marginTop:12}} onClick={handleCancelWaiting} disabled={waitingLoading}>대기 취소</button>
              </div>
            ) : myWaiting.status === 'CANCELLED' ? (
              <p className="card-sub">대기가 취소되었습니다</p>
            ) : (
              <p className="card-sub">현재 상태: {myWaiting.status}</p>
            )}
          </div>
        </div>
      </div>

      {popupGoods.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop:48 }}>🛍️ 판매 굿즈</div>
          <div className="grid-4">
            {popupGoods.map(g => <GoodsCard key={g.id} item={g} />)}
          </div>
        </>
      )}
    </div>
  )
}

export default function PopupDetail(){
  const params = useParams()
  const key = params.id ?? params.popupId
  const featured = featuredPopups.find(f => String(f.id) === String(key))
  return featured ? <FeaturedPopupDetail popup={featured} /> : <BasicPopupDetail />
}