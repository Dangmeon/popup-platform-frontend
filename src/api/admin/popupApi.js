import { popupCategoryCode } from '../../utils/popupCategories.js'
import http from '../axiosInstance.js'
import {filterRows,id,rows} from './liveUtils.js'

export function normalizePopup(raw) {
  return {...raw,category:popupCategoryCode(raw.category),status:['PAUSED','CANCELLED'].includes(raw.opStatus)?raw.opStatus:raw.status || 'UNKNOWN'}
}
export async function getPopups({keyword='',status=''} = {}) {
  const data=rows((await http.get('/api/admin/popups')).data).map(normalizePopup)
  const word=keyword.trim().toLowerCase()
  return filterRows(data,row=>(!word||`${row.title} ${row.location}`.toLowerCase().includes(word))&&(!status||row.status===status))
}
export async function getPopup(popId) {
  return normalizePopup((await http.get(`/api/popups/${id(popId)}`)).data)
}
