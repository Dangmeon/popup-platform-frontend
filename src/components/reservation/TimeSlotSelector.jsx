import { getSlotUnavailableReason } from '../../utils/reservationAvailability'
import './TimeSlotSelector.css'

function TimeSlotSelector({
  selectedDate,
  selectedTimeSlotId,
  onTimeSelect,
  timeSlots = [],
  peopleCount = 1,
  now = Date.now(),
  loading = false,
  disabled = false,
}) {
  // 선택 날짜의 회차
  const dateSlots = timeSlots
    .filter((slot) => slot.slotDate === selectedDate)
    .sort((first, second) =>
      first.startTime.localeCompare(second.startTime)
    )

  return (
    <div className="time-slot-selector" aria-busy={loading}>
      <h3>예약 시간 선택</h3>

      {loading ? (
        <p className="time-slot-notice" role="status">
          예약 회차를 불러오는 중입니다.
        </p>
      ) : !selectedDate ? (
        <p className="time-slot-notice">
          먼저 예약 날짜를 선택해 주세요.
        </p>
      ) : dateSlots.length === 0 ? (
        <p className="time-slot-notice" role="status">
          선택한 날짜에 등록된 회차가 없습니다.
        </p>
      ) : (
        <div className="time-slot-grid">
          {dateSlots.map((slot) => {
            const unavailableReason = getSlotUnavailableReason(
              slot,
              peopleCount,
              now
            )

            const selected =
              selectedTimeSlotId === slot.timeSlotId

            return (
              <button
                type="button"
                key={slot.timeSlotId}
                disabled={disabled || Boolean(unavailableReason)}
                aria-pressed={selected}
                className={`time-slot ${
                  selected ? 'selected' : ''
                }`}
                onClick={() => onTimeSelect(slot)}
              >
                <span className="time-slot-time">
                  {slot.startTime} ~ {slot.endTime}
                </span>

                <span className="time-slot-remaining">
                  {unavailableReason ||
                    `잔여 ${slot.remaining}명`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimeSlotSelector