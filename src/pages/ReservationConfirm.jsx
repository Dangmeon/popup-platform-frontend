import PopqLogo from '../components/reservation/PopqLogo'
import './ReservationPage.css'
import './ReservationConfirm.css'

function ReservationConfirm({
  selectedDate,
  selectedTime,
  peopleCount,
  onBack,
  onConfirm,
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

        <h1>예약 정보를 확인해 주세요</h1>
        <p>선택하신 날짜와 시간, 인원이 맞는지 확인해 주세요.</p>
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
      <section className="reservation-summary">
        <div className="reservation-summary-header">
          <h3>선택한 예약 정보</h3>
          <span className="reservation-summary-badge">
            확인 중
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

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 교체 */}
        <p className="reservation-confirm-notice">
          현재는 테스트 화면입니다. 로그인 후 진행하면 마이페이지에
          데모 예약 내역이 기록됩니다. 실제 예약 및 QR코드 발급은
          서버 연동 후 가능합니다.
        </p>

        {/* 버튼 */}
        <div className="reservation-confirm-actions">
          <button
            type="button"
            className="reservation-back-button"
            onClick={onBack}
          >
            ← 이전으로
          </button>

          <button
            type="button"
            className="reservation-next-button"
            onClick={onConfirm}
          >
            데모 예약 완료 보기 →
          </button>
        </div>
      </section>
    </main>
  )
}

export default ReservationConfirm