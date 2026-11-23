import http from '../axiosInstance.js'
import {id,rows} from './liveUtils.js'
import {normalizePopup} from './popupApi.js'

export async function getManagers() { return rows((await http.get('/api/admin/managers')).data) }
export function popupPayload(form) {
  const positive=value=>value===''||value==null?null:Number(value)
  const data={title:form.title.trim(),location:form.location.trim(),startDate:form.startDate,endDate:form.endDate,category:form.category,description:form.description?.trim() || '',storeImg:form.storeImg?.trim() || '',roundNum:positive(form.roundNum),reservStart:form.reservStart,reservEnd:form.reservEnd,reservPeopleCap:positive(form.reservPeopleCap)}
  if(!data.title||!data.location||!data.startDate||!data.endDate)throw new Error('팝업명·장소·운영 기간을 입력해 주세요.')
  if(data.startDate>data.endDate)throw new Error('종료일은 시작일 이후로 설정해 주세요.')
  const time=/^([01]\d|2[0-3]):[0-5]\d$/
  if(!time.test(data.reservStart)||!time.test(data.reservEnd)||data.reservStart>=data.reservEnd)throw new Error('예약 운영 시간의 시작과 종료를 확인해 주세요.')
  if([data.roundNum,data.reservPeopleCap].some(v=>v!==null&&(!Number.isSafeInteger(v)||v<1)))throw new Error('예약 정원과 오픈 차수는 1 이상의 정수로 입력해 주세요.')
  return data
}
export async function savePopup(popId,form) {
  const payload=popupPayload(form)
  const response=popId ? await http.put(`/api/admin/popups/${id(popId)}`,payload) : await http.post('/api/admin/popups',payload)
  if(!Number.isSafeInteger(response.data?.popId))throw new Error('저장 결과를 확인하지 못했습니다. 목록을 새로고침해 주세요.')
  return normalizePopup(response.data)
}
export async function assignManager(popId,managerEmail) {
  return normalizePopup((await http.patch(`/api/admin/popups/${id(popId)}/manager`,{managerEmail:managerEmail.trim()})).data)
}
export async function deletePopup(popId) { await http.delete(`/api/admin/popups/${id(popId)}`) }
export async function changePopupOperation(popId, action) {
  if (!['pause', 'resume', 'cancel'].includes(action)) throw new Error('운영 상태 변경 항목을 확인해 주세요.')
  const { data } = await http.patch(`/api/admin/popups/${id(popId)}/${action}`)
  if (data?.popId !== Number(popId) || !['OPEN', 'PAUSED', 'CANCELLED'].includes(data.opStatus)) {
    throw new Error('변경 결과를 확인하지 못했습니다. 목록을 새로고침해 주세요.')
  }
  return normalizePopup(data)
}
