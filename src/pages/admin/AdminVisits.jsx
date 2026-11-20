import { useSearchParams } from 'react-router-dom'
import AdminWaitings from './AdminWaitings.jsx'
import AdminReservationStatus from './AdminReservationStatus.jsx'
import './AdminVisits.css'

export default function AdminVisits() {
  const [params,setParams]=useSearchParams()
  const tab=params.get('tab')==='reservations'?'reservations':'waiting'
  function select(value){const next=new URLSearchParams(params);next.set('tab',value);setParams(next)}
  return <div className="av-page"><header className="admin-page-heading"><div><h2>예약·웨이팅 현황</h2><p>팝업별 방문 예약과 현장 대기 현황을 확인하세요.</p></div></header>
    <div className="av-tabs" role="tablist" aria-label="방문 현황 종류">{[['reservations','예약'],['waiting','웨이팅']].map(([value,label])=><button type="button" key={value} role="tab" id={`av-tab-${value}`} aria-selected={tab===value} aria-controls="av-panel" onClick={()=>select(value)}>{label}</button>)}</div>
    <section id="av-panel" className="av-panel" role="tabpanel" aria-labelledby={`av-tab-${tab}`}>
      {tab==='waiting'?<AdminWaitings/>:<AdminReservationStatus/>}
    </section>
  </div>
}
