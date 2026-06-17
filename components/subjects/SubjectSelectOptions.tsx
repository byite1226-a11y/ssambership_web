import { SUBJECT_SELECT_GROUPS } from "@/lib/subjects/subjectCatalog";

/**
 * 과목 정본(subjectCatalog) 기반 2단 드롭다운 옵션.
 * 소분류가 있는 대분류는 <optgroup>, 단일 대분류는 평면 <option>.
 * 서버/클라이언트 컴포넌트 양쪽에서 <select> 자식으로 사용 가능(훅 없음).
 */
export function SubjectSelectOptions() {
  return (
    <>
      {SUBJECT_SELECT_GROUPS.map((group) =>
        group.options.length === 1 && group.options[0].code === group.major.code ? (
          <option key={group.major.code} value={group.major.code}>
            {group.major.label}
          </option>
        ) : (
          <optgroup key={group.major.code} label={group.major.label}>
            {group.options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </optgroup>
        )
      )}
    </>
  );
}
