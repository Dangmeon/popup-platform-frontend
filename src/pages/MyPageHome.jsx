import React from 'react'
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PopqIcon from '../components/common/PopqIcon.jsx'
import MyOrders from './MyOrders'
import '../styles/MyPageHome.css'
import '../styles/AccountRefine.css'

// 1. 마이페이지 공통 프레임 (사이드바와 프로필 고정, <Outlet />으로 하위 페이지 렌더링)
export function MyPageFrame() {
  const app = useApp()
  const navigate = useNavigate()
  const user = app.currentUser

  if (!user) {
    return (
      <div className="container empty-state">
        로그인이 필요합니다. <Link to="/login">로그인하기</Link>
      </div>
    )
  }

  function logout() {
    app.logout()
    navigate('/', { replace: true })
  }

  const name = user.name || user.username || '회원'

  return (
    <div className="pq-my container">
      <header className="pq-my-profile">
        <span className="pq-my-avatar">{name.slice(0, 1)}</span>
        <div>
          <span className="pq-my-eyebrow">MY POPQ</span>
          <h1>안녕하세요, {name}님</h1>
          <p>나의 팝업 경험을 한곳에서 관리하세요.</p>
        </div>
      </header>

      <div className="pq-my-grid">
        {/* 고정되는 사이드바 메뉴 */}
        <aside className="pq-my-sidebar">
          <nav aria-label="마이페이지 메뉴">
            <NavLink to="/mypage" end>마이페이지 홈</NavLink>
          </nav>
          <button type="button" onClick={logout}>
            <PopqIcon name="logout" size={18} />로그아웃
          </button>
        </aside>

        {/* 메뉴에 따라 바뀌는 오른쪽 콘텐츠 영역 */}
        <section className="pq-my-content">
          <Outlet />
        </section>
      </div>
    </div>
  )
}

// 2. 마이페이지 홈 전용 콘텐츠
export default function MyPageHome() {
  return (
    <div>
      <h2>나의 POPQ</h2>
      <p className="pq-my-muted">회원 정보와 계정 설정을 편하게 관리하세요.</p>
      
      <div className="pq-my-tiles pq-my-single" style={{ marginBottom: '32px' }}>
        <Link to="/mypage/account">
          <span className="pq-my-card-icon"><PopqIcon name="user" size={25} /></span>
          <h3>내 정보 보기</h3>
          <p>이메일·이름·연락처 확인부터 비밀번호 변경까지</p>
          <span>정보 확인하기 →</span>
        </Link>
      </div>

      {/* 주문 내역 컴포넌트 */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
        <MyOrders />
      </div>
    </div>
  )
}