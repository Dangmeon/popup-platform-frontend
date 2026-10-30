// 나중에 제거할 부분: 실제 팝업 API 연결 후 사용하지 않는 더미 데이터

// 임시 팝업 데이터
const popups = [
  {
    popId: 1,
    title: '성수 POPQ 팝업',
    location: '서울 성동구 성수동',
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    status: 'OPEN',
    description: 'POPQ 굿즈와 전시를 만날 수 있는 팝업스토어입니다.',
  },
  {
    popId: 2,
    title: '홍대 캐릭터 팝업',
    location: '서울 마포구 서교동',
    startDate: '2026-10-15',
    endDate: '2026-11-10',
    status: 'OPEN',
    description: '캐릭터 전시와 체험 공간을 운영하는 팝업스토어입니다.',
  },
  {
    popId: 3,
    title: '강남 굿즈 팝업',
    location: '서울 강남구 역삼동',
    startDate: '2026-11-10',
    endDate: '2026-11-30',
    status: 'UPCOMING',
    description: '오픈을 준비 중인 굿즈 전시 팝업스토어입니다.',
  },
  {
    popId: 4,
    title: '잠실 컬렉션 팝업',
    location: '서울 송파구 잠실동',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'CLOSED',
    description: '운영이 종료된 컬렉션 전시 팝업스토어입니다.',
  },
]

// 팝업 목록 조회
export async function getMockPopups({
  keyword = '',
  status = '',
} = {}) {
  const searchKeyword = keyword.trim().toLowerCase()

  const filteredPopups = popups.filter((popup) => {
    const matchesKeyword =
      popup.title.toLowerCase().includes(searchKeyword) ||
      popup.location.toLowerCase().includes(searchKeyword)

    const matchesStatus = !status || popup.status === status

    return matchesKeyword && matchesStatus
  })

  return {
    items: filteredPopups.map((popup) => ({ ...popup })),
    total: filteredPopups.length,
    totalAll: popups.length,
  }
}

// 팝업 상세 조회
export async function getMockPopup(popId) {
  const popup = popups.find(
    (item) => String(item.popId) === String(popId)
  )

  if (!popup) {
    const error = new Error('팝업 정보를 찾을 수 없습니다.')
    error.status = 404
    error.code = 'POPUP_NOT_FOUND'
    throw error
  }

  return { ...popup }
}