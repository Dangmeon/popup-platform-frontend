import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { signupRequest } from '../api/authApi'

export default function Signup() {
  const app = useApp()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      await signupRequest(form)
      app.showToast('회원가입이 완료되었어요. 로그인해주세요')
      nav('/login')
    } catch (err) {
      if (!err.response) {
        setError('서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요.')
      } else {
        setError(err.response.data?.message || '회원가입에 실패했습니다. 입력 내용을 확인해주세요')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-box">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>이메일</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>이름</label>
          <input value={form.name} onChange={e => update('name', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>연락처</label>
          <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="010-1234-5678" required />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </form>
      <div className="form-foot">이미 계정이 있으신가요? <Link to="/login">로그인</Link></div>
    </div>
  )
}
