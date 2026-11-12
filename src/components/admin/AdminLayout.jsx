import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import AdminSidebar from './AdminSidebar'
import './AdminLayout.css'
import './AdminClean.css'
import PopqIcon from '../common/PopqIcon.jsx'

// 모든 관리자 페이지에서 공통으로 사용하는 레이아웃
function AdminLayout() {
  const app = useApp()

  // 주소를 직접 입력해도 로그인한 관리자만 화면에 접근
  if (!app.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (app.currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }
  return (
    <div className="admin-layout admin-clean">

      {/* 왼쪽 관리자 사이드바 */}
      <AdminSidebar />

      {/* 오른쪽 관리자 메인 영역 */}
      <div className="admin-main">

        {/* 관리자 페이지 상단 헤더 */}
        <header className="admin-header">
          <div>
            <span className="admin-header-eyebrow">POPQ ADMINISTRATION</span>
            <h1>POPQ 총관리자 센터</h1>
            <p>전체 팝업과 서비스 운영을 관리하세요.</p>
          </div>

          {/* 관리자 계정 표시 */}
          <div className="admin-account">
            <PopqIcon name="admin" size={24} />
            <span>{app.currentUser?.name || '관리자'}님<small>총관리자</small></span>
          </div>
        </header>

        {/* 선택한 관리자 메뉴 화면 표시 */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout