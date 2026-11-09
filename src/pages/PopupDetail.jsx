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
import './PopupDetail.css'

const TIME_SLOTS = ['11:00', '13:00', '15:00', '17:00']

const TABS = [
  { key: 'about', label: '소개' },
  { key: 'goods', label: '굿즈' },
  { key: 'guide', label: '방문 안내' },
  { key: 'map', label: '위치' },
]

// 진행 상태: 서버 값이 있으면 그것을, 없으면 날짜로 계산
function getStatus(popup) {
  const raw = String(popup.status ?? popup.popupStatus ?? '').toUpperCase()
  if (['ONGOING', '진행중'].includes(raw)) return { label: '진행중', cls: 'is-on' }
  if (['UPCOMING', 'SCHEDULED', '진행예정'].includes(raw)) return { label: '진행예정', cls: 'is-soon' }
  if (['ENDED', 'FINISHED', '종료'].includes(raw)) return { label: '종료', cls: 'is-end' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = popup.startDate ? new Date(popup.startDate) : null
  const end = popup.endDate ? new Date(popup.endDate) : null
  const validStart = start && !isNaN(start)
  const validEnd = end && !isNaN(end)

  if (validStart && start > today) return { label: '진행예정', cls: 'is-soon' }
  if (validEnd && end < today) return { label: '종료', cls: 'is-end' }
  if (validStart && validEnd) return { label: '진행중', cls: 'is-on' }
  return null
}

function BasicPopupDetail(){
  const params = useParams()
  const id = params.popupId ?? params.id
  const app = useApp()

  // 서버에서 팝업 상세와 굿즈 조회 (GET /api/popups/{popId}, /api/popups/{popId}/products)
  const { data: popup, loading, error } = usePopup(id)
  const { data: productsData } = usePopupProducts(id)
  const popupGoods = Array.isArray(productsData) ? productsData : []

  const [tab, setTab] = useState('about')
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

  // 이미지: 여러 장(images)이 오면 갤러리로, 한 장이면 큰 이미지 하나로
  const images = (Array.isArray(popup.images) && popup.images.length > 0
    ? popup.images
    : [popup.image]
  ).filter(Boolean)
  const galleryClass = images.length >= 3 ? '' : images.length === 2 ? ' is-double' : ' is-single'

  const status = getStatus(popup)
  const description =
    popup.description ||
    popup.content ||
    `${popup.location || '지정된 장소'}에서 ${popup.startDate} ~ ${popup.endDate} 동안 열리는 팝업스토어예요.`
  const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(popup.location || popup.title || '')}`

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
    <div className="container bpd">
      {/* 경로 */}
      <nav className="bpd-crumb" aria-label="현재 위치">
        <Link to="/">홈</Link>
        <span>›</span>
        <Link to="/popups">팝업 탐색</Link>
        <span>›</span>
        <span className="bpd-crumb-now">{popup.title}</span>
      </nav>

      <div className="bpd-layout">
        {/* 왼쪽: 정보 */}
        <div className="bpd-main">
          {/* 이미지 */}
          {images.length > 0 ? (
            <div className={'bpd-gallery' + galleryClass}>
              {images.slice(0, 3).map((src, i) => (
                <img
                  key={src + i}
                  src={src}
                  alt={i === 0 ? popup.title : `${popup.title} ${i + 1}`}
                  className={i === 0 ? 'bpd-gallery-main' : 'bpd-gallery-sub'}
                />
              ))}
            </div>
          ) : (
            <div className="bpd-gallery-empty">이미지 준비 중이에요</div>
          )}

          {/* 제목 영역 */}
          <div className="bpd-head">
            <div className="bpd-badges">
              {popup.category && <span className="badge">{popup.category}</span>}
              {status && <span className={'bpd-status ' + status.cls}>{status.label}</span>}
            </div>
            <h1 className="bpd-title">{popup.title}</h1>
            <ul className="bpd-meta">
              <li>📍 {popup.location}</li>
              <li>🗓 {popup.startDate} ~ {popup.endDate}</li>
            </ul>
          </div>

          {/* 탭 */}
          <div className="bpd-tabs" role="tablist">
            {TABS.map(t => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={'bpd-tab' + (tab === t.key ? ' active' : '')}
                onClick={() => setTab(t.key)}
              >
                {t.label}{t.key === 'goods' && popupGoods.length > 0 ? ` ${popupGoods.length}` : ''}
              </button>
            ))}
          </div>

          <div className="bpd-panel">
            {tab === 'about' && (
              <div className="bpd-about">
                <div className="bpd-eyebrow">ABOUT</div>
                <h2 className="bpd-headline">{popup.title}</h2>
                <p className="bpd-desc">{description}</p>

                <div className="bpd-notice">
                  <h3>방문 전 꼭 확인해 주세요</h3>
                  <p>예약은 회차 7일 전 10:00에 열리고, 전날까지 할 수 있어요.</p>
                  <p>예약을 선점한 뒤 10분 안에 확정하지 않으면 자리가 풀려요.</p>
                  <p>현장 대기는 휴대폰 번호로 등록하고, 받은 체크인 코드로 입장해요.</p>
                </div>
              </div>
            )}

            {tab === 'goods' && (
              popupGoods.length > 0 ? (
                <div className="bpd-goods">
                  {popupGoods.map(g => <GoodsCard key={g.id} item={g} />)}
                </div>
              ) : (
                <div className="bpd-empty">아직 등록된 굿즈가 없어요</div>
              )
            )}

            {tab === 'guide' && (
              <div className="bpd-guide">
                <div className="bpd-guide-row">
                  <strong>운영 기간</strong>
                  <span>{popup.startDate} ~ {popup.endDate}</span>
                </div>
                <div className="bpd-guide-row">
                  <strong>장소</strong>
                  <span>{popup.location}</span>
                </div>
                <div className="bpd-guide-row">
                  <strong>예약 방법</strong>
                  <span>오른쪽에서 시간과 인원을 고르고 예약을 선점한 뒤 확정해요.</span>
                </div>
                <div className="bpd-guide-row">
                  <strong>현장 대기</strong>
                  <span>휴대폰 번호를 입력해 등록하면 순번과 체크인 코드를 받아요.</span>
                </div>
              </div>
            )}

            {tab === 'map' && (
              <div className="bpd-map">
                <p className="bpd-map-place">📍 {popup.location}</p>
                <a className="btn btn-outline" href={mapUrl} target="_blank" rel="noreferrer">
                  네이버 지도에서 보기
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 예약·대기 */}
        <aside className="bpd-aside">
          <div className="bpd-side-card">
            <div className="bpd-eyebrow">현재 혼잡도</div>
            <CongestionBar reserved={popup.reserved ?? 0} capacity={popup.capacity ?? 0} />
            <div className="card-sub">{popup.reserved ?? 0} / {popup.capacity ?? 0}명 예약</div>
          </div>

          {/* 예약 섹션 */}
          <div className="form-box bpd-box">
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
          <div className="form-box bpd-box">
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
        </aside>
      </div>
    </div>
  )
}

export default function PopupDetail(){
  const params = useParams()
  const key = params.id ?? params.popupId
  const featured = featuredPopups.find(f => String(f.id) === String(key))
  return featured ? <FeaturedPopupDetail popup={featured} /> : <BasicPopupDetail />
}