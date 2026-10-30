import { Routes, Route } from 'react-router-dom'

import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReservations from './pages/admin/AdminReservations'
import AdminMembers from './pages/admin/AdminMembers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminPopups from './pages/admin/AdminPopups'
import AdminWaitings from './pages/admin/AdminWaitings'

// 메인 페이지
function Home() {
  return <h1>POPQ 메인페이지</h1>
}

// 예약 페이지
function ReservationPage() {
  return <h1>POPQ 예약페이지</h1>
}

// 없는 페이지
function NotFound() {
  return <h1>404 - 페이지를 찾을 수 없습니다.</h1>
}

function App() {
  return (
    <Routes>
      {/* 메인 페이지 */}
      <Route path="/" element={<Home />} />

      {/* 예약 페이지 */}
      <Route
        path="/popups/:popupId/reserve"
        element={<ReservationPage />}
      />

      {/* 관리자 페이지 */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="popups" element={<AdminPopups />} />
        <Route path="waiting" element={<AdminWaitings />} />
      </Route>

      {/* 없는 페이지 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App