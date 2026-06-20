export const MINOR_GUARDIAN_CONSENT_TYPE = "minor_guardian_consent" as const;
export const MINOR_CONSENT_VERSION = "legal-placeholder-2026-06-20" as const;

export const MINOR_CONSENT_COPY = {
  title: "보호자 동의 필요",
  description:
    "만 14세 미만 가입자는 법정대리인 동의가 필요합니다. 아래 문구와 본인확인 방식은 법무 확정 후 교체됩니다.",
  checkboxLabel: "법정대리인에게 가입 및 개인정보 처리 동의를 받았습니다.",
  requiredError: "만 14세 미만 가입자는 보호자 동의가 필요합니다.",
  legalSlotLabel: "법무 확정 대기 항목",
  legalSlots: [
    "보호자 동의 고지 문구",
    "보호자 신원확인 방식",
    "동의 항목 및 버전 문구",
  ],
} as const;

export const MINOR_CONSENT_VERIFICATION_METHOD_PLACEHOLDER = "legal_review_pending" as const;