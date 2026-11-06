import { useEffect, useRef, useState } from 'react'
import {
  useParams,
  useNavigate,
  Link,
} from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import CongestionBar from '../components/common/CongestionBar.jsx'
import GoodsCard from '../components/common/GoodsCard.jsx'
import FeaturedPopupDetail from './FeaturedPopupDetail.jsx'
import { featuredPopups } from '../data/featuredPopups.js'
import { usePopup, usePopupProducts } from '../hooks/usePopups'
import {
  createWaiting,
  cancelWaiting as cancelWaitingApi,
} from '../api/waitingApi.js'
import { addWaitingId } from '../utils/waitingStore.js'

// 웨이팅 상태
const waitingStatuses = {
  WAITING: '대기 중',
  CALLED: '호출 완료',
  ENTERED: '입장 완료',
  CANCELLED: '대기 취소',
  EXPIRED: '호출 만료',
}

// 요청 오류 안내
function getWaitingError(error) {
  if (error.response?.status === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (error.response?.status === 403) {
    return '현장 대기를 처리할 권한이 없습니다.'
  }

  const message = error.response?.data?.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (!error.response && error.request) {
    return '서버 응답을 받지 못했습니다. 등록 또는 취소가 처리됐을 수 있으니 결과 확인 후 다시 진행해 주세요.'
  }

  return error.message || '현장 대기 요청을 처리하지 못했습니다.'
}

function BasicPopupDetail() {
  const { popupId } = useParams()
  const navigate = useNavigate()
  const app = useApp()

  // 서버 팝업 및 굿즈
  const { data: popup, loading, error } = usePopup(popupId)
  const {
    data: productsData,
    loading: goodsLoading,
    error: goodsError,
  } = usePopupProducts(popupId)

  const popupGoods = Array.isArray(productsData)
    ? productsData
    : []

  // 예약 인원
  const [peopleCount, setPeopleCount] = useState(1)

  // 현장 대기
  const [waitingPeopleCount, setWaitingPeopleCount] = useState('1')
  const [phone, setPhone] = useState('')
  const [myWaiting, setMyWaiting] = useState(null)
  const [waitingError, setWaitingError] = useState('')
  const [waitingNotice, setWaitingNotice] = useState('')
  const [waitingLoading, setWaitingLoading] = useState(false)
  const [creationUncertain, setCreationUncertain] = useState(false)

  // 요청 관리
  const requestLock = useRef(false)
  const active = useRef(false)

  useEffect(() => {
    active.current = true

    return () => {
      active.current = false
    }
  }, [])

  const username = app.isAuthenticated
    ? app.currentUser?.username
    : null

  const popId = Number(popup?.id)
  const validPopId =
    Number.isSafeInteger(popId) && popId > 0

  // 예약 화면 이동
  function handleReserve() {
    if (!username) {
      app.showToast('로그인 후 예약해 주세요.')
      navigate('/login')
      return
    }

    if (!validPopId) {
      app.showToast('서버의 팝업 ID를 확인할 수 없습니다.')
      return
    }

    navigate(`/popups/${popId}/reserve`, {
      state: { peopleCount },
    })
  }

  // 현장 대기 등록
  async function handleWaiting() {
    if (requestLock.current || creationUncertain) return

    if (!username) {
      app.showToast('로그인 후 현장 대기를 등록해 주세요.')
      navigate('/login')
      return
    }

    if (!validPopId) {
      setWaitingError('서버의 팝업 ID를 확인할 수 없습니다.')
      return
    }

    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim())) {
      setWaitingError('휴대폰 번호를 올바르게 입력해 주세요.')
      return
    }

    const count = Number(waitingPeopleCount)

    if (!Number.isSafeInteger(count) || count < 1) {
      setWaitingError('대기 인원은 1 이상의 정수로 입력해 주세요.')
      return
    }

    requestLock.current = true
    setWaitingLoading(true)
    setWaitingError('')
    setWaitingNotice('')

    let receivedResponse = false

    try {
      const data = await createWaiting({
        popId,
        phone: phone.trim(),
        peopleCount: count,
      })

      receivedResponse = true

      if (
        !Number.isSafeInteger(data?.waitingId) ||
        data.waitingId < 1 ||
        typeof data.status !== 'string'
      ) {
        throw new Error('웨이팅 등록 응답을 확인할 수 없습니다.')
      }

      // 서버 등록과 브라우저 기록 구분
      let saved = true

      try {
        addWaitingId(data.waitingId, username)
      } catch {
        saved = false
      }

      if (!active.current) return

      setMyWaiting(data)

      if (!saved) {
        setWaitingNotice(
          `서버 등록은 완료됐지만 브라우저에 기록하지 못했습니다. 접수 ID ${data.waitingId}와 대기번호를 기록해 주세요.`
        )
      }

      app.showToast('현장 대기 등록 결과를 확인해 주세요.')
    } catch (requestError) {
      if (!active.current) return

      if (
        receivedResponse ||
        (!requestError.response && requestError.request) ||
        requestError.response?.status >= 500
      ) {
        setCreationUncertain(true)
      }

      setWaitingError(getWaitingError(requestError))
    } finally {
      requestLock.current = false

      if (active.current) {
        setWaitingLoading(false)
      }
    }
  }

  // 현장 대기 취소
  async function handleCancelWaiting() {
    if (
      requestLock.current ||
      !username ||
      myWaiting?.status !== 'WAITING'
    ) {
      return
    }

    if (!window.confirm('현장 대기를 취소하시겠습니까?')) {
      return
    }

    requestLock.current = true
    setWaitingLoading(true)
    setWaitingError('')

    try {
      const data = await cancelWaitingApi(myWaiting.waitingId)

      if (
        data?.waitingId !== myWaiting.waitingId ||
        typeof data.status !== 'string'
      ) {
        throw new Error('웨이팅 취소 응답을 확인할 수 없습니다.')
      }

      if (!active.current) return

      setMyWaiting(data)

      if (data.status === 'CANCELLED') {
        app.showToast('현장 대기가 취소되었습니다.')
      } else {
        setWaitingError('서버에서 반환한 현재 상태를 확인해 주세요.')
      }
    } catch (requestError) {
      if (active.current) {
        setWaitingError(getWaitingError(requestError))
      }
    } finally {
      requestLock.current = false

      if (active.current) {
        setWaitingLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="container empty-state" role="status">
        팝업 정보를 불러오는 중입니다.
      </div>
    )
  }

  if (error || !popup) {
    return (
      <div className="container empty-state">
        <p role="alert">
          {error || '존재하지 않는 팝업입니다.'}
        </p>
        <Link to="/popups">목록으로</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 32,
          marginTop: 24,
        }}
      >
        <div>
          {popup.image && (
            <img
              src={popup.image}
              alt={popup.title}
              style={{
                width: '100%',
                borderRadius: 'var(--radius)',
                aspectRatio: '4/3',
                objectFit: 'cover',
              }}
            />
          )}
        </div>

        <div>
          <span className="badge">{popup.category}</span>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: '12px 0 8px',
            }}
          >
            {popup.title}
          </h1>

          <p className="card-sub">{popup.location}</p>
          <p className="card-sub">
            {popup.startDate} ~ {popup.endDate}
          </p>

          {/* 혼잡도 */}
          <div style={{ marginTop: 24 }}>
            <div className="card-sub" style={{ marginBottom: 6 }}>
              현재 혼잡도
            </div>

            {Number(popup.capacity) > 0 ? (
              <>
                <CongestionBar
                  reserved={popup.reserved ?? 0}
                  capacity={popup.capacity}
                />
                <div className="card-sub">
                  {popup.reserved ?? 0} / {popup.capacity}명 예약
                </div>
              </>
            ) : (
              <p className="card-sub">
                현재 혼잡도 정보가 제공되지 않습니다.
              </p>
            )}
          </div>

          {/* 예약 화면 연결 */}
          <div
            className="form-box"
            style={{ margin: '24px 0 0', maxWidth: '100%' }}
          >
            <h2 style={{ fontSize: 18 }}>예약하기</h2>

            <div className="form-group">
              <span>방문 인원</span>

              <div className="qty-box">
                <button
                  type="button"
                  aria-label="방문 인원 줄이기"
                  disabled={peopleCount <= 1}
                  onClick={() =>
                    setPeopleCount((count) => Math.max(1, count - 1))
                  }
                >
                  −
                </button>

                <span aria-live="polite">{peopleCount}명</span>

                <button
                  type="button"
                  aria-label="방문 인원 늘리기"
                  disabled={peopleCount >= 3}
                  onClick={() =>
                    setPeopleCount((count) => Math.min(3, count + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>

            <p className="card-sub">
              예약은 1~3명까지 가능합니다.
              다음 화면에서 날짜와 실제 회차를 선택해 주세요.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={waitingLoading}
              onClick={handleReserve}
            >
              날짜·시간 선택하기
            </button>
          </div>

          {/* 현장 대기 */}
          <div
            className="form-box"
            style={{ margin: '16px 0 0', maxWidth: '100%' }}
            aria-busy={waitingLoading}
          >
            <h2 style={{ fontSize: 18 }}>현장 대기 등록</h2>

            {waitingError && (
              <p className="form-error" role="alert">
                {waitingError}
              </p>
            )}

            {waitingNotice && (
              <p className="card-sub" role="status">
                {waitingNotice}
              </p>
            )}

            {!myWaiting ? (
              <>
                <div className="form-group">
                  <label htmlFor="waiting-phone">휴대폰 번호</label>
                  <input
                    id="waiting-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    disabled={waitingLoading}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="waiting-people">대기 인원</label>
                  <input
                    id="waiting-people"
                    type="number"
                    min="1"
                    step="1"
                    value={waitingPeopleCount}
                    disabled={waitingLoading}
                    onChange={(event) =>
                      setWaitingPeopleCount(event.target.value)
                    }
                  />
                </div>

                {creationUncertain && (
                  <p role="alert">
                    중복 등록을 막기 위해 재등록을 중지했습니다.
                    마이페이지 또는 담당자를 통해 접수 여부를 확인해 주세요.
                  </p>
                )}

                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  disabled={waitingLoading || creationUncertain}
                  onClick={handleWaiting}
                >
                  {waitingLoading ? '등록 중…' : '현장 대기 등록하기'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: 'var(--primary)',
                  }}
                >
                  {myWaiting.queueNumber}번
                </div>

                <p className="card-sub">
                  상태: {waitingStatuses[myWaiting.status] ||
                    myWaiting.status}
                </p>

                {myWaiting.status === 'WAITING' && (
                  <p className="card-sub">
                    앞에 {myWaiting.teamsAhead ?? '-'}팀
                    {' · '}
                    예상 {myWaiting.estimatedWaitMins ?? '-'}분
                  </p>
                )}

                <p className="card-sub">
                  접수 ID: {myWaiting.waitingId}
                </p>

                {['WAITING', 'CALLED'].includes(myWaiting.status) && (
                  <p className="card-sub">
                    체크인 코드: <strong>{myWaiting.checkInCode || '-'}</strong>
                  </p>
                )}

                {myWaiting.status === 'WAITING' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    style={{ marginTop: 12 }}
                    disabled={waitingLoading}
                    onClick={handleCancelWaiting}
                  >
                    {waitingLoading ? '취소 중…' : '대기 취소'}
                  </button>
                )}

                <Link
                  to="/mypage"
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 12 }}
                >
                  마이페이지에서 최신 상태 확인
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 판매 굿즈 */}
      {goodsLoading && (
        <p role="status">굿즈 정보를 불러오는 중입니다.</p>
      )}

      {goodsError && (
        <p className="form-error" role="alert">
          {goodsError}
        </p>
      )}

      {!goodsLoading && !goodsError && popupGoods.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 48 }}>
            판매 굿즈
          </div>

          <div className="grid-4">
            {popupGoods.map((product) => (
              <GoodsCard key={product.id} item={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function PopupDetail() {
  const { popupId } = useParams()
  const app = useApp()

  const featured = featuredPopups.find(
    (popup) => String(popup.id) === String(popupId)
  )

  return featured ? (
    <FeaturedPopupDetail popup={featured} />
  ) : (
    <BasicPopupDetail
      key={`${popupId}:${app.currentUser?.username || app.currentUser?.email || 'guest'}`}
    />
  )
}