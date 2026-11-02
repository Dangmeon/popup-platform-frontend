// 서버 일시 변환
export function parseReservationDateTime(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  // 소수점 이하 밀리초 정리
  const normalized = value.trim().replace(
    /(\.\d{3})\d+/,
    '$1'
  )

  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)

  // 나중에 확인할 부분: 시간대 없는 서버 일시는 로컬 테스트의 한국 시간 기준
  const date = new Date(
    hasTimeZone ? normalized : `${normalized}+09:00`
  )

  return Number.isNaN(date.getTime()) ? null : date
}

// 예약 불가 사유
export function getSlotUnavailableReason(
  slot,
  peopleCount,
  now = Date.now()
) {
  if (!slot) {
    return '회차 정보를 확인해 주세요.'
  }

  if (
    !Number.isSafeInteger(peopleCount) ||
    peopleCount < 1 ||
    peopleCount > 3
  ) {
    return '예약 인원은 1~3명입니다.'
  }

  const openAt = parseReservationDateTime(slot.reservOpenAt)
  const closeAt = parseReservationDateTime(slot.reservCloseAt)

  if (
    !openAt ||
    !closeAt ||
    openAt.getTime() >= closeAt.getTime()
  ) {
    return '예약 가능 시간 확인 필요'
  }

  if (now < openAt.getTime()) {
    return '예약 오픈 전'
  }

  if (now >= closeAt.getTime()) {
    return '예약 마감'
  }

  if (!Number.isSafeInteger(slot.remaining) || slot.remaining < 0) {
    return '잔여석 확인 필요'
  }

  if (slot.remaining === 0) {
    return '잔여석 없음'
  }

  if (slot.remaining < peopleCount) {
    return '선택 인원보다 잔여석 부족'
  }

  return ''
}