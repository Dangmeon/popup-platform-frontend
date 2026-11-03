import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

// 로그인 오류 안내
function getLoginError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return '서버 응답 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.'
    }

    if (error.request) {
      return '서버에 연결하지 못했습니다. 서버 실행 상태와 연결 설정을 확인해 주세요.'
    }

    return error.message || '로그인 요청을 처리하지 못했습니다.'
  }

  const { status, data } = error.response

  if (status === 401) {
    return '아이디 또는 비밀번호를 확인해 주세요.'
  }

  if (status === 403) {
    return '로그인이 거부됐습니다. 서버 응답을 확인해 주세요.'
  }

  if (status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  }

  if (data && typeof data.message === 'string') {
    return data.message
  }

  return '로그인하지 못했습니다. 입력 정보를 확인해 주세요.'
}

export default function Login() {
  const app = useApp()
  const navigate = useNavigate()

  // 로그인 입력
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // 요청 상태
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  // 실제 로그인
  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting.current) return

    setError('')

    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해 주세요.')
      return
    }

    submitting.current = true
    setLoading(true)

    try {
      await app.loginWithApi({
        username: username.trim(),
        password,
      })

      navigate('/', { replace: true })
    } catch (requestError) {
      setError(getLoginError(requestError))
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <div className="form-box">
      <h2>로그인</h2>

      <form onSubmit={handleSubmit} aria-busy={loading}>
        {/* 아이디 */}
        <div className="form-group">
          <label htmlFor="login-username">아이디</label>
          <input
            id="login-username"
            type="text"
            name="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              setError('')
            }}
            autoComplete="username"
            disabled={loading}
            aria-describedby={error ? 'login-error' : undefined}
            required
          />
        </div>

        {/* 비밀번호 */}
        <div className="form-group">
          <label htmlFor="login-password">비밀번호</label>
          <input
            id="login-password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
            autoComplete="current-password"
            disabled={loading}
            aria-describedby={error ? 'login-error' : undefined}
            required
          />
        </div>

        {/* 오류 안내 */}
        {error && (
          <p
            id="login-error"
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* 로그인 버튼 */}
        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={loading}
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>

      {/* 회원가입 안내 */}
      <div className="form-foot">
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
        <p>회원가입 화면은 아직 데모이며 서버 계정이 생성되지 않습니다.</p>
      </div>
    </div>
  )
}