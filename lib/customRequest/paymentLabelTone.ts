/** 결제 상태 라벨 → 색상 클래스 (학생/멘토 카드 공용) */
export function paymentLabelClassName(label: string): string {
  const t = label.trim();
  if (t === "결제 완료") return "font-semibold text-emerald-600";
  if (t === "결제 확인 대기") return "font-semibold text-amber-600";
  if (t === "에스크로") return "font-semibold text-blue-600";
  return "text-ds-tertiary";
}
