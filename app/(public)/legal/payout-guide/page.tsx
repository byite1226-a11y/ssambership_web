import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "정산 안내",
  description: "멘토 정산 흐름, 지급 주기, 환불·취소 반영 원칙을 안내합니다.",
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

export default function LegalPayoutGuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#16A34A]">멘토 지원</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">정산 안내</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          멘토가 구독·맞춤의뢰 등으로 발생한 수익을 정산받는 흐름을 설명합니다. 실제 금액·수수료·일정은 로그인 후
          정산 화면에서 확인해 주세요.
        </p>
      </header>

      <GuideSection id="what-is-payout" title="정산이란?">
        <p>
          정산은 멘토가 쌤버십에서 제공한 서비스(구독 질문방, 맞춤의뢰 등)로 발생한 수익을 플랫폼이 집계한 뒤,
          정해진 절차에 따라 멘토에게 지급하는 과정입니다.
        </p>
        <p>
          학생의 결제·이용 내역과 멘토의 활동 내역이 맞물려 산출되며, 환불·취소·분쟁 처리 결과는 정산 금액에
          반영될 수 있습니다.
        </p>
      </GuideSection>

      <GuideSection id="cycle" title="정산 주기와 지급">
        <p>
          정산은 보통 <strong className="font-bold text-slate-900">월 단위</strong>로 집계되며, 매월 정해진 지급일에
          멘토 계좌로 이체합니다. 구체적인 지급일·집계 기간은 운영 정책과 공지에 따라 안내됩니다.
        </p>
        <p>
          지급 전 <strong className="font-bold text-slate-900">플랫폼 수수료</strong>가 공제됩니다. 구독·맞춤의뢰
          등 항목별 수수료율과 적용 방식은 정산 화면과 약관·운영 정책에서 확인할 수 있습니다.
        </p>
        <p>
          정산 계좌·세금 관련 정보는 멘토 정산 화면에서 등록·수정합니다. 정보가 누락되거나 확인이 필요하면 지급이
          지연될 수 있습니다.
        </p>
      </GuideSection>

      <GuideSection id="refund-adjustment" title="환불·취소와 익월 반영">
        <p>
          학생 환불, 구독 해지, 맞춤의뢰 취소·분쟁 등으로 이미 집계된 수익이 조정되면, 해당 금액은 이후 정산
          주기에 반영될 수 있습니다.
        </p>
        <p>
          조정 내역과 사유는 정산 화면의 상세 내역에서 확인할 수 있습니다. 문의가 필요하면 고객센터를 이용해
          주세요.
        </p>
      </GuideSection>

      <GuideSection id="check-amounts" title="실제 금액·일정 확인">
        <p>
          예상 정산액, 확정 내역, 수수료 공제, 지급 예정일 등 <strong className="font-bold text-slate-900">실제 숫자</strong>
          는 멘토 전용 정산 대시보드에서만 조회할 수 있습니다. 비로그인 상태에서는 상세 금액을 표시하지 않습니다.
        </p>
        <p>
          구독 요금·플랜별 혜택·질문 한도 등 학생 측 요금 정보는{" "}
          <Link href="/subscribe" className="font-bold text-[#1A56DB] hover:underline">
            구독 안내
          </Link>
          화면을 참고해 주세요.
        </p>
      </GuideSection>

      <aside className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-7">
        <h2 className="text-lg font-extrabold text-slate-900">정산 화면에서 확인하기</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          멘토로 로그인하면 이번 달·지난 달 정산 요약, 상세 내역, 계좌 정보를 볼 수 있습니다. 아직 멘토가 아니라면
          가입 후 심사·승인을 거쳐 활동을 시작할 수 있습니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/mentor/payouts"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#16A34A] px-6 text-sm font-extrabold text-white transition hover:bg-emerald-700"
          >
            정산 화면 보기
          </Link>
          <Link
            href="/login/mentor"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            멘토 로그인
          </Link>
        </div>
      </aside>

      <p className="text-center text-sm text-slate-600">
        멘토 활동을 시작하려면{" "}
        <Link href="/signup" className="font-bold text-[#16A34A] hover:underline">
          멘토 가입
        </Link>
        을 진행해 주세요. 활동 방법은{" "}
        <Link href="/legal/mentor-guide" className="font-bold text-[#1A56DB] hover:underline">
          멘토 가이드
        </Link>
        에서 확인할 수 있습니다.
      </p>
    </div>
  );
}
