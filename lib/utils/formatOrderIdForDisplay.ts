/** 주문·요청 id를 화면에 짧게 표시(전체 UUID 노출 완화). */
export function shortOrderIdForDisplay(id: string): string {
  const s = String(id).trim();
  if (s.length <= 16) {
    return s;
  }
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}
