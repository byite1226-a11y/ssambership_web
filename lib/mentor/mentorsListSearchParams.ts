export type MentorsListSort = "new" | "rating" | "reviews" | "price";

export type MentorsListFilters = {
  q: string;
  university: string;
  subject: string;
  verification: string;
  sort: MentorsListSort;
};

const SORTS: MentorsListSort[] = ["new", "rating", "reviews", "price"];

function pickSort(v: string | undefined): MentorsListSort {
  return SORTS.includes(v as MentorsListSort) ? (v as MentorsListSort) : "new";
}

export function parseMentorsListFilters(sp: Record<string, string | string[] | undefined>): MentorsListFilters {
  const one = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return String(v[0] ?? "").trim();
    return typeof v === "string" ? v.trim() : "";
  };
  return {
    q: one("q"),
    university: one("university"),
    subject: one("subject"),
    verification: one("verification"),
    sort: pickSort(one("sort")),
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
  if (f.university) o.university = f.university;
  if (f.subject) o.subject = f.subject;
  if (f.verification) o.verification = f.verification;
  if (f.sort && f.sort !== "new") o.sort = f.sort;
  return o;
}
