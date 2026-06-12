export const QUESTION_SUBJECT_OPTIONS = [
  { code: "korean", label: "국어" },
  { code: "english", label: "영어" },
  { code: "math", label: "수학" },
  { code: "science", label: "과학" },
  { code: "social", label: "사회·역사" },
  { code: "essay", label: "논술·글쓰기" },
  { code: "career", label: "진로·입시" },
  { code: "etc", label: "기타" },
] as const;

export type QuestionSubjectCode = (typeof QUESTION_SUBJECT_OPTIONS)[number]["code"];

const SUBJECT_CODE_SET = new Set<string>(QUESTION_SUBJECT_OPTIONS.map((s) => s.code));
const SUBJECT_LABEL_TO_CODE = new Map<string, QuestionSubjectCode>(
  QUESTION_SUBJECT_OPTIONS.map((s) => [s.label, s.code])
);

const LEGACY_SUBJECT_TO_CODE = new Map<string, QuestionSubjectCode>([
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

export function normalizeQuestionSubjectCode(value: unknown): QuestionSubjectCode | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (SUBJECT_CODE_SET.has(trimmed)) return trimmed as QuestionSubjectCode;
  return SUBJECT_LABEL_TO_CODE.get(trimmed) ?? LEGACY_SUBJECT_TO_CODE.get(trimmed) ?? null;
}

export function questionSubjectLabelFromCode(value: unknown): string | null {
  const code = normalizeQuestionSubjectCode(value);
  if (!code) return null;
  return QUESTION_SUBJECT_OPTIONS.find((s) => s.code === code)?.label ?? null;
}
