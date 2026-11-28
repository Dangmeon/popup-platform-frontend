import SearchablePopupSelect from '../../components/admin/SearchablePopupSelect.jsx'
import {useEffect,useState} from 'react'
import {getPopups} from '../../api/admin/popupApi.js'
import {adminReservationError,getAdminReservations,reservationStatusLabels} from '../../api/admin/adminReservationApi.js'

export default function AdminReservationStatus() {
  const [popups,setPopups]=useState([]),[popId,setPopId]=useState(''),[popupError,setPopupError]=useState(''),[popupLoading,setPopupLoading]=useState(true)
  const [status,setStatus]=useState(''),[keyword,setKeyword]=useState(''),[date,setDate]=useState('')
  const [data,setData]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[popupRetry,setPopupRetry]=useState(0)
  useEffect(()=>{
    let active=true;setPopupLoading(true);setPopupError('')
    getPopups().then(result=>{if(active){setPopups(result.items);setPopId(previous=>result.items.some(p=>String(p.popId)===previous)?previous:result.items[0]?String(result.items[0].popId):'')}}).catch(()=>{if(active){setPopups([]);setPopId('');setPopupError('팝업 목록을 불러오지 못했습니다.')}}).finally(()=>{if(active)setPopupLoading(false)})
    return()=>{active=false}
  },[popupRetry])
  useEffect(()=>{
    const controller=new AbortController();let active=true
    setData([]);setError('')
    if(!popId){setLoading(false);return()=>controller.abort()}
    setLoading(true)
    getAdminReservations({popId,status,signal:controller.signal}).then(result=>{if(active)setData(result)}).catch(err=>{if(active)setError(adminReservationError(err))}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false;controller.abort()}
  },[popId,status,retry])
  useEffect(()=>{
    const refresh=()=>{if(!document.hidden)setRetry(v=>v+1)}
    const timer=setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh)
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}
  },[])
  const word=keyword.trim().toLowerCase()
  const visible=data.filter(row=>(!date||row.slotDate===date)&&(!word||`${row.reservationId} ${row.username}`.toLowerCase().includes(word)))
    .sort((a, b) => a.reservationId - b.reservationId)
  return <div className="av-reservations"><section className="admin-panel"><div className="popup-admin-filters"><SearchablePopupSelect popups={popups} value={popId} onChange={setPopId} disabled={popupLoading} emptyLabel={popupLoading ? '불러오는 중…' : '팝업을 선택하세요'} /><label>예약 상태<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">전체 상태</option>{Object.entries(reservationStatusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>방문 날짜<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>예약번호·이메일<input type="search" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="예약번호 또는 이메일"/></label><button type="button" className="popup-admin-button" disabled={loading||popupLoading} onClick={()=>{setRetry(v=>v+1);if(popupError)setPopupRetry(v=>v+1)}}>새로고침</button></div>{popupError&&<p role="alert">{popupError}</p>}</section>
    <section className="admin-panel" aria-busy={loading}><div className="admin-panel-header"><h3>예약 현황</h3>{!loading&&!error&&popId&&<span>{visible.length}건</span>}</div>{loading?<p role="status">예약 현황을 불러오고 있어요.</p>:error?<div role="alert"><p>{error}</p><button className="popup-admin-button" onClick={()=>setRetry(v=>v+1)}>다시 조회</button></div>:!popId?<p>팝업을 선택해 주세요.</p>:<div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>예약번호</th><th>방문 날짜</th><th>시간</th><th>예약자 이메일</th><th>인원</th><th>상태</th><th>접수일시</th></tr></thead><tbody>{visible.map(row=><tr key={row.reservationId}><td>{row.reservationId}</td><td>{row.slotDate}</td><td>{row.startTime}</td><td>{row.username}</td><td>{row.peopleCount}명</td><td>{reservationStatusLabels[row.reservationStatus]}</td><td>{row.reservedAt?String(row.reservedAt).slice(0,16).replace('T',' '):'—'}</td></tr>)}{!visible.length&&<tr><td colSpan={7}>조건에 맞는 예약이 없습니다.</td></tr>}</tbody></table></div>}</section>
  </div>
}
