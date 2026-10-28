
import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'

// 예약 관련 화면
import ReservationPage from './pages/ReservationPage'
import ReservationConfirm from './pages/ReservationConfirm'
import ReservationComplete from './pages/ReservationComplete'

// POPQ 메인 페이지 (임시 화면)
function Home() {
  const navigate = useNavigate()

  return (
    <main style={{ padding: '40px' }}>
      <h1>POPQ 메인페이지</h1>

      {/* 예약 화면 이동 버튼 */}
      <button
        type="button"
        onClick={() => navigate('/popups/1/reserve')}
        style={{
          marginTop: '16px',
          padding: '8px 14px',
          fontSize: '13px',
          borderRadius: '6px',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          color: '#222',
          cursor: 'pointer',
        }}
      >
        예약 화면 이동 →
      </button>
    </main>
  )
}

// 존재하지 않는 주소로 접근했을 때 표시
function NotFound() {
  return <h1>404 - 페이지를 찾을 수 없습니다.</h1>
}

// 전체 페이지 이동 및 예약 정보 관리
function App() {
  const navigate = useNavigate()

  // 사용자가 선택한 예약 날짜와 시간 저장
  const [reservation, setReservation] = useState({
    date: null,
    time: null,
  })

  // 날짜와 시간 선택 후 예약 확인 화면으로 이동
  const handleReservationNext = (date, time) => {
    setReservation({ date, time })
    navigate('/reservations/confirm')
  }

  // 예약 확인 후 예약 완료 화면으로 이동
  const handleReservationComplete = () => {
    navigate('/reservations/complete')
  }

  // 메인 화면으로 이동하면서 예약 정보 초기화
  const handleGoHome = () => {
    setReservation({ date: null, time: null })
    navigate('/')
  }

  return (
    <Routes>
      {/* POPQ 메인 페이지 */}
      <Route path="/" element={<Home />} />

      {/* 팝업스토어 예약 날짜 및 시간 선택 */}
      <Route
        path="/popups/:popupId/reserve"
        element={
          <ReservationPage onNext={handleReservationNext} />
        }
      />

      {/* 예약 정보 확인 화면 */}
      <Route
        path="/reservations/confirm"
        element={
          <ReservationConfirm
            selectedDate={reservation.date}
            selectedTime={reservation.time}
            onBack={() => navigate(-1)}
            onConfirm={handleReservationComplete}
          />
        }
      />

      {/* 예약 완료 및 QR 화면 */}
      <Route
        path="/reservations/complete"
        element={
          <ReservationComplete
            selectedDate={reservation.date}
            selectedTime={reservation.time}
            onGoHome={handleGoHome}
          />
        }
      />

      {/* 존재하지 않는 페이지 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
