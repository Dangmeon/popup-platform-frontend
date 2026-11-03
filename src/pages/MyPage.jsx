import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { featuredPopups } from '../data/featuredPopups.js'
import { getPopups } from '../api/popupApi'
import { getMyReservations } from '../api/mypageApi'
import {
  getWaiting,
  cancelWaiting as cancelWaitingApi,
} from '../api/waitingApi'
import { loadWaitingIds } from '../utils/waitingStore'

// 예약 상태
const reservationStatuses = {
  HOLD: '확정 대기',
  CONFIRMED: '예약 확정',
  CANCELLED: '예약 취소',
  USED: '이용 완료',
  VISITED: '방문 완료',
  EXPIRED: '예약 만료',
}

// 웨이팅 상태
const waitingStatuses = {
  WAITING: '대기 중',
  CALLED: '호출 완료',
  ENTERED: '입장 완료',
  CANCELLED: '대기 취소',
  EXPIRED: '호출 만료',
}

// 오류 안내
function getErrorMessage(error, fallback) {
  if (error.response?.status === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (error.response?.status === 403) {
    return '조회하거나 처리할 권한이 없습니다.'
  }

  const message = error.response?.data?.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (!error.response && error.request) {
    return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return error.message || fallback
}

// 예약 응답 변환
function normalizeReservation(item) {
  // 나중에 확인할 부분: 내 예약 목록 API의 최종 응답 필드
  return {
    id: item.reservationId ?? item.id,
    popId: item.popId ?? item.popupId,
    popupName: item.popupName,
    popupImage: item.popupImage,
    date: item.slotDate ?? item.visitDate ?? item.reservationDate,
    time: item.startTime ?? item.timeSlot ?? item.slotStartTime,
    peopleCount: item.peopleCount ?? item.headcount ?? item.people,
    status: item.reservationStatus ?? item.status,
  }
}

export default function MyPage() {
  const app = useApp()
  const [tab, setTab] = useState('reservations')
  const [retryKey, setRetryKey] = useState(0)

  const username = app.isAuthenticated
    ? app.currentUser?.username
    : null

  const currentUsername = useRef(username)
  currentUsername.current = username

  // 서버 조회 결과
  const [serverState, setServerState] = useState({
    owner: null,
    reservations: [],
    waitings: [],
    popups: [],
    reservationLoading: false,
    waitingLoading: false,
    reservationError: '',
    waitingError: '',
  })

  // 웨이팅 취소
  const [cancelState, setCancelState] = useState({
    owner: null,
    id: null,
    error: '',
  })
  const cancelLock = useRef(false)

  // 서버 내역 조회
  useEffect(() => {
    if (!username) return

    let active = true

    setServerState({
      owner: username,
      reservations: [],
      waitings: [],
      popups: [],
      reservationLoading: true,
      waitingLoading: true,
      reservationError: '',
      waitingError: '',
    })

    async function loadReservations() {
      try {
        const items = await getMyReservations()

        if (!Array.isArray(items)) {
          throw new Error('예약 목록 응답 형식을 확인해 주세요.')
        }

        if (!active) return

        setServerState((previous) => ({
          ...previous,
          reservations: items.map(normalizeReservation),
          reservationLoading: false,
        }))
      } catch (error) {
        if (!active) return

        setServerState((previous) => ({
          ...previous,
          reservations: [],
          reservationLoading: false,
          reservationError: getErrorMessage(
            error,
            '예약 내역을 불러오지 못했습니다.'
          ),
        }))
      }
    }

    async function loadWaitings() {
      try {
        const ids = loadWaitingIds(username)
        const results = await Promise.allSettled(
          ids.map((id) => getWaiting(id))
        )

        if (!active) return

        const items = results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value)

        const failed = results.find(
          (result) => result.status === 'rejected'
        )

        setServerState((previous) => ({
          ...previous,
          waitings: items,
          waitingLoading: false,
          waitingError: failed
            ? getErrorMessage(
                failed.reason,
                '일부 웨이팅 내역을 불러오지 못했습니다.'
              )
            : '',
        }))
      } catch (error) {
        if (!active) return

        setServerState((previous) => ({
          ...previous,
          waitings: [],
          waitingLoading: false,
          waitingError: getErrorMessage(
            error,
            '웨이팅 내역을 불러오지 못했습니다.'
          ),
        }))
      }
    }

    async function loadPopupNames() {
      try {
        const items = await getPopups()

        if (!active) return

        setServerState((previous) => ({
          ...previous,
          popups: Array.isArray(items) ? items : [],
        }))
      } catch {
        // 팝업 조회 실패 시 예약 정보 또는 팝업 번호 표시
      }
    }

    loadReservations()
    loadWaitings()
    loadPopupNames()

    return () => {
      active = false
    }
  }, [username, retryKey])

  // 현재 계정의 결과만 표시
  const ownsResult =
    Boolean(username) && serverState.owner === username

  const reservations = ownsResult
    ? serverState.reservations
    : []
  const waitings = ownsResult ? serverState.waitings : []
  const reservationLoading =
    Boolean(username) &&
    (!ownsResult || serverState.reservationLoading)
  const waitingLoading =
    Boolean(username) &&
    (!ownsResult || serverState.waitingLoading)

  // 실제 팝업 정보
  function findServerPopup(popId) {
    if (!ownsResult) return null

    return serverState.popups.find(
      (popup) => String(popup.id) === String(popId)
    )
  }

  // 데모 팝업 정보
  function findDemoPopup(popId) {
    return (
      app.popups.find(
        (popup) => String(popup.id) === String(popId)
      ) ||
      featuredPopups.find(
        (popup) => String(popup.id) === String(popId)
      )
    )
  }

  // 서버 웨이팅 취소
  async function handleCancelWaiting(waitingId) {
    if (!username || cancelLock.current) return

    if (!window.confirm('현장 대기를 취소하시겠습니까?')) {
      return
    }

    const owner = username
    cancelLock.current = true
    setCancelState({ owner, id: waitingId, error: '' })

    try {
      const result = await cancelWaitingApi(waitingId)

      if (
        result?.waitingId !== waitingId ||
        typeof result?.status !== 'string'
      ) {
        throw new Error('웨이팅 취소 응답을 확인할 수 없습니다.')
      }

      if (currentUsername.current !== owner) return

      setServerState((previous) =>
        previous.owner === owner
          ? {
              ...previous,
              waitings: previous.waitings.map((waiting) =>
                waiting.waitingId === waitingId
                  ? result
                  : waiting
              ),
            }
          : previous
      )

      if (result.status === 'CANCELLED') {
        app.showToast('대기가 취소되었습니다.')
      } else {
        setCancelState({
          owner,
          id: null,
          error: '서버에서 반환한 대기 상태를 확인해 주세요.',
        })
      }
    } catch (error) {
      if (currentUsername.current !== owner) return

      setCancelState({
        owner,
        id: null,
        error: getErrorMessage(
          error,
          '취소 결과를 확인하지 못했습니다. 내역을 다시 조회해 주세요.'
        ),
      })
    } finally {
      cancelLock.current = false

      if (currentUsername.current === owner) {
        setCancelState((previous) => ({
          ...previous,
          id: null,
        }))
      }
    }
  }

  if (!app.currentUser) {
    return (
      <div className="container empty-state">
        <p>로그인이 필요합니다.</p>
        <Link
          to="/login"
          className="btn btn-primary"
          style={{ marginTop: 16, display: 'inline-block' }}
        >
          로그인하기
        </Link>
      </div>
    )
  }

  const myDemoReservations = app.reservations.filter(
    (reservation) =>
      Boolean(app.currentUser.email) &&
      reservation.memberEmail === app.currentUser.email
  )

  const legacyReservations = app.reservations.filter(
    (reservation) => !reservation.memberEmail
  )

  // 데모 예약 표시
  function renderDemoReservation(reservation) {
    const popup = findDemoPopup(reservation.popupId)
    const image = popup?.image || popup?.poster

    return (
      <div className="cart-row" key={reservation.id}>
        {image && <img src={image} alt={popup?.title || '팝업'} />}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card-title">
            {popup?.title || '팝업 정보 없음'}
          </div>
          <div className="card-sub">
            {reservation.visitDate || '날짜 정보 없음'}
            {' · '}
            {reservation.timeSlot || '시간 정보 없음'}
            {' · '}
            {reservation.peopleCount}명
          </div>
          <div className="card-sub">
            상태: {reservationStatuses[reservation.status] ||
              reservation.status}
          </div>
          <div className="card-sub" style={{ overflowWrap: 'anywhere' }}>
            예약번호: {reservation.number || reservation.id}
          </div>
          <div className="card-sub">
            데모 기록 · 실제 입장용 예약이 아닙니다.
          </div>
        </div>

        {reservation.status === 'HOLD' && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => app.cancelReservation(reservation.id)}
          >
            데모 취소
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-title">마이페이지</div>

      <p className="card-sub">
        {app.currentUser.name}님
        {' '}
        ({app.currentUser.email ?? app.currentUser.username ?? '데모 계정'})
      </p>

      <Link
        to="/mypage/account"
        className="btn btn-outline"
        style={{ display: 'inline-block', marginTop: 12 }}
      >
        내 정보 관리
      </Link>

      {/* 내역 선택 */}
      <div className="tabs" style={{ marginTop: 24 }}>
        {[
          ['reservations', '내 예약'],
          ['waitings', '내 웨이팅'],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={`tab-btn ${tab === value ? 'active' : ''}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {username && (
        <button
          type="button"
          className="btn btn-outline"
          disabled={
            reservationLoading ||
            waitingLoading ||
            cancelLock.current
          }
          onClick={() => setRetryKey((previous) => previous + 1)}
        >
          내역 다시 조회
        </button>
      )}

      {/* 서버 예약 내역 */}
      {tab === 'reservations' && username && (
        <>
          {reservationLoading ? (
            <p role="status">예약 내역을 불러오는 중입니다.</p>
          ) : serverState.reservationError ? (
            <p role="alert">{serverState.reservationError}</p>
          ) : reservations.length === 0 ? (
            <div className="empty-state">예약 내역이 없습니다.</div>
          ) : (
            reservations.map((reservation) => {
              const popup = findServerPopup(reservation.popId)
              const image = reservation.popupImage || popup?.image

              return (
                <div className="cart-row" key={reservation.id}>
                  {image && (
                    <img
                      src={image}
                      alt={reservation.popupName || popup?.title || '팝업'}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="card-title">
                      {reservation.popupName ||
                        popup?.title ||
                        `팝업 ${reservation.popId ?? ''}`}
                    </div>
                    <div className="card-sub">
                      {reservation.date || '날짜 정보 없음'}
                      {' · '}
                      {reservation.time || '시간 정보 없음'}
                      {' · '}
                      {reservation.peopleCount ?? '-'}명
                    </div>
                    <div className="card-sub">
                      상태: {reservationStatuses[reservation.status] ||
                        reservation.status || '확인 필요'}
                    </div>
                    <div className="card-sub">
                      예약번호: {reservation.id ?? '확인 필요'}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      {/* 데모 예약 내역 */}
      {tab === 'reservations' && !username && (
        <>
          <p className="card-sub">
            이 브라우저에 저장된 데모 예약 내역입니다.
          </p>

          {myDemoReservations.length === 0 ? (
            <div className="empty-state">
              현재 계정의 데모 예약 내역이 없습니다.
            </div>
          ) : (
            myDemoReservations.map(renderDemoReservation)
          )}

          {legacyReservations.length > 0 && (
            <section>
              <h2 className="section-title">이전 브라우저 데모 기록</h2>
              <p className="card-sub">
                회원 정보 없이 저장된 기록으로 현재 회원의 예약인지
                확인할 수 없습니다.
              </p>
              {legacyReservations.map(renderDemoReservation)}
            </section>
          )}
        </>
      )}

      {/* 서버 웨이팅 내역 */}
      {tab === 'waitings' && username && (
        <>
          <p className="card-sub">
            현재 계정으로 이 브라우저에서 등록한 웨이팅을 조회합니다.
            다른 기기에서 등록한 내역까지 조회하는 기능은 아닙니다.
          </p>

          {ownsResult && serverState.waitingError && (
            <p role="alert">{serverState.waitingError}</p>
          )}

          {cancelState.owner === username && cancelState.error && (
            <p role="alert">{cancelState.error}</p>
          )}

          {waitingLoading ? (
            <p role="status">웨이팅 내역을 불러오는 중입니다.</p>
          ) : waitings.length === 0 ? (
            <div className="empty-state">
              표시할 웨이팅 내역이 없습니다.
            </div>
          ) : (
            waitings.map((waiting) => {
              const popup = findServerPopup(waiting.popId)

              return (
                <div className="cart-row" key={waiting.waitingId}>
                  {popup?.image && (
                    <img src={popup.image} alt={popup.title || '팝업'} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="card-title">
                      {popup?.title || `팝업 ${waiting.popId}`}
                    </div>
                    <div className="card-sub">
                      대기번호 {waiting.queueNumber}번
                      {' · '}
                      {waiting.peopleCount}명
                    </div>
                    <div className="card-sub">
                      상태: {waitingStatuses[waiting.status] || waiting.status}
                    </div>

                    {waiting.status === 'WAITING' && (
                      <div className="card-sub">
                        앞에 {waiting.teamsAhead ?? '-'}팀
                        {' · '}
                        예상 {waiting.estimatedWaitMins ?? '-'}분
                      </div>
                    )}

                    <div className="card-sub">
                      체크인 코드: {waiting.checkInCode || '-'}
                    </div>
                  </div>

                  {waiting.status === 'WAITING' && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={
                        cancelState.owner === username &&
                        cancelState.id !== null
                      }
                      onClick={() => handleCancelWaiting(waiting.waitingId)}
                    >
                      {cancelState.owner === username &&
                      cancelState.id === waiting.waitingId
                        ? '취소 중…'
                        : '대기 취소'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </>
      )}

      {/* 데모 웨이팅 내역 */}
      {tab === 'waitings' && !username && (
        <>
          <p className="card-sub">
            회원 구분 정보가 없는 기존 브라우저 데모 기록입니다.
          </p>

          {app.waitings.length === 0 ? (
            <div className="empty-state">웨이팅 내역이 없습니다.</div>
          ) : (
            app.waitings.map((waiting) => {
              const popup = findDemoPopup(waiting.popupId)
              const image = popup?.image || popup?.poster

              return (
                <div className="cart-row" key={waiting.id}>
                  {image && <img src={image} alt={popup?.title || '팝업'} />}

                  <div style={{ flex: 1 }}>
                    <div className="card-title">
                      {popup?.title || '팝업 정보 없음'}
                    </div>
                    <div className="card-sub">
                      대기번호 {waiting.queueNumber}번
                      {' · '}
                      {waiting.peopleCount}명
                    </div>
                    <div className="card-sub">
                      상태: {waitingStatuses[waiting.status] || waiting.status}
                    </div>
                  </div>

                  {waiting.status === 'WAITING' && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => app.cancelWaiting(waiting.id)}
                    >
                      데모 취소
                    </button>
                  )}
                </div>
              )
            })
          )}
        </>
      )}
    </div>
  )
}