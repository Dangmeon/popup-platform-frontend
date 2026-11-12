import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../styles/NearbyPopups.css'

// 지도 서비스와 좌표 API 연결 전 사용하는 위치·팝업 예시입니다.
// 실제 현재 위치를 수집하거나 실제 지도로 안내하지 않습니다.
const points = [
  { id:1, area:'성수', title:'성수 POPQ 스튜디오', location:'성수 · 예시 위치', x:30, y:35 },
  { id:2, area:'성수', title:'성수 라이프 마켓', location:'성수 · 예시 위치', x:54, y:55 },
  { id:3, area:'성수', title:'성수 굿즈 라운지', location:'성수 · 예시 위치', x:72, y:28 },
  { id:4, area:'잠실', title:'잠실 POPQ 팝업', location:'잠실 · 예시 위치', x:45, y:45 },
  { id:5, area:'여의도', title:'여의도 POPQ 마켓', location:'여의도 · 예시 위치', x:60, y:40 },
]
export default function NearbyPopups() {
  const [params] = useSearchParams()
  const [area,setArea] = useState(['성수','잠실','여의도'].includes(params.get('area')) ? params.get('area') : '성수')
  const [selected,setSelected] = useState(null)
  const items=points.filter(p=>p.area===area)
  return <div className="container pq-nearby"><span className="pq-my-eyebrow">AROUND YOU</span><h1>주변 팝업</h1><p>관심 있는 동네의 팝업을 살펴보세요.</p>
    <p className="pq-map-notice">프로토타입 · 실제 지도가 아닌 예시 위치 화면입니다. 지도 API 연결 후 현재 위치와 실제 팝업을 표시합니다.</p>
    <div className="pq-map-tabs">{['성수','잠실','여의도'].map(a=><button key={a} aria-pressed={area===a} onClick={()=>{setArea(a);setSelected(null)}}>{a}</button>)}</div>
    <div className="pq-map-layout"><div className="pq-map" role="region" aria-label={`${area} 예시 팝업 위치`}>
      <svg viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="500" fill="#edf1e7"/><path d="M0 350Q300 230 800 390" stroke="#d4e6eb" strokeWidth="90" fill="none"/><path d="M-50 70 850 250M180 0 390 500M620 0 500 500M0 160 800 50" stroke="white" strokeWidth="24" fill="none"/></svg>
      <span className="pq-map-area">{area} · 예시 지도</span>
      {items.map(p=><button key={p.id} className={`pq-map-pin${selected===p.id?' selected':''}`} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>setSelected(p.id)} aria-pressed={selected===p.id}>{p.title}</button>)}
    </div><aside>{items.map(p=><button key={p.id} className={`pq-map-card${selected===p.id?' selected':''}`} onClick={()=>setSelected(p.id)} aria-pressed={selected===p.id}><span>예시 팝업</span><h3>{p.title}</h3><p>{p.location}</p></button>)}<Link to="/popups">실제 팝업 목록 보기 →</Link></aside></div>
  </div>
}
