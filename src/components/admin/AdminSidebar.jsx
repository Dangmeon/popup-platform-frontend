import { NavLink } from 'react-router-dom'

// 관리자 사이드바 메뉴 목록
const menus = [
  { name: '대시보드', path: '/admin', end: true },
  { name: '팝업 관리', path: '/admin/popups' },
  { name: '예약 관리', path: '/admin/reservations' },
  { name: '웨이팅 관리', path: '/admin/waiting' },
  { name: '굿즈 관리', path: '/admin/products' },
  { name: '주문 관리', path: '/admin/orders' },
  { name: '회원 관리', path: '/admin/members' },
]

// 관리자 왼쪽 사이드바
function AdminSidebar() {
  return (
    <aside className="admin-sidebar">

      {/* POPQ 관리자 로고 */}
      <div className="admin-brand">
        <h2>POPQ</h2>
        <span>ADMIN CENTER</span>
      </div>

      {/* 관리자 메뉴 이동 */}
      <nav className="admin-nav">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            end={menu.end}
            // 현재 선택된 메뉴에 active 스타일 적용
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            {menu.name}
          </NavLink>
        ))}
      </nav>

      {/* 사이드바 하단 문구 */}
      <div className="admin-sidebar-footer">
        POPQ Management
      </div>
    </aside>
  )
}

export default AdminSidebar