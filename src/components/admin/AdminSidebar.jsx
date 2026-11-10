import { NavLink } from 'react-router-dom'

const menus = [
  { name: '대시보드', path: '/admin', end: true },
  { name: '팝업 관리', path: '/admin/popups' },
  { name: '예약 관리', path: '/admin/reservations' },
  { name: '웨이팅 관리', path: '/admin/waiting' },
  { name: '굿즈 관리', path: '/admin/products' },
  { name: '주문 관리', path: '/admin/orders' },
  { name: '매출 관리', path: '/admin/sales' },
  { name: '회원 관리', path: '/admin/members' },
]

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <h2>POPQ</h2>
        <span>ADMIN CENTER</span>
      </div>

      <nav className="admin-nav">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            end={menu.end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            {menu.name}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        POPQ Management
      </div>
    </aside>
  )
}

export default AdminSidebar