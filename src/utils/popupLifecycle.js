const DAY=86400000
function validDate(value) {
  if(typeof value!=='string')return null
  const date=value.slice(0,10)
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null
  const timestamp=Date.parse(`${date}T00:00:00Z`)
  return Number.isFinite(timestamp)&&new Date(timestamp).toISOString().slice(0,10)===date?date:null
}
export function popupDates(popup) {
  let start=validDate(popup.startDate),end=validDate(popup.endDate)
  // 기존 홍보 팝업 중 period만 있는 항목도 동일한 날짜 기준으로 표시합니다.
  const match=String(popup.period||'').match(/(\d{4})\.(\d{2})\.(\d{2}).*?~\s*(?:(\d{4})\.)?(\d{2})\.(\d{2})/)
  if(match){
    start ||= validDate(`${match[1]}-${match[2]}-${match[3]}`)
    const endYear=match[4]||String(Number(match[1])+(Number(match[5])<Number(match[2])?1:0))
    end ||= validDate(`${endYear}-${match[5]}-${match[6]}`)
  }
  return {start,end}
}
export function getPopupLifecycle(popup,now=Date.now()) {
  if(String(popup.opStatus||'').toUpperCase()==='CANCELLED')return {label:'운영 취소',className:'is-ended'}
  if(String(popup.opStatus||'').toUpperCase()==='PAUSED')return {label:'운영 일시 중지',className:'is-paused'}
  const {start,end}=popupDates(popup)
  const today=new Date(now+9*3600000).toISOString().slice(0,10)
  if(start&&end&&start<=end){
    if(today<start)return {label:'진행 예정',className:'is-upcoming'}
    if(today>end)return {label:'종료',className:'is-ended'}
    const remaining=Math.round((Date.parse(`${end}T00:00:00Z`)-Date.parse(`${today}T00:00:00Z`))/DAY)
    if(remaining===0)return {label:'오늘 종료',className:'is-closing',remaining}
    if(remaining<=10)return {label:`종료 D-${remaining}`,className:'is-closing',remaining}
    return {label:'진행중',className:'is-ongoing',remaining}
  }
  // 날짜가 없거나 잘못된 경우 D-day를 추측하지 않고 서버 상태만 표시합니다.
  const raw=String(popup.status??popup.popupStatus??'').toUpperCase()
  if(['ONGOING','진행중'].includes(raw))return {label:'진행중',className:'is-ongoing'}
  if(['UPCOMING','SCHEDULED','진행예정'].includes(raw))return {label:'진행 예정',className:'is-upcoming'}
  if(['ENDED','FINISHED','종료'].includes(raw))return {label:'종료',className:'is-ended'}
  return null
}
