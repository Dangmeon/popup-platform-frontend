
import { Routes, Route } from 'react-router-dom'

function Home() {
  return <h1>POPQ 메인페이지</h1>
}

function ReservationPage() {
  return <h1>POPQ 예약페이지</h1>
}

function NotFound() {
  return <h1>404 - 페이지를 찾을 수 없습니다.</h1>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/popups/:popupId/reserve" element={<ReservationPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
