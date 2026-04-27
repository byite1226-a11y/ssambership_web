export const SUBSCRIBE_PAGE_DATA_MODEL = [
  "plans | mentor_plans | subscription_plans — fetchPlansForMentor",
  "subscriptions — 현재 멘토·학생 구독 여부 probe",
  "payments — 최근 결제/의도 probe",
  "promotions | notices — 활성 공지 probe",
  "mentor_student_rooms — 결제 성공 후 생성(이번 단계는 주석·CTA만)",
] as const;
