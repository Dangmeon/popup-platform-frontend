import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import ReservationCalendar from '../components/reservation/ReservationCalendar'
import TimeSlotSelector from '../components/reservation/TimeSlotSelector'
import PopqLogo from '../components/reservation/PopqLogo'
import './ReservationPage.css'

// 초기 인원 확인
function getInitialPeopleCount(value) {
  return Number.isSafeInteger(value) && value >= 1 ? value : 1
}

function ReservationPage({ onNext }) {
  const { popupId } = useParams()
  const location = useLocation()

  // 날짜 및 시간
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  // 예약 인원
  const [peopleCount, setPeopleCount] = useState(() =>
    getInitialPeopleCount(location.state?.peopleCount)
  )

  // 날짜 선택
  function handleDateSelect(date) {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  // 시간 선택
  function handleTimeSelect(time) {
    setSelectedTime(time)
  }

  // 예약 정보 전달
  function handleNext() {
    if (!selectedDate || !selectedTime) return

    onNext(selectedDate, selectedTime, {
      popupId,
      peopleCount,
    })
  }

  return (
    <main className="reservation-page">
      {/* 예약 페이지 상단 */}
      <div className="reservation-hero">
        <div className="reservation-brand">
          <PopqLogo />
          <span className="reservation-brand-tag">
            POP-UP EXPERIENCE
          </span>
        </div>

        <h1>설레는 팝업, 지금 예약하세요!</h1>
        <p>방문하고 싶은 날짜와 시간을 선택해 주세요.</p>
      </div>

      {/* 예약 진행 단계 */}
      <div className="reservation-steps">
        <div className="reservation-step active">
          <span>01</span>
          날짜 · 시간 선택
        </div>

        <span className="reservation-step-arrow">→</span>

        <div className="reservation-step">
          <span>02</span>
          예약 확인
        </div>

        <span className="reservation-step-arrow">→</span>

        <div className="reservation-step">
          <span>03</span>
          예약 완료
        </div>
      </div>

      {/* 달력 */}
      <ReservationCalendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* 시간 선택 */}
      <TimeSlotSelector
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onTimeSelect={handleTimeSelect}
      />

      {/* 예약 인원 */}
      <section className="reservation-summary">
        <div className="reservation-summary-header">
          <h3>예약 인원</h3>
        </div>

        <div className="reservation-summary-row">
          <label htmlFor="reservation-people-count">방문 인원</label>

          <select
            id="reservation-people-count"
            value={peopleCount}
            onChange={(event) =>
              setPeopleCount(Number(event.target.value))
            }
          >
            {/* 나중에 바꿀 부분: 서버의 예약 인원 제한으로 교체 */}
            {Array.from(
              { length: Math.max(10, peopleCount) },
              (_, index) => index + 1
            ).map((count) => (
              <option key={count} value={count}>
                {count}명
              </option>
            ))}
          </select>
        </div>

        <p>
          데모에서는 기본 1~10명을 선택할 수 있습니다.
          실제 예약 가능 인원은 서버 연동 시 확인합니다.
        </p>
      </section>

      {/* 예약 정보 */}
      {selectedDate && selectedTime && (
        <section className="reservation-summary">
          <div className="reservation-summary-header">
            <h3>선택한 예약 정보</h3>
            <span className="reservation-summary-badge">
              선택 완료
            </span>
          </div>

          <div className="reservation-summary-row">
            <span>예약 날짜</span>
            <strong>{selectedDate}</strong>
          </div>

          <div className="reservation-summary-row">
            <span>예약 시간</span>
            <strong>{selectedTime}</strong>
          </div>

          <div className="reservation-summary-row">
            <span>예약 인원</span>
            <strong>{peopleCount}명</strong>
          </div>

          <button
            type="button"
            className="reservation-next-button"
            onClick={handleNext}
          >
            예약 정보 확인하기 →
          </button>
        </section>
      )}
    </main>
  )
}

export default ReservationPage