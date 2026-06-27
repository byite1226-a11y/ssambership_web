/**
 * 관리자 목록 화면 공용 검색·필터·페이지네이션 유틸.
 *
 * - 서버 컴포넌트의 `searchParams` 를 받아 안전하게 `{ search, status, page, pageSize }` 로 파싱.
 * - URL 빌더로 탭/페이지 이동 링크 생성.
 * - 페이지·페이지 사이즈는 클램프(<=0/NaN/지나친 값 방지).
 *
 * 동작 변경 X — 페이지 데이터 로더가 `params.search/status` 가 비어 있으면 기존과 동일하게 전체 조회.
 */

export type AdminListParams = {
  search: string;        // 빈 문자열이면 검색 없음
  status: string;        // 빈 문자열 또는 'all' 이면 필터 없음
  page: number;          // 1-based
  pageSize: number;      // 보통 25~100
};

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

function pickStr(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && value[0]) return String(value[0]).trim();
  return "";
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export function parseAdminListParams(
  sp: Record<string, string | string[] | undefined>,
  opts?: { defaultPageSize?: number; maxPageSize?: number; defaultStatus?: string }
): AdminListParams {
  const defaultPageSize = opts?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = opts?.maxPageSize ?? MAX_PAGE_SIZE;
  const defaultStatus = opts?.defaultStatus ?? "";

  const search = pickStr(sp.q || sp.search);
  const status = pickStr(sp.status) || defaultStatus;
  const page = clamp(Number.parseInt(pickStr(sp.page) || "1", 10), 1, 100000);
  const pageSize = clamp(
    Number.parseInt(pickStr(sp.pageSize) || String(defaultPageSize), 10),
    1,
    maxPageSize
  );

  return { search, status, page, pageSize };
}

/** range(from, to) 계산: PostgREST 0-based inclusive */
export function rangeForPage(params: AdminListParams): { from: number; to: number } {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  return { from, to };
}

/** "all" / 빈 문자열을 '필터 없음' 으로 처리 */
export function isStatusActive(status: string): boolean {
  return Boolean(status) && status !== "all";
}

/**
 * 현재 params 위에 override 한 URL 을 만든다. 빈 값은 쿼리에서 제거.
 * 페이지 외 다른 키를 바꾸면 page 는 1 로 리셋(필터/검색 변경 시 의도된 동작).
 */
export function buildAdminListUrl(
  basePath: string,
  params: AdminListParams,
  overrides: Partial<AdminListParams> = {}
): string {
  const next = { ...params, ...overrides };
  if (
    overrides.search !== undefined ||
    overrides.status !== undefined ||
    overrides.pageSize !== undefined
  ) {
    if (overrides.page === undefined) next.page = 1;
  }

  const usp = new URLSearchParams();
  if (next.search) usp.set("q", next.search);
  if (next.status && next.status !== "all") usp.set("status", next.status);
  if (next.page && next.page > 1) usp.set("page", String(next.page));
  if (next.pageSize && next.pageSize !== DEFAULT_PAGE_SIZE) usp.set("pageSize", String(next.pageSize));

  const qs = usp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
