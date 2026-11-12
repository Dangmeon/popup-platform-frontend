import { useState } from 'react'
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import PopqIcon from '../../components/common/PopqIcon.jsx'
import { createManagerDemo, managerDemoPopup } from '../../data/managerDemo.js'
import './ManagerCenter.css'

const labels = { CONFIRMED:'입장 예정', ENTERED:'입장 완료', CANCELLED:'취소', WAITING:'대기 중', CALLED:'호출 완료' }
const sumPeople = rows => rows.reduce((total, row) => total + row.people, 0)
const isToday = date => date === new Intl.DateTimeFormat('sv-SE', { timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date())

export default function ManagerCenter() {
  const app = useApp()
  if (!app.isAuthenticated) return <Navigate to="/login" replace />
  if (app.currentUser?.role !== 'MANAGER') return <Navigate to="/" replace />
  // 계정이 바뀌면 이전 계정의 화면 상태를 재사용하지 않습니다.
  return <ManagerDemo key={app.currentUser?.username || app.currentUser?.email} />
}

function ManagerDemo() {
  const app = useApp()
  const { pathname } = useLocation()
  const [data, setData] = useState(createManagerDemo)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [date, setDate] = useState(() => createManagerDemo().reservations[0].date)
  const [notice, setNotice] = useState('')
  const page = pathname.replace(/\/$/, '')
  const mode = page === '/manager' ? 'dashboard' : page === '/manager/reservations' ? 'reservations' : page === '/manager/waiting' ? 'waiting' : null
  const todayReservations = data.reservations.filter(row => isToday(row.date))
  const waitingRows = data.waitings.filter(row => row.status === 'WAITING')
  const calledRows = data.waitings.filter(row => row.status === 'CALLED')
  const entered = sumPeople(todayReservations.filter(row => row.status === 'ENTERED')) + sumPeople(data.waitings.filter(row => row.status === 'ENTERED'))
  const stats = [
    ['오늘 예약 인원', sumPeople(todayReservations.filter(row => row.status !== 'CANCELLED')), '명', '입장 완료 인원 포함 · 취소 제외'],
    ['오늘 입장 완료', entered, '명', '예약 방문 + 현장 웨이팅'],
    ['현재 대기', waitingRows.length, '팀', `${sumPeople(waitingRows)}명 대기 중`],
    ['호출 후 입장 대기', calledRows.length, '팀', `${sumPeople(calledRows)}명 호출 완료`],
  ]

  // API 교체 지점: 서버 처리 성공 응답으로 데이터를 갱신해야 합니다.
  // 현재는 브라우저 메모리만 변경하며 새로고침하면 초기화됩니다.
  function change(collection, id, next) {
    const row = data[collection].find(item => item.id === id)
    const allowed = collection === 'reservations'
      ? row?.status === 'CONFIRMED' && next === 'ENTERED'
      : (row?.status === 'WAITING' && ['CALLED','CANCELLED'].includes(next)) || (row?.status === 'CALLED' && ['ENTERED','CANCELLED'].includes(next))
    if (!allowed) return
    if (next === 'CANCELLED' && !window.confirm('예시 웨이팅을 취소하시겠습니까?')) return
    setData(previous => ({ ...previous, [collection]:previous[collection].map(item => item.id === id ? {...item,status:next} : item) }))
    setNotice(`${id} · ${labels[next]} 처리했습니다. (더미데이터에만 반영)`)
  }

  function badge(value) { return <span className={`mg-badge mg-${value.toLowerCase()}`}>{labels[value] || value}</span> }
  function reservationTable(rows) {
    return <div className="mg-table-scroll"><table><thead><tr><th>예약번호</th><th>방문자</th><th>날짜·회차</th><th>인원</th><th>상태</th><th>처리</th></tr></thead><tbody>
      {rows.map(row => <tr key={row.id}><td>{row.id}</td><td><strong>{row.name}</strong><small>{row.phone}</small></td><td>{row.date}<small>{row.time}</small></td><td>{row.people}명</td><td>{badge(row.status)}</td><td>{row.status === 'CONFIRMED' ? <button className="mg-action" onClick={() => change('reservations',row.id,'ENTERED')}>입장 처리</button> : '—'}</td></tr>)}
      {!rows.length && <tr><td colSpan={6} className="mg-empty">조건에 맞는 예약이 없습니다.</td></tr>}
    </tbody></table></div>
  }
  function waitingTable(rows) {
    return <div className="mg-table-scroll"><table><thead><tr><th>대기번호</th><th>방문자</th><th>인원</th><th>상태</th><th>처리</th></tr></thead><tbody>
      {rows.map(row => <tr key={row.id}><td><strong>{String(row.number).padStart(3,'0')}</strong></td><td>{row.name}<small>{row.phone}</small></td><td>{row.people}명</td><td>{badge(row.status)}</td><td><div className="mg-actions">
        {row.status === 'WAITING' && <button className="mg-action" onClick={() => change('waitings',row.id,'CALLED')}>호출</button>}
        {row.status === 'CALLED' && <button className="mg-action" onClick={() => change('waitings',row.id,'ENTERED')}>입장 처리</button>}
        {['WAITING','CALLED'].includes(row.status) && <button className="mg-action mg-muted" onClick={() => change('waitings',row.id,'CANCELLED')}>취소</button>}
        {!['WAITING','CALLED'].includes(row.status) && '—'}
      </div></td></tr>)}
      {!rows.length && <tr><td colSpan={5} className="mg-empty">조건에 맞는 웨이팅이 없습니다.</td></tr>}
    </tbody></table></div>
  }

  const query = search.trim().toLowerCase()
  const matching = row => `${row.name} ${row.phone} ${row.id} ${row.number ?? ''}`.toLowerCase().includes(query) && (status === 'ALL' || row.status === status)
  return <div className="mg-shell">
    <aside className="mg-sidebar">
      <Link className="mg-logo" to="/" aria-label="POPQ 메인으로 이동"><img src="/logo.png" alt="POPQ" /><span>MANAGER CENTER</span></Link>
      <div className="mg-assignment"><span>담당 팝업 · 예시</span><strong>{managerDemoPopup.title}</strong><small>{managerDemoPopup.location}</small></div>
      <nav aria-label="매니저 메뉴">
        {[['/manager','calendar','오늘 현황'],['/manager/reservations','ticket','예약 관리'],['/manager/waiting','user','웨이팅 관리']].map(([to,icon,label]) => <NavLink key={to} to={to} end onClick={() => {setSearch('');setStatus('ALL')}}><PopqIcon name={icon} size={20} />{label}</NavLink>)}
      </nav>
      <Link className="mg-return" to="/">사용자 메인으로 돌아가기 →</Link>
    </aside>
    <div className="mg-main">
      <header className="mg-top"><div><span>POPQ OPERATIONS</span><h1>{managerDemoPopup.title}</h1></div><div className="mg-account"><PopqIcon name="manager" size={24} /><span>{app.currentUser?.name || '매니저'}님<small>팝업 매니저</small></span></div></header>
      <main className="mg-content">
        <p className="mg-demo">프로토타입 · 성수 POPQ의 예시 데이터입니다. 실제 담당 팝업·방문자 정보가 아니며, 처리 결과는 DB에 저장되지 않고 새로고침 시 초기화됩니다.</p>
        {notice && <p className="mg-notice" role="status">{notice}</p>}
        {!mode ? <section className="mg-panel"><h2>페이지를 찾을 수 없습니다.</h2><Link to="/manager">오늘 현황으로 이동</Link></section> : <>
          <div className="mg-page-title"><div><h2>{mode === 'dashboard' ? '오늘의 운영 현황' : mode === 'reservations' ? '예약 관리' : '웨이팅 관리'}</h2><p>{mode === 'dashboard' ? '매출 대신 방문·입장·대기 흐름을 확인하세요.' : '담당 팝업의 예시 방문 내역을 관리합니다.'}</p></div><span>{new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'long'}).format(new Date())}</span></div>
          <div className="mg-stats">{stats.map(([label,value,unit,caption]) => <article key={label}><span>{label}</span><strong>{value}<small>{unit}</small></strong><p>{caption}</p></article>)}</div>
          {mode === 'dashboard' ? <>
            <section className="mg-panel"><div className="mg-panel-title"><h3>오늘 회차별 예약 현황</h3><Link to="/manager/reservations">예약 관리 →</Link></div><div className="mg-slots">{['10:00','11:00','13:00','14:00','15:00'].map(time => {
              const rows = todayReservations.filter(row => row.time === time && row.status !== 'CANCELLED')
              const count = sumPeople(rows)
              return <div key={time}><span>{time}</span><div className="mg-meter" aria-label={`${time} 예약 ${count}명, 예시 정원 10명`}><i style={{width:`${count * 10}%`}} /></div><strong>{count}<small> / 10명</small></strong></div>
            })}</div></section>
            <section className="mg-panel"><div className="mg-panel-title"><h3>현재 웨이팅</h3><Link to="/manager/waiting">전체 보기 →</Link></div>{waitingTable(data.waitings.filter(row => ['WAITING','CALLED'].includes(row.status)))}</section>
          </> : <section className="mg-panel">
            <div className="mg-filters"><input aria-label="방문자 또는 번호 검색" placeholder="이름·연락처·번호 검색" value={search} onChange={e => setSearch(e.target.value)} />
              {mode === 'reservations' && <input aria-label="방문 날짜" type="date" value={date} onChange={e => setDate(e.target.value)} />}
              <select aria-label="상태 필터" value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">모든 상태</option>{(mode === 'reservations' ? ['CONFIRMED','ENTERED','CANCELLED'] : ['WAITING','CALLED','ENTERED','CANCELLED']).map(value => <option key={value} value={value}>{labels[value]}</option>)}</select>
            </div>
            {mode === 'reservations' ? reservationTable(data.reservations.filter(row => (!date || row.date === date) && matching(row))) : waitingTable(data.waitings.filter(matching))}
          </section>}
        </>}
      </main>
    </div>
  </div>
}
