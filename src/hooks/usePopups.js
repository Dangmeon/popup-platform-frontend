import { useEffect, useState } from 'react'
import {
  getPopups,
  getPopup,
  getPopupProducts,
} from '../api/popupApi'

// ─────────────────────────────────────────────
// 화면에서 API를 쉽게 쓰는 훅 (src/hooks/usePopups.js 로 저장)
// 반환값: { data, loading, error }
// ─────────────────────────────────────────────

function getErrorMessage(err) {
  if (!err.response) return '서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요.'
  const { status, data } = err.response
  if (status === 404) return '존재하지 않는 항목입니다.'
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  if (data && typeof data.message === 'string') return data.message
  return '데이터를 불러오지 못했습니다.'
}

// 공통 처리: fetcher를 실행하고 로딩/오류/결과를 관리
function useFetch(fetcher, deps, initial) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetcher()
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { if (!cancelled) setError(getErrorMessage(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

// 팝업 목록: usePopups({ status: 'ONGOING' }) 또는 usePopups({ category: 'FOOD' })
export function usePopups(params = {}) {
  return useFetch(() => getPopups(params), [JSON.stringify(params)], [])
}

// 팝업 상세
export function usePopup(popId) {
  return useFetch(() => getPopup(popId), [popId], null)
}

// 팝업의 굿즈 목록
export function usePopupProducts(popId) {
  return useFetch(() => getPopupProducts(popId), [popId], [])
}