// 나중에 제거할 부분: 실제 회원 API 연결 후 사용하지 않는 더미 데이터

// 임시 회원 데이터
const members = [
  {
    id: 1,
    name: '김팝큐',
    email: 'popq@example.com',
    joinedAt: '2026-10-01',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 2,
    name: '이하늘',
    email: 'sky@example.com',
    joinedAt: '2026-10-05',
    status: 'ACTIVE',
    role: 'USER',
  },
  {
    id: 3,
    name: '박봄',
    email: 'spring@example.com',
    joinedAt: '2026-10-10',
    status: 'SUSPENDED',
    role: 'USER',
  },
  {
    id: 4,
    name: '최여름',
    email: 'summer@example.com',
    joinedAt: '2026-10-12',
    status: 'WITHDRAWN',
    role: 'USER',
  },
  {
    id: 5,
    name: '운영관리자',
    email: 'admin@example.com',
    joinedAt: '2026-09-01',
    status: 'ACTIVE',
    role: 'ADMIN',
  },
]

// 회원 목록 조회
export async function getMockMembers({
  keyword = '',
  status = '',
} = {}) {
  const searchKeyword = keyword.trim().toLowerCase()

  const filteredMembers = members.filter((member) => {
    const matchesKeyword =
      member.name.toLowerCase().includes(searchKeyword) ||
      member.email.toLowerCase().includes(searchKeyword)

    const matchesStatus = !status || member.status === status

    return matchesKeyword && matchesStatus
  })

  return {
    items: filteredMembers.map((member) => ({ ...member })),
    total: filteredMembers.length,
    totalAll: members.length,
  }
}

// 회원 상세 조회
export async function getMockMember(id) {
  const member = members.find(
    (item) => String(item.id) === String(id)
  )

  if (!member) {
    const error = new Error('회원 정보를 찾을 수 없습니다.')
    error.status = 404
    error.code = 'MEMBER_NOT_FOUND'
    throw error
  }

  return { ...member }
}