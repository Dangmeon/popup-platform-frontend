import PopqLogo from '../components/reservation/PopqLogo'
import ReservationTimer from '../components/reservation/ReservationTimer'
import './ReservationPage.css'
import './ReservationConfirm.css'
import './ReservationComplete.css'

function ReservationComplete({
  selectedDate,
  selectedTime,
  peopleCount,
  reservationNumber,
  onGoHome,
}) {
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
        <p>데모 예약 정보를 확인해 주세요.</p>
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

        <div className="reservation-step active">
          <span>03</span>
          예약 완료
        </div>
      </div>

      {/* 예약 정보 */}
      <section className="reservation-summary">
        <div className="reservation-summary-header">
          <h3>예약 정보</h3>
          <span className="reservation-summary-badge">
            데모 화면
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
          <span>데모 예약번호</span>
          <strong
            style={{
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {reservationNumber}
          </strong>
        </div>

        {/* 예약 시작까지 남은 시간 */}
        <ReservationTimer
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />

        {/* QR코드 안내 */}
        <div className="reservation-qr-section">
          <div className="reservation-qr-placeholder">
            QR코드 발급 예정
          </div>

          <p>
            실제 QR코드는 백엔드 예약 API 연동 후 표시됩니다.
          </p>
        </div>

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 교체 */}
        <p className="reservation-confirm-notice">
          현재는 프론트엔드 테스트용 화면입니다.
          데모 내역은 이 브라우저에만 저장되며 실제 예약은 생성되지
          않았습니다. 입장용으로 사용할 수 없습니다.
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