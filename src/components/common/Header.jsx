import { useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { keywordSuggestions } from '../../data/sampleData.js'
import { useApp } from '../../context/AppContext.jsx'
import './Header.css'

export default function Header() {
  const app = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [keyword, setKeyword] = useState('')

  // 메인 화면 확인
  const isHomePage = location.pathname === '/'

  // 로그아웃
  function handleLogout() {
    app.logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="container header-top">
        {/* 로고 */}
        <Link
          to="/"
          className="logo-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '90px',
            overflow: 'visible',
          }}
        >
          <img
            src="/logo.png"
            alt="POPQ"
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Link>

        {/* 검색 입력 */}
        <form
          className="search-box"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            aria-label="팝업스토어, 브랜드, 지역 검색"
            placeholder="팝업스토어, 브랜드, 지역을 검색해보세요"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </form>

        {/* 회원 메뉴 */}
        <div className="header-actions">
          <Link to="/cart" className="icon-btn">
            장바구니
          </Link>
          <Link to="/mypage" className="icon-btn">
            마이페이지
          </Link>

          {app.currentUser ? (
            <>
              <span
                className="icon-btn"
                style={{ cursor: 'default' }}
              >
                {app.currentUser.name}님
              </span>

              <button
                type="button"
                className="icon-btn"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="icon-btn">
                로그인
              </Link>
              <Link to="/signup" className="icon-btn">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 추천 검색어 */}
      <div className="container keyword-row">
        {keywordSuggestions.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            className="keyword-chip"
            onClick={() => setKeyword(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* 메인 팝업 목록 이동 */}
      {isHomePage && (
        <div className="container header-nav">
          <Link to="/popups" className="hd-discover">
            팝업 발견
          </Link>
        </div>
      )}
    </header>
  )
}