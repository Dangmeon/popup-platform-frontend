// 매출 요약 조회. 금액은 원 단위입니다.
// 실제 API 연결 시에도 화면에는 같은 형식으로 반환합니다.
export async function getSalesSummary() {
  const month = Number(
    new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      timeZone: 'Asia/Seoul',
    }).format(new Date())
  )

  return {
    isDemo: true,
    previousMonth: {
      month: month === 1 ? 12 : month - 1,
      amount: 3250000,
    },
    currentMonth: {
      month,
      amount: 4180000,
    },
    nextMonthForecast: {
      month: month === 12 ? 1 : month + 1,
      amount: 4650000,
    },
  }
}