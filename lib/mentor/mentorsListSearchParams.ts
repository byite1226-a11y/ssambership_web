export type MentorsListSort =
  | "popular"
  | "new"
  | "review"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "response";

export type MentorsListView = "list" | "grid";

export type MentorSubjectFilter =
  | ""
  | "수학"
  | "영어"
  | "국어"
  | "과학"
  | "사회"
  | "논술"
  | "코딩"
  | "기타";

export type MentorGradeFilter = "중등" | "고등" | "N수" | "공통";

export type MentorTypeFilter =
  | "메디컬계열"
  | "교육학과"
  | "공대"
  | "경영경제대"
  | "문과대"
  | "SKY";

export type MentorPriceBandFilter = "under30" | "30to50" | "50to100" | "over100" | "custom";

export type MentorSchoolFilter = "" | "서울대" | "연대" | "고대" | "기타";

export type MentorsListFilters = {
  q: string;
  subject: MentorSubjectFilter;
  school: MentorSchoolFilter;
  university: string;
  verification: string;
  verifiedOnly: boolean;
  grades: MentorGradeFilter[];
  mentorTypes: MentorTypeFilter[];
  priceBand: MentorPriceBandFilter | null;
  priceMin: number | null;
  priceMax: number | null;
  sort: MentorsListSort;
  view: MentorsListView;
  page: number;
};

export const MENTORS_PAGE_SIZE = 12;

export function defaultMentorsListFilters(overrides?: Partial<MentorsListFilters>): MentorsListFilters {
  return {
    q: "",
    subject: "",
    school: "",
    university: "",
    verification: "",
    verifiedOnly: false,
    grades: [],
    mentorTypes: [],
    priceBand: null,
    priceMin: null,
    priceMax: null,
    sort: "popular",
    view: "list",
    page: 1,
    ...overrides,
  };
}

export const MENTOR_SUBJECT_OPTIONS: { id: MentorSubjectFilter; label: string }[] = [
  { id: "", label: "전체" },
  { id: "수학", label: "수학" },
  { id: "영어", label: "영어" },
  { id: "국어", label: "국어" },
  { id: "과학", label: "과학" },
  { id: "사회", label: "사회" },
  { id: "논술", label: "논술" },
  { id: "코딩", label: "코딩" },
  { id: "기타", label: "기타" },
];

export const MENTOR_GRADE_OPTIONS: { id: MentorGradeFilter; label: string }[] = [
  { id: "중등", label: "중등" },
  { id: "고등", label: "고등" },
  { id: "N수", label: "N수" },
  { id: "공통", label: "공통" },
];

export const MENTOR_TYPE_OPTIONS: { id: MentorTypeFilter; label: string }[] = [
  { id: "메디컬계열", label: "메디컬계열" },
  { id: "교육학과", label: "교육학과" },
  { id: "공대", label: "공대" },
  { id: "경영경제대", label: "경영·경제대" },
  { id: "문과대", label: "문과대" },
  { id: "SKY", label: "SKY" },
];

export const MENTOR_PRICE_BAND_OPTIONS: {
  id: MentorPriceBandFilter;
  label: string;
  min: number | null;
  max: number | null;
}[] = [
  { id: "under30", label: "3만원 이하", min: null, max: 30_000 },
  { id: "30to50", label: "3~5만원", min: 30_000, max: 50_000 },
  { id: "50to100", label: "5~10만원", min: 50_000, max: 100_000 },
  { id: "over100", label: "10만원 이상", min: 100_000, max: null },
  { id: "custom", label: "직접 입력", min: null, max: null },
];

export const MENTOR_SCHOOL_OPTIONS: { id: MentorSchoolFilter; label: string }[] = [
  { id: "", label: "전체" },
  { id: "서울대", label: "서울대" },
  { id: "연대", label: "연대" },
  { id: "고대", label: "고대" },
  { id: "기타", label: "기타" },
];

export const MENTOR_SORT_OPTIONS: { id: MentorsListSort; label: string }[] = [
  { id: "popular", label: "인기순" },
  { id: "new", label: "최신순" },
  { id: "review", label: "리뷰많은순" },
  { id: "price_asc", label: "가격낮은순" },
];

const SORTS: MentorsListSort[] = ["popular", "new", "review", "price_asc", "price_desc", "rating", "response"];

