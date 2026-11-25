import http from '../axiosInstance.js'
import { id } from './liveUtils.js'

const validAmount = value => Number.isSafeInteger(value) && value >= 0

// 주문 건수와 판매 수량을 포함한 누적 매출 조회
export async function getSalesSummary({ popId, signal } = {}) {
  const path = popId ? `/api/admin/popups/${id(popId)}/sales` : '/api/admin/sales'
  const { data } = await http.get(path, { signal })
  if (['totalSales', 'totalOrderCount', 'totalQuantity'].some(key => !validAmount(data?.[key]))) {
    throw new Error('누적 매출 응답을 확인하지 못했습니다.')
  }
  return data
}

// 최근 4개월 또는 선택 주를 포함한 4주 매출 조회
export async function getSalesTrend({ popId, date, signal }) {
  const path = popId ? `/api/admin/popups/${id(popId)}/weekly` : '/api/admin/monthly'
  const { data } = await http.get(path, { signal, params: popId ? { date } : undefined })
  const periodKey = popId ? 'weekStart' : 'month'
  const pattern = popId ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-(0[1-9]|1[0-2])$/
  if (!Array.isArray(data) || data.length !== 4 ||
      data.some(row => !pattern.test(row?.[periodKey]) || !validAmount(row?.totalSales) ||
        (popId && !pattern.test(row?.weekEnd))) ||
      new Set(data.map(row => row[periodKey])).size !== 4) {
    throw new Error('기간별 매출 응답을 확인하지 못했습니다.')
  }
  return [...data].sort((a, b) => a[periodKey].localeCompare(b[periodKey]))
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
