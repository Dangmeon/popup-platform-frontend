// 팝업 카테고리 코드와 표시 이름
export const popupCategoryLabels = {
  ENT: '엔터테인먼트', FOOD: '푸드', CHAR: '캐릭터', FASHION: '패션',
  LIVING: '리빙', SPORTS: '스포츠', ETC: '기타',
}

export function popupCategoryCode(value) {
  return { CHARACTER: 'CHAR', ENTERTAINMENT: 'ENT' }[value] ?? value
}
