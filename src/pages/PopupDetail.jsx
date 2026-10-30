import { useState } from 'react'
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

function BasicPopupDetail() {
  const { popupId } = useParams()
  const navigate = useNavigate()
  const app = useApp()

  // 팝업 정보
  const popup = app.popups.find(
    (item) => String(item.id) === String(popupId)
  )

  // 방문 인원 및 현장 대기
  const [peopleCount, setPeopleCount] = useState(1)
  const [myWaitingId, setMyWaitingId] = useState(null)

  if (!popup) {
    return (
      <div className="container empty-state">
        존재하지 않는 팝업입니다.{' '}
        <Link to="/popups">목록으로</Link>
      </div>
    )
  }

  const popupGoods = app.products.filter(
    (product) => product.popupId === popup.id
  )

  const myWaiting = app.waitings.find(
    (waiting) => waiting.id === myWaitingId
  )

  // 예약 화면 이동
  function handleReserve() {
    if (!app.currentUser) {
      app.showToast('로그인이 필요합니다')
      return
    }

    navigate(`/popups/${popup.id}/reserve`, {
      state: { peopleCount },
    })
  }

  // 현장 대기 등록
  function handleWaiting() {
    if (!app.currentUser) {
      app.showToast('로그인이 필요합니다')
      return
    }

    const waitingId = app.registerWaiting(popup.id, peopleCount)
    setMyWaitingId(waitingId)
    app.showToast('현장 대기열에 등록되었어요')
  }

  return (
    <div className="container">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          marginTop: 24,
        }}
      >
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

            <CongestionBar
              reserved={popup.reserved}
              capacity={popup.capacity}
            />

            <div className="card-sub">
              {popup.reserved} / {popup.capacity}명 예약
            </div>
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
                  onClick={() => setPeopleCount((count) => count + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <p className="card-sub">
              다음 화면에서 방문 날짜와 시간을 선택해 주세요.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleReserve}
            >
              날짜·시간 선택하기
            </button>
          </div>

          {/* 현장 대기 */}
          <div
            className="form-box"
            style={{ margin: '16px 0 0', maxWidth: '100%' }}
          >
            <h2 style={{ fontSize: 18 }}>현장 대기 등록</h2>

            {!myWaiting ? (
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={handleWaiting}
              >
                현장 대기 등록하기
              </button>
            ) : myWaiting.status === 'WAITING' ? (
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
                  체크인 코드: <strong>{myWaiting.checkinCode}</strong>
                </p>

                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 12 }}
                  onClick={() => app.cancelWaiting(myWaiting.id)}
                >
                  대기 취소
                </button>
              </div>
            ) : (
              <p className="card-sub">대기가 취소되었습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* 판매 굿즈 */}
      {popupGoods.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 48 }}>
            🛍️ 판매 굿즈
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

  const featured = featuredPopups.find(
    (popup) => String(popup.id) === String(popupId)
  )

  return featured ? (
    <FeaturedPopupDetail popup={featured} />
  ) : (
    <BasicPopupDetail key={popupId} />
  )
}