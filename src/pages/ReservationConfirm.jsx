import { useEffect, useState } from 'react'
import PopqLogo from '../components/reservation/PopqLogo'
import { parseReservationDateTime } from '../utils/reservationAvailability'
import './ReservationPage.css'
import './ReservationConfirm.css'

// 예약 상태 표시
const reservationStatuses = {
  HOLD: '확정 대기',
  CONFIRMED: '예약 확정',
  CANCELLED: '예약 취소',
  EXPIRED: '예약 만료',
  USED: '이용 완료',
}

// 남은 시간 표시
function formatRemainingTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`
}

function ReservationConfirm({
  reservationId,
  reservationStatus,
  expiresAt,
  selectedDate,
  selectedTime,
  peopleCount,
  submitting = false,
  checkingStatus = false,
  error = '',
  onBack,
  onConfirm,
  onCheckStatus,
}) {
  // 현재 시각
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const expiration = parseReservationDateTime(expiresAt)

  const remainingSeconds = expiration
    ? Math.max(
        0,
        Math.ceil((expiration.getTime() - now) / 1000)
      )
    : null

  const isHold = reservationStatus === 'HOLD'
  const isBusy = submitting || checkingStatus

  // 서버가 종료 상태를 반환한 경우에만 재선택
  const canGoBack =
    reservationStatus === 'EXPIRED' ||
    reservationStatus === 'CANCELLED'

  const canConfirm =
    isHold &&
    Boolean(reservationId) &&
    remainingSeconds !== null &&
    typeof onConfirm === 'function'

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

        <h1>예약 정보를 확인해 주세요</h1>
        <p>날짜·시간·인원을 확인한 뒤 최종 확정해 주세요.</p>
      </div>

      {/* 예약 진행 단계 */}
      <div className="reservation-steps">
        <div className="reservation-step">
          <span>01</span>
          날짜 · 시간 선택
        </div>

        <span className="reservation-step-arrow">→</span>

        <div className="reservation-step active">
          <span>02</span>
          예약 확인
        </div>

        <span className="reservation-step-arrow">→</span>

        <div className="reservation-step">
          <span>03</span>
          예약 완료
        </div>
      </div>

      {/* 예약 정보 */}
      <section className="reservation-summary" aria-busy={isBusy}>
        <div className="reservation-summary-header">
          <h3>선택한 예약 정보</h3>

          <span className="reservation-summary-badge">
            {reservationStatuses[reservationStatus] ||
              reservationStatus ||
              '상태 확인 필요'}
          </span>
        </div>

        <div className="reservation-summary-row">
          <span>예약번호</span>
          <strong>{reservationId ?? '-'}</strong>
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

        {/* 확정 제한 시간 */}
        {isHold && (
          <>
            <div className="reservation-summary-row">
              <span>확정까지 남은 시간</span>

              <strong role="timer" aria-live="off">
                {remainingSeconds === null
                  ? '만료시각 확인 필요'
                  : formatRemainingTime(remainingSeconds)}
              </strong>
            </div>

            <p className="reservation-confirm-notice">
              현재는 임시 예약 상태입니다.
              최종 확정이 완료되어야 예약이 확정됩니다.
            </p>

            {remainingSeconds === 0 && (
              <p className="reservation-confirm-notice" role="status">
                화면 기준 제한 시간이 지났습니다.
                아래 버튼으로 서버의 만료 처리 결과를 확인해 주세요.
                실제 상태는 서버 응답으로 판단합니다.
              </p>
            )}

            {remainingSeconds === null && (
              <p className="reservation-confirm-notice" role="alert">
                만료시각을 확인하지 못했습니다.
                예약 상태를 다시 조회해 주세요.
              </p>
            )}

            <p className="reservation-confirm-notice">
              현재 서버는 HOLD 취소와 자동 해제가 준비되지 않아,
              임시 예약 중에는 이전 단계로 돌아갈 수 없습니다.
              화면을 나가도 서버의 임시 예약이 즉시 취소되지는 않습니다.
            </p>
          </>
        )}

        {/* 종료 상태 */}
        {reservationStatus === 'EXPIRED' && (
          <p className="reservation-confirm-notice" role="status">
            서버에서 예약 만료가 확인됐습니다.
            날짜와 회차를 다시 선택해 주세요.
          </p>
        )}

        {reservationStatus === 'CANCELLED' && (
          <p className="reservation-confirm-notice" role="status">
            취소된 예약입니다. 새 예약을 진행할 수 있습니다.
          </p>
        )}

        {reservationStatus === 'USED' && (
          <p className="reservation-confirm-notice" role="status">
            이미 이용 완료된 예약입니다.
          </p>
        )}

        {/* 요청 오류 */}
        {error && (
          <p className="reservation-confirm-notice" role="alert">
            {error}
          </p>
        )}

        {/* 예약 버튼 */}
        <div className="reservation-confirm-actions">
          <button
            type="button"
            className="reservation-back-button"
            disabled={
              isBusy ||
              !canGoBack ||
              typeof onBack !== 'function'
            }
            onClick={onBack}
          >
            회차 다시 선택
          </button>

          <button
            type="button"
            className="reservation-next-button"
            disabled={isBusy || !canConfirm}
            onClick={onConfirm}
          >
            {submitting
              ? '서버 처리 중…'
              : remainingSeconds === 0
                ? '만료 상태 확인'
                : '예약 확정하기 →'}
          </button>
        </div>

        {/* 서버 상태 재조회 */}
        {typeof onCheckStatus === 'function' && (
          <button
            type="button"
            className="reservation-next-button"
            disabled={isBusy}
            onClick={onCheckStatus}
          >
            {checkingStatus ? '조회 중…' : '예약 상태 다시 조회'}
          </button>
        )}
      </section>
    </main>
  )
}

export default ReservationConfirm