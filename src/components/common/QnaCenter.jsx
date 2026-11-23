import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { deleteQuestion, getMyQnas, getQna, getQnas, qnaCategories, qnaError, saveAnswer, saveQuestion } from '../../api/qnaApi.js'
import './QnaCenter.css'

const blankQuestion = () => ({category:'ETC', title:'', content:'', secret:true})
const dateLabel = value => value ? String(value).slice(0,16).replace('T',' ') : '접수 완료'

export default function QnaCenter({ admin = false }) {
  const app = useApp()
  if (!app.isAuthenticated) return <div className="qn-state">로그인 후 문의를 이용해 주세요. <Link to="/login">로그인하기</Link></div>
  if (admin && app.currentUser?.role !== 'ADMIN') return <p className="qn-error" role="alert">사이트 문의는 관리자만 관리할 수 있습니다.</p>
  const owner = app.currentUser?.username || app.currentUser?.email
  return <Center key={`${owner}:${admin}`} admin={admin} />
}

function Center({ admin }) {
  const [category,setCategory] = useState('')
  const [status,setStatus] = useState('')
  const [page,setPage] = useState(0)
  const [refresh,setRefresh] = useState(0)
  const [rows,setRows] = useState([])
  const [pages,setPages] = useState(0)
  const [total,setTotal] = useState(null)
  const [waiting,setWaiting] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [editor,setEditor] = useState(null)
  const [question,setQuestion] = useState(blankQuestion)
  const [selected,setSelected] = useState(null)
  const [answer,setAnswer] = useState('')
  const [detailLoading,setDetailLoading] = useState(false)
  const [actionError,setActionError] = useState('')
  const [busy,setBusy] = useState(false)
  const lock = useRef(false)
  const mounted = useRef(false)
  const detailVersion = useRef(0)
  useEffect(() => {mounted.current=true; return () => {mounted.current=false;detailVersion.current+=1}},[])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true);setError('')
    async function load() {
      try {
        if (admin) {
          const [data,count] = await Promise.all([getQnas({category,status,page,signal:controller.signal}), getQnas({status:'WAITING',size:1,signal:controller.signal})])
          if (!active) return
          if (page > 0 && page >= data.totalPages) {setPage(Math.max(0,data.totalPages-1));return}
          setRows(data.content);setPages(data.totalPages);setTotal(data.totalElements);setWaiting(count.totalElements)
        } else {
          const mine = await getMyQnas({signal:controller.signal})
          if (!active) return
          setRows(mine);setTotal(mine.length);setWaiting(mine.filter(row=>row.status==='WAITING').length)
        }
      } catch (err) { if (active) {setError(qnaError(err));setRows([]);setWaiting(null);setTotal(null)} }
      finally {if(active)setLoading(false)}
    }
    load()
    return () => {active=false;controller.abort()}
  },[admin,category,status,page,refresh])

  // 관리 화면을 열어두면 신규 문의를 주기적으로 조회합니다. 전용 알림 API는 추가하지 않습니다.
  useEffect(() => {
    if (!admin) return
    const update = () => {if(!document.hidden && !lock.current)setRefresh(value=>value+1)}
    const timer = setInterval(update,30000)
    document.addEventListener('visibilitychange',update)
    return () => {clearInterval(timer);document.removeEventListener('visibilitychange',update)}
  },[admin])

  async function open(row) {
    if (lock.current) return
    const version=++detailVersion.current
    setSelected(null);setEditor(null);setDetailLoading(true);setActionError('');setNotice('')
    try {
      const detail = await getQna(row.qnaId)
      if(mounted.current && version===detailVersion.current){setSelected(detail);setAnswer(detail.answerContent || '')}
    } catch(err){if(mounted.current && version===detailVersion.current)setActionError(qnaError(err))}
    finally{if(mounted.current && version===detailVersion.current)setDetailLoading(false)}
  }
  function close() {if(lock.current)return;detailVersion.current+=1;setSelected(null);setEditor(null);setDetailLoading(false);setActionError('')}
  function newQuestion() {close();setQuestion(blankQuestion());setEditor({id:null});setNotice('')}
  function editQuestion() {setQuestion({category:selected.category,title:selected.title,content:selected.content,secret:selected.secret});setEditor({id:selected.qnaId});setSelected(null);setActionError('')}
  async function mutate(work, success) {
    if(lock.current)return
    lock.current=true;setBusy(true);setActionError('');setNotice('')
    try {
      await work()
      if(mounted.current){setNotice(success);setSelected(null);setEditor(null);setRefresh(value=>value+1)}
    } catch(err){if(mounted.current)setActionError(qnaError(err))}
    finally{lock.current=false;if(mounted.current)setBusy(false)}
  }
  function submitQuestion(event){event.preventDefault();mutate(()=>saveQuestion(editor.id,question),editor.id?'문의가 수정되었습니다.':'문의가 접수되었습니다. 관리자 답변을 기다려 주세요.')}
  function submitAnswer(event){event.preventDefault();mutate(()=>saveAnswer(selected.qnaId,answer),'답변이 저장되었습니다.')}
  function remove(){if(window.confirm('이 문의를 삭제하시겠습니까?'))mutate(()=>deleteQuestion(selected.qnaId),'문의가 삭제되었습니다.')}
  const visible = admin ? rows : rows.filter(row=>(!category || row.category===category)&&(!status || row.status===status))
  return <div className="qn-center">
    <div className="qn-summary"><div><span>{admin?'답변을 기다리는 사이트 문의':'답변 대기'}</span><strong>{waiting ?? '—'}<small>건</small></strong></div><p>{admin?'회원이 남긴 POPQ 이용 문의를 확인하고 답변해 주세요.':'작성한 문의와 관리자 답변을 확인하세요.'}</p></div>
    <div className="qn-toolbar"><div className="qn-filters"><select aria-label="문의 유형" value={category} disabled={busy} onChange={e=>{setCategory(e.target.value);setPage(0)}}><option value="">모든 유형</option>{Object.entries(qnaCategories).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><select aria-label="답변 상태" value={status} disabled={busy} onChange={e=>{setStatus(e.target.value);setPage(0)}}><option value="">모든 상태</option><option value="WAITING">답변 대기</option><option value="ANSWERED">답변 완료</option></select></div><div className="qn-actions"><button type="button" className="qn-secondary" disabled={busy||loading} onClick={()=>setRefresh(v=>v+1)}>새로고침</button>{!admin&&<button type="button" className="qn-primary" disabled={busy} onClick={newQuestion}>문의 작성</button>}</div></div>
    {notice&&<p className="qn-notice" role="status">{notice}</p>}
    {actionError&&<p className="qn-error" role="alert">{actionError}</p>}
    {editor&&<form className="qn-detail" onSubmit={submitQuestion}><div className="qn-detail-heading"><h3>{editor.id?'문의 수정':'POPQ 사이트 문의'}</h3><button type="button" disabled={busy} onClick={close}>닫기</button></div><label>문의 유형<select value={question.category} disabled={busy} onChange={e=>setQuestion({...question,category:e.target.value})}>{Object.entries(qnaCategories).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>제목<input maxLength={200} required disabled={busy} value={question.title} onChange={e=>setQuestion({...question,title:e.target.value})}/></label><label>문의 내용<textarea maxLength={2000} rows={7} required disabled={busy} value={question.content} onChange={e=>setQuestion({...question,content:e.target.value})}/></label><label className="qn-checkbox"><input type="checkbox" checked={question.secret} disabled={busy} onChange={e=>setQuestion({...question,secret:e.target.checked})}/>비밀글로 작성</label><p className="qn-hint">{question.secret?'작성자와 관리자만 내용을 확인할 수 있습니다.':'공개 문의는 다른 회원도 내용을 확인할 수 있습니다.'} 비밀번호·결제 정보는 입력하지 마세요.</p><button type="submit" className="qn-primary" disabled={busy}>{busy?'저장 중…':editor.id?'수정 저장':'문의 접수'}</button></form>}
    {detailLoading&&<p className="qn-state" role="status">문의를 확인하고 있어요.</p>}
    {selected&&<section className="qn-detail"><div className="qn-detail-heading"><span className={`qn-status ${selected.status==='ANSWERED'?'answered':''}`}>{selected.status==='ANSWERED'?'답변 완료':'답변 대기'}</span><button type="button" disabled={busy} onClick={close}>닫기</button></div><h3>{selected.title}</h3><p className="qn-meta">{qnaCategories[selected.category]} · {dateLabel(selected.createdAt)}{selected.secret?' · 비밀글':''}{admin?` · ${selected.writerName || '회원'}`:''}</p><p className="qn-content">{selected.content}</p>{selected.answerContent&&<div className="qn-answer"><span>POPQ 답변 · {dateLabel(selected.answeredAt)}</span><p>{selected.answerContent}</p></div>}{admin?<form onSubmit={submitAnswer}><label>{selected.answerContent?'답변 수정':'답변 작성'}<textarea rows={6} maxLength={2000} required disabled={busy} value={answer} onChange={e=>setAnswer(e.target.value)}/></label><button className="qn-primary" type="submit" disabled={busy}>{busy?'저장 중…':'답변 저장'}</button></form>:<div className="qn-actions">{selected.status==='WAITING'&&<button className="qn-secondary" type="button" disabled={busy} onClick={editQuestion}>문의 수정</button>}<button className="qn-delete" type="button" disabled={busy} onClick={remove}>문의 삭제</button></div>}</section>}
    <div className="qn-list-heading"><span>{admin?'사이트 문의':'내 문의'}</span><small>{total ?? '—'}건{!admin&&(category||status)?` · 검색 결과 ${visible.length}건`:''}</small></div>
    {loading?<div className="qn-state" role="status">문의 목록을 불러오고 있어요.</div>:error?<div className="qn-state qn-error" role="alert">{error}<button className="qn-secondary" onClick={()=>setRefresh(v=>v+1)}>다시 시도</button></div>:!visible.length?<div className="qn-state">{category||status?'조건에 맞는 문의가 없습니다.':'아직 접수된 문의가 없습니다.'}</div>:<div className="qn-list">{visible.map(row=><button className="qn-row" key={row.qnaId} type="button" disabled={busy} onClick={()=>open(row)}><span className={`qn-status ${row.status==='ANSWERED'?'answered':''}`}>{row.status==='ANSWERED'?'답변 완료':'답변 대기'}</span><span className="qn-row-title"><small>{qnaCategories[row.category]}{row.secret?' · 비밀글':''}</small><strong>{row.title}</strong></span><span className="qn-row-date">{dateLabel(row.createdAt)}</span><span aria-hidden="true">↗</span></button>)}</div>}
    {admin&&pages>1&&<nav className="qn-pagination" aria-label="문의 목록 페이지"><button className="qn-secondary" disabled={busy||loading||page===0} onClick={()=>setPage(v=>v-1)}>이전</button><span>{page+1} / {pages}</span><button className="qn-secondary" disabled={busy||loading||page+1>=pages} onClick={()=>setPage(v=>v+1)}>다음</button></nav>}
  </div>
}
