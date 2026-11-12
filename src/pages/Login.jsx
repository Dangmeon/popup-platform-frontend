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

  if (status === 400 || status === 401) {
    return '이메일 또는 비밀번호를 확인해 주세요.'
  }

  if (status === 403) {
    return '로그인이 거부됐습니다. 서버 응답을 확인해 주세요.'
  }

  if (status === 404) {
    return '로그인 API 또는 계정 정보를 찾지 못했습니다. 서버 응답을 확인해 주세요.'
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

  // 입력값과 요청 상태
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  // 실제 로그인
  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) return

    setError('')

    if (!username.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해 주세요.')
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
    // 로그인 카드 주변 여백
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 700,
        padding: '72px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* 너비를 줄이고 내부 세로 여백을 확대한 카드 */}
      <div
        className="form-box"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 400,
          minWidth: 0,
          minHeight: 490,
          margin: 0,
          padding: '44px clamp(22px, 5vw, 36px)',
          boxSizing: 'border-box',
          border: '1px solid #e5e9df',
          borderRadius: 20,
          background: '#fff',
          boxShadow: '0 10px 36px rgb(35 48 24 / 5%)',
        }}
      >
        {/* 제목과 짧은 안내 */}
        <h2
          style={{
            margin: '0 0 10px',
            color: '#293323',
            fontSize: 27,
            letterSpacing: '-0.8px',
          }}
        >
          로그인
        </h2>

        <p
          style={{
            margin: '0 0 32px',
            color: '#777c73',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          POPQ에서 새로운 팝업을 만나보세요.
        </p>

        <form onSubmit={handleSubmit} aria-busy={loading}>
          {/* 이메일 입력 */}
          <div className="form-group" style={{ marginBottom: 22 }}>
            <label htmlFor="login-username">이메일</label>
            <input
              id="login-username"
              type="email"
              name="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError('')
              }}
              autoComplete="username"
              disabled={loading}
              aria-describedby={error ? 'login-error' : undefined}
              style={{
                minHeight: 48,
                borderColor: '#e0e5d9',
                borderRadius: 9,
              }}
              required
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="form-group" style={{ marginBottom: 26 }}>
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
              style={{
                minHeight: 48,
                borderColor: '#e0e5d9',
                borderRadius: 9,
              }}
              required
            />
          </div>

          {/* 로그인 오류 */}
          {error && (
            <p id="login-error" className="form-error" role="alert">
              {error}
            </p>
          )}

          {/* 올리브색 로그인 버튼 */}
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading}
            style={{
              minHeight: 48,
              borderRadius: 9,
              background: '#465235',
              boxShadow: 'none',
            }}
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        {/* 회원가입과 비밀번호 찾기 */}
        <div className="form-foot" style={{ marginTop: 28 }}>
          <Link to="/signup">회원가입</Link>
          <span
            aria-hidden="true"
            style={{ margin: '0 12px', opacity: 0.35 }}
          >
            |
          </span>
          <Link to="/reset-password">비밀번호 찾기</Link>
        </div>
      </div>
    </div>
  )
}