import type { AppRole } from "@/lib/types/user";
import { RoleStudentCardIllustration } from "./illustrations/RoleStudentCardIllustration";
import { RoleMentorCardIllustration } from "./illustrations/RoleMentorCardIllustration";
import {
  MentorBenefitIcon1,
  MentorBenefitIcon2,
  MentorBenefitIcon3,
  StudentBenefitIcon1,
  StudentBenefitIcon2,
  StudentBenefitIcon3,
} from "./icons/AuthBenefitIcons";

type Selectable = Extract<AppRole, "student" | "mentor">;

const cards: {
  id: Selectable;
  shortLabel: string;
  title: string;
  lead: string;
  benefits: [string, string, string];
  tone: "blue" | "emerald";
}[] = [
  {
    id: "student",
    shortLabel: "학생",
    title: "학생으로 가입하기",
    lead: "멘토에게 질문하고 콘텐츠·멤버십 혜택을 학생 흐름에 맞게 시작해요.",
    benefits: [
      "질문·콘텐츠 이용(정책·요금제 기준)",
      "닉네임·학교·프로필로 멘토 탐색(제공 범위는 약관)",
      "알림·이벤트(선택 수신 시) 혜택 안내",
    ],
    tone: "blue",
  },
  {
    id: "mentor",
    shortLabel: "멘토",
    title: "멘토로 가입하기",
    lead: "대학 인증과 프로필을 바탕으로 멘티에게 답하며 멘토 활동을 시작해요.",
    benefits: [
      "대학(재) 인증·프로필·활동(승인/정책)",
      "질의응답·가이드(제공·과금)은 약관·정책",
      "심사·이의·갱신 시 자료·보관·삭제(운영)",
    ],
    tone: "emerald",
  },
];

const studentIcons = [StudentBenefitIcon1, StudentBenefitIcon2, StudentBenefitIcon3] as const;
const mentorIcons = [MentorBenefitIcon1, MentorBenefitIcon2, MentorBenefitIcon3] as const;

type RoleSelectorProps = {
  value: Selectable | null;
  onChange: (r: Selectable) => void;
  disabled?: boolean;
};

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6" role="group" aria-label="가입 유형">
      {cards.map((c) => {
        const selected = value === c.id;
        const isBlue = c.tone === "blue";
        const accent = isBlue ? "#2563EB" : "#059669";
        const focusRing = isBlue ? "focus-visible:ring-[#2563EB]/40" : "focus-visible:ring-[#059669]/40";
        const chipClass = isBlue
          ? "bg-blue-50 text-[#2563EB] ring-1 ring-blue-100"
          : "bg-emerald-50 text-[#059669] ring-1 ring-emerald-100";
        const heroBox = isBlue
          ? "border-slate-200 bg-blue-50/40"
          : "border-slate-200 bg-emerald-50/40";
        const footerBorder = "border-slate-200";
        const footerSelected = isBlue ? "text-[#2563EB]" : "text-[#059669]";
        const footerHint = isBlue ? "text-slate-500" : "text-slate-500";
        const icons = c.id === "student" ? studentIcons : mentorIcons;

        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c.id)}
            className={[
              "group relative flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-white p-5 text-left transition sm:p-6",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              focusRing,
              selected
                ? isBlue
                  ? "border-[#2563EB] ring-2 ring-[#2563EB]/15"
                  : "border-[#059669] ring-2 ring-[#059669]/15"
                : "border-slate-200 hover:border-slate-300",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
            aria-pressed={selected}
          >
            {selected ? (
              <span
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: accent }}
                aria-hidden
              >
                ✓
              </span>
            ) : null}

            <div
              className={`mb-4 h-36 w-full shrink-0 overflow-hidden rounded-xl border sm:h-40 ${heroBox}`}
            >
              {c.id === "student" ? (
                <RoleStudentCardIllustration className="h-full w-full object-cover" />
              ) : (
                <RoleMentorCardIllustration className="h-full w-full object-cover" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={`inline-flex w-fit max-w-full items-center rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${chipClass}`}
              >
                {c.shortLabel}
              </span>
              <span className="mt-2 block text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">
                {c.title}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-slate-600 sm:text-base">
                {c.lead}
              </span>

              <ul className="mt-4 flex list-none flex-col gap-2" role="list">
                {c.benefits.map((b, i) => {
                  const Icon = icons[i] ?? icons[0];
                  if (!Icon) return null;
                  return (
                    <li
                      key={b}
                      className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                    >
                      <span className="flex shrink-0 items-center justify-center" aria-hidden>
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-slate-800">
                        {b}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={`mt-5 border-t ${footerBorder} pt-4`}>
              {selected ? (
                <span className={`text-sm font-bold ${footerSelected}`}>
                  선택됨 — 아래 {c.id === "student" ? "학생" : "멘토"} 가입서를 이어갈 수 있어요
                </span>
              ) : (
                <span className={`text-sm font-medium ${footerHint}`}>
                  카드를 눌러 이 유형을 선택하세요
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
