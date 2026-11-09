import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import './Header.css'

export default function Header(){
  const app = useApp()
  const nav = useNavigate()
  const [keyword, setKeyword] = useState('')

  function handleLogout(){
    app.logout()
    nav('/')
  }

  // 검색: 팝업 목록으로 이동하면서 검색어를 주소에 담는다
  function goSearch(word){
    const q = word.trim()
    nav(q ? `/popups?q=${encodeURIComponent(q)}` : '/popups')
  }

  function handleSearch(e){
    e.preventDefault()
    goSearch(keyword)
  }

  return (
    <header className="header">
      <div className="container header-top">
        <Link
          to="/"
          className="logo-link"
          style={{ display: 'inline-flex', alignItems: 'center', height: '90px', overflow: 'visible' }}
        >
          <img
            src="/logo.png"
            alt="POPQ"
            style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </Link>
        <form className="search-box" onSubmit={handleSearch}>
          <input
            placeholder="팝업스토어, 브랜드, 지역을 검색해보세요"
            value={keyword}
            onChange={e=>setKeyword(e.target.value)}
          />
        </form>
        <div className="header-actions">
          <Link to="/cart" className="icon-btn">장바구니</Link>
          <Link to="/mypage" className="icon-btn">마이페이지</Link>
          {app.currentUser ? (
            <>
              <span className="icon-btn" style={{cursor:'default'}}>{app.currentUser.name}님</span>
              <button className="icon-btn" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="icon-btn">로그인</Link>
              <Link to="/signup" className="icon-btn">회원가입</Link>
            </>
          )}
        </div>
      </div>
      <div className="container header-nav">
        <Link to="/popups" className="hd-discover"> 팝업 발견</Link>
        <Link to="/goods" className="hd-discover"> 굿즈샵</Link>
      </div>
    </header>
  )
}