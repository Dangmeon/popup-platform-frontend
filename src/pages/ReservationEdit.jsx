import { useEffect, useRef, useState } from 'react'
import ReservationCalendar from '../components/reservation/ReservationCalendar'
import TimeSlotSelector from '../components/reservation/TimeSlotSelector'
import { getTimeSlots } from '../api/timeSlotApi'
import { getSlotUnavailableReason } from '../utils/reservationAvailability'
import './ReservationPage.css'
import './ReservationEdit.css'

// 요청 오류 안내
function getErrorMessage(error) {
  const message = error.response?.data?.message

  if (error.response?.status === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (!error.response && error.request) {
    return '서버 응답을 받지 못했습니다. 예약 상태를 다시 확인해 주세요.'
  }

  return error.message || '예약 정보를 처리하지 못했습니다.'
}

function ReservationEdit({
  reservation,
  busy = false,
  onSave,
  onBack,
}) {
  // 변경할 예약 정보
  const [selectedDate, setSelectedDate] = useState(reservation.date)
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState(
    reservation.timeSlotId
  )
  const [peopleCount, setPeopleCount] = useState(
    reservation.peopleCount
  )

  // 회차 조회
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  // 변경 요청
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const saveLock = useRef(false)
  const [now, setNow] = useState(Date.now)

  const isBusy = busy || saving
  const isConfirmed = reservation.reservationStatus === 'CONFIRMED'

  // 예약 가능 시각 갱신
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 팝업 회차 조회
  useEffect(() => {
    let active = true

    setLoading(true)
    setLoadError('')

    async function loadTimeSlots() {
      try {
        const items = await getTimeSlots({
          popId: reservation.popId,
        })

        if (!active) return

        setTimeSlots(items)
      } catch (error) {
        if (!active) return

        setTimeSlots([])
        setLoadError(getErrorMessage(error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTimeSlots()

    return () => {
      active = false
    }
  }, [reservation.popId, retryKey])

  // 기존 회차의 확보 인원 반영
  const selectableSlots = timeSlots.map((slot) => {
    if (
      isConfirmed &&
      slot.timeSlotId === reservation.timeSlotId &&
      Number.isSafeInteger(slot.remaining) &&
      slot.remaining >= 0
    ) {
      return {
        ...slot,
        remaining: slot.remaining + reservation.peopleCount,
      }
    }

    return slot
  })

  const selectedSlot = selectableSlots.find(
    (slot) =>
      slot.timeSlotId === selectedTimeSlotId &&
      slot.slotDate === selectedDate
  )

  const unavailableReason = getSlotUnavailableReason(
    selectedSlot,
    peopleCount,
    now
  )

  const unchanged =
    selectedTimeSlotId === reservation.timeSlotId &&
    peopleCount === reservation.peopleCount

  // 날짜 선택
  function handleDateSelect(date) {
    setSelectedDate(date)
    setSelectedTimeSlotId(null)
    setSaveError('')
  }

  // 회차 선택
  function handleTimeSelect(slot) {
    setSelectedTimeSlotId(slot.timeSlotId)
    setSaveError('')
  }

  // 예약 변경 요청
  async function handleSave() {
    if (
      isBusy ||
      saveLock.current ||
      loading ||
      loadError ||
      !isConfirmed ||
      unchanged ||
      typeof onSave !== 'function'
    ) {
      return
    }

    const reason = getSlotUnavailableReason(
      selectedSlot,
      peopleCount,
      Date.now()
    )

    if (reason) {
      setSaveError(reason)
      return
    }

    saveLock.current = true
    setSaving(true)
    setSaveError('')

    try {
      await onSave({
        timeSlotId: selectedSlot.timeSlotId,
        peopleCount,
      })
    } catch (error) {
      setSaveError(getErrorMessage(error))
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

  return (
    <main className="reservation-page pq-edit" aria-busy={isBusy}>
      {/* 페이지 상단 */}
      <div className="reservation-hero">
        <h1>예약 변경</h1>
        <p>변경할 날짜와 회차, 방문 인원을 선택해 주세요.</p>
      </div>

      {/* 기존 예약 */}
      <section className="reservation-summary">
        <div className="reservation-summary-header">
          <h3>현재 예약</h3>
          <span className="reservation-summary-badge">
            예약번호 {reservation.reservationId}
          </span>
        </div>

        {reservation.popupName && (
          <div className="reservation-summary-row">
            <span>팝업스토어</span>
            <strong>{reservation.popupName}</strong>
          </div>
        )}

        <div className="reservation-summary-row">
          <span>방문 일시</span>
          <strong>
            {reservation.date} {reservation.time}
          </strong>
        </div>

        <div className="reservation-summary-row">
          <span>방문 인원</span>
          <strong>{reservation.peopleCount}명</strong>
        </div>

        <p className="reservation-confirm-notice">
          예약을 변경하면 새 입장 QR이 발급돼요.
        </p>

        {!isConfirmed && (
          <p role="alert">
            확정된 예약만 변경할 수 있습니다.
            이전 화면에서 예약 상태를 다시 확인해 주세요.
          </p>
        )}
      </section>

      <div className="pq-edit-grid">
        <div className="pq-edit-selection">
        {/* 방문 인원 */}
        <section className="reservation-summary">
          <h3>변경할 방문 인원</h3>

          <div className="reservation-summary-row">
            <label htmlFor="edit-reservation-people">
              방문 인원
            </label>

            <select
              id="edit-reservation-people"
              value={peopleCount}
              disabled={isBusy || !isConfirmed}
              onChange={(event) => {
                setPeopleCount(Number(event.target.value))
                setSaveError('')
              }}
            >
              {[1, 2, 3].map((count) => (
                <option key={count} value={count}>
                  {count}명
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 회차 조회 오류 */}
        {loadError && (
          <section className="reservation-summary">
            <p role="alert">{loadError}</p>

            <button
              type="button"
              className="reservation-next-button pq-edit-secondary"
              disabled={isBusy || loading}
              onClick={() => setRetryKey((previous) => previous + 1)}
            >
              회차 다시 불러오기
            </button>
          </section>
        )}

        {/* 날짜 선택 */}
        <ReservationCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          timeSlots={selectableSlots}
          peopleCount={peopleCount}
          now={now}
          loading={loading}
          disabled={isBusy || Boolean(loadError) || !isConfirmed}
        />

        {/* 회차 선택 */}
        <TimeSlotSelector
          selectedDate={selectedDate}
          selectedTimeSlotId={selectedTimeSlotId}
          onTimeSelect={handleTimeSelect}
          timeSlots={selectableSlots}
          peopleCount={peopleCount}
          now={now}
          loading={loading}
          disabled={isBusy || Boolean(loadError) || !isConfirmed}
        />

        </div>
        {/* 변경 정보 */}
        <section className="reservation-summary">
          <h3>변경할 예약 정보</h3>

          <div className="reservation-summary-row">
            <span>방문 날짜</span>
            <strong>{selectedDate || '날짜를 선택해 주세요.'}</strong>
          </div>

          <div className="reservation-summary-row">
            <span>방문 시간</span>
            <strong>
              {selectedSlot
                ? `${selectedSlot.startTime} ~ ${selectedSlot.endTime}`
                : '회차를 선택해 주세요.'}
            </strong>
          </div>

          <div className="reservation-summary-row">
            <span>방문 인원</span>
            <strong>{peopleCount}명</strong>
          </div>

          {saveError && (
            <p className="reservation-confirm-notice" role="alert">
              {saveError}
            </p>
          )}

          {!loading && selectedSlot && unavailableReason && (
            <p role="status">{unavailableReason}</p>
          )}

          {unchanged && (
            <p>현재 예약과 다른 회차 또는 인원을 선택해 주세요.</p>
          )}

          <button
            type="button"
            className="reservation-next-button"
            disabled={
              isBusy ||
              loading ||
              Boolean(loadError) ||
              !isConfirmed ||
              unchanged ||
              Boolean(unavailableReason) ||
              typeof onSave !== 'function'
            }
            onClick={handleSave}
          >
            {isBusy ? '변경 처리 중…' : '선택한 정보로 변경하기'}
          </button>

          <button
            type="button"
            className="reservation-next-button pq-edit-secondary"
            disabled={isBusy || typeof onBack !== 'function'}
            onClick={onBack}
          >
            변경하지 않고 돌아가기
          </button>
        </section>
      </div>
    </main>
  )
}

export default ReservationEdit