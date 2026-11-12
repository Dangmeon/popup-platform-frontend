import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import PopqIcon from './PopqIcon.jsx'
import './Header.css'

// 상단 아이콘 링크
function HeaderLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `pq-header-action${isActive ? ' is-active' : ''}`
      }
      aria-label={label}
      title={label}
    >
      <PopqIcon name={icon} />
      <span className="pq-header-tooltip" aria-hidden="true">
        {label}
      </span>
    </NavLink>
  )
}

export default function Header() {
  const app = useApp()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  // 검색어를 팝업 목록 주소로 전달
  function handleSearch(event) {
    event.preventDefault()
    const query = keyword.trim()

    navigate(
      query ? `/popups?q=${encodeURIComponent(query)}` : '/popups'
    )
  }


  return (
    <header className="header pq-header">
      <div className="pq-header-inner">
        {/* 기존 POPQ 로고 */}
        <Link to="/" className="pq-header-logo" aria-label="POPQ 홈">
          <img src="/logo.png" alt="POPQ" />
        </Link>

        {/* 검색창과 검색 버튼 */}
        <form
          className="pq-header-search"
          role="search"
          onSubmit={handleSearch}
        >
          <input
            type="search"
            aria-label="팝업스토어 검색"
            placeholder="어떤 팝업을 찾으세요?"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button type="submit" aria-label="검색" title="검색">
            <PopqIcon name="search" size={18} />
          </button>
        </form>

        {/* 팝업·굿즈·예약·장바구니 메뉴 */}
        <nav className="pq-header-actions" aria-label="주요 메뉴">
          <HeaderLink to="/popups" icon="calendar" label="팝업 탐색" />
          <HeaderLink to="/my-activities" icon="ticket" label="내 예약·웨이팅" />
          <HeaderLink to="/cart" icon="cart" label="장바구니" />


          {app.currentUser ? (
            <>
              <HeaderLink
                to="/mypage"
                icon="user"
                label="마이페이지"
              />
              {/* 중절모와 넥타이 아이콘: ADMIN 전용 관리자 화면 */}
              {app.isAuthenticated && app.currentUser?.role === 'ADMIN' && (
                <HeaderLink
                  to="/admin"
                  icon="admin"
                  label="관리자 모드"
                />
              )}
              {/* ADMIN과 같은 위치에 모자 없는 매니저 아이콘 */}
              {app.isAuthenticated && app.currentUser?.role === 'MANAGER' && (
                <HeaderLink to="/manager" icon="manager" label="매니저 모드" />
              )}
            </>
          ) : (
            <HeaderLink to="/login" icon="user" label="로그인" />
          )}
        </nav>
      </div>
    </header>
  )
}