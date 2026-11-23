import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import PopqIcon from '../../components/common/PopqIcon.jsx'
import http from '../../api/axiosInstance.js'
import { getPopups } from '../../api/admin/popupApi.js'
import { getAdminReservations, reservationStatusLabels } from '../../api/admin/adminReservationApi.js'
import { errorText } from '../../api/admin/liveUtils.js'
import './ManagerCenter.css'

const waitingLabels = { WAITING:'대기 중', CALLED:'호출 완료', ENTERED:'입장 완료', CANCELLED:'취소', EXPIRED:'만료' }
const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const people = rows => rows.reduce((sum, row) => sum + row.peopleCount, 0)

export default function ManagerCenter() {
  const app = useApp()
  if (!app.isAuthenticated) return <Navigate to="/login" replace />
  if (app.currentUser?.role !== 'MANAGER') return <Navigate to="/" replace />
  return <ManagerLive key={app.currentUser?.username || app.currentUser?.email} />
}

function ManagerLive() {
  const app = useApp()
  const { pathname } = useLocation()
  const [popups, setPopups] = useState(null), [popupError, setPopupError] = useState('')
  const [popId, setPopId] = useState(''), [popupRetry, setPopupRetry] = useState(0)
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const [retry, setRetry] = useState(0), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const [search, setSearch] = useState(''), [status, setStatus] = useState('ALL'), [date, setDate] = useState(today)
  const lock = useRef(false), mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    let active = true
    setPopupError('')
    getPopups().then(result => {
      if (!active) return
      setPopups(result.items)
      setPopId(previous => result.items.some(p => String(p.popId) === previous) ? previous : String(result.items[0]?.popId || ''))
    }).catch(e => { if (active) { setPopups(null); setPopupError(errorText(e)) } })
    return () => { active = false }
  }, [popupRetry])
  useEffect(() => {
    if (!popId || busy) return
    let active = true, running = false
    const controller = new AbortController()
    async function load() {
      if (running) return
      running = true; setLoading(true); setError('')
      try {
        const [reservations, response] = await Promise.all([
          getAdminReservations({popId:Number(popId), signal:controller.signal}),
          http.get(`/api/admin/popups/${popId}/waitings`, {signal:controller.signal})
        ])
        const waiting = response.data
        if (!Array.isArray(waiting?.waitings) || waiting.popId !== Number(popId)) throw new Error('웨이팅 응답을 확인하지 못했습니다.')
        if (active) setData({popId, reservations, waitings:waiting.waitings})
      } catch (e) { if (active) { setData(null); setError(e.response ? errorText(e) : e.message) } }
      finally { running = false; if (active) setLoading(false) }
    }
    load()
    const timer = setInterval(load, 30000)
    return () => { active = false; controller.abort(); clearInterval(timer) }
  }, [popId, retry, busy])
  const popup = popups?.find(p => String(p.popId) === popId)
  const current = data?.popId === popId ? data : null
  const day = today()
  const daily = current?.reservations.filter(r => r.slotDate === day) || []
  const waiting = current?.waitings.filter(r => r.status === 'WAITING') || []
  const called = current?.waitings.filter(r => r.status === 'CALLED') || []
  const stats = [['오늘 확정 예약', people(daily.filter(r => r.reservationStatus === 'CONFIRMED')), '명'], ['오늘 이용 완료 예약', people(daily.filter(r => r.reservationStatus === 'USED')), '명'], ['현재 대기', waiting.length, '팀'], ['호출 후 입장 대기', called.length, '팀']]
  const mode = pathname.replace(/\/$/, '') === '/manager' ? 'dashboard' : pathname.endsWith('/reservations') ? 'reservations' : pathname.endsWith('/waiting') ? 'waiting' : null
  async function act(row, type) {
    if (lock.current || !current) return
    if (!window.confirm(type === 'call' ? `대기번호 ${row.queueNumber}번을 호출하시겠습니까?` : `대기번호 ${row.queueNumber}번을 입장 처리하시겠습니까?`)) return
    lock.current = true; setBusy(true); setNotice('')
    try {
      const response = type === 'call'
        ? await http.post(`/api/admin/waitings/${row.waitingId}/call`)
        : await http.post('/api/admin/waitings/checkIn', {checkInCode:row.checkInCode})
      if (response.data?.waitingId !== row.waitingId || response.data?.status !== (type === 'call' ? 'CALLED' : 'ENTERED')) throw new Error('처리 결과를 다시 조회해 주세요.')
      if (mounted.current) setNotice(type === 'call' ? '호출했습니다.' : '입장 처리했습니다.')
    } catch (e) { if (mounted.current) setNotice(e.response ? errorText(e) : '처리 결과를 확인하지 못했습니다. 새로고침 후 상태를 확인해 주세요.') }
    finally { lock.current = false; if (mounted.current) { setBusy(false); setRetry(v => v + 1) } }
  }
  const query = search.trim().toLowerCase()
  function reservationTable(rows) {
    return <div className="mg-table-scroll"><table><thead><tr><th>예약번호</th><th>회원 이메일</th><th>날짜·회차</th><th>인원</th><th>상태</th></tr></thead><tbody>{rows.map(r => <tr key={r.reservationId}><td>{r.reservationId}</td><td>{r.username}</td><td>{r.slotDate}<small>{r.startTime}</small></td><td>{r.peopleCount}명</td><td>{reservationStatusLabels[r.reservationStatus]}</td></tr>)}{!rows.length && <tr><td colSpan={5} className="mg-empty">조건에 맞는 예약이 없습니다.</td></tr>}</tbody></table></div>
  }
  function waitingTable(rows) {
    return <div className="mg-table-scroll"><table><thead><tr><th>대기번호</th><th>체크인 코드</th><th>인원</th><th>상태</th><th>처리</th></tr></thead><tbody>{rows.map(r => <tr key={r.waitingId}><td>{r.queueNumber}</td><td>{r.checkInCode || '—'}</td><td>{r.peopleCount}명</td><td>{waitingLabels[r.status] || r.status}</td><td>{r.status === 'WAITING' ? <button className="mg-action" disabled={busy || loading} onClick={() => act(r, 'call')}>호출</button> : r.status === 'CALLED' ? <button className="mg-action" disabled={busy || loading || !r.checkInCode} onClick={() => act(r, 'checkIn')}>입장 처리</button> : '—'}</td></tr>)}{!rows.length && <tr><td colSpan={5} className="mg-empty">조건에 맞는 웨이팅이 없습니다.</td></tr>}</tbody></table></div>
  }
  return <div className="mg-shell"><aside className="mg-sidebar">
    <Link className="mg-logo" to="/" aria-label="POPQ 메인으로 이동"><img src="/logo.png" alt="POPQ" /><span>매니저 센터</span></Link>
    <div className="mg-assignment"><span>담당 팝업</span><strong>{popup?.title || '담당 팝업 선택'}</strong><small>{popup?.location}</small></div>
    <nav aria-label="매니저 메뉴">{[['/manager','calendar','오늘 현황'],['/manager/reservations','ticket','예약 관리'],['/manager/waiting','user','웨이팅 관리']].map(([to,icon,label]) => <NavLink key={to} to={to} end onClick={() => {setSearch('');setStatus('ALL')}}><PopqIcon name={icon} size={20}/>{label}</NavLink>)}</nav>
    <Link className="mg-return" to="/">사용자 메인으로 돌아가기 →</Link>
  </aside><div className="mg-main"><header className="mg-top"><h1>{popup?.title || '매니저 센터'}</h1><span>{app.currentUser?.name || '매니저'}님</span></header><main className="mg-content">
    <div className="mg-page-title"><h2>{mode === 'dashboard' ? '오늘의 운영 현황' : mode === 'reservations' ? '예약 관리' : mode === 'waiting' ? '웨이팅 관리' : '페이지를 찾을 수 없습니다.'}</h2><button className="mg-action" disabled={busy || loading} onClick={() => {setRetry(v => v + 1);setPopupRetry(v => v + 1)}}>새로고침</button></div>
    {popupError ? <p role="alert">{popupError}</p> : popups === null ? <p role="status">담당 팝업을 확인하고 있어요.</p> : !popups.length ? <section className="mg-panel">배정된 팝업이 없습니다.</section> : <label>담당 팝업 <select value={popId} disabled={busy} onChange={e => {setPopId(e.target.value);setNotice('');setStatus('ALL');setSearch('')}}>{popups.map(p => <option key={p.popId} value={p.popId}>{p.title}</option>)}</select></label>}
    {notice && <p className="mg-notice" role="status">{notice}</p>}
    {error ? <p role="alert">{error}</p> : popId && !current ? <p role="status">현황을 불러오고 있어요.</p> : current && mode && <>
      <div className="mg-stats">{stats.map(([label,value,unit]) => <article key={label}><span>{label}</span><strong>{value}<small>{unit}</small></strong></article>)}</div>
      {mode === 'dashboard' ? <><section className="mg-panel"><div className="mg-panel-title"><h3>오늘 예약 현황</h3><Link to="/manager/reservations">예약 관리 →</Link></div>{reservationTable(daily)}</section><section className="mg-panel"><div className="mg-panel-title"><h3>현재 웨이팅</h3><Link to="/manager/waiting">전체 보기 →</Link></div>{waitingTable([...waiting,...called])}</section></> : <section className="mg-panel">
        <div className="mg-filters"><input aria-label="번호·이메일·체크인 코드 검색" placeholder={mode === 'reservations' ? '예약번호·이메일 검색' : '대기번호·체크인 코드 검색'} value={search} onChange={e => setSearch(e.target.value)}/>{mode === 'reservations' && <input aria-label="방문 날짜" type="date" value={date} onChange={e => setDate(e.target.value)}/>}<select aria-label="상태 필터" value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">모든 상태</option>{Object.entries(mode === 'reservations' ? reservationStatusLabels : waitingLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        {mode === 'reservations' ? reservationTable(current.reservations.filter(r => (!date || r.slotDate === date) && (status === 'ALL' || r.reservationStatus === status) && `${r.reservationId} ${r.username}`.toLowerCase().includes(query))) : waitingTable(current.waitings.filter(r => (status === 'ALL' || r.status === status) && `${r.queueNumber} ${r.checkInCode || ''}`.toLowerCase().includes(query)))}
      </section>}
    </>}
  </main></div></div>
}
