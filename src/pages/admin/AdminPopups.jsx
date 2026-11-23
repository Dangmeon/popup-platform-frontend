import AdminDetailModal from '../../components/admin/AdminDetailModal.jsx'
import {useEffect,useRef,useState} from 'react'
import {getPopups,getPopup} from '../../api/admin/popupApi.js'
import {assignManager,changePopupOperation,deletePopup,getManagers,popupPayload,savePopup} from '../../api/admin/popupActions.js'
import {uploadProductImage} from '../../api/admin/productApi.js'
import {errorText} from '../../api/admin/liveUtils.js'
import './AdminPopups.css'
import './PopupManagement.css'

const statuses={UPCOMING:'진행 예정',ONGOING:'진행 중',ENDED:'종료',PAUSED:'운영 일시 중지',CANCELLED:'운영 취소',UNKNOWN:'일정 확인 필요'}
const blank=()=>({title:'',location:'',startDate:'',endDate:'',category:'',description:'',storeImg:'',roundNum:'',reservStart:'10:00',reservEnd:'18:00',reservPeopleCap:''})
const inputForm=p=>({...blank(),...Object.fromEntries(Object.keys(blank()).map(key=>[key,p[key]??'']))})

function Modal({title,busy,onClose,children}) {
  const ref=useRef(null)
  useEffect(()=>{const dialog=ref.current;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();return()=>{document.body.style.overflow=overflow;dialog.close()}},[])
  return <dialog ref={ref} className="pa-dialog" aria-label={title} onCancel={event=>{event.preventDefault();if(!busy)onClose()}}><div className="pa-dialog-heading"><h3>{title}</h3><button type="button" disabled={busy} onClick={onClose}>닫기</button></div>{children}</dialog>
}

