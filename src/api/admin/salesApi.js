import http from '../axiosInstance.js'
import { id } from './liveUtils.js'

export async function getSalesSummary({ popId, signal } = {}) {
  const path = popId ? `/api/admin/popups/${id(popId)}/sales` : '/api/admin/sales'
  const { data } = await http.get(path, { signal })
  if (!data || ['totalSales', 'totalOrderCount', 'totalQuantity'].some(key => !Number.isSafeInteger(data[key]) || data[key] < 0)) {
    throw new Error('매출 응답을 확인하지 못했습니다.')
  }
  return data
}
