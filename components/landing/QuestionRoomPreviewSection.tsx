import Link from "next/link";

export function QuestionRoomPreviewSection() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-extrabold text-slate-900">질문방 구조</h2>
      <p className="mt-2 text-sm text-slate-600">
        <strong>room</strong> → <strong>thread</strong> → <strong>message</strong> 계층으로 대화를 쌓습니다. (질문방 라우트·쿼리 코드는 변경하지 않음)
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>멘토별 room 열기 (구독·초대·정책에 따름)</li>
        <li>thread 단위로 주제·상태 관리</li>
        <li>message가 실제 질문/답변 본문</li>
      </ol>
      <div className="mt-4">
        <Link href="/login" className="text-sm font-extrabold text-blue-700 underline">
          로그인 후 질문방(학생)
        </Link>
      </div>
    </section>
  );
}
