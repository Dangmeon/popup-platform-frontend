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

import {
  createHoldReservation,
  confirmReservation,
  getReservation,
} from './api/reservationApi'

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

// 예약 상태 확인
const reservationStatuses = new Set([
  'HOLD',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
  'USED',
])

// 서버 응답 변환
function mapReservation(response, previous) {
  if (
    !response ||
    !Number.isSafeInteger(response.reservationId) ||
    response.reservationId < 1 ||
    !reservationStatuses.has(response.reservationStatus)
  ) {
    throw new Error('서버의 예약 응답을 확인할 수 없습니다.')
  }

  if (
    previous.reservationId &&
    response.reservationId !== previous.reservationId
  ) {
    throw new Error('요청한 예약과 서버 응답의 예약번호가 다릅니다.')
  }

  return {
    ...previous,
    reservationId: response.reservationId,
    reservationStatus: response.reservationStatus,
    timeSlotId: response.timeSlotId ?? previous.timeSlotId,
    peopleCount: response.peopleCount ?? previous.peopleCount,
    expiresAt: response.expiresAt ?? previous.expiresAt,
    popId: response.popId ?? previous.popId,
    date: response.slotDate ?? previous.date,
    time: response.startTime ?? previous.time,
    endTime: response.endTime ?? previous.endTime,
    popupName: response.popupName ?? previous.popupName,
  }
}

