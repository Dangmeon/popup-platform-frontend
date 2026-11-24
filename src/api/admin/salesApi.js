import http from '../axiosInstance.js'
import { id } from './liveUtils.js'

export async function getSalesSummary({ popId, month, weekDate, signal } = {}) {
  const path = popId ? `/api/admin/popups/${id(popId)}/sales` : '/api/admin/sales'
  const { data } = await http.get(path, { params: popId ? { weekDate } : { month }, signal })
  if (!data || ['totalSales', 'totalOrderCount', 'totalQuantity'].some(key => !Number.isSafeInteger(data[key]) || data[key] < 0)) {
    throw new Error('매출 응답을 확인하지 못했습니다.')
  }
  if (month && data.month !== month) {
    throw new Error('월별 매출 집계가 확인되지 않았습니다.')
  }
  if (popId && weekDate) {
    const monday = new Date(weekDate + 'T00:00:00Z')
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7)
    if (data.weekStart !== monday.toISOString().slice(0, 10)) {
      throw new Error('주별 매출 집계가 확인되지 않았습니다.')
    }
  }
  return data
}

// 다음 달 예상 매출 조회
export async function getMonthlySalesForecast(month, signal) {
  const { data } = await http.get('/api/admin/sales/forecast', { signal })
  if (data?.periodUnit !== 'MONTH' || data.targetNextPeriod !== month ||
      !Number.isSafeInteger(data.expectedNextSales) || data.expectedNextSales < 0) {
    throw new Error('예상 매출을 확인하지 못했습니다.')
  }
  return data.expectedNextSales
}
