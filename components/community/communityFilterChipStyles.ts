/** 커뮤니티 목록 필터 칩(정렬·카테고리) 공통 외형 — 숏폼·게시판 동일 */
export function communityFilterChipClass(active: boolean, size: "sm" | "md" = "md"): string {
  const sizeClass =
    size === "sm" ? "px-3.5 py-1.5 text-xs font-bold" : "px-4 py-2 text-sm font-medium";
  const stateClass = active
    ? "bg-[#e8f0fe] text-[#2563eb] font-semibold"
    : "bg-[#f4f5f7] text-[#4b5563] hover:bg-[#eceef1]";
  return ["rounded-full transition-colors", sizeClass, stateClass].join(" ");
}
