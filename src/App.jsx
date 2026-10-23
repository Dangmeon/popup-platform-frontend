
import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'

import ReservationPage from './pages/ReservationPage'
import ReservationConfirm from './pages/ReservationConfirm'
import ReservationComplete from './pages/ReservationComplete'

function Home() {
  const navigate = useNavigate()

  return (
    <main style={{ padding: '40px' }}>
      <h1>POPQ 메인페이지</h1>

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

function NotFound() {
  return <h1>404 - 페이지를 찾을 수 없습니다.</h1>
}

function App() {
  const navigate = useNavigate()

  const [reservation, setReservation] = useState({
    date: null,
    time: null,
  })

  const handleReservationNext = (date, time) => {
    setReservation({ date, time })
    navigate('/reservations/confirm')
  }

  const handleReservationComplete = () => {
    navigate('/reservations/complete')
  }

  const handleGoHome = () => {
    setReservation({ date: null, time: null })
    navigate('/')
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/popups/:popupId/reserve"
        element={
          <ReservationPage onNext={handleReservationNext} />
        }
      />

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

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
