import { useState } from 'react'
import { getSlotUnavailableReason } from '../../utils/reservationAvailability'
import './ReservationCalendar.css'

// 한국 기준 현재 월
function getCurrentMonthIndex() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())

  const year = Number(
    parts.find((part) => part.type === 'year').value
  )
  const month = Number(
    parts.find((part) => part.type === 'month').value
  )

  return year * 12 + month - 1
}

// 날짜 문자열
function createDateString(year, month, day) {
  return [
    String(year).padStart(4, '0'),
    String(month + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function ReservationCalendar({
  selectedDate,
  onDateSelect,
  timeSlots = [],
  peopleCount = 1,
  now = Date.now(),
  loading = false,
  disabled = false,
}) {
  // 표시할 월
  const [monthIndex, setMonthIndex] = useState(
    getCurrentMonthIndex
  )

  // 서버에 등록된 날짜
  const registeredDates = [
    ...new Set(
      timeSlots
        .map((slot) => slot.slotDate)
        .filter(
          (date) =>
            typeof date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(date)
        )
    ),
  ].sort()

  const registeredMonths = registeredDates.map((date) => {
    const [year, month] = date.split('-').map(Number)
    return year * 12 + month - 1
  })

  const minMonth =
    registeredMonths.length > 0
      ? Math.min(...registeredMonths)
      : monthIndex

  const maxMonth =
    registeredMonths.length > 0
      ? Math.max(...registeredMonths)
      : monthIndex

  // 등록된 회차 범위 안에서 표시
  const visibleMonth = Math.min(
    Math.max(monthIndex, minMonth),
    maxMonth
  )

  const year = Math.floor(visibleMonth / 12)
  const month = visibleMonth % 12

  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()

  const dates = Array.from(
    { length: firstDay + lastDate },
    (_, index) => (
      index < firstDay ? null : index - firstDay + 1
    )
  )

  // 월 이동
  function moveMonth(amount) {
    setMonthIndex(visibleMonth + amount)
  }

  return (
    <div className="reservation-calendar" aria-busy={loading}>
      {/* 달력 헤더 */}
      <div className="calendar-header">
        <h3>예약 날짜 선택</h3>

        <div className="calendar-navigation">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            disabled={
              disabled ||
              loading ||
              registeredDates.length === 0 ||
              visibleMonth <= minMonth
            }
            aria-label="이전 달"
          >
            ‹
          </button>

          <span aria-live="polite">
            {year}년 {month + 1}월
          </span>

          <button
            type="button"
            onClick={() => moveMonth(1)}
            disabled={
              disabled ||
              loading ||
              registeredDates.length === 0 ||
              visibleMonth >= maxMonth
            }
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
      </div>

      {/* 조회 상태 */}
      {loading ? (
        <p className="calendar-notice" role="status">
          예약 가능한 날짜를 불러오는 중입니다.
        </p>
      ) : registeredDates.length === 0 ? (
        <p className="calendar-notice" role="status">
          표시할 회차가 없습니다. 로그인과 회차 조회 상태를 확인해 주세요.
        </p>
      ) : (
        <>
          {/* 달력 */}
          <div className="calendar-grid">
            {['일', '월', '화', '수', '목', '금', '토'].map(
              (weekday) => (
                <div className="calendar-weekday" key={weekday}>
                  {weekday}
                </div>
              )
            )}

            {dates.map((day, index) => {
              if (day === null) {
                return (
                  <div key={`empty-${index}`} aria-hidden="true" />
                )
              }

              const dateString = createDateString(year, month, day)

              const dateSlots = timeSlots.filter(
                (slot) => slot.slotDate === dateString
              )

              const available = dateSlots.some(
                (slot) =>
                  getSlotUnavailableReason(
                    slot,
                    peopleCount,
                    now
                  ) === ''
              )

              const selected = selectedDate === dateString

              const unavailableReason =
                dateSlots.length === 0
                  ? '등록된 회차 없음'
                  : getSlotUnavailableReason(
                      dateSlots[0],
                      peopleCount,
                      now
                    )

              return (
                <button
                  type="button"
                  key={dateString}
                  disabled={disabled || !available}
                  aria-pressed={selected}
                  aria-label={`${year}년 ${month + 1}월 ${day}일, ${
                    available ? '예약 가능' : unavailableReason
                  }`}
                  title={
                    available
                      ? `선택 인원 ${peopleCount}명 예약 가능`
                      : unavailableReason
                  }
                  className={`calendar-day ${
                    selected ? 'selected' : ''
                  } ${available ? '' : 'unavailable'}`}
                  onClick={() => onDateSelect(dateString)}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* 예약 안내 */}
          <p className="calendar-notice">
            서버의 예약 오픈·마감 시각과 잔여석을 기준으로 표시합니다.
            선택한 인원이 예약 가능한 날짜만 선택할 수 있습니다.
          </p>
        </>
      )}
    </div>
  )
}

export default ReservationCalendar