function pickSort(v: string | undefined): MentorsListSort {
  if (v === "reviews" || v === "rating") return "review";
  if (v === "price") return "price_asc";
  if (SORTS.includes(v as MentorsListSort)) return v as MentorsListSort;
  return "popular";
}

function pickSubject(v: string): MentorSubjectFilter {
  const found = MENTOR_SUBJECT_OPTIONS.find((o) => o.id === v);
  return found ? found.id : v ? (v as MentorSubjectFilter) : "";
}

function pickSchool(v: string): MentorSchoolFilter {
  const found = MENTOR_SCHOOL_OPTIONS.find((o) => o.id === v);
  return found ? found.id : "";
}

function parseIntParam(v: string): number | null {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseListParam(v: string, allowed: readonly string[]): string[] {
  if (!v.trim()) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => allowed.includes(s));
}

function pickPriceBand(v: string, priceMin: number | null, priceMax: number | null): MentorPriceBandFilter | null {
  if (v && MENTOR_PRICE_BAND_OPTIONS.some((o) => o.id === v)) {
    return v as MentorPriceBandFilter;
  }
  if (priceMin != null || priceMax != null) return "custom";
  return null;
}

function many(sp: Record<string, string | string[] | undefined>, k: string): string {
  const v = sp[k];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join(",");
  return typeof v === "string" ? v.trim() : "";
}

export function parseMentorsListFilters(sp: Record<string, string | string[] | undefined>): MentorsListFilters {
  const one = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return String(v[0] ?? "").trim();
    return typeof v === "string" ? v.trim() : "";
  };

  const school = pickSchool(one("school") || one("university"));
  const verifiedOnly = one("verified") === "1" || one("verification") === "verified";
  const priceMin = parseIntParam(one("priceMin"));
  const priceMax = parseIntParam(one("priceMax"));
  const priceBand = pickPriceBand(one("priceBand"), priceMin, priceMax);

  let resolvedMin = priceMin;
  let resolvedMax = priceMax;
  if (priceBand && priceBand !== "custom") {
    const band = MENTOR_PRICE_BAND_OPTIONS.find((b) => b.id === priceBand);
    if (band) {
      resolvedMin = band.min;
      resolvedMax = band.max;
    }
  }

  const viewRaw = one("view");
  const view: MentorsListView = viewRaw === "grid" ? "grid" : "list";

  return {
    q: one("q"),
    subject: pickSubject(one("subject")),
    school,
    university: school || one("university"),
    verification: one("verification"),
    verifiedOnly,
    grades: parseListParam(many(sp, "grades"), MENTOR_GRADE_OPTIONS.map((g) => g.id)) as MentorGradeFilter[],
    mentorTypes: parseListParam(many(sp, "mentorTypes"), MENTOR_TYPE_OPTIONS.map((t) => t.id)) as MentorTypeFilter[],
    priceBand,
    priceMin: resolvedMin,
    priceMax: resolvedMax,
    sort: pickSort(one("sort")),
    view,
    page: Math.max(1, parseIntParam(one("page")) ?? 1),
  };
}

export function mentorsListHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined | null>
): string {
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) {
    if (v !== undefined && v !== null && v !== "") next[k] = v;
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "") {
      delete next[k];
      continue;
    }
    next[k] = v;
  }
  const u = new URLSearchParams(next);
  const s = u.toString();
  return s ? `/mentors?${s}` : "/mentors";
}

export function filtersToHrefRecord(f: MentorsListFilters): Record<string, string | undefined> {
  const o: Record<string, string | undefined> = {};
  if (f.q) o.q = f.q;
  if (f.subject) o.subject = f.subject;
  if (f.school) o.school = f.school;
  else if (f.university) o.university = f.university;
  if (f.verifiedOnly) o.verified = "1";
  if (f.verification && !f.verifiedOnly) o.verification = f.verification;
  if (f.grades.length) o.grades = f.grades.join(",");
  if (f.mentorTypes.length) o.mentorTypes = f.mentorTypes.join(",");
  if (f.priceBand) o.priceBand = f.priceBand;
  if (f.priceMin != null) o.priceMin = String(f.priceMin);
  if (f.priceMax != null) o.priceMax = String(f.priceMax);
  if (f.sort && f.sort !== "popular") o.sort = f.sort;
  if (f.view === "grid") o.view = "grid";
  if (f.page > 1) o.page = String(f.page);
  return o;
}
