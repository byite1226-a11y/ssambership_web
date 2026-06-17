// 정본은 lib/subjects/subjectCatalog.ts. 이 모듈은 기존 호출부 호환을 위해 얇게 위임한다.
import {
  SUBJECT_CATALOG,
  getSubjectLabel,
  normalizeSubjectCode,
} from "@/lib/subjects/subjectCatalog";

export const QUESTION_SUBJECT_OPTIONS = SUBJECT_CATALOG.map((s) => ({ code: s.code, label: s.label }));

export type QuestionSubjectCode = string;

export function normalizeQuestionSubjectCode(value: unknown): string | null {
  return normalizeSubjectCode(value);
}

export function questionSubjectLabelFromCode(value: unknown): string | null {
  const code = normalizeSubjectCode(value);
  return code ? getSubjectLabel(code) : null;
}
