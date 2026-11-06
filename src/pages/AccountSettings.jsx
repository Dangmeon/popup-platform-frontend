import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { updateMyInfo, deleteMyAccount } from '../api/authApi'
import '../styles/AccountSettings.css'

// ─────────────────────────────────────────────
// 회원 정보 관리 (API 연결 버전)
// - 내 정보 수정 / 비밀번호 변경: PUT /api/members/me
// - 회원 탈퇴: DELETE /api/members/me
// - 로그인 토큰은 axiosInstance가 자동으로 붙입니다.
// - 서버 로그인(JWT)을 한 상태에서만 동작합니다. (데모 로그인은 불가)
// ─────────────────────────────────────────────

const TABS = [
  { id: 'profile', label: '내 정보 수정' },
  { id: 'password', label: '비밀번호 변경' },
  { id: 'withdraw', label: '회원 탈퇴' },
]

// 서버 오류 문구
function getApiError(err, fallback) {
  if (!err.response) {
    return '서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요.'
  }
  const { status, data } = err.response
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if (status === 403) return '권한이 없습니다.'
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  if (data && typeof data.message === 'string') return data.message
  return fallback
}

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

      {!app.isAuthenticated && (
        <div className="form-error" style={{ marginBottom: 12 }}>
          데모 로그인 상태입니다. 서버에 저장하려면 서버 계정으로 로그인해 주세요.
        </div>
      )}

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
        {tab === 'password' && <PasswordForm app={app} />}
        {tab === 'withdraw' && <WithdrawForm app={app} />}
      </div>
    </div>
  )
}

/* ───────── 1. 내 정보 수정 ───────── */
function ProfileForm({ app, user }) {
  const [name, setName] = useState(user.name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    if (!app.isAuthenticated) return setError('서버 계정으로 로그인한 뒤 이용해 주세요')
    if (name.trim().length < 2 || name.trim().length > 20) {
      return setError('이름은 2~20자로 입력해주세요')
    }
    if (phone && !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone)) {
      return setError('휴대폰 번호 형식이 올바르지 않습니다 (예: 010-1234-5678)')
    }
    setError('')
    setLoading(true)

    try {
      // PUT /api/members/me  { name, phone }
      await updateMyInfo({ name: name.trim(), phone: phone.trim() })
      app.updateUser({ name: name.trim(), phone: phone.trim() })
      app.showToast('내 정보가 저장되었어요')
    } catch (err) {
      setError(getApiError(err, '저장하지 못했습니다. 입력 내용을 확인해 주세요'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>내 정보 수정</h2>
      <div className="form-group">
        <label>이메일(아이디)</label>
        <input value={user.email ?? user.username ?? ''} disabled />
      </div>
      <div className="form-group">
        <label>이름</label>
        <input value={name} onChange={e => setName(e.target.value)} maxLength={20} />
      </div>
      <div className="form-group">
        <label>휴대폰 번호</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-1234-5678" />
      </div>
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary btn-block acc-submit" type="submit" disabled={loading}>
        {loading ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}

/* ───────── 2. 비밀번호 변경 ───────── */
// 명세서에 '현재 비밀번호' 항목이 없어 입력칸을 뺐습니다.
function PasswordForm({ app }) {
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    if (!app.isAuthenticated) return setError('서버 계정으로 로그인한 뒤 이용해 주세요')
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
      return setError('새 비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다')
    }
    if (next !== confirm) return setError('새 비밀번호 확인이 일치하지 않습니다')
    setError('')
    setLoading(true)

    try {
      // PUT /api/members/me  { password }
      await updateMyInfo({ password: next })
      app.showToast('비밀번호가 변경되었어요')
      setNext(''); setConfirm('')
    } catch (err) {
      setError(getApiError(err, '비밀번호를 변경하지 못했습니다'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>비밀번호 변경</h2>
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
      <button className="btn btn-primary btn-block acc-submit" type="submit" disabled={loading}>
        {loading ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  )
}

/* ───────── 3. 회원 탈퇴 ───────── */
// 명세서에 비밀번호 확인 항목이 없어 입력칸을 뺐습니다.
function WithdrawForm({ app }) {
  const navigate = useNavigate()
  const [agree, setAgree] = useState(false)
  const [word, setWord] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ready = agree && word === '탈퇴'

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    if (!app.isAuthenticated) return setError('서버 계정으로 로그인한 뒤 이용해 주세요')
    setError('')
    setLoading(true)

    try {
      // DELETE /api/members/me
      // TODO(정책): 진행 중인 예약이 있을 때 탈퇴를 막을지 팀 정책 확인 필요
      await deleteMyAccount()
      app.logout()
      app.showToast('회원 탈퇴가 완료되었어요')
      navigate('/')
    } catch (err) {
      setError(getApiError(err, '탈퇴 처리하지 못했습니다'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>회원 탈퇴</h2>
      <ul className="acc-warn">
        <li>탈퇴하면 계정과 개인정보가 삭제되며 복구할 수 없습니다.</li>
        <li>예약 내역, 장바구니를 더 이상 볼 수 없습니다.</li>
        <li>진행 중인 예약은 탈퇴 전에 취소해주세요.</li>
      </ul>

      <div className="form-group">
        <label>확인을 위해 <strong>탈퇴</strong>를 입력해주세요</label>
        <input value={word} onChange={e => setWord(e.target.value)} placeholder="탈퇴" />
      </div>
      <label className="acc-agree">
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
        위 내용을 모두 확인했으며 탈퇴에 동의합니다.
      </label>

      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary btn-block acc-submit acc-danger" type="submit" disabled={!ready || loading}>
        {loading ? '처리 중...' : '회원 탈퇴'}
      </button>
    </form>
  )
}