import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/common/Header.jsx'
import Footer from './components/common/Footer.jsx'
import Home from './pages/Home.jsx'
import PopupList from './pages/PopupList.jsx'
import PopupDetail from './pages/PopupDetail.jsx'
import MyPage from './pages/MyPage.jsx'
import Cart from './pages/Cart.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import { useApp } from './context/AppContext.jsx'
import LoadingMascot from './components/common/LoadingMascot.jsx'
import NotFound from './pages/NotFound.jsx'
import AccountSettings from './pages/AccountSettings.jsx'

export default function App(){
  const app = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <LoadingMascot text="POPQ 불러오는 중..." />
  }

  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/popups" element={<PopupList />} />
          <Route path="/popups/:popupId" element={<PopupDetail />} />
          {/* TODO: 예약 페이지 연결 예정 (예약 담당 개발자 코드 통합 시 추가)
              /popups/:popupId/reserve  : 예약 날짜 및 시간 선택
              /reservations/confirm     : 예약 확인
              /reservations/complete    : 예약 완료 */}
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/mypage/account" element={<AccountSettings />} />
        </Routes>
      </main>
      <Footer />
      <div className="toast-wrap">
        {app.toasts.map(t => <div className="toast" key={t.id}>{t.msg}</div>)}
      </div>
    </div>
  )
}
