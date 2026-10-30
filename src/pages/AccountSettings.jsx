import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import '../styles/AccountSettings.css'

// ─────────────────────────────────────────────
// 회원 정보 관리 (샘플 동작 버전)
// - AppContext는 수정하지 않습니다.
// - 내 정보 수정 결과는 localStorage에만 저장합니다. (API 연동 전 임시)
// - API가 준비되면 아래 TODO(API) 부분만 axios 호출로 교체합니다.
// ─────────────────────────────────────────────

const OVERRIDE_KEY = 'popq-profile-override'

function loadOverride() {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {} } catch { return {} }
}

const TABS = [
  { id: 'profile', label: '내 정보 수정' },
  { id: 'password', label: '비밀번호 변경' },
  { id: 'withdraw', label: '회원 탈퇴' },
]

export default function AccountSettings() {
  const app = useApp()
  const [tab, setTab] = useState('profile')
  const user = app.currentUser

  if (!user) {
    return (
      <div className="container empty-state">
        로그인이 필요합니다. <Link to="/login">로그인하기</Link>
      </div>
    )
  }

  return (
    <div className="container acc">
      <h1 className="page-title">내 정보 관리</h1>

      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={'tab-btn' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      <div className="form-box acc-box">
        {tab === 'profile' && <ProfileForm app={app} user={user} />}
        {tab === 'password' && <PasswordForm app={app} user={user} />}
        {tab === 'withdraw' && <WithdrawForm app={app} user={user} />}
      </div>
    </div>
  )
}

/* ───────── 1. 내 정보 수정 ───────── */
function ProfileForm({ app, user }) {
  const saved = loadOverride()
  const [name, setName] = useState(saved.name ?? user.name ?? user.nickname ?? '')
  const [phone, setPhone] = useState(saved.phone ?? user.phone ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (name.trim().length < 2 || name.trim().length > 20) {
      return setError('이름은 2~20자로 입력해주세요')
    }
    if (phone && !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone)) {
      return setError('휴대폰 번호 형식이 올바르지 않습니다 (예: 010-1234-5678)')
    }
    setError('')

    // TODO(API): PUT /api/members/me  { name, phone }
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ name: name.trim(), phone }))
    app.showToast('내 정보가 저장되었어요')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>내 정보 수정</h2>
      <div className="form-group">
        <label>이메일(아이디)</label>
        <input value={user.email ?? user.id ?? ''} disabled />
      </div>
      <div className="form-group">
        <label>이름</label>
        <input value={name} onChange={e => setName(e.target.value)} maxLength={20} />
      </div>
      <div className="form-group">
        <label>휴대폰 번호 (선택)</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-1234-5678" />
      </div>
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary btn-block acc-submit" type="submit">저장</button>
    </form>
  )
}

/* ───────── 2. 비밀번호 변경 ───────── */
function PasswordForm({ app, user }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!current) return setError('현재 비밀번호를 입력해주세요')
    // 샘플 데이터에 password 필드가 있을 때만 현재 비밀번호를 비교합니다.
    if (user.password !== undefined && user.password !== current) {
      return setError('현재 비밀번호가 일치하지 않습니다')
    }
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
      return setError('새 비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다')
    }
    if (next === current) return setError('현재 비밀번호와 다른 비밀번호를 입력해주세요')
    if (next !== confirm) return setError('새 비밀번호 확인이 일치하지 않습니다')
    setError('')

    // TODO(API): PUT /api/members/me/password  { currentPassword, newPassword }
    app.showToast('비밀번호가 변경되었어요 (샘플: 실제 저장은 API 연동 후)')
    setCurrent(''); setNext(''); setConfirm('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>비밀번호 변경</h2>
      <div className="form-group">
        <label>현재 비밀번호</label>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="form-group">
        <label>새 비밀번호</label>
        <input type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" />
        <div className="acc-hint">영문, 숫자 포함 8자 이상</div>
      </div>
      <div className="form-group">
        <label>새 비밀번호 확인</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary btn-block acc-submit" type="submit">비밀번호 변경</button>
    </form>
  )
}

/* ───────── 3. 회원 탈퇴 ───────── */
function WithdrawForm({ app, user }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [word, setWord] = useState('')
  const [error, setError] = useState('')

  const ready = agree && word === '탈퇴' && password.length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (user.password !== undefined && user.password !== password) {
      return setError('비밀번호가 일치하지 않습니다')
    }
    setError('')

    // TODO(API): DELETE /api/members/me  (비밀번호 확인)
    // TODO(정책): 진행 중인 예약이 있을 때 탈퇴를 막을지 팀 정책 확인 필요
    localStorage.removeItem(OVERRIDE_KEY)

    // AppContext의 로그아웃 함수 이름은 프로젝트에 맞게 확인하세요.
    const logout = app.logout || app.signOut || app.logOut
    if (typeof logout === 'function') logout()

    app.showToast('회원 탈퇴가 완료되었어요')
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>회원 탈퇴</h2>
      <ul className="acc-warn">
        <li>탈퇴하면 계정과 개인정보가 삭제되며 복구할 수 없습니다.</li>
        <li>예약 내역, 찜 목록, 장바구니를 더 이상 볼 수 없습니다.</li>
        <li>진행 중인 예약은 탈퇴 전에 취소해주세요.</li>
      </ul>

      <div className="form-group">
        <label>비밀번호 확인</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="form-group">
        <label>확인을 위해 <strong>탈퇴</strong>를 입력해주세요</label>
        <input value={word} onChange={e => setWord(e.target.value)} placeholder="탈퇴" />
      </div>
      <label className="acc-agree">
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
        위 내용을 모두 확인했으며 탈퇴에 동의합니다.
      </label>

      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary btn-block acc-submit acc-danger" type="submit" disabled={!ready}>
        회원 탈퇴
      </button>
    </form>
  )
}