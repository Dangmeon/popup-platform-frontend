import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPasswordRequest } from '../api/authApi.js'

// 비밀번호 찾기 오류 안내
function getResetError(error) {
  if (!error.response) {
    return '서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요.'
  }

  const { status } = error.response

  if (status === 400 || status === 404) {
    return '가입된 이메일과 이름을 다시 확인해 주세요.'
  }

  if (status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return '임시 비밀번호를 보내지 못했습니다. 입력 정보를 확인해 주세요.'
}

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    setError('')

    if (!email.trim() || !name.trim()) {
      setError('이메일과 이름을 입력해 주세요.')
      return
    }

    setLoading(true)

    try {
      await resetPasswordRequest({ email, name })
      setDone(true)
    } catch (requestError) {
      setError(getResetError(requestError))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="form-box">
        <h2>비밀번호 찾기</h2>
        <p style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>
          임시 비밀번호를 이메일로 보냈어요.
        </p>
        <p className="card-sub">
          메일함을 확인하고 임시 비밀번호로 로그인한 뒤, 마이페이지의 내 정보 관리에서 비밀번호를 바꿔 주세요.
        </p>
        <Link to="/login" className="btn btn-primary btn-block" style={{ marginTop: 16, textAlign: 'center' }}>
          로그인하러 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="form-box">
      <h2>비밀번호 찾기</h2>
      <p className="card-sub">가입한 이메일과 이름을 입력하면 임시 비밀번호를 이메일로 보내 드려요.</p>

      <form onSubmit={handleSubmit} aria-busy={loading}>
        <div className="form-group">
          <label htmlFor="reset-email">이메일</label>
          <input
            id="reset-email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
            autoComplete="email"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reset-name">이름</label>
          <input
            id="reset-name"
            type="text"
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            autoComplete="name"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? '보내는 중…' : '임시 비밀번호 받기'}
        </button>
      </form>

      <div className="form-foot">
        <Link to="/login">로그인으로 돌아가기</Link>
      </div>
    </div>
  )
}