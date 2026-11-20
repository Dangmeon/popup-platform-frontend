import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PopqIcon from '../components/common/PopqIcon.jsx'
import MyOrders from './MyOrders.jsx'
import { MyPageFrame } from './MyPageHome.jsx'
import { demoRecent, demoInquiries, faqItems, makeDemoCoupons } from '../data/myPageDemo.js'
import { addCalendarMonths, couponState, extendDemoCoupon } from '../utils/couponPolicy.js'
import '../styles/MyPageServices.css'

const headings = {
  orders:['MY ORDERS','내 주문·배송','주문한 굿즈가 어디쯤 오고 있는지 확인하세요.'],
  coupons:['MY BENEFITS','쿠폰함','생일에 찾아오는 작은 선물, POPQ가 준비했어요.'],
  recent:['RECENTLY VIEWED','최근 본 목록','마음에 남았던 팝업을 다시 만나보세요.'],
  faq:['HELP CENTER','자주 묻는 질문','궁금한 내용을 먼저 찾아보세요.'],
  inquiries:['MY INQUIRIES','내 문의','궁금한 내용을 남기고 답변을 확인하세요.'],
}
export default function MyPageServices({ section }) {
  const app = useApp()
  const owner = app.currentUser?.username || app.currentUser?.email || 'guest'
  return <MyPageFrame><ServiceContent key={`${owner}:${section}`} section={section} /></MyPageFrame>
}
function ServiceContent({section}) {
  const [eyebrow,title,description] = headings[section]
  return <div className="ms-page"><header className="ms-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></header>
    {section==='orders'&&<MyOrders />}{section==='coupons'&&<Coupons />}{section==='recent'&&<Recent />}{section==='faq'&&<Faq />}{section==='inquiries'&&<Inquiries />}
  </div>
}
function Filter({items,value,onChange,label}) {
  return <div className="ms-filters" aria-label={label}>{items.map(([key,text])=><button type="button" key={key} aria-pressed={value===key} onClick={()=>onChange(key)}>{text}</button>)}</div>
}
function Empty({text}) {return <div className="ms-empty"><PopqIcon name="bag" size={30}/><p>{text}</p></div>}
function Coupons() {
  const [rows,setRows]=useState(()=>makeDemoCoupons())
  const [filter,setFilter]=useState('available')
  const [now,setNow]=useState(Date.now)
  const [notice,setNotice]=useState('')
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])
  const filtered=rows.filter(row=>filter==='all'||couponState(row,now).key===filter)
  function extend(row) {
    const current=Date.now()
    if(couponState(row,current).key!=='available'||row.extended){setNotice('사용 가능한 미연장 쿠폰만 연장할 수 있어요.');return}
    const nextDate=addCalendarMonths(row.expiresOn,1)
    if(!window.confirm(`쿠폰 연장을 확인할까요?\n${row.expiresOn} → ${nextDate}\n현재는 연장 결과만 미리 확인할 수 있어요.`))return
    try{const extended=extendDemoCoupon(row,Date.now());setRows(previous=>previous.map(item=>item.id===row.id?extended:item));setNotice('연장 시 유효기간을 표시했어요. 실제 쿠폰은 변경되지 않습니다.')}catch(error){setNotice(error.message)}
  }
  return <><div className="ms-coupon-policy"><PopqIcon name="ticket" size={27}/><div><strong>생일에는 전 품목 10% 할인</strong><p>가입 시 등록한 생일 당일 발급 · 유효기간 3개월 · 미사용·미만료 쿠폰 1회 1개월 연장</p></div></div>
    <Filter label="쿠폰 상태" items={ [['available','사용 가능'],['used','사용 완료'],['expired','기간 만료'],['all','전체']] } value={filter} onChange={setFilter}/>
    {notice&&<p className="ms-feedback" role="status">{notice}</p>}
    <div className="ms-coupons">{filtered.map(row=>{
      const state=couponState(row,now),urgent=state.key==='available'&&state.days<=3
      return <article className={`ms-coupon ${state.key}`} key={row.id}><div className={`ms-coupon-art${urgent?' is-urgent':''}`}>
        <div className="ms-coupon-original"><span className="ms-coupon-label">HAPPY BIRTHDAY · POPQ</span><div className="ms-coupon-value">{row.discount}<span>%</span><small>OFF</small></div><h3>{row.name}</h3><p>{row.scope} 할인</p><small>{row.issuedOn} 발급</small><i><PopqIcon name="ticket" size={120}/></i></div>
        {urgent&&<div className="ms-coupon-overlay"><span>유효기간을 확인해 주세요</span><strong>{state.days===0?'오늘 만료':`만료 D-${state.days}`}</strong><small>쿠폰이 사라지기 전에 혜택을 챙겨보세요</small></div>}
        {state.key!=='available'&&<div className="ms-coupon-overlay is-inactive"><strong>{state.label}</strong></div>}
      </div><footer><div><strong>{row.expiresOn}까지</strong><small>만료일 23:59까지</small></div>{state.key==='available'&&!row.extended?<button type="button" onClick={()=>extend(row)}>1개월 연장 <span>↗</span></button>:<span className="ms-extension-state">{row.extended?'1회 연장 완료':state.label}</span>}</footer></article>
    })}</div>{!filtered.length&&<Empty text="해당 쿠폰이 없어요."/>}
  </>
}
function Recent() {
  const [rows,setRows]=useState(demoRecent)
  return <><div className="ms-list-toolbar"><span>팝업 {rows.length}개</span><button type="button" disabled={!rows.length} onClick={()=>{if(window.confirm('목록을 모두 비울까요?'))setRows([])}}>목록 비우기</button></div><div className="ms-recent">{rows.map(row=><article key={row.id}><Link to={`/popups/${row.id}`}><img src={row.poster} alt={row.title}/><div><small>{row.category||'팝업스토어'}</small><h3>{row.title}</h3><p>{row.location}</p><span>{row.period}</span></div></Link><button type="button" aria-label={`${row.title} 목록에서 삭제`} onClick={()=>setRows(previous=>previous.filter(item=>item.id!==row.id))}>×</button></article>)}</div>{!rows.length&&<Empty text="목록을 모두 비웠어요."/>}</>
}
function Faq() {
  const [category,setCategory]=useState('all'),[query,setQuery]=useState('')
  const rows=faqItems.filter(row=>(category==='all'||row.category===category)&&`${row.question} ${row.answer}`.includes(query.trim()))
  return <><label className="ms-search"><PopqIcon name="search" size={20}/><input type="search" placeholder="궁금한 내용을 검색해 보세요" aria-label="FAQ 검색" value={query} onChange={e=>setQuery(e.target.value)}/></label><Filter label="FAQ 종류" items={ [['all','전체'],['예약·웨이팅','예약·웨이팅'],['주문·배송','주문·배송'],['쿠폰','쿠폰']] } value={category} onChange={setCategory}/><div className="ms-faq">{rows.map(row=><details key={row.question}><summary><span>{row.category}</span><strong>{row.question}</strong><b>+</b></summary><p>{row.answer}</p></details>)}</div>{!rows.length&&<Empty text="검색 결과가 없어요."/>}<div className="ms-help"><div><strong>찾는 답변이 없나요?</strong><p>내 문의에서 확인해 보세요.</p></div><Link to="/mypage/inquiries">내 문의 보기 →</Link></div></>
}
function Inquiries() {
  const [rows]=useState(demoInquiries),[writing,setWriting]=useState(false),[notice,setNotice]=useState('')
  const [form,setForm]=useState({category:'주문·배송',title:'',body:''})
  function submit(event){event.preventDefault();setNotice('문의 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.')}
  return <><div className="ms-list-toolbar"><span>문의 {rows.length}건</span><button type="button" className="ms-action" onClick={()=>setWriting(value=>!value)}>{writing?'작성 닫기':'문의 작성'}</button></div>{notice&&<p role="status" className="ms-feedback">{notice}</p>}{writing&&<form className="ms-inquiry-form" onSubmit={submit}><h3>문의 작성</h3><label>문의 유형<select value={form.category} onChange={e=>setForm(previous=>({...previous,category:e.target.value}))}>{['주문·배송','쿠폰','예약·웨이팅','기타'].map(value=><option key={value}>{value}</option>)}</select></label><label>제목<input value={form.title} maxLength={80} required onChange={e=>setForm(previous=>({...previous,title:e.target.value}))}/></label><label>내용<textarea value={form.body} maxLength={1000} rows={5} required onChange={e=>setForm(previous=>({...previous,body:e.target.value}))}/></label><button className="ms-action" type="submit">문의 등록</button></form>}<div className="ms-inquiries">{rows.map(row=><details key={row.id}><summary><span className={`ms-inquiry-status${row.answered?' answered':''}`}>{row.answered?'답변 완료':'답변 대기'}</span><div><small>{row.category} · {row.date}</small><h3>{row.title}</h3></div><span>⌄</span></summary><div className="ms-inquiry-body"><p>{row.body}</p>{row.answer?<blockquote><strong>POPQ 답변</strong><p>{row.answer}</p></blockquote>:<p className="ms-footnote">답변을 기다리고 있어요.</p>}</div></details>)}</div></>
}
