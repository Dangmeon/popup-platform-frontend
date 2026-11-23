import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import PopupCard from '../components/common/PopupCard.jsx'
import { usePopups } from '../hooks/usePopups'
import { getPopupStage } from '../utils/popupLifecycle.js'

export default function PopupList() {
  const {data,loading,error} = usePopups({})
  const location = useLocation()
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [keyword,setKeyword] = useState(q)
  const [category,setCategory] = useState('전체')
  const [stage,setStage] = useState('ONGOING')
  const [now,setNow] = useState(Date.now)
  useEffect(()=>setKeyword(q),[q,location.key])
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer)},[])
  const popups = Array.isArray(data) ? data : []
  const categories = ['전체',...new Set(popups.map(p=>p.category).filter(Boolean))]
  const word = keyword.trim().toLowerCase()
  const matches = popups.filter(p=>(category==='전체'||p.category===category)&&(!word||`${p.title} ${p.location}`.toLowerCase().includes(word))&&getPopupStage(p,now)===stage)
  return <div className="container">
    <div className="page-title">팝업 탐색</div>
    <input aria-label="팝업명, 지역으로 검색" placeholder="팝업명, 지역으로 검색" value={keyword} onChange={e=>setKeyword(e.target.value)} style={{width:'100%',maxWidth:420,padding:'12px 18px',borderRadius:999,border:'1px solid var(--border)',marginBottom:20}} />
    <div className="tabs" aria-label="팝업 진행 상태" style={{flexWrap:'wrap',marginBottom:16}}>
      {[['ONGOING','진행 중'],['ENDED','종료된 팝업'],['UPCOMING','진행 예정']].map(([key,label])=><button type="button" key={key} className={'tab-btn'+(stage===key?' active':'')} aria-pressed={stage===key} onClick={()=>setStage(key)}>{label}</button>)}
    </div>
    <div className="tabs" aria-label="팝업 카테고리" style={{flexWrap:'wrap'}}>{categories.map(value=><button type="button" key={value} className={'tab-btn'+(category===value?' active':'')} aria-pressed={category===value} onClick={()=>setCategory(value)}>{value}</button>)}</div>
    {word&&!loading&&!error&&<p className="card-sub" style={{marginBottom:12}}>검색 결과 {matches.length}개</p>}
    {loading?<div className="empty-state">팝업 목록을 불러오는 중이에요.</div>:error?<div className="empty-state" role="alert">{error}</div>:!matches.length?<div className="empty-state">조건에 맞는 팝업이 없어요.</div>:<div className="grid-4">{matches.map(p=><PopupCard key={p.id} popup={p}/>)}</div>}
  </div>
}
