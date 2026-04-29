/** PageScaffold·UI 하단에 노출하는 Supabase 연결 예정 포인트 */
export const CUSTOM_REQUEST_DATA_MODEL = [
  "custom_request_posts (의뢰 본문·카테고리·기한·예산)",
  "custom_request_post_attachments (의뢰 등록 첨부 메타·private Storage 키)",
  "custom_request_applications (멘토 제안 가격·납기·제안 내용)",
  "custom_request_orders (학생이 제안 1건 선택 시 생성 → 주문·진행)",
  "custom_order_deliverables (납품 파일 버전)",
  "disputes (분쟁)",
  "categories | custom_request_categories (카테고리 — 정규화 시)",
  "mentor_profiles / users (지원서에 멘토 표시·마스킹)",
] as const;
