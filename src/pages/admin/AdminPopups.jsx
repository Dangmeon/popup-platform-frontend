import { useEffect, useState } from 'react'
import {
  getPopups,
  getPopup,
} from '../../api/admin/popupApi'
import './AdminPopups.css'

// 나중에 확인할 부분: 서버의 운영 상태와 일치시키기
const popupStatuses = {
  UPCOMING: '운영 예정',
  OPEN: '운영 중',
  CLOSED: '운영 종료',
}

function AdminPopups() {
  // 팝업 목록
  const [popups, setPopups] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  // 팝업 상세
  const [selectedId, setSelectedId] = useState(null)
  const [selectedPopup, setSelectedPopup] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // 재조회
  const [listRetryKey, setListRetryKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)

  // 팝업 목록 조회
  useEffect(() => {
    let active = true

    async function loadPopups() {
      setListLoading(true)
      setListError('')

      try {
        const response = await getPopups({ keyword, status })

        if (!active) return

        setPopups(response.items)
        setTotal(response.total)
        setTotalAll(response.totalAll)
      } catch (error) {
        if (!active) return

        setPopups([])
        setTotal(0)
        setTotalAll(0)
        setListError(
          error.message || '팝업 목록을 불러오지 못했습니다.'
        )
      } finally {
        if (active) setListLoading(false)
      }
    }

    loadPopups()

    return () => {
      active = false
    }
  }, [keyword, status, listRetryKey])

  // 팝업 상세 조회
  useEffect(() => {
    let active = true

    async function loadPopup() {
      setSelectedPopup(null)
      setDetailError('')

      if (selectedId === null) {
        setDetailLoading(false)
        return
      }

      setDetailLoading(true)

      try {
        const response = await getPopup(selectedId)

        if (active) setSelectedPopup(response)
      } catch (error) {
        if (active) {
          setDetailError(
            error.message || '팝업 상세 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    }

    loadPopup()

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
    <div className="admin-popups">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>팝업 관리</h2>
          <p>팝업스토어의 운영 정보와 일정을 확인하세요.</p>
        </div>

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}
      <p className="popup-admin-demo">
        가상 팝업을 사용하는 조회 화면입니다.
        날짜와 운영 상태는 고정된 예시이며 실제 서버와 연결되지 않습니다.
      </p>

      {/* 검색 및 필터 */}
      <section className="admin-panel" aria-label="팝업 검색">
        <div className="popup-admin-filters">
          <label>
            팝업명 / 위치
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="팝업명 또는 위치 입력"
            />
          </label>

          <label>
            운영 상태
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(popupStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="popup-admin-button"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>
      </section>

      {/* 팝업 목록 */}
      <section
        className="admin-panel popup-admin-list"
        aria-busy={listLoading}
      >
        <div className="admin-panel-header">
          <h3>팝업 목록</h3>
          {!listLoading && !listError && (
            <span>
              검색 {total}개 / 전체 {totalAll}개
            </span>
          )}
        </div>

        {listLoading && (
          <p role="status">팝업 목록을 불러오는 중입니다.</p>
        )}

        {listError && (
          <div>
            <p role="alert">{listError}</p>
            <button
              type="button"
              className="popup-admin-button"
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
            <table className="admin-table popup-admin-table">
              <caption className="popup-admin-sr-only">
                팝업 검색 결과
              </caption>

              <thead>
                <tr>
                  <th scope="col">팝업번호</th>
                  <th scope="col">팝업명</th>
                  <th scope="col">위치</th>
                  <th scope="col">운영기간</th>
                  <th scope="col">상태</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>

              <tbody>
                {popups.map((popup) => (
                  <tr key={popup.popId}>
                    <td>{popup.popId}</td>
                    <td>{popup.title}</td>
                    <td>{popup.location}</td>
                    <td>
                      {popup.startDate}
                      <br />
                      ~ {popup.endDate}
                    </td>
                    <td>
                      <span
                        className={`popup-admin-status ${popup.status.toLowerCase()}`}
                      >
                        {popupStatuses[popup.status] || popup.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="popup-admin-button"
                        aria-label={`${popup.title} 상세 보기`}
                        aria-expanded={selectedId === popup.popId}
                        aria-controls="popup-admin-detail"
                        onClick={() => setSelectedId(popup.popId)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}

                {popups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="popup-admin-empty">
                      검색 조건에 맞는 팝업이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 팝업 상세 */}
      <div id="popup-admin-detail">
        {selectedId !== null && (
          <section
            className="admin-panel popup-admin-detail"
            aria-labelledby="popup-admin-detail-title"
            aria-busy={detailLoading}
          >
            <div className="admin-panel-header">
              <h3 id="popup-admin-detail-title">팝업 상세</h3>
              <button
                type="button"
                className="popup-admin-button"
                onClick={() => setSelectedId(null)}
              >
                닫기
              </button>
            </div>

            {detailLoading && (
              <p role="status">팝업 정보를 불러오는 중입니다.</p>
            )}

            {detailError && (
              <div>
                <p role="alert">{detailError}</p>
                <button
                  type="button"
                  className="popup-admin-button"
                  onClick={() =>
                    setDetailRetryKey((previous) => previous + 1)
                  }
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!detailLoading && !detailError && selectedPopup && (
              <dl className="popup-admin-info">
                <div>
                  <dt>팝업번호</dt>
                  <dd>{selectedPopup.popId}</dd>
                </div>
                <div>
                  <dt>팝업명</dt>
                  <dd>{selectedPopup.title}</dd>
                </div>
                <div>
                  <dt>위치</dt>
                  <dd>{selectedPopup.location}</dd>
                </div>
                <div>
                  <dt>운영 시작일</dt>
                  <dd>{selectedPopup.startDate}</dd>
                </div>
                <div>
                  <dt>운영 종료일</dt>
                  <dd>{selectedPopup.endDate}</dd>
                </div>
                <div>
                  <dt>운영 상태</dt>
                  <dd>
                    {popupStatuses[selectedPopup.status] ||
                      selectedPopup.status}
                  </dd>
                </div>
                <div>
                  <dt>설명</dt>
                  <dd>{selectedPopup.description || '-'}</dd>
                </div>
              </dl>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminPopups