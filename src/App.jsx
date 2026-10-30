import { useEffect, useRef, useState } from 'react'
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
  const [reservation, setReservation] = useState(null)

  // 완료 처리 기록
  const completedIds = useRef(new Set())

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)

    return () => clearTimeout(timer)
  }, [])

  // 예약 정보 확인
  function handleReservationNext(date, time, details = {}) {
    const { popupId, peopleCount } = details

    if (
      !date ||
      !time ||
      !popupId ||
      !Number.isSafeInteger(peopleCount) ||
      peopleCount < 1
    ) {
      app.showToast('예약 날짜·시간·인원을 확인해 주세요.')
      return
    }

    // 나중에 바꿀 부분: 실제 API가 발급한 예약번호 사용
    const id = `DEMO-${crypto.randomUUID()}`

    setReservation({
      id,
      popupId,
      date,
      time,
      peopleCount,
      completed: false,
    })

    navigate('/reservations/confirm')
  }

  // 데모 예약 완료
  function handleReservationComplete() {
    if (!reservation) return

    if (completedIds.current.has(reservation.id)) {
      navigate('/reservations/complete')
      return
    }

    if (!app.currentUser) {
      app.showToast('로그인 후 예약 확인 화면에서 다시 진행해 주세요.')
      navigate('/login')
      return
    }

    try {
      // 나중에 바꿀 부분: 실제 예약 API 호출 및 성공 응답 처리
      app.addDemoReservation({
        id: reservation.id,
        popupId: reservation.popupId,
        visitDate: reservation.date,
        timeSlot: reservation.time,
        peopleCount: reservation.peopleCount,
      })

      completedIds.current.add(reservation.id)

      setReservation((previous) => ({
        ...previous,
        completed: true,
      }))

      app.showToast('데모 예약 내역을 저장했습니다. 실제 예약은 아닙니다.')
      navigate('/reservations/complete')
    } catch (error) {
      app.showToast(
        error.message || '데모 예약 내역을 저장하지 못했습니다.'
      )
    }
  }

  // 메인 이동
  function handleGoHome() {
    setReservation(null)
    navigate('/')
  }

  const hasReservation = Boolean(
    reservation?.date &&
      reservation?.time &&
      reservation?.popupId &&
      reservation?.peopleCount
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
                  peopleCount={reservation.peopleCount}
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
              hasReservation && reservation.completed ? (
                <ReservationComplete
                  selectedDate={reservation.date}
                  selectedTime={reservation.time}
                  peopleCount={reservation.peopleCount}
                  reservationNumber={reservation.id}
                  onGoHome={handleGoHome}
                />
              ) : (
                <Navigate
                  to={
                    hasReservation
                      ? '/reservations/confirm'
                      : '/popups'
                  }
                  replace
                />
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