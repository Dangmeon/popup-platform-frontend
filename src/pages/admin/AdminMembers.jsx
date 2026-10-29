import { useState } from 'react'
import './AdminMembers.css'

// 임시 회원 상태
const memberStatuses = {
  ACTIVE: '정상',
  SUSPENDED: '이용 제한',
  WITHDRAWN: '탈퇴',
}

// 임시 회원 권한
const memberRoles = {
  USER: '일반 회원',
  ADMIN: '관리자',
}

// 임시 회원 데이터
const demoMembers = [
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

function AdminMembers() {
  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  // 상세 정보
  const [selectedId, setSelectedId] = useState(null)

  const searchKeyword = keyword.trim().toLowerCase()

  const filteredMembers = demoMembers.filter((member) => {
    const matchesKeyword =
      member.name.toLowerCase().includes(searchKeyword) ||
      member.email.toLowerCase().includes(searchKeyword)

    const matchesStatus = !status || member.status === status

    return matchesKeyword && matchesStatus
  })

  const selectedMember = demoMembers.find(
    (member) => member.id === selectedId
  )

  // 필터 초기화
  function handleReset() {
    setKeyword('')
    setStatus('')
  }

  return (
    <div className="admin-members">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>회원 관리</h2>
          <p>회원 정보를 검색하고 가입 현황을 확인하세요.</p>
        </div>

        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 데모 안내 */}
      <p className="member-admin-demo">
        가상 회원 정보를 사용하는 데모 화면입니다.
        회원 상태와 권한은 조회만 가능하며 실제 서버와 연결되지 않습니다.
      </p>

      {/* 검색 및 필터 */}
      <section className="admin-panel" aria-label="회원 검색">
        <div className="member-admin-filters">
          <label>
            이름 / 이메일
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="이름 또는 이메일 입력"
            />
          </label>

          <label>
            회원 상태
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(memberStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="member-admin-button"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>
      </section>

      {/* 회원 목록 */}
      <section className="admin-panel member-admin-list">
        <div className="admin-panel-header">
          <h3>회원 목록</h3>
          <span>
            검색 {filteredMembers.length}명 / 전체 {demoMembers.length}명
          </span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table member-admin-table">
            <caption className="member-admin-sr-only">
              회원 검색 결과
            </caption>

            <thead>
              <tr>
                <th scope="col">회원번호</th>
                <th scope="col">이름</th>
                <th scope="col">이메일</th>
                <th scope="col">가입일</th>
                <th scope="col">상태</th>
                <th scope="col">권한</th>
                <th scope="col">관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.joinedAt}</td>
                  <td>
                    <span
                      className={`member-admin-status ${member.status.toLowerCase()}`}
                    >
                      {memberStatuses[member.status]}
                    </span>
                  </td>
                  <td>{memberRoles[member.role]}</td>
                  <td>
                    <button
                      type="button"
                      className="member-admin-button"
                      aria-label={`${member.name} 회원 상세 보기`}
                      aria-expanded={selectedId === member.id}
                      aria-controls="member-admin-detail"
                      onClick={() => setSelectedId(member.id)}
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="member-admin-empty">
                    검색 조건에 맞는 회원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 회원 상세 */}
      <div id="member-admin-detail">
        {selectedMember && (
          <section
            className="admin-panel member-admin-detail"
            aria-labelledby="member-admin-detail-title"
          >
            <div className="admin-panel-header">
              <h3 id="member-admin-detail-title">회원 상세</h3>
              <button
                type="button"
                className="member-admin-button"
                onClick={() => setSelectedId(null)}
              >
                닫기
              </button>
            </div>

            <dl className="member-admin-info">
              <div>
                <dt>회원번호</dt>
                <dd>{selectedMember.id}</dd>
              </div>
              <div>
                <dt>이름</dt>
                <dd>{selectedMember.name}</dd>
              </div>
              <div>
                <dt>이메일</dt>
                <dd>{selectedMember.email}</dd>
              </div>
              <div>
                <dt>가입일</dt>
                <dd>{selectedMember.joinedAt}</dd>
              </div>
              <div>
                <dt>회원 상태</dt>
                <dd>{memberStatuses[selectedMember.status]}</dd>
              </div>
              <div>
                <dt>권한</dt>
                <dd>{memberRoles[selectedMember.role]}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminMembers