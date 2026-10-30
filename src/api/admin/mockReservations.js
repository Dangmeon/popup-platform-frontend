// 날짜 표시
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 임시 예약 데이터
function createReservations() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  return [
    {
      id: 1,
      number: 'DEMO-000001',
      popupName: '성수 POPQ 팝업',
      memberName: '김팝큐',
      visitDate: formatDate(today),
      visitTime: '13:00',
      people: 1,
      status: 'CONFIRMED',
    },
    {
      id: 2,
      number: 'DEMO-000002',
      popupName: '홍대 캐릭터 팝업',
      memberName: '이하늘',
      visitDate: formatDate(today),
      visitTime: '14:00',
      people: 2,
      status: 'CONFIRMED',
    },
    {
      id: 3,
      number: 'DEMO-000003',
      popupName: '성수 POPQ 팝업',
      memberName: '박봄',
      visitDate: formatDate(today),
      visitTime: '11:00',
      people: 1,
      status: 'VISITED',
    },
    {
      id: 4,
      number: 'DEMO-000004',
      popupName: '강남 굿즈 팝업',
      memberName: '최여름',
      visitDate: formatDate(tomorrow),
      visitTime: '15:00',
      people: 2,
      status: 'CANCELLED',
    },
    {
      id: 5,
      number: 'DEMO-000005',
      popupName: '강남 굿즈 팝업',
      memberName: '정가을',
      visitDate: formatDate(tomorrow),
      visitTime: '16:00',
      people: 1,
      status: 'CONFIRMED',
    },
  ]
}

// 임시 저장소
let reservations = createReservations()

// 오류 생성
function createError(message, status, code) {
  const error = new Error(message)
  error.status = status
  error.code = code

  return error
}

// 예약 조회
function findReservation(id) {
  const reservation = reservations.find(
    (item) => String(item.id) === String(id)
  )

  if (!reservation) {
    throw createError(
      '예약 정보를 찾을 수 없습니다.',
      404,
      'RESERVATION_NOT_FOUND'
    )
  }

  return reservation
}

// 예약 목록 조회
export async function getMockReservations({
  keyword = '',
  visitDate = '',
  status = '',
} = {}) {
  const searchKeyword = keyword.trim().toLowerCase()

  const filtered = reservations.filter((reservation) => {
    const matchesKeyword =
      reservation.number.toLowerCase().includes(searchKeyword) ||
      reservation.memberName.toLowerCase().includes(searchKeyword)

    const matchesDate = !visitDate || reservation.visitDate === visitDate
    const matchesStatus = !status || reservation.status === status

    return matchesKeyword && matchesDate && matchesStatus
  })

  return {
    items: filtered.map((reservation) => ({ ...reservation })),
    total: filtered.length,
    totalAll: reservations.length,
  }
}

// 예약 상세 조회
export async function getMockReservation(id) {
  return { ...findReservation(id) }
}

// 방문 처리
export async function visitMockReservation(id) {
  const reservation = findReservation(id)

  if (reservation.status !== 'CONFIRMED') {
    throw createError(
      '예약 확정 상태에서만 방문 처리할 수 있습니다.',
      409,
      'RESERVATION_NOT_CONFIRMED'
    )
  }

  if (reservation.visitDate !== formatDate(new Date())) {
    throw createError(
      '방문 처리는 예약된 방문 날짜에만 가능합니다.',
      409,
      'INVALID_VISIT_DATE'
    )
  }

  const updatedReservation = {
    ...reservation,
    status: 'VISITED',
  }

  reservations = reservations.map((item) =>
    item.id === reservation.id ? updatedReservation : item
  )

  return { ...updatedReservation }
}