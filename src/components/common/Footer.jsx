import { Link } from 'react-router-dom'
import PopqIcon from './PopqIcon.jsx'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer pq-footer">
      <div className="pq-footer-inner">
        {/* 브랜드 소개 */}
        <div className="pq-footer-top">
          <div className="pq-footer-brand">
            <Link to="/" aria-label="POPQ 홈">
              <img src="/logo.png" alt="POPQ" />
            </Link>
            <p>
              좋아하는 팝업을 만나고,<br />
              새로운 취향을 발견하는 하루.
            </p>
          </div>

          {/* 실제 연결된 서비스 메뉴 */}
          <nav className="pq-footer-links" aria-label="푸터 서비스 메뉴">
            <div>
              <h2>DISCOVER</h2>
              <Link to="/popups">팝업 탐색</Link>
              <Link to="/goods">굿즈샵</Link>
            </div>
            <div>
              <h2>MY POPQ</h2>
              <Link to="/mypage">내 예약·웨이팅</Link>
              <Link to="/cart">장바구니</Link>
              <Link to="/mypage/account">내 정보</Link>
            </div>
          </nav>

          {/* 서비스 탐색 바로가기 */}
          <Link to="/popups" className="pq-footer-discover">
            다음 팝업을 만나보세요
            <PopqIcon name="arrow" size={19} />
          </Link>
        </div>

        {/* 하단 저작권 */}
        <div className="pq-footer-bottom">
          <span>© {new Date().getFullYear()} POPQ</span>
          <span>POP-UP EXPERIENCE, EVERY DAY.</span>
        </div>
      </div>
    </footer>
  )
}