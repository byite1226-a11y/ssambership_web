export type MentorsListSort = "new" | "review" | "price_asc" | "price_desc";

/** @deprecated use review */
export type MentorsListSortLegacy = "rating" | "reviews" | "price";

export type MentorSubjectFilter =
  | ""
  | "수학"
  | "영어"
  | "국어"
  | "과학"
  | "사회"
  | "기타";

export type MentorSchoolFilter = "" | "서울대" | "연대" | "고대" | "기타";

export type MentorsListFilters = {
  q: string;
  subject: MentorSubjectFilter;
  school: MentorSchoolFilter;
  university: string;
  verification: string;
  verifiedOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
  sort: MentorsListSort;
  page: number;
};

export const MENTORS_PAGE_SIZE = 12;

export const MENTOR_SUBJECT_OPTIONS: { id: MentorSubjectFilter; label: string }[] = [
  { id: "", label: "전체" },
  { id: "수학", label: "수학" },
  { id: "영어", label: "영어" },
  { id: "국어", label: "국어" },
  { id: "과학", label: "과학" },
  { id: "사회", label: "사회" },
  { id: "기타", label: "기타" },
];

export const MENTOR_SCHOOL_OPTIONS: { id: MentorSchoolFilter; label: string }[] = [
  { id: "", label: "전체" },
  { id: "서울대", label: "서울대" },
  { id: "연대", label: "연대" },
  { id: "고대", label: "고대" },
  { id: "기타", label: "기타" },
];

export const MENTOR_SORT_OPTIONS: { id: MentorsListSort; label: string }[] = [
  { id: "new", label: "최신순" },
  { id: "review", label: "리뷰많은순" },
  { id: "price_asc", label: "가격낮은순" },
  { id: "price_desc", label: "가격높은순" },
];

const SORTS: MentorsListSort[] = ["new", "review", "price_asc", "price_desc"];

function pickSort(v: string | undefined): MentorsListSort {
  if (v === "reviews" || v === "rating") return "review";
  if (v === "price") return "price_asc";
  if (SORTS.includes(v as MentorsListSort)) return v as MentorsListSort;
  return "new";
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

export function parseMentorsListFilters(sp: Record<string, string | string[] | undefined>): MentorsListFilters {
  const one = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return String(v[0] ?? "").trim();
    return typeof v === "string" ? v.trim() : "";
  };

  const school = pickSchool(one("school") || one("university"));
  const verifiedOnly = one("verified") === "1" || one("verification") === "verified";

  return {
    q: one("q"),
    subject: pickSubject(one("subject")),
    school,
    university: school || one("university"),
    verification: one("verification"),
    verifiedOnly,
    priceMin: parseIntParam(one("priceMin")),
    priceMax: parseIntParam(one("priceMax")),
    sort: pickSort(one("sort")),
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
  if (f.priceMin != null) o.priceMin = String(f.priceMin);
  if (f.priceMax != null) o.priceMax = String(f.priceMax);
  if (f.sort && f.sort !== "new") o.sort = f.sort;
  if (f.page > 1) o.page = String(f.page);
  return o;
}
