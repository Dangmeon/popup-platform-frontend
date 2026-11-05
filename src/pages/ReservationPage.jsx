import { useEffect, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useParams,
} from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { getTimeSlots } from '../api/timeSlotApi'
import { getSlotUnavailableReason } from '../utils/reservationAvailability'
import ReservationCalendar from '../components/reservation/ReservationCalendar'
import TimeSlotSelector from '../components/reservation/TimeSlotSelector'
import PopqLogo from '../components/reservation/PopqLogo'
import './ReservationPage.css'

const REFRESH_INTERVAL = 5000

// 초기 인원 확인
function getInitialPeopleCount(value) {
  return Number.isSafeInteger(value) && value >= 1 && value <= 3
    ? value
    : 1
}

// 요청 오류 안내
function getRequestError(error) {
  const status = error.response?.status
  const message = error.response?.data?.message

  if (status === 401) {
    return '인증이 필요합니다. 다시 로그인해 주세요.'
  }

  if (status === 403) {
    return '요청이 거부됐습니다. 로그인 상태와 서버 권한을 확인해 주세요.'
  }

  if (typeof message === 'string' && message) {
    return message
  }

  if (error.request && !error.response) {
    return '서버 응답을 확인하지 못했습니다. 연결 상태를 확인해 주세요.'
  }

  return error.message || '요청을 처리하지 못했습니다.'
}

