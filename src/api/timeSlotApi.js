import axiosInstance from './axiosInstance'

// 서버 주소 확인
function validateServerAddress() {
  if (!axiosInstance.defaults.baseURL?.trim()) {
    throw new Error('백엔드 서버 주소가 설정되지 않았습니다.')
  }
}

// ID 확인
function validateId(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label}는 1 이상의 정수여야 합니다.`)
  }
}

// 날짜 확인
function validateDate(value) {
  if (typeof value !== 'string') {
    throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.')
  }

  const date = new Date(`${value}T00:00:00Z`)

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error('올바른 날짜를 선택해 주세요.')
  }
}

// 팝업 회차 목록 조회
export async function getTimeSlots({ popId, date } = {}) {
  validateServerAddress()
  validateId(popId, '팝업 ID')

  const params = {}

  if (date !== undefined && date !== '') {
    validateDate(date)
    params.date = date
  }

  const response = await axiosInstance.get(
    `/api/popups/${popId}/slots`,
    { params }
  )

  if (!Array.isArray(response.data)) {
    throw new Error('회차 목록 응답 형식을 확인해 주세요.')
  }

  return response.data
}

// 회차 상세 조회
export async function getTimeSlot(timeSlotId) {
  validateServerAddress()
  validateId(timeSlotId, '회차 ID')

  const response = await axiosInstance.get(
    `/api/slots/${timeSlotId}`
  )

  return response.data
}