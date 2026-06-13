import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "멘토 가이드",
  description: "쌤버십 멘토 활동, 시작 흐름, 답변·콘텐츠 가이드를 안내합니다.",
};

function GuideSection(props: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={props.id}
      aria-labelledby={`${props.id}-heading`}
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"
    >
      <h2 id={`${props.id}-heading`} className="text-lg font-extrabold text-slate-900">
        {props.title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">{props.children}</div>
    </section>
  );
}

export default function LegalMentorGuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#16A34A]">멘토 지원</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">멘토 가이드</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          쌤버십에서 멘토로 활동하는 방법, 시작 절차, 좋은 답변·콘텐츠 작성 팁을 정리했습니다. 요금·수수료·한도 등
          구체 수치는 각 화면과 정책 페이지에서 확인해 주세요.
        </p>
      </header>

      <GuideSection id="role" title="멘토가 하는 일">
        <p>멘토는 구독 중인 학생과 1:1로 연결되어 아래 영역에서 활동합니다.</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            <strong className="font-bold text-slate-900">질문방</strong> — 학생 질문에 답하고, 스레드별로 학습
            흐름을 이어갑니다.
          </li>
          <li>
            <strong className="font-bold text-slate-900">연결노트</strong> — 질문방 단위로 장기 학습·진도를
            기록·공유합니다.
          </li>
          <li>
            <strong className="font-bold text-slate-900">커뮤니티</strong> — 게시판·숏폼에 학습 콘텐츠를
            발행합니다.
          </li>
          <li>
            <strong className="font-bold text-slate-900">맞춤의뢰</strong> — 학생이 요청한 맞춤 작업을 검토·수행하고
            납품합니다.
          </li>
        </ul>
        <p>
          각 영역은 별도 운영 규칙과 화면 흐름이 있으며, 멘토 콘솔에서 통합 관리할 수 있습니다.
        </p>
      </GuideSection>

      <GuideSection id="onboarding" title="시작 흐름">
        <ol className="list-inside list-decimal space-y-3 pl-1">
          <li>
            <strong className="font-bold text-slate-900">가입</strong> — 멘토 유형으로 회원가입하고 기본 프로필을
            입력합니다.
          </li>
          <li>
            <strong className="font-bold text-slate-900">대학(재) 인증·심사</strong> — 재학·졸업 등 증빙 자료를
            제출하고 운영팀 심사를 기다립니다. 결과는 이메일·앱 알림으로 안내됩니다.
          </li>
          <li>
            <strong className="font-bold text-slate-900">프로필·요금제 설정</strong> — 소개, 과목, 구독 플랜 등을
            정리합니다. 플랜별 혜택·가격은 구독·프로필 설정 화면에서 확인·수정합니다.
          </li>
          <li>
            <strong className="font-bold text-slate-900">활동 시작</strong> — 승인 후 질문방·커뮤니티·맞춤의뢰
            메뉴가 활성화되며 학생과 연결됩니다.
          </li>
        </ol>
        <p>
          심사 중에도 가이드와 공지를 참고할 수 있습니다. 진행 상태는{" "}
          <Link href="/mentor/dashboard" className="font-bold text-[#1A56DB] hover:underline">
            멘토 대시보드
          </Link>
          와 마이페이지에서 확인하세요.
        </p>
      </GuideSection>

      <GuideSection id="quality" title="좋은 답변·콘텐츠 가이드">
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            학생 질문의 <strong className="font-bold text-slate-900">의도와 수준</strong>을 먼저 파악하고, 이해를
            돕는 설명·예시를 제공합니다.
          </li>
          <li>
            답변·콘텐츠에 <strong className="font-bold text-slate-900">출처·인용</strong>이 필요하면 명시하고, 타인
            저작물·초상권을 침해하지 않습니다.
          </li>
          <li>
            학교 제출용 <strong className="font-bold text-slate-900">대필·대행</strong>은 허용되지 않습니다. 구조·
            문장 피드백·학습 방향 제시 등 가이드 범위를 지켜 주세요.
          </li>
          <li>
            멘토 선택 전 <strong className="font-bold text-slate-900">외부 연락처 교환</strong>은 금지됩니다. 소통은
            플랫폼 내 기능을 이용합니다.
          </li>
          <li>
            지연·휴식이 필요하면 질문방·프로필 상태를 미리 안내해 학생 기대치를 맞춥니다.
          </li>
        </ul>
      </GuideSection>

      <GuideSection id="earnings" title="수익·정산">
        <p>
          구독·맞춤의뢰 등으로 발생한 수익은 월 단위로 집계되며, 플랫폼 수수료 공제 후 정해진 지급일에
          이체됩니다. 환불·취소·분쟁 결과는 이후 정산에 반영될 수 있습니다.
        </p>
        <p>
          수수료율·예상 정산액·지급 일정 등 <strong className="font-bold text-slate-900">구체 금액과 일정</strong>
          은{" "}
          <Link href="/legal/payout-guide" className="font-bold text-[#16A34A] hover:underline">
            정산 안내
          </Link>
          와 로그인 후{" "}
          <Link href="/mentor/payouts" className="font-bold text-[#16A34A] hover:underline">
            정산 화면
          </Link>
          에서 확인하세요.
        </p>
      </GuideSection>

      <GuideSection id="community-rules" title="커뮤니티·운영 규칙">
        <p>
          게시판·숏폼 업로드, 신고·제재, 권리 표기 등 커뮤니티 세부 규칙은 별도 문서를 따릅니다.
        </p>
        <p>
          <Link href="/legal/community-guidelines" className="font-bold text-[#1A56DB] hover:underline">
            커뮤니티 이용규칙
          </Link>
          을 읽고 업로드·답변 시 준수해 주세요. 맞춤의뢰 금지 표현·약관·환불 정책도 함께 확인하는 것이 좋습니다.
        </p>
        <p className="text-slate-600">
          관련 링크:{" "}
          <Link href="/legal/terms" className="font-bold text-[#1A56DB] hover:underline">
            이용약관
          </Link>
          {" · "}
          <Link href="/legal/no-ghostwriting" className="font-bold text-[#1A56DB] hover:underline">
            대필 금지 안내
          </Link>
          {" · "}
          <Link href="/legal/refund" className="font-bold text-[#1A56DB] hover:underline">
            환불 정책
          </Link>
        </p>
      </GuideSection>

      <aside className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-7">
        <h2 className="text-lg font-extrabold text-slate-900">멘토로 시작하기</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          아직 계정이 없다면 멘토 유형으로 가입해 주세요. 이미 멘토 계정이 있다면 로그인 후 대시보드에서 활동을
          이어갈 수 있습니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#16A34A] px-6 text-sm font-extrabold text-white transition hover:bg-emerald-700"
          >
            멘토 가입하기
          </Link>
          <Link
            href="/login/mentor"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            멘토 로그인
          </Link>
        </div>
      </aside>
    </div>
  );
}