// 마지막 조회 시각
function formatCheckedTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function ReservationPage({ onCreateHold }) {
  const { popupId } = useParams()
  const location = useLocation()
  const app = useApp()

  const popId = Number(popupId)
  const validPopupId =
    /^\d+$/.test(popupId || '') &&
    Number.isSafeInteger(popId) &&
    popId > 0

  const scope = `${app.currentUser?.username || ''}:${popupId}`
  const initialPeopleCount = getInitialPeopleCount(
    location.state?.peopleCount
  )

  // 예약 인원
  const [peopleSelection, setPeopleSelection] = useState({
    scope,
    value: initialPeopleCount,
  })

  const peopleCount =
    peopleSelection.scope === scope
      ? peopleSelection.value
      : initialPeopleCount

  // 선택 정보
  const [selection, setSelection] = useState({
    scope,
    date: null,
    timeSlotId: null,
  })

  const selectedDate =
    selection.scope === scope ? selection.date : null

  const selectedTimeSlotId =
    selection.scope === scope ? selection.timeSlotId : null

  // 회차 조회
  const [slotState, setSlotState] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  // 선택 변경 안내
  const [selectionNotice, setSelectionNotice] = useState({
    scope,
    message: '',
  })

  // 예약 요청
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const submitLock = useRef(false)

  // 화면 시간 갱신
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 서버 회차 자동 조회
  useEffect(() => {
    if (!app.isAuthenticated || !validPopupId) return

    let active = true
    let inFlight = false
    let stopped = false
    let timer = null

    function clearTimer() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    }

    function scheduleNext() {
      clearTimer()

      if (
        !active ||
        stopped ||
        document.visibilityState === 'hidden'
      ) {
        return
      }

      timer = setTimeout(loadTimeSlots, REFRESH_INTERVAL)
    }

    async function loadTimeSlots() {
      if (
        !active ||
        stopped ||
        inFlight ||
        document.visibilityState === 'hidden'
      ) {
        return
      }

      clearTimer()

      if (submitLock.current) {
        scheduleNext()
        return
      }

      inFlight = true

      setSlotState((previous) => {
        const existing =
          previous?.scope === scope ? previous : null

        return {
          scope,
          ready: existing?.ready ?? false,
          loading: !existing?.ready,
          refreshing: true,
          items: existing?.items ?? [],
          error: existing?.error ?? '',
          updatedAt: existing?.updatedAt ?? null,
        }
      })

      try {
        const items = await getTimeSlots({ popId })

        if (!active || submitLock.current) return

        setSlotState({
          scope,
          ready: true,
          loading: false,
          refreshing: false,
          items,
          error: '',
          updatedAt: Date.now(),
        })
      } catch (error) {
        if (!active || submitLock.current) return

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          stopped = true
        }

        setSlotState((previous) => {
          const existing =
            previous?.scope === scope ? previous : null

          return {
            scope,
            ready: existing?.ready ?? false,
            loading: false,
            refreshing: false,
            items: existing?.items ?? [],
            error: getRequestError(error),
            updatedAt: existing?.updatedAt ?? null,
          }
        })
      } finally {
        inFlight = false

        if (active) {
          setSlotState((previous) =>
            previous?.scope === scope
              ? { ...previous, refreshing: false }
              : previous
          )

          scheduleNext()
        }
      }
    }

    // 화면 복귀 시 갱신
    function handleVisibilityChange() {
      clearTimer()

      if (document.visibilityState !== 'hidden') {
        loadTimeSlots()
      }
    }

    function handleFocus() {
      loadTimeSlots()
    }

    loadTimeSlots()

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )
    window.addEventListener('focus', handleFocus)

    return () => {
      active = false
      clearTimer()

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
      window.removeEventListener('focus', handleFocus)
    }
  }, [
    app.isAuthenticated,
    validPopupId,
    popId,
    scope,
    retryKey,
  ])

  const currentSlotState =
    slotState?.scope === scope ? slotState : null

  const timeSlots = currentSlotState?.items ?? []
  const loading =
    !currentSlotState || currentSlotState.loading
  const refreshing = currentSlotState?.refreshing ?? false
  const loadError = currentSlotState?.error || ''

  const selectedSlot = timeSlots.find(
    (slot) =>
      slot.timeSlotId === selectedTimeSlotId &&
      slot.slotDate === selectedDate
  )

  const unavailableReason = selectedSlot
    ? getSlotUnavailableReason(selectedSlot, peopleCount, now)
    : ''

  const canShowSelection =
    app.isAuthenticated &&
    validPopupId &&
    currentSlotState?.ready &&
    !loading &&
    !loadError

  const notice =
    selectionNotice.scope === scope
      ? selectionNotice.message
      : ''

  // 마감된 선택 해제
  useEffect(() => {
    if (
      !canShowSelection ||
      selectedTimeSlotId === null ||
      submitting
    ) {
      return
    }

    const reason = selectedSlot
      ? unavailableReason
      : '선택한 회차가 더 이상 제공되지 않습니다.'

    if (!reason) return

    setSelection((previous) => {
      if (
        previous.scope !== scope ||
        previous.timeSlotId !== selectedTimeSlotId
      ) {
        return previous
      }

      return {
        ...previous,
        timeSlotId: null,
      }
    })

    setSelectionNotice({
      scope,
      message: `${reason} 다른 회차를 선택해 주세요.`,
    })
  }, [
    canShowSelection,
    selectedTimeSlotId,
    selectedSlot,
    unavailableReason,
    submitting,
    scope,
  ])

  // 날짜 선택
  function handleDateSelect(date) {
    setSelection({
      scope,
      date,
      timeSlotId: null,
    })

    setSelectionNotice({ scope, message: '' })
    setSubmitError('')
  }

  // 시간 선택
  function handleTimeSelect(slot) {
    if (loading || loadError || submitting) return

    const reason = getSlotUnavailableReason(
      slot,
      peopleCount,
      Date.now()
    )

    if (reason) {
      setSelectionNotice({ scope, message: reason })
      return
    }

    setSelection({
      scope,
      date: slot.slotDate,
      timeSlotId: slot.timeSlotId,
    })

    setSelectionNotice({ scope, message: '' })
    setSubmitError('')
  }

  // 인원 변경
  function handlePeopleChange(event) {
    setPeopleSelection({
      scope,
      value: Number(event.target.value),
    })

    setSelection({
      scope,
      date: selectedDate,
      timeSlotId: null,
    })

    setSelectionNotice({ scope, message: '' })
    setSubmitError('')
  }

  // 회차 다시 조회
  function handleReload() {
    if (submitting || refreshing) return

    setSubmitError('')
    setRetryKey((previous) => previous + 1)
  }

  // HOLD 생성 요청
  async function handleNext() {
    if (
      submitLock.current ||
      !canShowSelection ||
      refreshing ||
      !selectedSlot ||
      typeof onCreateHold !== 'function'
    ) {
      return
    }

    const reason = getSlotUnavailableReason(
      selectedSlot,
      peopleCount,
      Date.now()
    )

    if (reason) {
      setSelectionNotice({
        scope,
        message: `${reason} 다른 회차를 선택해 주세요.`,
      })
      return
    }

    submitLock.current = true
    setSubmitting(true)
    setSubmitError('')

    try {
      await onCreateHold({
        popId,
        timeSlotId: selectedSlot.timeSlotId,
        peopleCount,
        slotDate: selectedSlot.slotDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      })
    } catch (error) {
      setSubmitError(getRequestError(error))
      setRetryKey((previous) => previous + 1)
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
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
        <p>방문할 날짜와 회차, 인원을 선택해 주세요.</p>
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

      {/* 로그인 안내 */}
      {!app.isAuthenticated && (
        <section className="reservation-summary">
          <h3>로그인이 필요합니다</h3>
          <p>예약 회차 조회는 서버 로그인 후 이용할 수 있습니다.</p>
          <Link to="/login">로그인 화면으로 이동</Link>
        </section>
      )}

      {/* 팝업 연결 안내 */}
      {app.isAuthenticated && !validPopupId && (
        <section className="reservation-summary">
          <h3>서버 팝업 연결이 필요합니다</h3>
          <p>
            현재 팝업은 서버의 숫자 팝업 ID와 연결되지 않았습니다.
            실제 팝업 조회 API 연결 후 예약할 수 있습니다.
          </p>
          <Link to="/popups">팝업 목록으로 이동</Link>
        </section>
      )}

      {app.isAuthenticated && validPopupId && (
        <>
          {/* 예약 인원 */}
          <section className="reservation-summary">
            <div className="reservation-summary-header">
              <h3>예약 인원</h3>
            </div>

            <div className="reservation-summary-row">
              <label htmlFor="reservation-people-count">
                방문 인원
              </label>

              <select
                id="reservation-people-count"
                value={peopleCount}
                onChange={handlePeopleChange}
                disabled={submitting}
              >
                {[1, 2, 3].map((count) => (
                  <option key={count} value={count}>
                    {count}명
                  </option>
                ))}
              </select>
            </div>

            <p>예약은 1~3명까지 가능합니다.</p>
          </section>

          {/* 회차 갱신 안내 */}
          <section className="reservation-summary">
            <div className="reservation-summary-header">
              <h3>회차 현황</h3>
            </div>

            <p>
              화면을 보고 있는 동안 회차 현황이 약 5초 간격으로
              자동 갱신됩니다.
            </p>

            <p className="card-sub">
              {loading
                ? '회차를 불러오는 중입니다.'
                : refreshing
                  ? '최신 잔여석을 확인하고 있습니다.'
                  : `마지막 확인: ${formatCheckedTime(
                      currentSlotState?.updatedAt
                    )}`}
            </p>

            {loadError && (
              <p role="alert">
                {loadError} 최신 정보를 확인하기 전에는 예약할 수
                없습니다.
              </p>
            )}

            <button
              type="button"
              className="reservation-next-button"
              onClick={handleReload}
              disabled={submitting || refreshing}
            >
              {refreshing ? '확인 중…' : '회차 다시 불러오기'}
            </button>
          </section>

          {/* 선택 변경 안내 */}
          {notice && (
            <p className="reservation-confirm-notice" role="status">
              {notice}
            </p>
          )}

          {/* 날짜 및 시간 */}
          <ReservationCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            timeSlots={timeSlots}
            peopleCount={peopleCount}
            now={now}
            loading={loading}
            disabled={submitting || Boolean(loadError)}
          />

          <TimeSlotSelector
            selectedDate={selectedDate}
            selectedTimeSlotId={selectedTimeSlotId}
            onTimeSelect={handleTimeSelect}
            timeSlots={timeSlots}
            peopleCount={peopleCount}
            now={now}
            loading={loading}
            disabled={submitting || Boolean(loadError)}
          />

          {/* 요청 오류 */}
          {submitError && (
            <p className="reservation-confirm-notice" role="alert">
              {submitError}
            </p>
          )}

          {/* 선택 정보 */}
          {canShowSelection && selectedSlot && (
            <section className="reservation-summary">
              <div className="reservation-summary-header">
                <h3>선택한 예약 정보</h3>
                <span className="reservation-summary-badge">
                  {unavailableReason ? '재선택 필요' : '선택 완료'}
                </span>
              </div>

              <div className="reservation-summary-row">
                <span>예약 날짜</span>
                <strong>{selectedSlot.slotDate}</strong>
              </div>

              <div className="reservation-summary-row">
                <span>예약 시간</span>
                <strong>
                  {selectedSlot.startTime} ~ {selectedSlot.endTime}
                </strong>
              </div>

              <div className="reservation-summary-row">
                <span>예약 인원</span>
                <strong>{peopleCount}명</strong>
              </div>

              <p>
                다음 버튼을 누르면 임시 예약이 생성됩니다.
                이후 확인 화면에서 최종 확정해야 합니다.
              </p>

              {unavailableReason && (
                <p role="status">{unavailableReason}</p>
              )}

              <button
                type="button"
                className="reservation-next-button"
                disabled={
                  submitting ||
                  refreshing ||
                  Boolean(unavailableReason) ||
                  typeof onCreateHold !== 'function'
                }
                onClick={handleNext}
              >
                {submitting
                  ? '임시 예약 요청 중…'
                  : refreshing
                    ? '잔여석 확인 중…'
                    : typeof onCreateHold !== 'function'
                      ? '예약 생성 연결 준비 중'
                      : '임시 예약 후 정보 확인 →'}
              </button>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default ReservationPage