type Props = {
  /** null이면 자격 정보를 불러오지 못한 상태 */
  eligibilityKnown: boolean;
  eligible: boolean;
};

export function ReviewEligibilityBanner(props: Props) {
  if (!props.eligibilityKnown) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs font-medium leading-relaxed text-amber-950">
        <p className="font-extrabold">리뷰 작성 자격</p>
        <p className="mt-1">
          동일 멘토에 대해 <strong>연속 2회 결제 성공</strong>한 경우에만 후기 작성이 가능하다는 정책을 UI에 반영합니다. 현재
          자격을 계산하는 쿼리가 연결되어 있지 않아 작성 폼은 비활성화됩니다.
        </p>
        <ul className="mt-2 list-inside list-disc text-amber-900/90">
          <li>무료체험만 이용한 경우 작성 불가</li>
          <li>1개월만 이용한 경우 작성 불가</li>
        </ul>
      </div>
    );
  }
  if (!props.eligible) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-800">
        <p className="font-extrabold">리뷰를 작성할 수 없습니다</p>
        <p className="mt-1">정책상 이 멘토에 대한 후기 작성 조건을 충족하지 않습니다.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-semibold text-emerald-950">
      리뷰 작성 조건을 충족한 것으로 표시됩니다. 아래에서 내용을 작성해 주세요.
    </div>
  );
}
