import { useEffect, useState } from 'react'
import { getPopups } from '../../api/admin/popupApi'
import {
  getWaitings,
  getWaiting,
} from '../../api/admin/waitingApi'
import './AdminWaitings.css'

// 나중에 확인할 부분: 백엔드 현장 대기 상태값과 일치시키기
const waitingStatuses = {
  WAITING: '대기 중',
  CALLED: '호출 완료',
  ENTERED: '입장 완료',
  CANCELLED: '대기 취소',
  EXPIRED: '호출 만료',
}

// 날짜 표시
function formatDateTime(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 연락처 표시
function maskPhone(phone) {
  return phone.replace(/^(\d{3})-\d{4}-(\d{4})$/, '$1-****-$2')
}

function AdminWaitings() {
  // 팝업 선택
  const [popups, setPopups] = useState([])
  const [popId, setPopId] = useState('')
  const [popupLoading, setPopupLoading] = useState(true)
  const [popupError, setPopupError] = useState('')

  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  // 웨이팅 목록
  const [waitings, setWaitings] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')

  // 상세 정보
  const [selectedId, setSelectedId] = useState(null)
  const [selectedWaiting, setSelectedWaiting] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // 재조회
  const [popupRetryKey, setPopupRetryKey] = useState(0)
  const [listRetryKey, setListRetryKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)

  // 팝업 목록 조회
  useEffect(() => {
    let active = true

    async function loadPopups() {
      setPopupLoading(true)
      setPopupError('')

      try {
        // 나중에 확인할 부분: 선택용 팝업 목록이 페이지 단위로 반환되는지 확인
        const response = await getPopups()

        if (active) setPopups(response.items)
      } catch (error) {
        if (active) {
          setPopupError(
            error.message || '팝업 목록을 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setPopupLoading(false)
      }
    }

    loadPopups()

    return () => {
      active = false
    }
  }, [popupRetryKey])

  // 웨이팅 목록 조회
  useEffect(() => {
    let active = true

    async function loadWaitings() {
      setListError('')
      setWaitings([])
      setTotal(0)
      setTotalAll(0)

      if (!popId) {
        setListLoading(false)
        return
      }

      setListLoading(true)

      try {
        const response = await getWaitings({
          popId,
          keyword,
          status,
        })

        if (!active) return

        setWaitings(response.items)
        setTotal(response.total)
        setTotalAll(response.totalAll)
      } catch (error) {
        if (active) {
          setListError(
            error.message || '웨이팅 목록을 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setListLoading(false)
      }
    }

    loadWaitings()

    return () => {
      active = false
    }
  }, [popId, keyword, status, listRetryKey])

  // 상세 조회
  useEffect(() => {
    let active = true

    async function loadWaiting() {
      setSelectedWaiting(null)
      setDetailError('')

      if (selectedId === null) {
        setDetailLoading(false)
        return
      }

      setDetailLoading(true)

      try {
        const response = await getWaiting(selectedId)

        if (active) setSelectedWaiting(response)
      } catch (error) {
        if (active) {
          setDetailError(
            error.message || '웨이팅 상세 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    }

    loadWaiting()

    return () => {
      active = false
    }
  }, [selectedId, detailRetryKey])

  // 팝업 변경
  function handlePopupChange(event) {
    setPopId(event.target.value)
    setSelectedId(null)
    setKeyword('')
    setStatus('')
  }

  // 검색 조건 초기화
  function handleReset() {
    setKeyword('')
    setStatus('')
  }

  const detailRows = selectedWaiting
    ? [
        ['팝업명', selectedWaiting.popupName],
        ['대기번호', selectedWaiting.queueNumber],
        ['연락처', selectedWaiting.phone],
        ['대기 인원', `${selectedWaiting.peopleCount}명`],
        [
          '상태',
          waitingStatuses[selectedWaiting.status] ||
            selectedWaiting.status,
        ],
        ['등록일시', formatDateTime(selectedWaiting.joinedAt)],
        ['호출일시', formatDateTime(selectedWaiting.calledAt)],
        ['호출 만료시각', formatDateTime(selectedWaiting.expiresAt)],
      ]
    : []

  return (
    <div className="admin-waitings">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>웨이팅 관리</h2>
          <p>팝업별 현장 입장 대기 현황을 확인하세요.</p>
        </div>

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}
      <p className="waiting-admin-demo">
        가상 현장 대기 정보를 사용하는 조회 화면입니다.
        현재 시각과 관계없이 예시 상태를 표시합니다.
        실제 호출·입장 처리·자동 만료는 실행하지 않습니다.
      </p>

      {/* 팝업 선택 및 검색 */}
      <section className="admin-panel" aria-label="웨이팅 검색">
        <div className="waiting-admin-filters">
          <label>
            팝업 선택
            <select
              value={popId}
              onChange={handlePopupChange}
              disabled={popupLoading || Boolean(popupError)}
            >
              <option value="">
                {popupLoading ? '팝업 불러오는 중…' : '팝업을 선택하세요'}
              </option>
              {popups.map((popup) => (
                <option key={popup.popId} value={popup.popId}>
                  {popup.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            대기번호 / 연락처
            <input
              type="search"
              value={keyword}
              disabled={!popId}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="대기번호 또는 연락처 끝자리"
            />
          </label>

          <label>
            대기 상태
            <select
              value={status}
              disabled={!popId}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(waitingStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="waiting-admin-button"
            disabled={!popId}
            onClick={handleReset}
          >
            초기화
          </button>
        </div>

        {popupError && (
          <div>
            <p role="alert">{popupError}</p>
            <button
              type="button"
              className="waiting-admin-button"
              onClick={() =>
                setPopupRetryKey((previous) => previous + 1)
              }
            >
              팝업 다시 불러오기
            </button>
          </div>
        )}

        {!popupLoading && !popupError && popups.length === 0 && (
          <p role="status">선택할 수 있는 팝업이 없습니다.</p>
        )}
      </section>

      {/* 웨이팅 목록 */}
      <section
        className="admin-panel waiting-admin-list"
        aria-busy={listLoading}
      >
        <div className="admin-panel-header">
          <h3>현장 대기 목록</h3>
          {popId && !listLoading && !listError && (
            <span>
              검색 {total}팀 / 팝업 전체 {totalAll}팀
            </span>
          )}
        </div>

        {!popId && <p>조회할 팝업을 먼저 선택해 주세요.</p>}

        {listLoading && (
          <p role="status">웨이팅 목록을 불러오는 중입니다.</p>
        )}

        {listError && (
          <div>
            <p role="alert">{listError}</p>
            <button
              type="button"
              className="waiting-admin-button"
              onClick={() =>
                setListRetryKey((previous) => previous + 1)
              }
            >
              다시 불러오기
            </button>
          </div>
        )}

        {popId && !listLoading && !listError && (
          <div className="admin-table-wrapper">
            <table className="admin-table waiting-admin-table">
              <caption className="waiting-admin-sr-only">
                선택한 팝업의 현장 대기 검색 결과
              </caption>

              <thead>
                <tr>
                  <th scope="col">대기번호</th>
                  <th scope="col">연락처</th>
                  <th scope="col">인원</th>
                  <th scope="col">등록일시</th>
                  <th scope="col">상태</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>

              <tbody>
                {waitings.map((waiting) => (
                  <tr key={waiting.waitingId}>
                    <td>{waiting.queueNumber}</td>
                    <td>{maskPhone(waiting.phone)}</td>
                    <td>{waiting.peopleCount}명</td>
                    <td>{formatDateTime(waiting.joinedAt)}</td>
                    <td>
                      <span
                        className={`waiting-admin-status ${waiting.status.toLowerCase()}`}
                      >
                        {waitingStatuses[waiting.status] ||
                          waiting.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="waiting-admin-button"
                        aria-label={`${waiting.queueNumber}번 상세 보기`}
                        aria-expanded={selectedId === waiting.waitingId}
                        aria-controls="waiting-admin-detail"
                        onClick={() => setSelectedId(waiting.waitingId)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}

                {waitings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="waiting-admin-empty">
                      검색 조건에 맞는 현장 대기가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 웨이팅 상세 */}
      <div id="waiting-admin-detail">
        {selectedId !== null && (
          <section
            className="admin-panel waiting-admin-detail"
            aria-labelledby="waiting-admin-detail-title"
            aria-busy={detailLoading}
          >
            <div className="admin-panel-header">
              <h3 id="waiting-admin-detail-title">현장 대기 상세</h3>
              <button
                type="button"
                className="waiting-admin-button"
                onClick={() => setSelectedId(null)}
              >
                닫기
              </button>
            </div>

            {detailLoading && (
              <p role="status">웨이팅 정보를 불러오는 중입니다.</p>
            )}

            {detailError && (
              <div>
                <p role="alert">{detailError}</p>
                <button
                  type="button"
                  className="waiting-admin-button"
                  onClick={() =>
                    setDetailRetryKey((previous) => previous + 1)
                  }
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!detailLoading && !detailError && selectedWaiting && (
              <dl className="waiting-admin-info">
                {detailRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminWaitings