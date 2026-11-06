import { useState } from 'react'
import './AdminSaleDatePicker.css'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const hours = Array.from(
  { length: 24 },
  (_, index) => String(index).padStart(2, '0')
)

const minutes = Array.from(
  { length: 60 },
  (_, index) => String(index).padStart(2, '0')
)

// 한국 날짜
function getToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const getPart = (type) =>
    parts.find((part) => part.type === type).value

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
}

// 날짜 문자열
function createDateValue(year, month, day) {
  return [
    String(year).padStart(4, '0'),
    String(month + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function AdminSaleDatePicker({
  label,
  date,
  hour,
  minute,
  onDateChange,
  onHourChange,
  onMinuteChange,
  disabled = false,
}) {
  const today = getToday()

  // 표시할 달
  const [displayMonth, setDisplayMonth] = useState(() => {
    const initial = date || today
    const [year, month] = initial.split('-').map(Number)

    return { year, month: month - 1 }
  })

  const { year, month } = displayMonth
  const firstWeekday = new Date(year, month, 1).getDay()
  const lastDay = new Date(year, month + 1, 0).getDate()

  // 달 이동
  function moveMonth(amount) {
    setDisplayMonth((previous) => {
      const next = new Date(
        previous.year,
        previous.month + amount,
        1
      )

      return {
        year: next.getFullYear(),
        month: next.getMonth(),
      }
    })
  }

  // 오늘 선택
  function handleToday() {
    const [todayYear, todayMonth] = today.split('-').map(Number)

    setDisplayMonth({
      year: todayYear,
      month: todayMonth - 1,
    })

    onDateChange(today)
  }

  return (
    <fieldset
      className="admin-sale-picker"
      disabled={disabled}
    >
      <legend>{label}</legend>

      {/* 선택 정보 */}
      <div className="admin-sale-picker-summary" aria-live="polite">
        <strong>{date ? date.replaceAll('-', '.') : '날짜를 선택하세요'}</strong>
        <span>{hour}:{minute} · 한국 시간</span>
      </div>

      {/* 달 이동 */}
      <div className="admin-sale-picker-header">
        <button
          type="button"
          className="admin-sale-picker-arrow"
          aria-label={`${label} 이전 달`}
          onClick={() => moveMonth(-1)}
        >
          ‹
        </button>

        <strong aria-live="polite">
          {year}년 {month + 1}월
        </strong>

        <button
          type="button"
          className="admin-sale-picker-arrow"
          aria-label={`${label} 다음 달`}
          onClick={() => moveMonth(1)}
        >
          ›
        </button>
      </div>

      {/* 요일 */}
      <div className="admin-sale-picker-weekdays" aria-hidden="true">
        {weekdays.map((weekday, index) => (
          <span
            key={weekday}
            className={
              index === 0
                ? 'sunday'
                : index === 6
                  ? 'saturday'
                  : ''
            }
          >
            {weekday}
          </span>
        ))}
      </div>

      {/* 날짜 선택 */}
      <div
        className="admin-sale-picker-days"
        role="group"
        aria-label={`${label} ${year}년 ${month + 1}월 날짜 선택`}
      >
        {Array.from({ length: 42 }, (_, index) => {
          const day = index - firstWeekday + 1

          if (day < 1 || day > lastDay) {
            return (
              <span
                key={`empty-${index}`}
                className="admin-sale-picker-empty"
                aria-hidden="true"
              />
            )
          }

          const value = createDateValue(year, month, day)
          const selected = value === date
          const isToday = value === today
          const weekday = index % 7

          const className = [
            'admin-sale-picker-day',
            selected ? 'selected' : '',
            isToday ? 'today' : '',
            weekday === 0 ? 'sunday' : '',
            weekday === 6 ? 'saturday' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={value}
              type="button"
              className={className}
              aria-label={`${year}년 ${month + 1}월 ${day}일`}
              aria-pressed={selected}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onDateChange(value)}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* 달력 안내 */}
      <div className="admin-sale-picker-footer">
        <span>테두리: 오늘 · 코랄 배경: 선택일</span>

        <button
          type="button"
          className="admin-sale-picker-today"
          onClick={handleToday}
        >
          오늘 선택
        </button>
      </div>

      {/* 시간 선택 */}
      <div className="admin-sale-picker-time">
        <label>
          시
          <select
            value={hour}
            onChange={(event) => onHourChange(event.target.value)}
          >
            {hours.map((value) => (
              <option key={value} value={value}>
                {value}시
              </option>
            ))}
          </select>
        </label>

        <span className="admin-sale-picker-colon" aria-hidden="true">
          :
        </span>

        <label>
          분
          <select
            value={minute}
            onChange={(event) => onMinuteChange(event.target.value)}
          >
            {minutes.map((value) => (
              <option key={value} value={value}>
                {value}분
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  )
}

export default AdminSaleDatePicker