/** PageScaffold·UI 하단에 노출하는 Supabase 연결 예정 포인트 */
export const CUSTOM_REQUEST_DATA_MODEL = [
  "custom_request_posts (의뢰 본문·카테고리·기한·예산)",
  "custom_request_applications (멘토 지원/제안가·납기)",
  "custom_request_orders (학생이 지원 1건 선택 시 insert → /custom-request/orders/[id])",
  "custom_order_deliverables (납품 파일 버전)",
  "disputes (분쟁)",
  "categories | custom_request_categories (카테고리 — 정규화 시)",
  "mentor_profiles / users (지원서에 멘토 표시·마스킹)",
] as const;
