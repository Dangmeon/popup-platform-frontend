import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { featuredPopups } from '../data/featuredPopups.js'

// 예약 상태 표시
const reservationStatuses = {
  HOLD: '확정 대기',
  CONFIRMED: '예약 확정',
  CANCELLED: '예약 취소',
  VISITED: '방문 완료',
  EXPIRED: '예약 만료',
}

// 웨이팅 상태 표시
const waitingStatuses = {
  WAITING: '대기 중',
  CALLED: '호출 완료',
  ENTERED: '입장 완료',
  CANCELLED: '대기 취소',
  EXPIRED: '호출 만료',
}

export default function MyPage() {
  const app = useApp()
  const [tab, setTab] = useState('reservations')

  if (!app.currentUser) {
    return (
      <div className="container empty-state">
        <p>로그인이 필요합니다.</p>
        <Link
          to="/login"
          className="btn btn-primary"
          style={{
            marginTop: 16,
            display: 'inline-block',
          }}
        >
          로그인하기
        </Link>
      </div>
    )
  }

  // 팝업 정보 조회
  function findPopup(popupId) {
    return (
      app.popups.find(
        (popup) => String(popup.id) === String(popupId)
      ) ||
      featuredPopups.find(
        (popup) => String(popup.id) === String(popupId)
      )
    )
  }

  // 로그인 회원의 예약
  const myReservations = app.reservations.filter(
    (reservation) =>
      reservation.memberEmail === app.currentUser.email
  )

  // 소유자 정보가 없는 이전 기록
  const legacyReservations = app.reservations.filter(
    (reservation) => !reservation.memberEmail
  )

  // 예약 내역 표시
  function renderReservation(reservation) {
    const popup = findPopup(reservation.popupId)
    const image = popup?.image || popup?.poster

    return (
      <div className="cart-row" key={reservation.id}>
        {image && (
          <img
            src={image}
            alt={popup?.title || '팝업 이미지'}
          />
        )}

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
            상태:{' '}
            {reservationStatuses[reservation.status] ||
              reservation.status}
          </div>

          <div
            className="card-sub"
            style={{ overflowWrap: 'anywhere' }}
          >
            예약번호: {reservation.number || reservation.id}
          </div>

          {reservation.isDemo && (
            <div className="card-sub">
              데모 기록 · 실제 입장용 예약이 아닙니다.
            </div>
          )}
        </div>

        {reservation.status === 'HOLD' && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => app.cancelReservation(reservation.id)}
          >
            취소
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-title">마이페이지</div>

      <p className="card-sub">
        {app.currentUser.name}님 ({app.currentUser.email})
      </p>

      <Link
        to="/mypage/account"
        className="btn btn-outline"
        style={{
          display: 'inline-block',
          marginTop: 12,
        }}
      >
        내 정보 관리
      </Link>

      {/* 내역 선택 */}
      <div className="tabs" style={{ marginTop: 24 }}>
        <button
          type="button"
          className={`tab-btn ${
            tab === 'reservations' ? 'active' : ''
          }`}
          onClick={() => setTab('reservations')}
        >
          내 예약
        </button>

        <button
          type="button"
          className={`tab-btn ${
            tab === 'waitings' ? 'active' : ''
          }`}
          onClick={() => setTab('waitings')}
        >
          내 웨이팅
        </button>
      </div>

      {/* 예약 내역 */}
      {tab === 'reservations' && (
        <>
          {/* 나중에 바꿀 부분: 서버의 로그인 회원 예약 조회 API로 교체 */}
          <p className="card-sub">
            이 브라우저에 저장된 데모 내역입니다.
            실제 예약 여부는 서버와 연결되지 않습니다.
          </p>

          {myReservations.length === 0 ? (
            <div className="empty-state">
              현재 계정의 데모 예약 내역이 없습니다.
            </div>
          ) : (
            myReservations.map(renderReservation)
          )}

          {/* 이전 기록 */}
          {legacyReservations.length > 0 && (
            <section>
              <h2 className="section-title">이전 브라우저 데모 기록</h2>

              <p className="card-sub">
                아래 기록은 회원 정보 없이 저장된 이전 데이터입니다.
                현재 로그인한 회원의 예약인지 확인할 수 없습니다.
              </p>

              {legacyReservations.map(renderReservation)}
            </section>
          )}
        </>
      )}

      {/* 웨이팅 내역 */}
      {tab === 'waitings' && (
        <>
          {/* 나중에 바꿀 부분: 서버의 로그인 회원 웨이팅 조회 API로 교체 */}
          <p className="card-sub">
            기존 현장 대기 데모 기록입니다.
            현재 데이터에는 회원 구분 정보가 없습니다.
          </p>

          {app.waitings.length === 0 ? (
            <div className="empty-state">
              웨이팅 내역이 없어요.
            </div>
          ) : (
            app.waitings.map((waiting) => {
              const popup = findPopup(waiting.popupId)
              const image = popup?.image || popup?.poster

              return (
                <div className="cart-row" key={waiting.id}>
                  {image && (
                    <img
                      src={image}
                      alt={popup?.title || '팝업 이미지'}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="card-title">
                      {popup?.title || '팝업 정보 없음'}
                    </div>

                    <div className="card-sub">
                      대기번호 {waiting.queueNumber}번
                      {' · '}
                      {waiting.peopleCount}명
                    </div>

                    <div className="card-sub">
                      상태:{' '}
                      {waitingStatuses[waiting.status] ||
                        waiting.status}
                    </div>
                  </div>

                  {waiting.status === 'WAITING' && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => app.cancelWaiting(waiting.id)}
                    >
                      취소
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