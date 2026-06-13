export function CommunityHomeIntroStrip() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-5 py-4 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">커뮤니티 안내</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        <span className="font-extrabold text-slate-900">숏폼</span>과 <span className="font-extrabold text-slate-900">게시판</span>은 학습 영상과
        글을 각각 모아 두었습니다. 원하는 영역은 왼쪽 메뉴에서 바로 열 수 있어요.
      </p>
    </div>
  );
}