export default function AdminPopups() {
  const [items,setItems]=useState([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('')
  const [keyword,setKeyword]=useState(''),[status,setStatus]=useState(''),[retry,setRetry]=useState(0)
  const [selected,setSelected]=useState(null),[detailLoading,setDetailLoading]=useState(false)
  const [managers,setManagers]=useState(null),[managerError,setManagerError]=useState(''),[managerRetry,setManagerRetry]=useState(0)
  const [dialog,setDialog]=useState(null),[form,setForm]=useState(blank),[managerEmail,setManagerEmail]=useState(''),[confirmation,setConfirmation]=useState('')
  const [image,setImage]=useState(null),[busy,setBusy]=useState(false),[actionError,setActionError]=useState(''),[notice,setNotice]=useState('')
  const mounted=useRef(false),lock=useRef(false),version=useRef(0),uploaded=useRef(null)
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;version.current+=1}},[])
  useEffect(()=>{
    let active=true;setLoading(true);setError('')
    getPopups({keyword,status}).then(data=>{if(active){setItems(data.items);setTotal(data.totalAll)}}).catch(err=>{if(active){setItems([]);setError(errorText(err))}}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[keyword,status,retry])
  useEffect(()=>{
    let active=true;setManagers(null);setManagerError('')
    getManagers().then(rows=>{if(active)setManagers(rows)}).catch(err=>{if(active)setManagerError(errorText(err))})
    return()=>{active=false}
  },[managerRetry])
  const managerLabel=popup=>{
    if(popup.managerId==null)return '미배정'
    const manager=managers?.find(row=>row.id===popup.managerId)
    return manager?`${manager.name} (${manager.email})`:`담당 회원 #${popup.managerId}`
  }
  async function openDetail(popId) {
    if(lock.current)return
    const current=++version.current;setDetailLoading(true);setActionError('');setNotice('');setSelected(null)
    try {const data=await getPopup(popId);if(mounted.current&&current===version.current)setSelected(data)}
    catch(err){if(mounted.current&&current===version.current)setActionError(errorText(err))}
    finally{if(mounted.current&&current===version.current)setDetailLoading(false)}
  }
  function open(type) {
    if(lock.current)return
    version.current+=1;setDetailLoading(false);setActionError('');setNotice('');setConfirmation('');setImage(null);uploaded.current=null
    if(type==='create')setForm(blank())
    if(type==='edit')setForm(inputForm(selected))
    if(type==='manager')setManagerEmail(managers?.find(row=>row.id===selected.managerId)?.email || '')
    setDialog({type,popup:type==='create'?null:selected})
  }
  function close(){if(!lock.current){setDialog(null);setActionError('')}}
  function change(event){const {name,value}=event.target;setForm(previous=>({...previous,[name]:value}))}
  async function mutate(work,text) {
    if(lock.current)return
    lock.current=true;setBusy(true);setActionError('')
    try {
      const updated=await work()
      if(mounted.current){setSelected(updated || null);setDialog(null);setNotice(text);setRetry(v=>v+1)}
    }catch(err){if(mounted.current)setActionError(err.response?errorText(err):err.message || '처리 결과를 확인하지 못했습니다. 목록을 다시 확인해 주세요.')}
    finally{lock.current=false;if(mounted.current)setBusy(false)}
  }
  function submitPopup(event) {
    event.preventDefault()
    try{popupPayload(form)}catch(err){setActionError(err.message);return}
    mutate(async()=>{
      let storeImg=form.storeImg
      if(image){if(!uploaded.current)uploaded.current=await uploadProductImage(image);storeImg=uploaded.current}
      return savePopup(dialog.popup?.popId,{...form,storeImg})
    },dialog.type==='create'?'팝업이 등록되었습니다.':'팝업 정보가 수정되었습니다.')
  }
  const operationLabels={pause:'일시중지',resume:'운영 재개',cancel:'운영 취소'}
  const current=dialog?.popup
  const nextManager=managers?.find(row=>row.email===managerEmail)
  const fields=[['title','팝업명','text',true],['location','장소·주소','text',true],['startDate','운영 시작일','date',true],['endDate','운영 종료일','date',true],['reservStart','예약 운영 시작 시간','time',true],['reservEnd','예약 운영 종료 시간','time',true],['reservPeopleCap','예약 정원','number',false],['roundNum','오픈 차수','number',false]]
  return <div className="admin-popups pa-management"><div className="admin-page-heading"><div><h2>팝업 관리</h2><p>팝업 정보와 담당 매니저를 관리하세요.</p></div><button type="button" className="popup-admin-button primary" disabled={busy} onClick={()=>open('create')}>팝업 등록</button></div>
    {notice&&<p className="pa-notice" role="status">{notice}</p>}{actionError&&!dialog&&<p className="pa-error" role="alert">{actionError}</p>}
    <section className="admin-panel"><div className="popup-admin-filters"><label>팝업명·장소<input type="search" disabled={busy} value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="팝업명 또는 장소 검색"/></label><label>상태<select disabled={busy} value={status} onChange={e=>setStatus(e.target.value)}><option value="">전체 상태</option>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="popup-admin-button" disabled={busy||loading} onClick={()=>setRetry(v=>v+1)}>새로고침</button></div></section>
    <section className="admin-panel" aria-busy={loading}><div className="admin-panel-header"><h3>팝업 목록</h3>{!loading&&!error&&<span>{items.length}개 / 전체 {total}개</span>}</div>{loading?<p role="status">팝업을 불러오고 있어요.</p>:error?<div role="alert"><p>{error}</p><button className="popup-admin-button" onClick={()=>setRetry(v=>v+1)}>다시 시도</button></div>:<div className="admin-table-wrapper"><table className="admin-table popup-admin-table"><thead><tr><th>팝업명</th><th>운영 기간</th><th>상태</th><th>담당 매니저</th><th>관리</th></tr></thead><tbody>{items.map(popup=><tr key={popup.popId}><td>{popup.title}<small className="pa-location">{popup.location}</small></td><td>{popup.startDate}<br/>~ {popup.endDate}</td><td>{statuses[popup.status] || popup.status}</td><td>{managerLabel(popup)}</td><td><button className="popup-admin-button" disabled={busy} onClick={()=>openDetail(popup.popId)}>상세 보기</button></td></tr>)}{!items.length&&<tr><td colSpan={5}>조건에 맞는 팝업이 없습니다.</td></tr>}</tbody></table></div>}</section>
    {detailLoading&&<section className="admin-panel" role="status">상세 정보를 확인하고 있어요.</section>}
    {selected&&!dialog&&<AdminDetailModal title="팝업 상세" onClose={()=>setSelected(null)}><section className="admin-panel pa-detail"><div className="admin-panel-header"><h3>{selected.title}</h3><button className="popup-admin-button" disabled={busy} onClick={()=>setSelected(null)}>닫기</button></div><dl>{[['장소',selected.location],['운영 기간',`${selected.startDate} ~ ${selected.endDate}`],['예약 운영 시간',`${selected.reservStart || '—'} ~ ${selected.reservEnd || '—'}`],['상태',statuses[selected.status]],['카테고리',selected.category],['담당 매니저',managerLabel(selected)],['예약 정원',selected.reservPeopleCap??'미설정'],['오픈 차수',selected.roundNum??'미설정'],['소개',selected.description || '등록된 소개가 없습니다.']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="pa-actions">{selected.opStatus!=='CANCELLED'&&<><button className="popup-admin-button" disabled={busy} onClick={()=>open(selected.opStatus==='PAUSED'?'resume':'pause')}>{selected.opStatus==='PAUSED'?'운영 재개':'일시중지'}</button><button className="popup-admin-button pa-danger" disabled={busy} onClick={()=>open('cancel')}>운영 취소</button></>}<button className="popup-admin-button primary" disabled={busy||selected.opStatus==='CANCELLED'} onClick={()=>open('edit')}>정보 수정</button><button className="popup-admin-button" disabled={busy||managers===null} onClick={()=>open('manager')}>담당 매니저 변경</button><button className="popup-admin-button pa-danger" disabled={busy} onClick={()=>open('delete')}>팝업 삭제</button></div>{managerError&&<p className="pa-error" role="alert">매니저 목록을 확인하지 못했습니다. <button className="popup-admin-button" onClick={()=>setManagerRetry(v=>v+1)}>다시 조회</button></p>}</section></AdminDetailModal>}
    {dialog&&<Modal title={dialog.type==='create'?'팝업 등록':dialog.type==='edit'?'팝업 정보 수정':dialog.type==='manager'?'담당 매니저 변경':operationLabels[dialog.type]||'팝업 삭제'} busy={busy} onClose={close}>
      {actionError&&<p className="pa-error" role="alert">{actionError}</p>}
      {['create','edit'].includes(dialog.type)&&<form onSubmit={submitPopup}><fieldset disabled={busy}><div className="pa-form-grid">{fields.map(([name,label,type,required])=><label key={name}>{label}<input name={name} type={type} required={required} min={type==='number'?1:name==='endDate'?form.startDate:undefined} step={type==='number'?1:undefined} value={form[name]} onChange={change}/></label>)}<label>카테고리<select name="category" value={form.category} onChange={change} required><option value="">선택하세요</option>{[...new Set(['ENTERTAINMENT','FOOD','CHARACTER','FASHION',form.category].filter(Boolean))].map(value=><option key={value} value={value}>{value}</option>)}</select></label><label>대표 이미지 업로드<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{setImage(e.target.files?.[0]||null);uploaded.current=null}}/></label></div>{!image&&<label>기존 이미지 경로<input name="storeImg" value={form.storeImg} onChange={change} placeholder="등록된 이미지 경로"/></label>}<label>팝업 소개<textarea name="description" rows={5} value={form.description} onChange={change}/></label><div className="pa-actions"><button className="popup-admin-button primary" type="submit">{busy?'저장 중…':dialog.type==='create'?'팝업 등록':'수정 저장'}</button><button className="popup-admin-button" type="button" onClick={close}>취소</button></div></fieldset></form>}
      {dialog.type==='manager'&&<form onSubmit={event=>{event.preventDefault();mutate(()=>assignManager(current.popId,managerEmail),'담당 매니저가 변경되었습니다.')}}><p><strong>{current.title}</strong></p><p className="pa-hint">현재 담당: {managerLabel(current)}</p><fieldset disabled={busy}><label>변경할 담당 매니저<select required={false} value={managerEmail} onChange={e=>setManagerEmail(e.target.value)}><option value="">담당 배정 해제</option>{managers?.map(manager=><option key={manager.id} value={manager.email}>{manager.name} · {manager.email}</option>)}</select></label><p className="pa-confirm">{nextManager?`${nextManager.name}님에게 이 팝업의 담당을 변경합니다.`:'이 팝업의 담당 매니저 배정을 해제합니다.'}</p><div className="pa-actions"><button type="submit" className="popup-admin-button primary">{busy?'변경 중…':'변경 확인'}</button><button type="button" className="popup-admin-button" onClick={close}>취소</button></div></fieldset></form>}
      {operationLabels[dialog.type]&&<form onSubmit={event=>{
        event.preventDefault()
        if(dialog.type==='cancel'&&confirmation!==current.title)return
        mutate(()=>changePopupOperation(current.popId,dialog.type),dialog.type==='pause'?'팝업 운영을 일시중지했습니다.':dialog.type==='resume'?'팝업 운영을 재개했습니다.':'팝업 운영이 취소되었습니다.')
      }}>
        <p><strong>{current.title}</strong> 팝업을 {operationLabels[dialog.type]}하시겠습니까?</p>
        {dialog.type==='pause'&&<p className="pa-hint">팝업 운영을 일시중지합니다. 이후 운영 재개로 되돌릴 수 있습니다.</p>}
        {dialog.type==='resume'&&<p className="pa-hint">일시중지를 해제합니다. 예약·구매 가능 여부는 서버의 운영 일정과 판매 조건에 따라 결정됩니다.</p>}
        {dialog.type==='cancel'&&<><p className="pa-error">운영 취소는 되돌릴 수 없습니다. 시작 전 회차와 해당 회차의 확정 대기·확정 예약, 대기 중·호출된 웨이팅이 함께 취소됩니다.</p><label>확인을 위해 팝업명을 입력해 주세요.<input value={confirmation} disabled={busy} onChange={event=>setConfirmation(event.target.value)} autoComplete="off" required/></label></>}
        <div className="pa-actions"><button type="submit" className={`popup-admin-button ${dialog.type==='cancel'?'pa-danger':'primary'}`} disabled={busy||(dialog.type==='cancel'&&confirmation!==current.title)}>{busy?'처리 중…':operationLabels[dialog.type]}</button><button type="button" className="popup-admin-button" disabled={busy} onClick={close}>돌아가기</button></div>
      </form>}
      {dialog.type==='delete'&&<form onSubmit={event=>{event.preventDefault();if(confirmation!==current.title)return;mutate(()=>deletePopup(current.popId),'팝업이 삭제되었습니다.')}}><p><strong>{current.title}</strong> 팝업을 삭제하시겠습니까?</p><p className="pa-hint">등록된 회차나 상품이 있으면 삭제할 수 없습니다. 연결된 데이터를 함께 삭제하지 않습니다.</p><label>확인을 위해 팝업명을 입력해 주세요.<input value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)} autoComplete="off"/></label><div className="pa-actions"><button type="submit" className="popup-admin-button pa-danger" disabled={busy||confirmation!==current.title}>{busy?'삭제 중…':'팝업 삭제'}</button><button type="button" className="popup-admin-button" disabled={busy} onClick={close}>취소</button></div></form>}
    </Modal>}
  </div>
}
