import { useState } from 'react'
import './AdminReservations.css'

// 예약 상태
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

// 임시 예약 데이터
function createDemoReservations() {
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

function AdminReservations() {
  // 예약 데이터
  const [reservations, setReservations] = useState(createDemoReservations)

  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [status, setStatus] = useState('')

  // 상세 정보 및 안내
  const [selectedId, setSelectedId] = useState(null)
  const [notice, setNotice] = useState('')

  const normalizedKeyword = keyword.trim().toLowerCase()

  const filteredReservations = reservations.filter((reservation) => {
    const matchesKeyword =
      reservation.number.toLowerCase().includes(normalizedKeyword) ||
      reservation.memberName.toLowerCase().includes(normalizedKeyword)

    const matchesDate = !visitDate || reservation.visitDate === visitDate
    const matchesStatus = !status || reservation.status === status

    return matchesKeyword && matchesDate && matchesStatus
  })

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === selectedId
  )

  // 필터 초기화
  function handleReset() {
    setKeyword('')
    setVisitDate('')
    setStatus('')
  }

  // 방문 처리
  function handleVisit(reservationId) {
    const reservation = reservations.find(
      (item) => item.id === reservationId
    )

    if (!reservation || reservation.status !== 'CONFIRMED') return

    const today = formatDate(new Date())

    if (reservation.visitDate !== today) {
      setNotice('방문 처리는 예약된 방문 날짜에만 가능합니다.')
      return
    }

    const confirmed = window.confirm(
      `${reservation.number}\n${reservation.memberName}님의 방문을 완료 처리할까요?`
    )

    if (!confirmed) return

    setReservations((previous) =>
      previous.map((item) =>
        item.id === reservationId && item.status === 'CONFIRMED'
          ? { ...item, status: 'VISITED' }
          : item
      )
    )

    setNotice(`${reservation.number} 예약의 데모 방문 처리가 완료됐습니다.`)
  }

  return (
    <div className="admin-reservations">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>예약 관리</h2>
          <p>예약번호를 조회하고 방문 정보를 확인하세요.</p>
        </div>

        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 데모 안내 */}
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

      {/* 예약 목록 */}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <h3>예약 목록</h3>
          <span>
            검색 {filteredReservations.length}건 / 전체 {reservations.length}건
          </span>
        </div>

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
              {filteredReservations.map((reservation) => (
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
                      {reservationStatuses[reservation.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="reservation-admin-button"
                      aria-expanded={selectedId === reservation.id}
                      aria-controls="reservation-admin-detail"
                      aria-label={`${reservation.number} 상세 보기`}
                      onClick={() => {
                        setSelectedId(reservation.id)
                        setNotice('')
                      }}
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))}

              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="reservation-admin-empty">
                    검색 조건에 맞는 예약이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 예약 상세 */}
      <div id="reservation-admin-detail">
        {selectedReservation && (
          <section
            className="admin-panel reservation-admin-detail"
            aria-labelledby="reservation-admin-detail-title"
          >
            <div className="admin-panel-header">
              <h3 id="reservation-admin-detail-title">예약 상세</h3>
              <button
                type="button"
                className="reservation-admin-button"
                onClick={() => setSelectedId(null)}
              >
                닫기
              </button>
            </div>

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
                  {selectedReservation.visitDate} {selectedReservation.visitTime}
                </dd>
              </div>
              <div>
                <dt>예약 인원</dt>
                <dd>{selectedReservation.people}명</dd>
              </div>
              <div>
                <dt>예약 상태</dt>
                <dd>
                  {reservationStatuses[selectedReservation.status]}
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
                selectedReservation.status !== 'CONFIRMED' ||
                selectedReservation.visitDate !== formatDate(new Date())
              }
              onClick={() => handleVisit(selectedReservation.id)}
            >
              {selectedReservation.status === 'VISITED'
                ? '방문 처리 완료'
                : '방문 완료 처리'}
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminReservations