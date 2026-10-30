import { useEffect, useState } from 'react'
import {
  getMembers,
  getMember,
} from '../../api/admin/memberApi'
import './AdminMembers.css'

// 나중에 확인할 부분: 백엔드 회원 상태값과 일치시키기
const memberStatuses = {
  ACTIVE: '정상',
  SUSPENDED: '이용 제한',
  WITHDRAWN: '탈퇴',
}

// 나중에 확인할 부분: 백엔드 회원 권한값과 일치시키기
const memberRoles = {
  USER: '일반 회원',
  ADMIN: '관리자',
}

function AdminMembers() {
  // 회원 목록
  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  // 회원 상세
  const [selectedId, setSelectedId] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // 재조회
  const [listRetryKey, setListRetryKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)

  // 회원 목록 조회
  useEffect(() => {
    let active = true

    async function loadMembers() {
      setListLoading(true)
      setListError('')

      try {
        const response = await getMembers({
          keyword,
          status,
        })

        if (!active) return

        setMembers(response.items)
        setTotal(response.total)
        setTotalAll(response.totalAll)
      } catch (error) {
        if (!active) return

        setMembers([])
        setTotal(0)
        setTotalAll(0)
        setListError(
          error.message || '회원 목록을 불러오지 못했습니다.'
        )
      } finally {
        if (active) setListLoading(false)
      }
    }

    loadMembers()

    return () => {
      active = false
    }
  }, [keyword, status, listRetryKey])

  // 회원 상세 조회
  useEffect(() => {
    let active = true

    async function loadMember() {
      setSelectedMember(null)
      setDetailError('')

      if (selectedId === null) {
        setDetailLoading(false)
        return
      }

      setDetailLoading(true)

      try {
        const response = await getMember(selectedId)

        if (active) setSelectedMember(response)
      } catch (error) {
        if (active) {
          setDetailError(
            error.message || '회원 상세 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    }

    loadMember()

    return () => {
      active = false
    }
  }, [selectedId, detailRetryKey])

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

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}
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
      <section
        className="admin-panel member-admin-list"
        aria-busy={listLoading}
      >
        <div className="admin-panel-header">
          <h3>회원 목록</h3>
          {!listLoading && !listError && (
            <span>
              검색 {total}명 / 전체 {totalAll}명
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
                  <th scope="col">상태</th>
                  <th scope="col">권한</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>

              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.id}</td>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.joinedAt}</td>
                    <td>
                      <span
                        className={`member-admin-status ${member.status.toLowerCase()}`}
                      >
                        {memberStatuses[member.status] || member.status}
                      </span>
                    </td>
                    <td>{memberRoles[member.role] || member.role}</td>
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

                {members.length === 0 && (
                  <tr>
                    <td colSpan={7} className="member-admin-empty">
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
      <div id="member-admin-detail">
        {selectedId !== null && (
          <section
            className="admin-panel member-admin-detail"
            aria-labelledby="member-admin-detail-title"
            aria-busy={detailLoading}
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

            {detailLoading && (
              <p role="status">회원 정보를 불러오는 중입니다.</p>
            )}

            {detailError && (
              <div>
                <p role="alert">{detailError}</p>
                <button
                  type="button"
                  className="member-admin-button"
                  onClick={() =>
                    setDetailRetryKey((previous) => previous + 1)
                  }
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!detailLoading && !detailError && selectedMember && (
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
                  <dd>
                    {memberStatuses[selectedMember.status] ||
                      selectedMember.status}
                  </dd>
                </div>
                <div>
                  <dt>권한</dt>
                  <dd>
                    {memberRoles[selectedMember.role] ||
                      selectedMember.role}
                  </dd>
                </div>
              </dl>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminMembers