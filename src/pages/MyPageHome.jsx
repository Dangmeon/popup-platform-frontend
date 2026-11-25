import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PopqIcon from '../components/common/PopqIcon.jsx'
import '../styles/MyPageHome.css'
import '../styles/AccountRefine.css'
import '../styles/MyPageServices.css'
import { myPageMenus } from '../data/myPageDemo.js'

// 마이페이지 공통 화면
export function MyPageFrame({ children }) {
  const app = useApp()
  const navigate = useNavigate()
  const user = app.currentUser
  if (!user) return <div className="container empty-state">로그인이 필요합니다. <Link to="/login">로그인하기</Link></div>
  function logout() { app.logout(); navigate('/', { replace: true }) }
  const name = user.name || user.username || '회원'
  return <div className="pq-my container">
    <header className="pq-my-profile">
      <span className="pq-my-avatar">{name.slice(0, 1)}</span>
      <div><h1>안녕하세요, {name}님</h1></div>
    </header>
    <div className="pq-my-grid">
      <aside className="pq-my-sidebar"><nav aria-label="마이페이지 메뉴">
        <NavLink to="/mypage" end>마이페이지 홈</NavLink>
        {myPageMenus.map(menu=><NavLink to={menu.path} key={menu.path}><span>{menu.title}</span><span aria-hidden="true">›</span></NavLink>)}
      </nav><button type="button" onClick={logout}><PopqIcon name="logout" size={18} />로그아웃</button></aside>
      <section className="pq-my-content">{children}</section>
    </div>
  </div>
}

// 마이페이지 홈
export default function MyPageHome() {
  return <MyPageFrame>
    <h2>나의 POPQ</h2>
    <p className="pq-my-muted">회원 정보부터 주문과 혜택까지 한곳에서 확인하세요.</p>
    <div className="pq-my-tiles pq-my-service-tiles">
      <Link to="/mypage/account">
        <span className="pq-my-card-icon"><PopqIcon name="user" size={25} /></span>
        <h3>내 정보 보기</h3>
        <p>이메일·이름·연락처 확인부터 비밀번호 변경까지</p>
        <span>정보 확인하기 →</span>
      </Link>
      {myPageMenus.map(menu=><Link to={menu.path} key={menu.path}><span className="pq-my-card-icon"><PopqIcon name={menu.icon} size={24}/></span><h3>{menu.title}</h3><p>{menu.description}</p><span>확인하기 →</span></Link>)}
    </div>
  </MyPageFrame>
}
