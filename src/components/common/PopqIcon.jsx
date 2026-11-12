const paths = {
  // 매출 현황을 나타내는 선 그래프 아이콘
  chart: (<><path d="M4 3v17h17" /><path d="m7 14 4-4 4 2 5-6" /></>),
  // 예약·대기 화면에서 사용하는 선형 아이콘
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  refresh: (<><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></>),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" />
    </>
  ),
  location: (
    <>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  // 굿즈 쇼핑백과 구분되는 장바구니 카트
  cart: (<><path d="M2 3h3l3 12h11l3-9H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>),
  bag: (
    <>
      <path d="M5 7h14l1 14H4L5 7Z" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M15 7v2m0 3v1m0 3v1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  // 중절모를 쓰고 넥타이를 맨 관리자 아이콘
  admin: (
    <>
      <path d="M7 7 8.5 2.5 12 4l3.5-1.5L17 7M4 7h16" />
      <path d="M8 9a4 4 0 0 0 8 0" />
      <path d="M4 22v-2a7 7 0 0 1 5-6l3 3 3-3a7 7 0 0 1 5 6v2" />
      <path d="m12 17-1.5 3 1.5 2 1.5-2-1.5-3" />
    </>
  ),
  // 매니저: 중절모 없이 넥타이를 착용한 사람
  manager: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22v-2a7 7 0 0 1 5-6l3 3 3-3a7 7 0 0 1 5 6v2" />
      <path d="m12 17-1.5 3 1.5 2 1.5-2-1.5-3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
      <path d="M9 12h12m-4-4 4 4-4 4" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
}

export default function PopqIcon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}