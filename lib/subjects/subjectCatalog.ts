// 과목 정본(단일 소스). 화면/폼/드롭다운은 다음 단계에서 이 모듈을 import 해 통일한다.
// DB public.subjects 테이블(074)과 code/label/parent/sort가 정확히 일치해야 한다.
// 계층: 대분류(parentCode=null) → 소분류(parentCode=대분류 code).

export type SubjectCatalogEntry = {
  code: string;
  label: string;
  parentCode: string | null;
  sortOrder: number;
};

export const SUBJECT_CATALOG: readonly SubjectCatalogEntry[] = [
  // 국어
  { code: "korean", label: "국어", parentCode: null, sortOrder: 10 },
  { code: "korean_speech_writing", label: "화법과작문", parentCode: "korean", sortOrder: 11 },
  { code: "korean_language_media", label: "언어와매체", parentCode: "korean", sortOrder: 12 },
  { code: "korean_reading", label: "독서", parentCode: "korean", sortOrder: 13 },
  { code: "korean_literature", label: "문학", parentCode: "korean", sortOrder: 14 },

  // 영어 (단일)
  { code: "english", label: "영어", parentCode: null, sortOrder: 20 },

  // 수학
  { code: "math", label: "수학", parentCode: null, sortOrder: 30 },
  { code: "math_1", label: "수학Ⅰ", parentCode: "math", sortOrder: 31 },
  { code: "math_2", label: "수학Ⅱ", parentCode: "math", sortOrder: 32 },
  { code: "math_calculus", label: "미적분", parentCode: "math", sortOrder: 33 },
  { code: "math_statistics", label: "확률과통계", parentCode: "math", sortOrder: 34 },
  { code: "math_geometry", label: "기하", parentCode: "math", sortOrder: 35 },

  // 한국사 (단일, 별도 대분류)
  { code: "korean_history", label: "한국사", parentCode: null, sortOrder: 40 },

  // 사회
  { code: "social", label: "사회", parentCode: null, sortOrder: 50 },
  { code: "social_life_ethics", label: "생활과윤리", parentCode: "social", sortOrder: 51 },
  { code: "social_ethics_thought", label: "윤리와사상", parentCode: "social", sortOrder: 52 },
  { code: "social_korea_geo", label: "한국지리", parentCode: "social", sortOrder: 53 },
  { code: "social_world_geo", label: "세계지리", parentCode: "social", sortOrder: 54 },
  { code: "social_east_asia_history", label: "동아시아사", parentCode: "social", sortOrder: 55 },
  { code: "social_world_history", label: "세계사", parentCode: "social", sortOrder: 56 },
  { code: "social_economics", label: "경제", parentCode: "social", sortOrder: 57 },
  { code: "social_politics_law", label: "정치와법", parentCode: "social", sortOrder: 58 },
  { code: "social_culture", label: "사회문화", parentCode: "social", sortOrder: 59 },

  // 과학
  { code: "science", label: "과학", parentCode: null, sortOrder: 60 },
  { code: "science_physics_1", label: "물리학Ⅰ", parentCode: "science", sortOrder: 61 },
  { code: "science_chemistry_1", label: "화학Ⅰ", parentCode: "science", sortOrder: 62 },
  { code: "science_biology_1", label: "생명과학Ⅰ", parentCode: "science", sortOrder: 63 },
  { code: "science_earth_1", label: "지구과학Ⅰ", parentCode: "science", sortOrder: 64 },
  { code: "science_physics_2", label: "물리학Ⅱ", parentCode: "science", sortOrder: 65 },
  { code: "science_chemistry_2", label: "화학Ⅱ", parentCode: "science", sortOrder: 66 },
  { code: "science_biology_2", label: "생명과학Ⅱ", parentCode: "science", sortOrder: 67 },
  { code: "science_earth_2", label: "지구과학Ⅱ", parentCode: "science", sortOrder: 68 },

  // 단일 대분류
  { code: "essay", label: "논술·글쓰기", parentCode: null, sortOrder: 70 },
  { code: "career", label: "진로·입시", parentCode: null, sortOrder: 80 },
  { code: "etc", label: "기타", parentCode: null, sortOrder: 99 },
] as const;

const BY_CODE = new Map<string, SubjectCatalogEntry>(SUBJECT_CATALOG.map((s) => [s.code, s]));
const LABEL_TO_CODE = new Map<string, string>(SUBJECT_CATALOG.map((s) => [s.label, s.code]));

// 레거시/기존 저장값 호환 — 기존 데이터가 깨지지 않게 흡수.
// (구 questionSubjects.ts 의 normalize+legacy 로직 + '사회·역사'→social 등)
const LEGACY_LABEL_TO_CODE = new Map<string, string>([
  ["사회·역사", "social"],
  ["사회/역사", "social"],
  ["역사", "korean_history"],
  ["한국사", "korean_history"],
  // 구 자유 입력 라벨 → 대분류 보존(소분류로 임의 승격하지 않음)
  ["미적분", "math"],
  ["확률과통계", "math"],
  ["확률과 통계", "math"],
  ["수학Ⅰ", "math"],
  ["수학 I", "math"],
  ["수학Ⅱ", "math"],
  ["수학 II", "math"],
  ["기하", "math"],
  ["대수", "math"],
  ["물리", "science"],
  ["화학", "science"],
]);

/** code → label. 못 찾으면 입력이 비어있지 않은 문자열이면 그대로, 아니면 '기타'. */
export function getSubjectLabel(code: unknown): string {
  if (typeof code === "string") {
    const hit = BY_CODE.get(code.trim());
    if (hit) return hit.label;
    const normalized = normalizeSubjectCode(code);
    if (normalized) return BY_CODE.get(normalized)?.label ?? code.trim();
    const trimmed = code.trim();
    if (trimmed) return trimmed;
  }
  return "기타";
}

/** 대분류만 (parentCode === null) — sortOrder 순. */
export function getMajorSubjects(): SubjectCatalogEntry[] {
  return SUBJECT_CATALOG.filter((s) => s.parentCode === null).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 특정 대분류의 소분류 — sortOrder 순. */
export function getMinorSubjects(parentCode: string): SubjectCatalogEntry[] {
  return SUBJECT_CATALOG.filter((s) => s.parentCode === parentCode).sort((a, b) => a.sortOrder - b.sortOrder);
}

export type SubjectSelectGroup = {
  major: { code: string; label: string };
  options: Array<{ code: string; label: string }>;
};

/**
 * 드롭다운(optgroup)용 구조. 소분류가 있으면 그 소분류들을 옵션으로,
 * 단일 대분류는 자기 자신을 유일한 옵션으로 둔다.
 */
export const SUBJECT_SELECT_GROUPS: readonly SubjectSelectGroup[] = getMajorSubjects().map((major) => {
  const minors = getMinorSubjects(major.code);
  const options = minors.length > 0
    ? minors.map((m) => ({ code: m.code, label: m.label }))
    : [{ code: major.code, label: major.label }];
  return { major: { code: major.code, label: major.label }, options };
});

/** 임의 입력(코드/현재 라벨/레거시 라벨) → 정본 code. 못 찾으면 null. */
export function normalizeSubjectCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (BY_CODE.has(trimmed)) return trimmed;
  return LABEL_TO_CODE.get(trimmed) ?? LEGACY_LABEL_TO_CODE.get(trimmed) ?? null;
}
