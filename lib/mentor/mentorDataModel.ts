/** PageScaffold `dataPoints` 등 화면 안내용(쿼리 식별자 아님) */
export const MENTOR_PROFILE_DATA_MODEL = [
  "프로필 기본 정보",
  "멘토 소개와 활동 정보",
  "채널 콘텐츠 준비 상태",
  "공개 프로필 표시 정보",
] as const;

export const MENTOR_CHANNEL_DATA_MODEL = [
  "등록한 대표 콘텐츠",
  "공개·유형별로 나누어 보기",
] as const;

/** 공개 멘토 목록 /mentors */
export const PUBLIC_MENTORS_LIST_DATA_MODEL = [
  "멘토 계정 기준 목록",
  "프로필 요약",
  "리뷰·평점 요약",
  "요금제 안내(참고)",
  "과목·태그 검색",
] as const;

/** 공개 멘토 상세 */
export const PUBLIC_MENTOR_DATA_MODEL = [
  "멘토 계정 확인",
  "프로필 및 소개",
  "대표 콘텐츠",
  "리뷰·평점 요약",
  "구독 요금제",
  "추가 안내(준비 중)",
] as const;

export const MENTOR_PAYOUTS_DATA_MODEL = [
  "멘토 지급·정산 내역",
  "구독·수익 요약",
  "맞춤의뢰 주문 흐름",
  "맞춤의뢰 정산 예정 및 지급 완료",
] as const;