// 요청 오류 안내
function getReservationError(error) {
  const status = error.response?.status
  const message = error.response?.data?.message

  if (status === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (status === 403) {
    return '이 예약을 처리할 권한이 없습니다.'
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (!error.response && error.request) {
    return '서버 응답을 받지 못했습니다. 요청이 처리되었을 수 있으므로 상태를 확인해 주세요.'
  }

  return error.message || '예약 요청을 처리하지 못했습니다.'
}

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
  const [reservationError, setReservationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // 중복 요청 방지
  const requestLock = useRef(false)
  const uncertainCreation = useRef(false)

  // 현재 인증 정보
  const username = app.isAuthenticated
    ? app.currentUser?.username
    : null

  const currentUsername = useRef(username)
  currentUsername.current = username

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)

    return () => clearTimeout(timer)
  }, [])

  const hasReservation = Boolean(
    username &&
      reservation?.owner === username &&
      reservation?.reservationId
  )

  // 예약 상태 반영
  function applyReservation(nextReservation) {
    setReservation(nextReservation)
    setReservationError('')

    if (nextReservation.reservationStatus === 'CONFIRMED') {
      navigate('/reservations/complete', { replace: true })
    } else {
      navigate('/reservations/confirm', { replace: true })
    }
  }

  // 임시 예약 생성
  async function handleCreateHold({
    popId,
    timeSlotId,
    peopleCount,
    slotDate,
    startTime,
    endTime,
  }) {
    if (requestLock.current) return

    if (!username) {
      throw new Error('실제 회원 계정으로 로그인해 주세요.')
    }

    // 기존 임시 예약 유지
    if (
      hasReservation &&
      reservation.reservationStatus === 'HOLD'
    ) {
      navigate('/reservations/confirm')
      return
    }

    if (uncertainCreation.current) {
      throw new Error(
        '이전 예약 생성 결과가 확인되지 않았습니다. 중복 생성을 막기 위해 서버의 예약 내역 확인이 필요합니다.'
      )
    }

    const owner = username
    requestLock.current = true

    try {
      const response = await createHoldReservation({
        timeSlotId,
        peopleCount,
      })

      const nextReservation = mapReservation(response, {
        owner,
        popId,
        timeSlotId,
        peopleCount,
        date: slotDate,
        time: startTime,
        endTime,
      })

      if (currentUsername.current !== owner) return

      applyReservation(nextReservation)
    } catch (error) {
      // 응답 유실 시 재생성 방지
      if (
        (!error.response && error.request) ||
        error.response?.status >= 500
      ) {
        uncertainCreation.current = true
      }

      throw new Error(getReservationError(error))
    } finally {
      requestLock.current = false
    }
  }

  // 최신 예약 상태 조회
  async function handleCheckStatus() {
    if (!hasReservation || requestLock.current) return

    const currentReservation = reservation
    const owner = username

    requestLock.current = true
    setCheckingStatus(true)
    setReservationError('')

    try {
      const response = await getReservation({
        reservationId: currentReservation.reservationId,
      })

      const nextReservation = mapReservation(
        response,
        currentReservation
      )

      if (currentUsername.current !== owner) return

      applyReservation(nextReservation)
    } catch (error) {
      if (currentUsername.current === owner) {
        setReservationError(getReservationError(error))
      }
    } finally {
      requestLock.current = false
      setCheckingStatus(false)
    }
  }

  // 예약 확정
  async function handleReservationComplete() {
    if (!hasReservation || requestLock.current) return

    if (reservation.reservationStatus === 'CONFIRMED') {
      navigate('/reservations/complete', { replace: true })
      return
    }

    if (reservation.reservationStatus !== 'HOLD') return

    const currentReservation = reservation
    const owner = username

    requestLock.current = true
    setSubmitting(true)
    setReservationError('')

    try {
      // 재시도 전에 서버 상태 확인
      const latestResponse = await getReservation({
        reservationId: currentReservation.reservationId,
      })

      let nextReservation = mapReservation(
        latestResponse,
        currentReservation
      )

      if (currentUsername.current !== owner) return

      if (nextReservation.reservationStatus === 'HOLD') {
        const response = await confirmReservation({
          reservationId: nextReservation.reservationId,
        })

        nextReservation = mapReservation(
          response,
          nextReservation
        )
      }

      if (currentUsername.current !== owner) return

      applyReservation(nextReservation)

      if (nextReservation.reservationStatus === 'CONFIRMED') {
        app.showToast('예약이 확정되었습니다.')
      } else if (
        nextReservation.reservationStatus === 'EXPIRED'
      ) {
        setReservationError(
          '예약 확정 시간이 만료되었습니다. 회차를 다시 선택해 주세요.'
        )
      }
    } catch (error) {
      if (currentUsername.current === owner) {
        setReservationError(getReservationError(error))
      }
    } finally {
      requestLock.current = false
      setSubmitting(false)
    }
  }

  // 회차 다시 선택
  function handleSelectAgain() {
    if (
      !hasReservation ||
      !['EXPIRED', 'CANCELLED'].includes(
        reservation.reservationStatus
      )
    ) {
      return
    }

    const popId = reservation.popId
    const peopleCount = reservation.peopleCount

    setReservation(null)
    setReservationError('')

    navigate(`/popups/${popId}/reserve`, {
      state: { peopleCount },
    })
  }

  // 메인 이동
  function handleGoHome() {
    navigate('/')
  }

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
              <ReservationPage
                onCreateHold={handleCreateHold}
              />
            }
          />

          {/* 예약 정보 확인 */}
          <Route
            path="/reservations/confirm"
            element={
              !username ? (
                <Navigate to="/login" replace />
              ) : hasReservation ? (
                reservation.reservationStatus ===
                'CONFIRMED' ? (
                  <Navigate
                    to="/reservations/complete"
                    replace
                  />
                ) : (
                  <ReservationConfirm
                    reservationId={reservation.reservationId}
                    reservationStatus={
                      reservation.reservationStatus
                    }
                    expiresAt={reservation.expiresAt}
                    selectedDate={reservation.date}
                    selectedTime={reservation.time}
                    peopleCount={reservation.peopleCount}
                    submitting={submitting}
                    checkingStatus={checkingStatus}
                    error={reservationError}
                    onBack={handleSelectAgain}
                    onConfirm={handleReservationComplete}
                    onCheckStatus={handleCheckStatus}
                  />
                )
              ) : (
                <Navigate to="/popups" replace />
              )
            }
          />

          {/* 예약 완료 */}
          <Route
            path="/reservations/complete"
            element={
              !username ? (
                <Navigate to="/login" replace />
              ) : hasReservation &&
                reservation.reservationStatus ===
                  'CONFIRMED' ? (
                <ReservationComplete
                  selectedDate={reservation.date}
                  selectedTime={reservation.time}
                  peopleCount={reservation.peopleCount}
                  reservationNumber={
                    reservation.reservationId
                  }
                  reservationStatus={
                    reservation.reservationStatus
                  }
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
          <Route
            path="products"
            element={<AdminProducts />}
          />
          <Route path="popups" element={<AdminPopups />} />
          <Route
            path="waiting"
            element={<AdminWaitings />}
          />
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