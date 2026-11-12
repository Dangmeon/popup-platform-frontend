import { Link, NavLink } from 'react-router-dom'
import PopqIcon from '../common/PopqIcon.jsx'

// 현장 운영 메뉴는 매니저 센터에서 관리합니다.
const menus = [
  { name:'대시보드',path:'/admin',icon:'calendar',end:true },
  { name:'팝업 관리',path:'/admin/popups',icon:'location' },
  { name:'굿즈 관리',path:'/admin/products',icon:'bag' },
  { name:'주문 관리',path:'/admin/orders',icon:'cart' },
  { name:'매출 관리',path:'/admin/sales',icon:'chart' },
  { name:'회원 관리',path:'/admin/members',icon:'user' },
]
export default function AdminSidebar() {
  return <aside className="admin-sidebar">
    {/* 로고는 사용자 메인으로 연결 */}
    <div className="admin-brand"><Link to="/" className="admin-logo-link" aria-label="POPQ 메인으로 이동"><img src="/logo.png" alt="POPQ" /><span>ADMIN CENTER</span></Link></div>
    <div className="admin-scope"><span>관리 범위</span><strong>전체 서비스 운영</strong></div>
    <nav className="admin-nav" aria-label="총관리자 메뉴">{menus.map(menu => <NavLink key={menu.path} to={menu.path} end={menu.end} className={({isActive}) => `admin-nav-link${isActive ? ' active' : ''}`}><PopqIcon name={menu.icon} size={20} />{menu.name}</NavLink>)}</nav>
    <div className="admin-sidebar-footer"><Link to="/">사용자 메인으로 돌아가기 →</Link></div>
  </aside>
}
