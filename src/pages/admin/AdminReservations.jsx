import { useEffect, useState } from 'react'
import {
  getReservations,
  getReservation,
  visitReservation,
} from '../../api/admin/reservationApi'
import './AdminReservations.css'

// 나중에 확인할 부분: 백엔드 예약 상태값과 일치시키기
const reservationStatuses = {
  CONFIRMED: '예약 확정',
  VISITED: '방문 완료',
  CANCELLED: '예약 취소',
}

// 날짜 표시
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function AdminReservations() {
  // 예약 목록
  const [reservations, setReservations] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [status, setStatus] = useState('')

  // 예약 상세
  const [selectedId, setSelectedId] = useState(null)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // 방문 처리 및 재조회
  const [visitLoading, setVisitLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [visitError, setVisitError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)

  // 예약 목록 조회
  useEffect(() => {
    let active = true

    async function loadReservations() {
      setListLoading(true)
      setListError('')

      try {
        const response = await getReservations({
          keyword,
          visitDate,
          status,
        })

        if (!active) return

        setReservations(response.items)
        setTotal(response.total)
        setTotalAll(response.totalAll)
      } catch (error) {
        if (!active) return

        setReservations([])
        setTotal(0)
        setTotalAll(0)
        setListError(
          error.message || '예약 목록을 불러오지 못했습니다.'
        )
      } finally {
        if (active) setListLoading(false)
      }
    }

    loadReservations()

    return () => {
      active = false
    }
  }, [keyword, visitDate, status, refreshKey])

  // 예약 상세 조회
  useEffect(() => {
    let active = true

    async function loadReservation() {
      setSelectedReservation(null)
      setDetailError('')

      if (selectedId === null) {
        setDetailLoading(false)
        return
      }

      setDetailLoading(true)

      try {
        const response = await getReservation(selectedId)

        if (active) setSelectedReservation(response)
      } catch (error) {
        if (active) {
          setDetailError(
            error.message || '예약 상세 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    }

    loadReservation()

    return () => {
      active = false
    }
  }, [selectedId, refreshKey, detailRetryKey])

  // 필터 초기화
  function handleReset() {
    setKeyword('')
    setVisitDate('')
    setStatus('')
  }

  // 상세 정보 열기
  function handleOpenDetail(id) {
    if (visitLoading) return

    setNotice('')
    setVisitError('')
    setSelectedId(id)
  }

  // 상세 정보 닫기
  function handleCloseDetail() {
    if (visitLoading) return

    setSelectedId(null)
    setNotice('')
    setVisitError('')
  }

  // 방문 처리
  async function handleVisit() {
    if (
      visitLoading ||
      !selectedReservation ||
      selectedReservation.status !== 'CONFIRMED'
    ) {
      return
    }

    setNotice('')
    setVisitError('')

    // 나중에 확인할 부분: 방문 가능 날짜와 시간은 서버 정책을 기준으로 검증
    if (selectedReservation.visitDate !== formatDate(new Date())) {
      setVisitError('방문 처리는 예약된 방문 날짜에만 가능합니다.')
      return
    }

    const confirmed = window.confirm(
      `${selectedReservation.number}\n${selectedReservation.memberName}님의 방문을 완료 처리할까요?`
    )

    if (!confirmed) return

    setVisitLoading(true)

    try {
      const updatedReservation = await visitReservation(
        selectedReservation.id
      )

      setSelectedReservation(updatedReservation)
      setNotice(
        `${updatedReservation.number} 예약의 방문 처리가 완료됐습니다.`
      )

      // 목록과 상세 정보 갱신
      setRefreshKey((previous) => previous + 1)
    } catch (error) {
      setVisitError(
        error.message ||
          '방문 처리 결과를 확인하지 못했습니다. 상세 정보를 다시 조회해 주세요.'
      )

      // 처리 결과 재확인
      setRefreshKey((previous) => previous + 1)
    } finally {
      setVisitLoading(false)
    }
  }

  return (
    <div className="admin-reservations">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>예약 관리</h2>
          <p>예약번호를 조회하고 방문 정보를 확인하세요.</p>
        </div>

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}
      <p className="reservation-admin-demo">
        임시 데이터로 동작합니다. 방문 처리 결과는 서버에 저장되지 않으며,
        새로고침하면 초기화됩니다.
      </p>

      {/* 검색 및 필터 */}
      <section className="admin-panel" aria-label="예약 검색">
        <div className="reservation-admin-filters">
          <label>
            예약번호 / 예약자
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="예: DEMO-000001 또는 김팝큐"
            />
          </label>

          <label>
            방문 날짜
            <input
              type="date"
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
            />
          </label>

          <label>
            예약 상태
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(reservationStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="reservation-admin-button"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>
      </section>

      {/* 처리 결과 */}
      <p className="reservation-admin-notice" role="status">
        {notice}
      </p>

      {visitError && (
        <p className="reservation-admin-notice" role="alert">
          {visitError}
        </p>
      )}

      {/* 예약 목록 */}
      <section className="admin-panel" aria-busy={listLoading}>
        <div className="admin-panel-header">
          <h3>예약 목록</h3>
          {!listLoading && !listError && (
            <span>
              검색 {total}건 / 전체 {totalAll}건
            </span>
          )}
        </div>

        {listLoading && (
          <p role="status">예약 목록을 불러오는 중입니다.</p>
        )}

        {listError && (
          <div>
            <p role="alert">{listError}</p>
            <button
              type="button"
              className="reservation-admin-button"
              onClick={() => setRefreshKey((previous) => previous + 1)}
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!listLoading && !listError && (
          <div className="admin-table-wrapper">
            <table className="admin-table reservation-admin-table">
              <caption className="reservation-admin-sr-only">
                예약 검색 결과
              </caption>

              <thead>
                <tr>
                  <th scope="col">예약번호</th>
                  <th scope="col">팝업명</th>
                  <th scope="col">예약자</th>
                  <th scope="col">방문 날짜·시간</th>
                  <th scope="col">인원</th>
                  <th scope="col">상태</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>

              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.number}</td>
                    <td>{reservation.popupName}</td>
                    <td>{reservation.memberName}</td>
                    <td>
                      {reservation.visitDate}
                      <br />
                      {reservation.visitTime}
                    </td>
                    <td>{reservation.people}명</td>
                    <td>
                      <span
                        className={`reservation-admin-status ${reservation.status.toLowerCase()}`}
                      >
                        {reservationStatuses[reservation.status] ||
                          reservation.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="reservation-admin-button"
                        disabled={visitLoading}
                        aria-expanded={selectedId === reservation.id}
                        aria-controls="reservation-admin-detail"
                        aria-label={`${reservation.number} 상세 보기`}
                        onClick={() => handleOpenDetail(reservation.id)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}

                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="reservation-admin-empty">
                      검색 조건에 맞는 예약이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 예약 상세 */}
      <div id="reservation-admin-detail">
        {selectedId !== null && (
          <section
            className="admin-panel reservation-admin-detail"
            aria-labelledby="reservation-admin-detail-title"
            aria-busy={detailLoading}
          >
            <div className="admin-panel-header">
              <h3 id="reservation-admin-detail-title">예약 상세</h3>
              <button
                type="button"
                className="reservation-admin-button"
                disabled={visitLoading}
                onClick={handleCloseDetail}
              >
                닫기
              </button>
            </div>

            {detailLoading && (
              <p role="status">예약 정보를 불러오는 중입니다.</p>
            )}

            {detailError && (
              <div>
                <p role="alert">{detailError}</p>
                <button
                  type="button"
                  className="reservation-admin-button"
                  onClick={() =>
                    setDetailRetryKey((previous) => previous + 1)
                  }
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!detailLoading && !detailError && selectedReservation && (
              <>
                <dl className="reservation-admin-info">
                  <div>
                    <dt>예약번호</dt>
                    <dd>{selectedReservation.number}</dd>
                  </div>
                  <div>
                    <dt>팝업명</dt>
                    <dd>{selectedReservation.popupName}</dd>
                  </div>
                  <div>
                    <dt>예약자</dt>
                    <dd>{selectedReservation.memberName}</dd>
                  </div>
                  <div>
                    <dt>방문 날짜·시간</dt>
                    <dd>
                      {selectedReservation.visitDate}{' '}
                      {selectedReservation.visitTime}
                    </dd>
                  </div>
                  <div>
                    <dt>예약 인원</dt>
                    <dd>{selectedReservation.people}명</dd>
                  </div>
                  <div>
                    <dt>예약 상태</dt>
                    <dd>
                      {reservationStatuses[selectedReservation.status] ||
                        selectedReservation.status}
                    </dd>
                  </div>
                </dl>

                <p className="reservation-admin-help">
                  직원이 예약번호와 방문 정보를 확인한 뒤 방문 처리해 주세요.
                  데모에서는 방문 당일의 확정 예약만 처리할 수 있습니다.
                </p>

                <button
                  type="button"
                  className="reservation-admin-button primary"
                  disabled={
                    visitLoading ||
                    selectedReservation.status !== 'CONFIRMED' ||
                    selectedReservation.visitDate !== formatDate(new Date())
                  }
                  onClick={handleVisit}
                >
                  {visitLoading
                    ? '방문 처리 중…'
                    : selectedReservation.status === 'VISITED'
                      ? '방문 처리 완료'
                      : '방문 완료 처리'}
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminReservations