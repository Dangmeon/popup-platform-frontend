import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PopqIcon from '../components/common/PopqIcon.jsx'
import { getMyReservations } from '../api/mypageApi'
import { getWaiting, cancelWaiting } from '../api/waitingApi'
import { getPopups } from '../api/popupApi'
import { loadWaitingIds } from '../utils/waitingStore'
import '../styles/MyActivities.css'

// 실제 내역만 표시하며, 조회 실패를 빈 목록으로 바꾸지 않습니다.
function errorMessage(error) {
  const status = error.response?.status
  if (status === 401) return '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.'
  if (status === 403) return '이 내역을 조회할 인증 또는 권한을 확인하지 못했습니다.'
  if (status === 404) return '내역 조회 기능을 아직 연결하지 못했습니다. 잠시 후 다시 확인해 주세요.'
  if (!error.response && error.request) return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  return '내역을 불러오지 못했습니다. 다시 조회해 주세요.'
}
function normalize(row) {
  return { id:row.reservationId ?? row.id, popId:row.popId ?? row.popupId, title:row.popupName,
    image:row.popupImage, date:row.slotDate ?? row.visitDate ?? row.reservationDate,
    time:row.startTime ?? row.timeSlot ?? row.slotStartTime,
    people:row.peopleCount ?? row.headcount ?? row.people, status:row.reservationStatus ?? row.status }
}

export default function MyPage() {
  const app = useApp()
  const owner = app.isAuthenticated ? app.currentUser?.username || app.currentUser?.email : null
  // 계정이 바뀌면 이전 계정의 내역과 요청 상태를 재사용하지 않습니다.
  return <ActivityPage key={owner || 'guest'} owner={owner} />
}

function ActivityPage({ owner }) {
  const [tab, setTab] = useState('reservations')
  const [retry, setRetry] = useState(0)
  const [reservations, setReservations] = useState([])
  const [waitings, setWaitings] = useState([])
  const [popups, setPopups] = useState([])
  const [loading, setLoading] = useState({ reservations:true, waitings:true })
  const [errors, setErrors] = useState({ reservations:'', waitings:'' })
  const [cancelling, setCancelling] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [notice, setNotice] = useState('')
  const cancelLock = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!owner) return
    let active = true
    setLoading({ reservations:true,waitings:true })
    setErrors({reservations:'',waitings:''})
    setCancelError('')
    // 예약과 웨이팅은 독립적으로 처리해 한쪽 실패가 다른 쪽을 가리지 않습니다.
    getMyReservations().then(rows => {
      if (!Array.isArray(rows)) throw new Error('Invalid reservation response')
      if (active) setReservations(rows.map(normalize).filter(row => row.status === 'CONFIRMED'))
    }).catch(error => {
      if (active) { setReservations([]); setErrors(previous => ({...previous,reservations:errorMessage(error)})) }
    }).finally(() => { if (active) setLoading(previous => ({...previous,reservations:false})) })

    async function fetchWaitings() {
      try {
        const ids = loadWaitingIds(owner)
        const results = await Promise.allSettled(ids.map(id => getWaiting(id)))
        if (!active) return
        const rows = results.filter(result => result.status === 'fulfilled').map(result => result.value)
        if (rows.some(row => !row || !Number.isSafeInteger(row.waitingId) || typeof row.status !== 'string')) throw new Error('Invalid waiting response')
        setWaitings(rows.filter(row => ['WAITING','CALLED'].includes(row.status)))
        const failure = results.find(result => result.status === 'rejected')
        if (failure) setErrors(previous => ({...previous,waitings:errorMessage(failure.reason)}))
      } catch (error) {
        if (active) {setWaitings([]);setErrors(previous => ({...previous,waitings:errorMessage(error)}))}
      } finally {
        if (active) setLoading(previous => ({...previous,waitings:false}))
      }
    }
    fetchWaitings()
    getPopups().then(rows => { if (active && Array.isArray(rows)) setPopups(rows) }).catch(() => {})
    return () => { active = false }
  }, [owner,retry])

  async function handleCancel(id) {
    if (cancelLock.current || !window.confirm('이 팝업의 현장 대기를 취소하시겠습니까?')) return
    cancelLock.current = true
    setCancelling(id); setCancelError('');setNotice('')
    try {
      const result = await cancelWaiting(id)
      if (result?.waitingId !== id || typeof result?.status !== 'string') throw new Error('Invalid waiting response')
      if (!mounted.current) return
      setWaitings(previous => previous.map(row => row.waitingId === id ? result : row).filter(row => ['WAITING','CALLED'].includes(row.status)))
      if (result.status === 'CANCELLED') setNotice('현장 대기가 취소되었습니다.')
      else setCancelError('대기 상태가 변경되었습니다. 최신 내역을 확인해 주세요.')
    } catch (error) {
      if (mounted.current) setCancelError(errorMessage(error))
    } finally {
      cancelLock.current = false
      if (mounted.current) setCancelling(null)
    }
  }
  const popupFor = id => popups.find(p => String(p.id ?? p.popId) === String(id))
  const rows = tab === 'reservations' ? reservations : waitings
  const count = type => loading[type] || errors[type] ? '—' : type === 'reservations' ? reservations.length : waitings.length
  const busy = loading.reservations || loading.waitings || cancelling !== null

  return <div className="pq-activities container">
    {/* 일반 마이페이지와 분리된 이용 내역 헤더 */}
    <header className="pa-heading"><div><span className="pa-eyebrow">MY EXPERIENCE</span><h1>내 예약·웨이팅</h1><p>곧 만날 팝업과 현재 대기 상황을 확인하세요.</p></div>
      {owner && <button className="pa-refresh" type="button" disabled={busy} onClick={() => setRetry(value => value+1)}><PopqIcon name="refresh" size={17} />{busy ? '확인 중' : '새로고침'}</button>}
    </header>
    {!owner ? <section className="pa-state"><span className="pa-state-icon"><PopqIcon name="ticket" size={32} /></span><h2>나의 팝업 여정을 확인하세요</h2><p>로그인하면 확정된 예약과 진행 중인 웨이팅을 볼 수 있어요.</p><Link className="pa-primary" to="/login">로그인하기</Link></section> : <>
      <nav className="pa-tabs" aria-label="이용 내역 종류">
        <button type="button" aria-pressed={tab === 'reservations'} onClick={() => setTab('reservations')}><PopqIcon name="ticket" size={23} /><span>방문 예정 예약<strong>{count('reservations')}<small>건</small></strong></span><span className="pa-tab-arrow">↗</span></button>
        <button type="button" aria-pressed={tab === 'waitings'} onClick={() => setTab('waitings')}><PopqIcon name="clock" size={23} /><span>진행 중인 웨이팅<strong>{count('waitings')}<small>건</small></strong></span><span className="pa-tab-arrow">↗</span></button>
      </nav>
      <div className="pa-list-heading"><h2>{tab === 'reservations' ? '예약 확인증' : '나의 대기 현황'}</h2><span>{tab === 'reservations' ? '확정된 예약만 표시합니다' : '대기 중·호출 완료 내역만 표시합니다'}</span></div>
      {tab === 'waitings' && <p className="pa-source-note">이 계정으로 현재 브라우저에서 등록한 웨이팅을 조회합니다.</p>}
      {notice && <p className="pa-feedback" role="status">{notice}</p>}{cancelError && <p className="pa-feedback pa-error" role="alert">{cancelError}</p>}
      {loading[tab] ? <section className="pa-state" role="status"><span className="pa-state-icon"><PopqIcon name="refresh" size={28} /></span><h2>내역을 확인하고 있어요</h2><p>잠시만 기다려 주세요.</p></section> : <>
        {errors[tab] && <section className="pa-state pa-unavailable" role="alert"><span className="pa-state-icon"><PopqIcon name="ticket" size={30} /></span><h2>내역을 불러오지 못했어요</h2><p>{errors[tab]}</p><div className="pa-state-actions"><button className="pa-primary" type="button" disabled={busy} onClick={() => setRetry(value=>value+1)}>다시 조회하기</button><Link className="pa-secondary" to="/popups">팝업 둘러보기</Link></div></section>}
        {!errors[tab] && rows.length === 0 && <section className="pa-state"><span className="pa-state-icon"><PopqIcon name={tab === 'reservations' ? 'ticket' : 'clock'} size={32} /></span><h2>{tab === 'reservations' ? '아직 확정된 예약이 없어요' : '현재 대기 중인 팝업이 없어요'}</h2><p>새로운 취향을 만날 팝업을 찾아보세요.</p><Link className="pa-primary" to="/popups">팝업 둘러보기<PopqIcon name="arrow" size={17} /></Link></section>}
        <div className="pa-tickets">{rows.map(row => {
          const reservation = tab === 'reservations'
          const popup = popupFor(row.popId)
          const title = row.title || popup?.title || `팝업 ${row.popId ?? ''}`
          const image = row.image || popup?.image || popup?.storeImg
          const id = reservation ? row.id : row.waitingId
          return <article className="pa-ticket" key={id}>
            <div className="pa-ticket-body"><div className="pa-poster">{image ? <img src={image} alt={title} /> : <PopqIcon name="ticket" size={32} />}</div><div className="pa-ticket-info"><span className="pa-ticket-type">{reservation ? 'RESERVATION' : 'WAITING'}</span><h3>{title}</h3><p>{popup?.location || '팝업 방문 내역'}</p>
              <dl>{reservation ? <><div><dt>방문 날짜</dt><dd>{row.date || '날짜 확인 필요'}</dd></div><div><dt>방문 시간</dt><dd>{row.time || '시간 확인 필요'}</dd></div><div><dt>방문 인원</dt><dd>{row.people ?? '—'}명</dd></div></> : <><div><dt>내 대기번호</dt><dd>{row.queueNumber ?? '—'}번</dd></div><div><dt>대기 인원</dt><dd>{row.peopleCount ?? '—'}명</dd></div>{row.status === 'WAITING' && <><div><dt>앞 대기 팀</dt><dd>{row.teamsAhead ?? '—'}팀</dd></div><div><dt>예상 대기</dt><dd>{row.estimatedWaitMins ?? '—'}분</dd></div></>}</>}</dl>
              {!reservation && row.status === 'CALLED' && <p className="pa-called-notice">입장 호출을 받았어요. 현장 직원에게 확인해 주세요.</p>}
            </div></div>
            <aside className="pa-ticket-stub"><span className={`pa-status ${row.status === 'CALLED' ? 'called' : ''}`}>{reservation ? '예약 확정' : row.status === 'CALLED' ? '입장 호출' : '대기 중'}</span><small>{reservation ? '예약번호' : '체크인 코드'}</small><strong>{reservation ? id : row.checkInCode || '확인 필요'}</strong>
              {!reservation && row.status === 'WAITING' && <button className="pa-secondary" type="button" disabled={cancelling !== null || busy} onClick={() => handleCancel(id)}>{cancelling === id ? '취소 중' : '대기 취소'}</button>}
            </aside>
          </article>
        })}</div>
      </>}
    </>}
  </div>
}
