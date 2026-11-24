// 업로드 이미지는 백엔드에서 제공
export function toImageUrl(url) {
  if (typeof url !== 'string') return ''
  if (!url.startsWith('/uploads/')) return url
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + url
}
