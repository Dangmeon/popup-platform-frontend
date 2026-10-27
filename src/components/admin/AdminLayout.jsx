import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import './AdminLayout.css'

// 모든 관리자 페이지에서 공통으로 사용하는 레이아웃
function AdminLayout() {
  return (
    <div className="admin-layout">

      {/* 왼쪽 관리자 사이드바 */}
      <AdminSidebar />

      {/* 오른쪽 관리자 메인 영역 */}
      <div className="admin-main">

        {/* 관리자 페이지 상단 헤더 */}
        <header className="admin-header">
          <div>
            <h1>POPQ 관리자 페이지</h1>
            <p>팝업스토어 운영 관리 시스템</p>
          </div>

          {/* 관리자 계정 표시 */}
          <span className="admin-account">관리자</span>
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