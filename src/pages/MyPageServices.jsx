import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PopqIcon from '../components/common/PopqIcon.jsx'
import MyOrders from './MyOrders.jsx'
import QnaCenter from '../components/common/QnaCenter.jsx'
import { MyPageFrame } from './MyPageHome.jsx'
import { demoRecent, faqItems } from '../data/myPageDemo.js'
import '../styles/MyPageServices.css'

const headings = {
  orders:'내 주문·배송',
  coupons:'쿠폰함',
  recent:'최근 본 목록',
  faq:'자주 묻는 질문',
  inquiries:'내 문의',
}
// 마이페이지 서비스 화면
export default function MyPageServices({ section }) {
  const app = useApp()
  const owner = app.currentUser?.username || app.currentUser?.email || 'guest'
  return <MyPageFrame><ServiceContent key={`${owner}:${section}`} section={section} /></MyPageFrame>
}
function ServiceContent({section}) {
  return <div className="ms-page"><header className="ms-heading"><h2>{headings[section]}</h2></header>
    {section==='orders'&&<MyOrders />}{section==='coupons'&&<p role="status">표시할 쿠폰이 없습니다.</p>}{section==='recent'&&<Recent />}{section==='faq'&&<Faq />}{section==='inquiries'&&<Inquiries />}
  </div>
}
function Filter({items,value,onChange,label}) {
  return <div className="ms-filters" aria-label={label}>{items.map(([key,text])=><button type="button" key={key} aria-pressed={value===key} onClick={()=>onChange(key)}>{text}</button>)}</div>
}
function Empty({text}) {return <div className="ms-empty"><PopqIcon name="bag" size={30}/><p>{text}</p></div>}
// 최근 본 팝업 화면
function Recent() {
  const [rows,setRows]=useState(demoRecent)
  return <><div className="ms-list-toolbar"><span>팝업 {rows.length}개</span><button type="button" disabled={!rows.length} onClick={()=>{if(window.confirm('목록을 모두 비울까요?'))setRows([])}}>목록 비우기</button></div><div className="ms-recent">{rows.map(row=><article key={row.id}><Link to={`/popups/${row.id}`}><img src={row.poster} alt={row.title}/><div><small>{row.category||'팝업스토어'}</small><h3>{row.title}</h3><p>{row.location}</p><span>{row.period}</span></div></Link><button type="button" aria-label={`${row.title} 목록에서 삭제`} onClick={()=>setRows(previous=>previous.filter(item=>item.id!==row.id))}>×</button></article>)}</div>{!rows.length&&<Empty text="목록을 모두 비웠어요."/>}</>
}
// 자주 묻는 질문 화면
function Faq() {
  const [category,setCategory]=useState('all'),[query,setQuery]=useState('')
  const rows=faqItems.filter(row=>(category==='all'||row.category===category)&&`${row.question} ${row.answer}`.includes(query.trim()))
  return <><label className="ms-search"><PopqIcon name="search" size={20}/><input type="search" placeholder="궁금한 내용을 검색해 보세요" aria-label="FAQ 검색" value={query} onChange={e=>setQuery(e.target.value)}/></label><Filter label="FAQ 종류" items={ [['all','전체'],['예약·웨이팅','예약·웨이팅'],['주문·배송','주문·배송']] } value={category} onChange={setCategory}/><div className="ms-faq">{rows.map(row=><details key={row.question}><summary><span>{row.category}</span><strong>{row.question}</strong><b>+</b></summary><p>{row.answer}</p></details>)}</div>{!rows.length&&<Empty text="검색 결과가 없어요."/>}<div className="ms-help"><div><strong>찾는 답변이 없나요?</strong><p>내 문의에서 확인해 보세요.</p></div><Link to="/mypage/inquiries">내 문의 보기 →</Link></div></>
}
// 내 문의 화면
function Inquiries() { return <QnaCenter /> }
