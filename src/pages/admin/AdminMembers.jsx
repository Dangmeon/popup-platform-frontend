import AdminDetailModal from '../../components/admin/AdminDetailModal.jsx'
import { useEffect, useState } from 'react'
import { getMembers } from '../../api/admin/memberApi.js'
import './AdminMembers.css'

const memberRoles = { USER: '일반 회원', ADMIN: '관리자', MANAGER: '매니저' }

function AdminMembers() {
  const [allMembers, setAllMembers] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [listRetryKey, setListRetryKey] = useState(0)

  // 관리자 회원 목록 조회
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    setListLoading(true)
    setListError('')
    getMembers({ signal }).then(items => {
      if (!signal.aborted) setAllMembers(items)
    }).catch(error => {
      if (signal.aborted) return
      const status = error.response?.status
      const message = status === 401 ? '다시 로그인해 주세요.' :
        status === 403 ? '회원 목록을 조회할 권한이 없습니다.' : '회원 목록을 불러오지 못했습니다.'
      setAllMembers([])
      setListError(message)
    }).finally(() => { if (!signal.aborted) setListLoading(false) })
    return () => controller.abort()
  }, [listRetryKey])

  // 이름·이메일 검색 및 회원번호 정렬
  const query = keyword.trim().toLowerCase()
  const members = allMembers.filter(({name, email}) =>
    String(name ?? '').toLowerCase().includes(query) || String(email ?? '').toLowerCase().includes(query)
  ).sort((a, b) => a.memberId - b.memberId)

  // 회원 관리 화면
  return (
    <div className="admin-members">
      <div className="admin-page-heading"><h2>회원 관리</h2></div>

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

          <button
            type="button"
            className="member-admin-button"
            onClick={() => setKeyword('')}
          >
            초기화
          </button>
        </div>
      </section>

      {/* 회원 목록 */}
      <section
        className="admin-panel member-admin-list"
        aria-busy={listLoading}
      >
        <div className="admin-panel-header">
          <h3>회원 목록</h3>
          {!listLoading && !listError && (
            <span>
              검색 {members.length}명 / 전체 {allMembers.length}명
            </span>
          )}
        </div>

        {listLoading && (
          <p role="status">회원 목록을 불러오는 중입니다.</p>
        )}

        {listError && (
          <div>
            <p role="alert">{listError}</p>
            <button
              type="button"
              className="member-admin-button"
              onClick={() =>
                setListRetryKey((previous) => previous + 1)
              }
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!listLoading && !listError && (
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
                  <th scope="col">권한</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>

              <tbody>
                {members.map((member) => (
                  <tr key={member.memberId}>
                    <td>{member.memberId}</td>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.createdAt || '—'}</td>
                    <td>{memberRoles[member.role] || member.role}</td>
                    <td>
                      <button
                        type="button"
                        className="member-admin-button"
                        aria-label={`${member.name} 회원 상세 보기`}
                        aria-expanded={selectedMember?.memberId === member.memberId}
                        aria-haspopup="dialog"
                        onClick={() => setSelectedMember(member)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}

                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="member-admin-empty">
                      검색 조건에 맞는 회원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 회원 상세 */}
      {selectedMember && (
        <AdminDetailModal title="회원 상세" onClose={() => setSelectedMember(null)}>
          <dl className="member-admin-info">
            {[
              ['회원번호', selectedMember.memberId],
              ['이름', selectedMember.name],
              ['이메일', selectedMember.email],
              ['연락처', selectedMember.phone],
              ['가입일', selectedMember.createdAt],
              ['권한', memberRoles[selectedMember.role] || selectedMember.role],
            ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}
          </dl>
        </AdminDetailModal>
      )}
    </div>
  )
}

export default AdminMembers
