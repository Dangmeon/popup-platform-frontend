import axiosInstance from './axiosInstance.js'
import { getMyInfo } from './authApi.js'

export const qnaCategories = { ACCOUNT:'계정·로그인', RESERVATION:'예약·웨이팅', POPUP:'팝업 이용', PARTNERSHIP:'입점·제휴', ETC:'기타' }

function validId(id) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) throw new Error('문의 번호를 확인해 주세요.')
  return Number(id)
}
export async function getQnas({ category, status, page = 0, size = 10, signal } = {}) {
  const { data } = await axiosInstance.get('/api/qnas', { params:{category:category || undefined,status:status || undefined,page,size}, signal })
  if (!Array.isArray(data?.content) || !Number.isSafeInteger(data.totalPages) || !Number.isSafeInteger(data.totalElements)) throw new Error('문의 목록을 확인하지 못했습니다.')
  return data
}

// 서버에는 회원별 목록 필터가 없어 모든 페이지에서 작성자 ID를 대조합니다.
// 이름이나 비밀글 열람 가능 여부로 소유자를 추측하지 않습니다.
export async function getMyQnas(options = {}) {
  const me = await getMyInfo()
  if (!Number.isSafeInteger(me?.memberId) || me.memberId < 1) throw new Error('회원 정보를 확인하지 못했습니다.')
  const rows = new Map()
  let page = 0, pages = 1
  while (page < pages) {
    const data = await getQnas({ ...options, page, size:50 })
    pages = data.totalPages
    data.content.filter(row => row.writerId === me.memberId).forEach(row => rows.set(row.qnaId,row))
    page += 1
  }
  return [...rows.values()]
}

export async function getQna(id, signal) {
  return (await axiosInstance.get(`/api/qnas/${validId(id)}`, {signal})).data
}
function questionPayload(form) {
  const payload = { category:form.category, title:form.title.trim(), content:form.content.trim(), secret:Boolean(form.secret) }
  if (!(payload.category in qnaCategories) || !payload.title || !payload.content || payload.title.length > 200 || payload.content.length > 2000) throw new Error('문의 유형·제목·내용을 확인해 주세요.')
  return payload
}
export async function saveQuestion(id, form) {
  const payload = questionPayload(form)
  return (await (id ? axiosInstance.put(`/api/qnas/${validId(id)}`,payload) : axiosInstance.post('/api/qnas',payload))).data
}
export async function deleteQuestion(id) { await axiosInstance.delete(`/api/qnas/${validId(id)}`) }
export async function saveAnswer(id, answerContent) {
  const content = answerContent.trim()
  if (!content || content.length > 2000) throw new Error('답변을 1~2000자로 입력해 주세요.')
  return (await axiosInstance.post(`/api/admin/qnas/${validId(id)}/answer`,{answerContent:content})).data
}
export function qnaError(error) {
  if (!error.response && error.request) return '서버에 연결하지 못했습니다. 잠시 후 다시 확인해 주세요.'
  if (error.response?.status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if (error.response?.status === 403) return '이 문의를 확인하거나 처리할 권한이 없습니다.'
  if (error.response?.status === 404) return '문의를 찾을 수 없습니다. 목록을 다시 확인해 주세요.'
  const message = error.response?.data?.message
  return typeof message === 'string' ? message : error.message || '문의 요청을 처리하지 못했습니다.'
}
