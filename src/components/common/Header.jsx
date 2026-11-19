import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import HeaderSearch from './HeaderSearch.jsx'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const location = useLocation()

  // 경로 변경·화면 확장 시 모바일 메뉴 닫기
  useEffect(() => { setMenuOpen(false) }, [location.pathname, location.search])
  useEffect(() => {
    const viewport = window.matchMedia('(min-width: 769px)')
    function closeWide() { if (viewport.matches) setMenuOpen(false) }
    viewport.addEventListener('change', closeWide)
    return () => viewport.removeEventListener('change', closeWide)
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    function escape(event) {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [menuOpen])

  const mobileMenus = [
    ['/popups', 'calendar', '전체 팝업', '진행 중·오픈 예정 팝업 탐색'],
    ['/nearby', 'location', '주변 팝업', '지역별 팝업 찾기'],
    ['/goods', 'bag', '굿즈샵', '팝업의 다양한 굿즈 둘러보기'],
    ['/my-activities', 'ticket', '내 예약·웨이팅', '예약 확인과 현재 대기 현황'],
    ['/cart', 'cart', '장바구니', '담아 둔 굿즈 확인'],
    [app.currentUser ? '/mypage' : '/login', 'user', app.currentUser ? '마이페이지' : '로그인', app.currentUser ? '내 정보와 계정 관리' : '로그인하고 POPQ 이용하기'],
  ]
  if (app.isAuthenticated && app.currentUser?.role === 'ADMIN') mobileMenus.push(['/admin','admin','관리자 센터','전체 서비스 운영 관리'])
  if (app.isAuthenticated && app.currentUser?.role === 'MANAGER') mobileMenus.push(['/manager','manager','매니저 센터','담당 팝업 예약·현장 운영'])


  return (
    <header className="header pq-header">
      <div className="pq-header-inner">
        {/* 기존 POPQ 로고 */}
        <Link to="/" className="pq-header-logo" aria-label="POPQ 홈">
          <img src="/logo.png" alt="POPQ" />
        </Link>

        <HeaderSearch key={app.isAuthenticated ? app.currentUser.username : 'guest'} authenticated={app.isAuthenticated} />

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
        {/* 모바일 전체 메뉴: 아이콘 옆에 설명을 표시 */}
        <button ref={menuButton} type="button" className="pq-menu-toggle" aria-expanded={menuOpen} aria-controls="pq-mobile-menu" onClick={() => setMenuOpen(value => !value)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">{menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}</svg>
          <span>전체 메뉴</span>
        </button>
      </div>
      {/* 펼침 메뉴는 모달이 아니므로 일반 링크와 키보드 이동을 유지합니다. */}
      <nav id="pq-mobile-menu" className="pq-mobile-menu" aria-label="전체 메뉴" hidden={!menuOpen}>
        {mobileMenus.map(([to, icon, label, description]) => <Link key={to} to={to} onClick={() => setMenuOpen(false)}><span className="pq-mobile-menu-icon"><PopqIcon name={icon} size={23} /></span><span><strong>{label}</strong><small>{description}</small></span><span className="pq-mobile-menu-arrow" aria-hidden="true">›</span></Link>)}
      </nav>
    </header>
  )
}