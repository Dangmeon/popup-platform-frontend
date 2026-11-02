import { useEffect, useState } from 'react'
import PopqLogo from '../components/reservation/PopqLogo'
import ReservationTimer from '../components/reservation/ReservationTimer'
import { getReservationQr } from '../api/reservationApi'
import './ReservationPage.css'
import './ReservationConfirm.css'
import './ReservationComplete.css'

// 예약 상태 표시
const statusLabels = {
  HOLD: '확정 대기',
  CONFIRMED: '예약 확정',
  CANCELLED: '예약 취소',
  EXPIRED: '예약 만료',
  USED: '이용 완료',
}

// QR 조회 오류 안내
function getQrErrorMessage(error) {
  const status = error.response?.status

  if (status === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (status === 403) {
    return 'QR 이미지를 조회할 권한이 없습니다.'
  }

  if (status === 404) {
    return '예약 또는 QR 이미지를 찾을 수 없습니다.'
  }

  if (status === 409) {
    return '현재 예약 상태에서는 QR 이미지를 조회할 수 없습니다.'
  }

  const message = error.response?.data?.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (!error.response && error.request) {
    return '서버에 연결할 수 없습니다. 연결 상태를 확인해 주세요.'
  }

  return 'QR 이미지를 불러오지 못했습니다. 다시 시도해 주세요.'
}

function ReservationComplete({
  selectedDate,
  selectedTime,
  peopleCount,
  reservationNumber,
  reservationStatus,
  onGoHome,
}) {
  const [retryKey, setRetryKey] = useState(0)
  const [qrState, setQrState] = useState({
    scope: '',
    loading: false,
    url: '',
    error: '',
  })

  const reservationId = Number(reservationNumber)
  const isValidId =
    Number.isSafeInteger(reservationId) && reservationId > 0
  const isConfirmed = reservationStatus === 'CONFIRMED'
  const canLoadQr = isConfirmed && isValidId
  const qrScope = `${reservationStatus}:${reservationNumber}:${retryKey}`

  const currentQr =
    qrState.scope === qrScope
      ? qrState
      : {
          loading: canLoadQr,
          url: '',
          error: '',
        }

  // QR 이미지 조회
  useEffect(() => {
    if (!canLoadQr) return

    let active = true
    let objectUrl = ''

    setQrState({
      scope: qrScope,
      loading: true,
      url: '',
      error: '',
    })

    async function loadQr() {
      try {
        const image = await getReservationQr({ reservationId })

        if (!active) return

        objectUrl = URL.createObjectURL(image)

        setQrState({
          scope: qrScope,
          loading: false,
          url: objectUrl,
          error: '',
        })
      } catch (error) {
        if (!active) return

        setQrState({
          scope: qrScope,
          loading: false,
          url: '',
          error: getQrErrorMessage(error),
        })
      }
    }

    loadQr()

    // 이미지 주소 정리
    return () => {
      active = false

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [canLoadQr, reservationId, qrScope])

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

        <h1>예약 확인증</h1>
        <p>
          {isConfirmed
            ? '확정된 예약 정보와 입장용 QR코드를 확인해 주세요.'
            : '현재 예약 상태를 확인해 주세요.'}
        </p>
      </div>

      {/* 예약 진행 단계 */}
      <div className="reservation-steps">
        <div className="reservation-step">
          <span>01</span>
          날짜 · 시간 선택
        </div>

        <span className="reservation-step-arrow">→</span>

        <div className="reservation-step">
          <span>02</span>
          예약 확인
        </div>

        <span className="reservation-step-arrow">→</span>

        <div
          className={`reservation-step${isConfirmed ? ' active' : ''}`}
        >
          <span>03</span>
          예약 완료
        </div>
      </div>

      {/* 예약 정보 */}
      <section className="reservation-summary">
        <div className="reservation-summary-header">
          <h3>예약 정보</h3>
          <span className="reservation-summary-badge">
            {statusLabels[reservationStatus] || '상태 확인 필요'}
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

        <div className="reservation-summary-row">
          <span>예약번호</span>
          <strong
            style={{
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {reservationNumber || '확인 필요'}
          </strong>
        </div>

        {/* 예약 시작까지 남은 시간 */}
        {isConfirmed && (
          <ReservationTimer
            selectedDate={selectedDate}
            selectedTime={selectedTime}
          />
        )}

        {/* QR 이미지 */}
        <div className="reservation-qr-section">
          {!isConfirmed ? (
            <p>예약이 확정된 경우에만 QR코드를 조회할 수 있습니다.</p>
          ) : !isValidId ? (
            <p role="alert">
              올바른 예약번호가 없어 QR코드를 조회할 수 없습니다.
            </p>
          ) : currentQr.loading ? (
            <p role="status">QR코드를 불러오는 중입니다.</p>
          ) : currentQr.error ? (
            <>
              <p role="alert">{currentQr.error}</p>

              <button
                type="button"
                className="reservation-next-button"
                onClick={() => setRetryKey((previous) => previous + 1)}
              >
                QR코드 다시 불러오기
              </button>
            </>
          ) : currentQr.url ? (
            <>
              <img
                src={currentQr.url}
                alt={`예약번호 ${reservationNumber} 입장용 QR코드`}
                width="240"
                height="240"
                style={{
                  display: 'block',
                  width: '240px',
                  maxWidth: '100%',
                  height: 'auto',
                  margin: '0 auto',
                  backgroundColor: '#fff',
                }}
              />

              <p>방문 시 직원에게 예약번호와 QR코드를 보여주세요.</p>
            </>
          ) : null}
        </div>

        {/* 예약 안내 */}
        <p className="reservation-confirm-notice">
          예약 상태는 서버에서 관리됩니다. QR 이미지를 불러오지
          못하더라도 예약이 취소되는 것은 아닙니다.
        </p>

        {/* 메인 이동 */}
        <button
          type="button"
          className="reservation-next-button reservation-home-button"
          onClick={onGoHome}
        >
          메인페이지로 돌아가기 →
        </button>
      </section>
    </main>
  )
}

export default ReservationComplete