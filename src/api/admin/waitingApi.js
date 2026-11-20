import http from '../axiosInstance.js'
import {getPopup} from './popupApi.js'
import {filterRows,id} from './liveUtils.js'

export async function getWaitings({popId,keyword='',status=''} = {}) {
  const data=(await http.get(`/api/admin/popups/${id(popId)}/waitings`)).data
  if(!Array.isArray(data?.waitings))throw new Error('대기 목록을 확인하지 못했습니다.')
  const word=keyword.trim().toLowerCase()
  return filterRows(data.waitings,row=>(!status||row.status===status)&&(!word||`${row.queueNumber} ${row.checkInCode}`.toLowerCase().includes(word)))
}
export async function getWaiting(waitingId) {
  const raw=(await http.get(`/api/waitings/${id(waitingId)}`)).data
  return {...raw,popupName:(await getPopup(raw.popId)).title}
}
