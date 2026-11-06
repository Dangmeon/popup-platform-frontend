import axiosInstance from './axiosInstance'

// 양수 ID 확인
function validateId(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label}는 1 이상의 정수여야 합니다.`)
  }
}

// 서버 주소 확인
function validateServerAddress() {
  if (!axiosInstance.defaults.baseURL?.trim()) {
    throw new Error('백엔드 서버 주소가 설정되지 않았습니다.')
  }
}

// 예약 인원 확인
function validatePeopleCount(peopleCount) {
  if (
    !Number.isSafeInteger(peopleCount) ||
    peopleCount < 1 ||
    peopleCount > 3
  ) {
    throw new Error('예약 인원은 1~3명으로 선택해 주세요.')
  }
}

// 나중에 바꿀 부분: 내 예약 목록 API 확정 후 연결
export const getReservations = () =>
  axiosInstance.get('/api/reservations')

// 예약 생성
export async function createHoldReservation({
  timeSlotId,
  peopleCount,
}) {
  validateServerAddress()
  validateId(timeSlotId, '회차 ID')
  validatePeopleCount(peopleCount)

  const response = await axiosInstance.post('/api/reservations', {
    timeSlotId,
    peopleCount,
  })

  return response.data
}

// 예약 상세 조회
export async function getReservation({ reservationId }) {
  validateServerAddress()
  validateId(reservationId, '예약 ID')

  const response = await axiosInstance.get(
    `/api/reservations/${reservationId}`
  )

  return response.data
}

// 예약 확정
export async function confirmReservation({ reservationId }) {
  validateServerAddress()
  validateId(reservationId, '예약 ID')

  const response = await axiosInstance.post(
    `/api/reservations/${reservationId}/confirm`
  )

  // 화면에서 CONFIRMED와 EXPIRED를 구분
  return response.data
}

// 예약 변경
export async function updateReservation({
  reservationId,
  timeSlotId,
  peopleCount,
}) {
  validateServerAddress()
  validateId(reservationId, '예약 ID')
  validateId(timeSlotId, '회차 ID')
  validatePeopleCount(peopleCount)

  const response = await axiosInstance.patch(
    `/api/reservations/${reservationId}`,
    {
      timeSlotId,
      peopleCount,
    }
  )

  return response.data
}

// 예약 취소
export async function cancelReservation({ reservationId }) {
  validateServerAddress()
  validateId(reservationId, '예약 ID')

  const response = await axiosInstance.patch(
    `/api/reservations/${reservationId}/cancel`
  )

  return response.data
}

// 예약 QR 이미지 조회
export async function getReservationQr({ reservationId }) {
  validateServerAddress()
  validateId(reservationId, '예약 ID')

  try {
    const response = await axiosInstance.get(
      `/api/reservations/${reservationId}/qr`,
      { responseType: 'blob' }
    )

    const image = response.data
    const contentType = (
      response.headers['content-type'] ||
      image?.type ||
      ''
    ).toLowerCase()

    if (
      !(image instanceof Blob) ||
      image.size === 0 ||
      !contentType.startsWith('image/png')
    ) {
      throw new Error('서버에서 올바른 QR 이미지를 받지 못했습니다.')
    }

    return image
  } catch (error) {
    // 이미지 요청의 JSON 오류 응답 처리
    const responseData = error.response?.data

    if (responseData instanceof Blob) {
      const contentType = (
        error.response.headers?.['content-type'] ||
        responseData.type ||
        ''
      ).toLowerCase()

      if (contentType.includes('json')) {
        try {
          error.response.data = JSON.parse(await responseData.text())
        } catch {
          // 원래 오류 유지
        }
      }
    }

    throw error
  }
}