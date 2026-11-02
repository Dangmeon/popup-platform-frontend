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
  updateReservation,
  cancelReservation,
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
import ReservationEdit from './pages/ReservationEdit'

import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReservations from './pages/admin/AdminReservations'
import AdminMembers from './pages/admin/AdminMembers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminPopups from './pages/admin/AdminPopups'
import AdminWaitings from './pages/admin/AdminWaitings'

// 예약 상태
const reservationStatuses = new Set([
  'HOLD',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
  'USED',
])

// 사용자별 저장 키
function getStorageKey(owner) {
  return `popQ_reservation_api:${encodeURIComponent(owner)}`
}

// 예약번호 조회
function readSavedReservation(owner) {
  const value = sessionStorage.getItem(getStorageKey(owner))

  if (!value) return null

  const saved = JSON.parse(value)

  if (saved.pendingCreation === true) {
    return { pendingCreation: true }
  }

  if (
    !Number.isSafeInteger(saved.reservationId) ||
    saved.reservationId < 1
  ) {
    throw new Error('저장된 예약번호를 확인할 수 없습니다.')
  }

  return { reservationId: saved.reservationId }
}

// 서버 응답 변환
function mapReservation(response, previous = {}) {
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
    throw new Error('요청한 예약과 응답의 예약번호가 다릅니다.')
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
    return '이 예약을 조회하거나 처리할 권한이 없습니다.'
  }

  if (status === 404) {
    return '예약을 찾을 수 없습니다. 예약번호를 확인해 주세요.'
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (!error.response && error.request) {
    return '서버 응답을 받지 못했습니다. 서버 연결을 확인한 뒤 예약 상태를 다시 조회해 주세요.'
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

// 예약 복원 화면
function ReservationRecovery({
  loading,
  error,
  onRetry,
  onRecover,
  onLogin,
}) {
  const [reservationId, setReservationId] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onRecover(reservationId)
  }

  return (
    <main className="reservation-page">
      <section className="reservation-summary">
        <h2>예약 정보 불러오기</h2>

        {loading ? (
          <p role="status">서버에서 예약 정보를 확인하고 있습니다.</p>
        ) : (
          <>
            <p>
              예약번호를 입력하면 로그인한 회원의 예약을
              서버에서 다시 조회합니다.
            </p>

            {error && <p role="alert">{error}</p>}

            <form onSubmit={handleSubmit}>
              <label htmlFor="restore-reservation-id">
                예약번호
              </label>

              <input
                id="restore-reservation-id"
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                value={reservationId}
                onChange={(event) =>
                  setReservationId(event.target.value)
                }
                required
                style={{
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  marginTop: '12px',
                  padding: '12px',
                  border: '1px solid #EEDFD0',
                  borderRadius: '10px',
                }}
              />

              <button
                type="submit"
                className="reservation-next-button"
              >
                예약번호로 조회
              </button>
            </form>

            <button
              type="button"
              className="reservation-next-button"
              onClick={onRetry}
            >
              저장된 예약 다시 조회
            </button>

            <button
              type="button"
              className="reservation-next-button"
              onClick={onLogin}
            >
              로그인 화면으로 이동
            </button>
          </>
        )}
      </section>
    </main>
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
  const [managing, setManaging] = useState(false)
  const [qrVersion, setQrVersion] = useState(0)

  // 예약 복원
  const [restoreKey, setRestoreKey] = useState(0)
  const [recovery, setRecovery] = useState({
    owner: null,
    status: 'idle',
    error: '',
  })

  // 요청 관리
  const requestLock = useRef(false)
  const uncertainCreation = useRef(false)
  const reservationRef = useRef(reservation)
  reservationRef.current = reservation

  const username = app.isAuthenticated
    ? app.currentUser?.username
    : null

  const currentUsername = useRef(username)
  currentUsername.current = username

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  // 새로고침 후 서버 예약 조회
  useEffect(() => {
    if (!username) return

    let active = true

    setRecovery({
      owner: username,
      status: 'loading',
      error: '',
    })

    async function restoreReservation() {
      try {
        const existing = reservationRef.current
        const saved =
          existing?.owner === username
            ? { reservationId: existing.reservationId }
            : readSavedReservation(username)

        if (!saved) {
          if (!active) return

          uncertainCreation.current = false
          setReservation(null)
          setRecovery({
            owner: username,
            status: 'ready',
            error: '',
          })
          return
        }

        if (saved.pendingCreation) {
          uncertainCreation.current = true
          throw new Error(
            '이전 예약 생성 결과가 확인되지 않았습니다. 예약번호가 있다면 아래에서 조회해 주세요. 번호를 받지 못했다면 서버의 예약 내역 확인이 필요합니다.'
          )
        }

        const response = await getReservation({
          reservationId: saved.reservationId,
        })

        const restored = mapReservation(response, {
          owner: username,
          reservationId: saved.reservationId,
        })

        if (!active) return

        uncertainCreation.current = false
        setReservation(restored)
        setReservationError('')

        sessionStorage.setItem(
          getStorageKey(username),
          JSON.stringify({
            reservationId: restored.reservationId,
          })
        )

        setRecovery({
          owner: username,
          status: 'ready',
          error: '',
        })
      } catch (error) {
        if (!active) return

        setRecovery({
          owner: username,
          status: 'error',
          error: getReservationError(error),
        })
      }
    }

    restoreReservation()

    return () => {
      active = false
    }
  }, [username, restoreKey])

  const restoring = Boolean(
    username &&
      (recovery.owner !== username ||
        recovery.status === 'loading')
  )

  const recoveryFailed =
    recovery.owner === username &&
    recovery.status === 'error'

  const hasReservation = Boolean(
    username &&
      reservation?.owner === username &&
      reservation?.reservationId
  )

  // 예약번호 보관
  function rememberReservation(nextReservation) {
    try {
      sessionStorage.setItem(
        getStorageKey(nextReservation.owner),
        JSON.stringify({
          reservationId: nextReservation.reservationId,
        })
      )
    } catch {
      app.showToast(
        '예약은 처리됐지만 예약번호를 보관하지 못했습니다. 예약번호를 기록해 주세요.'
      )
    }
  }

  // 예약 상태 반영
  function applyReservation(nextReservation) {
    rememberReservation(nextReservation)
    setReservation(nextReservation)
    setReservationError('')
    setQrVersion((previous) => previous + 1)

    if (nextReservation.reservationStatus === 'CONFIRMED') {
      navigate('/reservations/complete', { replace: true })
    } else {
      navigate('/reservations/confirm', { replace: true })
    }
  }

  // 예약번호로 복원
  async function handleRecoverById(value) {
    if (!username || requestLock.current) return

    const reservationId = Number(value)

    if (
      !/^\d+$/.test(value.trim()) ||
      !Number.isSafeInteger(reservationId) ||
      reservationId < 1
    ) {
      setRecovery({
        owner: username,
        status: 'error',
        error: '예약번호는 1 이상의 정수로 입력해 주세요.',
      })
      return
    }

    const owner = username
    requestLock.current = true

    setRecovery({
      owner,
      status: 'loading',
      error: '',
    })

    try {
      const response = await getReservation({ reservationId })
      const restored = mapReservation(response, {
        owner,
        reservationId,
      })

      if (currentUsername.current !== owner) return

      uncertainCreation.current = false
      setRecovery({
        owner,
        status: 'ready',
        error: '',
      })
      applyReservation(restored)
    } catch (error) {
      if (currentUsername.current === owner) {
        setRecovery({
          owner,
          status: 'error',
          error: getReservationError(error),
        })
      }
    } finally {
      requestLock.current = false
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

    if (restoring || recoveryFailed) {
      throw new Error('기존 예약 정보를 먼저 확인해 주세요.')
    }

    if (
      hasReservation &&
      reservation.reservationStatus === 'HOLD'
    ) {
      navigate('/reservations/confirm')
      return
    }

    if (uncertainCreation.current) {
      throw new Error(
        '이전 예약 생성 결과가 확인되지 않았습니다. 서버 예약 내역 확인이 필요합니다.'
      )
    }

    const owner = username
    requestLock.current = true
    let receivedResponse = false

    try {
      // 응답 유실에 대비한 생성 기록
      sessionStorage.setItem(
        getStorageKey(owner),
        JSON.stringify({ pendingCreation: true })
      )

      const response = await createHoldReservation({
        timeSlotId,
        peopleCount,
      })

      receivedResponse = true

      const nextReservation = mapReservation(response, {
        owner,
        popId,
        timeSlotId,
        peopleCount,
        date: slotDate,
        time: startTime,
        endTime,
      })

      // 계정 변경 시에도 생성된 예약번호 보관
      rememberReservation(nextReservation)

      if (currentUsername.current !== owner) return

      uncertainCreation.current = false
      applyReservation(nextReservation)
    } catch (error) {
      const unknownResult =
        receivedResponse ||
        (!error.response && Boolean(error.request)) ||
        error.response?.status >= 500

      if (unknownResult) {
        uncertainCreation.current = true
      } else {
        try {
          if (
            reservationRef.current?.owner === owner
          ) {
            rememberReservation(reservationRef.current)
          } else {
            sessionStorage.removeItem(getStorageKey(owner))
          }
        } catch {
          // 기존 서버 예약 유지
        }
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

      rememberReservation(nextReservation)

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

  // 변경 화면 진입
  async function handleOpenEdit() {
    if (!hasReservation || requestLock.current) return

    const owner = username
    requestLock.current = true
    setManaging(true)
    setReservationError('')

    try {
      const response = await getReservation({
        reservationId: reservation.reservationId,
      })
      const latest = mapReservation(response, reservation)

      if (currentUsername.current !== owner) return

      applyReservation(latest)

      if (latest.reservationStatus === 'CONFIRMED') {
        navigate('/reservations/edit')
      } else {
        setReservationError('현재 예약 상태에서는 변경할 수 없습니다.')
      }
    } catch (error) {
      if (currentUsername.current === owner) {
        setReservationError(getReservationError(error))
      }
    } finally {
      requestLock.current = false
      setManaging(false)
    }
  }

  // 예약 변경 및 취소
  async function handleManageReservation(action, changes = {}) {
    if (!hasReservation || requestLock.current) return

    const owner = username
    const currentReservation = reservation
    let mutationStarted = false
    let mutationFinished = false

    requestLock.current = true
    setManaging(true)
    setReservationError('')

    try {
      // 변경 전 서버 상태 확인
      const response = await getReservation({
        reservationId: currentReservation.reservationId,
      })
      const latest = mapReservation(response, currentReservation)

      if (currentUsername.current !== owner) return

      if (latest.reservationStatus !== 'CONFIRMED') {
        applyReservation(latest)
        setReservationError('현재 예약 상태에서는 변경하거나 취소할 수 없습니다.')
        return
      }

      mutationStarted = true

      const result = action === 'update'
        ? await updateReservation({
            reservationId: latest.reservationId,
            timeSlotId: changes.timeSlotId,
            peopleCount: changes.peopleCount,
          })
        : await cancelReservation({
            reservationId: latest.reservationId,
          })

      mutationFinished = true
      const changed = mapReservation(result, latest)
      rememberReservation(changed)

      // 변경된 방문 정보 다시 조회
      const detail = await getReservation({
        reservationId: changed.reservationId,
      })
      const refreshed = mapReservation(detail, changed)

      if (currentUsername.current !== owner) return

      applyReservation(refreshed)

      const expectedStatus = action === 'update'
        ? 'CONFIRMED'
        : 'CANCELLED'

      if (refreshed.reservationStatus === expectedStatus) {
        app.showToast(
          action === 'update'
            ? '예약이 변경되었습니다.'
            : '예약이 취소되었습니다.'
        )
      } else {
        setReservationError('서버에서 반환한 최신 예약 상태를 확인해 주세요.')
      }
    } catch (error) {
      if (currentUsername.current !== owner) return

      const message = getReservationError(error)
      const unknownResult = mutationStarted && (
        mutationFinished ||
        (!error.response && Boolean(error.request)) ||
        error.response?.status >= 500
      )

      if (unknownResult) {
        // 결과 확인 전 중복 변경 방지
        setRecovery({
          owner,
          status: 'error',
          error: `${message} 요청이 처리되었을 수 있으므로 저장된 예약을 다시 조회해 주세요.`,
        })
      } else {
        setReservationError(message)
      }

      throw new Error(message)
    } finally {
      requestLock.current = false
      setManaging(false)
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

    try {
      sessionStorage.removeItem(getStorageKey(username))
    } catch {
      setReservationError(
        '저장된 예약번호를 정리하지 못했습니다. 다시 시도해 주세요.'
      )
      return
    }

    const { popId, peopleCount } = reservation

    setReservation(null)
    setReservationError('')

    navigate(`/popups/${popId}/reserve`, {
      state: { peopleCount },
    })
  }

  // 변경 요청
  function handleUpdateReservation(changes) {
    return handleManageReservation('update', changes)
  }

  // 취소 요청
  function handleCancelReservation() {
    return handleManageReservation('cancel')
  }

  // 예약 복원 안내
  function renderRecovery() {
    return (
      <ReservationRecovery
        loading={restoring}
        error={recoveryFailed ? recovery.error : ''}
        onRetry={() => setRestoreKey((previous) => previous + 1)}
        onRecover={handleRecoverById}
        onLogin={() => navigate('/login')}
      />
    )
  }

  // 예약 화면 진입 확인
  function guardReservationPage(element, requireReservation = false) {
    if (!username) {
      return <Navigate to="/login" replace />
    }

    if (
      restoring ||
      recoveryFailed ||
      (requireReservation && !hasReservation)
    ) {
      return renderRecovery()
    }

    return element
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
            element={guardReservationPage(
              <ReservationPage onCreateHold={handleCreateHold} />
            )}
          />

          {/* 예약 정보 확인 */}
          <Route
            path="/reservations/confirm"
            element={guardReservationPage(
              reservation?.reservationStatus === 'CONFIRMED' ? (
                <Navigate
                  to="/reservations/complete"
                  replace
                />
              ) : (
                <ReservationConfirm
                  reservationId={reservation?.reservationId}
                  reservationStatus={
                    reservation?.reservationStatus
                  }
                  expiresAt={reservation?.expiresAt}
                  selectedDate={reservation?.date}
                  selectedTime={reservation?.time}
                  peopleCount={reservation?.peopleCount}
                  submitting={submitting}
                  checkingStatus={checkingStatus}
                  error={reservationError}
                  onBack={handleSelectAgain}
                  onConfirm={handleReservationComplete}
                  onCheckStatus={handleCheckStatus}
                />
              ),
              true
            )}
          />

          {/* 예약 완료 */}
          <Route
            path="/reservations/complete"
            element={guardReservationPage(
              reservation?.reservationStatus === 'CONFIRMED' ? (
                <ReservationComplete
                  selectedDate={reservation?.date}
                  selectedTime={reservation?.time}
                  peopleCount={reservation?.peopleCount}
                  reservationNumber={
                    reservation?.reservationId
                  }
                  reservationStatus={
                    reservation?.reservationStatus
                  }
                  qrVersion={qrVersion}
                  busy={managing || checkingStatus}
                  error={reservationError}
                  onChange={handleOpenEdit}
                  onCancel={handleCancelReservation}
                  onCheckStatus={handleCheckStatus}
                  onGoHome={() => navigate('/')}
                />
              ) : (
                <Navigate
                  to="/reservations/confirm"
                  replace
                />
              ),
              true
            )}
          />

          {/* 예약 변경 */}
          <Route
            path="/reservations/edit"
            element={guardReservationPage(
              reservation?.reservationStatus === 'CONFIRMED' ? (
                <ReservationEdit
                  key={`${reservation?.owner}:${reservation?.reservationId}:${qrVersion}`}
                  reservation={reservation}
                  busy={managing || checkingStatus}
                  onSave={handleUpdateReservation}
                  onBack={handleCheckStatus}
                />
              ) : (
                <Navigate to="/reservations/confirm" replace />
              ),
              true
            )}
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