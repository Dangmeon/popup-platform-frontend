import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Outlet,
  Navigate,
  useNavigate,
} from 'react-router-dom'

import Header from './components/common/Header.jsx'
import Footer from './components/common/Footer.jsx'
import LoadingMascot from './components/common/LoadingMascot.jsx'
import { useApp } from './context/AppContext.jsx'

import Home from './pages/Home.jsx'
import PopupList from './pages/PopupList.jsx'
import PopupDetail from './pages/PopupDetail.jsx'
import MyPage from './pages/MyPage.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import Cart from './pages/Cart.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import NotFound from './pages/NotFound.jsx'

import ReservationPage from './pages/ReservationPage'
import ReservationConfirm from './pages/ReservationConfirm'
import ReservationComplete from './pages/ReservationComplete'

import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReservations from './pages/admin/AdminReservations'
import AdminMembers from './pages/admin/AdminMembers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminPopups from './pages/admin/AdminPopups'
import AdminWaitings from './pages/admin/AdminWaitings'

// 사용자 화면 레이아웃
function UserLayout() {
  return (
    <div className="app">
      <Header />

      <div className="user-content">
        <Outlet />
      </div>

      <Footer />
    </div>
  )
}

function App() {
  const app = useApp()
  const navigate = useNavigate()

  // 초기 로딩
  const [loading, setLoading] = useState(true)

  // 예약 정보
  const [reservation, setReservation] = useState({
    date: null,
    time: null,
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)

    return () => clearTimeout(timer)
  }, [])

  // 예약 정보 확인
  function handleReservationNext(date, time) {
    setReservation({ date, time })
    navigate('/reservations/confirm')
  }

  // 데모 예약 완료
  function handleReservationComplete() {
    navigate('/reservations/complete')
  }

  // 메인 이동
  function handleGoHome() {
    setReservation({ date: null, time: null })
    navigate('/')
  }

  const hasReservation = Boolean(
    reservation.date && reservation.time
  )

  if (loading) {
    return <LoadingMascot text="POPQ 불러오는 중..." />
  }

  return (
    <>
      <Routes>
        {/* 사용자 페이지 */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/popups" element={<PopupList />} />
          <Route
            path="/popups/:popupId"
            element={<PopupDetail />}
          />

          {/* 예약 날짜 및 시간 선택 */}
          <Route
            path="/popups/:popupId/reserve"
            element={
              <ReservationPage onNext={handleReservationNext} />
            }
          />

          {/* 예약 정보 확인 */}
          <Route
            path="/reservations/confirm"
            element={
              hasReservation ? (
                <ReservationConfirm
                  selectedDate={reservation.date}
                  selectedTime={reservation.time}
                  onBack={() => navigate(-1)}
                  onConfirm={handleReservationComplete}
                />
              ) : (
                <Navigate to="/popups" replace />
              )
            }
          />

          {/* 데모 예약 완료 */}
          <Route
            path="/reservations/complete"
            element={
              hasReservation ? (
                <ReservationComplete
                  selectedDate={reservation.date}
                  selectedTime={reservation.time}
                  onGoHome={handleGoHome}
                />
              ) : (
                <Navigate to="/popups" replace />
              )
            }
          />

          {/* 회원 및 장바구니 */}
          <Route path="/mypage" element={<MyPage />} />
          <Route
            path="/mypage/account"
            element={<AccountSettings />}
          />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 없는 사용자 페이지 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* 관리자 페이지 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route
            path="reservations"
            element={<AdminReservations />}
          />
          <Route path="members" element={<AdminMembers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="popups" element={<AdminPopups />} />
          <Route path="waiting" element={<AdminWaitings />} />

          {/* 없는 관리자 페이지 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* 공통 알림 */}
      <div className="toast-wrap">
        {app.toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            {toast.msg}
          </div>
        ))}
      </div>
    </>
  )
}

export default App