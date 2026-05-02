export function CommunityHomeIntroStrip() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-5 py-4 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">커뮤니티 안내</p>
      <ul className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
        <li className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 shadow-sm">
          <span className="font-extrabold text-blue-700">숏폼</span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-600">
            멘토가 올린 짧은 세로형 학습 영상을 빠르게 훑어볼 수 있어요.
          </span>
        </li>
        <li className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 shadow-sm">
          <span className="font-extrabold text-blue-700">게시판</span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-600">
            공부법·해설·후기·학습 팁 중심의 텍스트 콘텐츠를 모아둡니다.
          </span>
        </li>
        <li className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5 shadow-sm">
          <span className="font-extrabold text-blue-700">참여</span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-600">
            댓글·스크랩으로 정리하고, 문제가 있으면 신고로 알려 주세요.
          </span>
        </li>
      </ul>
    </div>
  );
}
