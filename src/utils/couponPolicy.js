// 표시·시연용 정책. 실제 발급/사용/연장은 추후 서버가 검증해야 합니다.
export function koreaDate(now = Date.now()) {
  return new Date(now + 9 * 3600000).toISOString().slice(0, 10)
}
export function addCalendarMonths(date, months) {
  const [year, month, day] = date.split('-').map(Number)
  const first = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  first.setUTCDate(Math.min(day, lastDay))
  return first.toISOString().slice(0, 10)
}
export function daysUntil(expiresOn, now = Date.now()) {
  return Math.round((Date.parse(`${expiresOn}T00:00:00Z`) - Date.parse(`${koreaDate(now)}T00:00:00Z`)) / 86400000)
}
export function couponState(coupon, now = Date.now()) {
  const days = daysUntil(coupon.expiresOn, now)
  if (coupon.used) return { key:'used', label:'사용 완료', days }
  if (days < 0) return { key:'expired', label:'기간 만료', days }
  return { key:'available', label:'사용 가능', days }
}
export function extendDemoCoupon(coupon, now = Date.now()) {
  if (couponState(coupon, now).key !== 'available' || coupon.extended) throw new Error('사용 가능한 미연장 쿠폰만 1회 연장할 수 있어요.')
  return { ...coupon, expiresOn:addCalendarMonths(coupon.expiresOn, 1), extended:true }
}
