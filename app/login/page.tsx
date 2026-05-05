import Link from "next/link";
import { LoginStudentHeroIllustration } from "@/components/auth/illustrations/LoginStudentHeroIllustration";
import { LoginMentorHeroIllustration } from "@/components/auth/illustrations/LoginMentorHeroIllustration";

function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[#0b2b6c]">
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#123d8e] text-white"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M3 10 12 4l9 6-9 6-9-6Zm2.5 2.8L12 17l6.5-4.2V16L12 20l-6.5-4v-3.2Z" />
        </svg>
      </span>
      <span className="text-[1.35rem] font-extrabold leading-none tracking-[-0.03em]">쌤버십</span>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4ZM20.2 20.2l-4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <ellipse cx="12" cy="11.5" rx="11" ry="10" fill="#FEE500"/>
      <path d="M12 5C7.58 5 4 7.69 4 11c0 2.13 1.42 4 3.57 5.13l-.9 3.34c-.08.3.26.54.52.37L11.1 17.4c.3.03.6.05.9.05 4.42 0 8-2.69 8-6s-3.58-6-8-6z" fill="#191919"/>
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#03C75A"/>
      <path d="M13.7 12.4L10.1 7H7v10h3.3v-5.4L14 17H17V7h-3.3v5.4z" fill="white"/>
    </svg>
  );
}

function SocialRow() {
  const base =
    "inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors";
  return (
    <>
      <p className="text-center text-[13px] font-semibold text-slate-400">또는</p>
      <div className="grid grid-cols-3 gap-2.5">
        <button type="button" className={base} disabled>
          <GoogleIcon />
          Google
        </button>
        <button type="button" className={base} disabled>
          <KakaoIcon />
          카카오
        </button>
        <button type="button" className={base} disabled>
          <NaverIcon />
          네이버
        </button>
      </div>
    </>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1f58c6]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="9" width="18" height="13" rx="2" />
      <path d="M12 9V22M3 13h18" strokeLinecap="round" />
      <path d="M8 9c0-2.21 1.79-4 4-4s4 1.79 4 4" />
      <path d="M8 9c-2.21 0-4-1.79-4-4" strokeLinecap="round" />
      <path d="M16 9c2.21 0 4-1.79 4-4" strokeLinecap="round" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1f58c6]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1f58c6]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" strokeLinecap="round" />
      <path d="M15 14c1.5 0 5 .75 5 4" strokeLinecap="round" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#058b65]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  );
}
function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#058b65]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3 1.34-3 3 1.34 3 3 3" strokeLinecap="round" />
    </svg>
  );
}
function MentorChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#058b65]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      <path d="M9 10h6M9 14h4" strokeLinecap="round" />
    </svg>
  );
}

function BenefitCell({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-center">
      <span>{icon}</span>
      <p className="text-[12px] font-bold leading-tight text-slate-800">{title}</p>
      <p className="text-[11px] font-medium leading-tight text-slate-500">{description}</p>
    </li>
  );
}

function LandingCard({
  role,
  title,
  badge,
  line1,
  line2,
  ctaLabel,
  loginPath,
  signupPath,
  signupLabel,
  benefits,
}: {
  role: "student" | "mentor";
  title: string;
  badge: string;
  line1: string;
  line2: string;
  ctaLabel: string;
  loginPath: string;
  signupPath: string;
  signupLabel: string;
  benefits: { icon: React.ReactNode; title: string; description: string }[];
}) {
  const student = role === "student";
  return (
    <section
      className={`rounded-2xl border px-7 pt-6 pb-7 bg-white ${
        student ? "border-[#c9defe]" : "border-[#b6e8d4]"
      }`}
    >
      {/* Badge + Illustration row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${
              student ? "bg-[#ddeeff] text-[#2d5fa8]" : "bg-[#d4f0e4] text-[#1a6649]"
            }`}
          >
            {badge}
          </span>
          <h2 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.03em] text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-[15px] font-bold leading-snug tracking-[-0.01em] text-slate-700">
            {line1}
            <br />
            {line2}
          </p>
        </div>
        <div className={`h-[210px] w-[220px] flex-shrink-0 rounded-2xl overflow-hidden ${
            student ? "bg-[#e8f1ff]" : "bg-[#d4f0e4]"
          }`}>
          {student ? (
            <LoginStudentHeroIllustration className="h-full w-full" />
          ) : (
            <LoginMentorHeroIllustration className="h-full w-full" />
          )}
        </div>
      </div>

      {/* Benefits */}
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {benefits.map((item) => (
          <BenefitCell
            key={`${item.title}-${item.description}`}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={loginPath}
        className={`mt-4 inline-flex h-[52px] w-full items-center justify-center rounded-xl text-[17px] font-extrabold text-white ${
          student ? "bg-[#1462ff]" : "bg-[#058b65]"
        }`}
      >
        {ctaLabel}
      </Link>

      {/* Social */}
      <div className="mt-3">
        <SocialRow />
      </div>

      {/* Signup link */}
      <p className="mt-4 text-center text-[13px] font-semibold text-slate-600">
        {role === "student" ? "학생 계정이 없으신가요? " : "멘토 계정이 없으신가요? "}
        <Link href={signupPath} className="font-extrabold text-[#1f4e97] underline underline-offset-2">
          {signupLabel}
        </Link>
      </p>
    </section>
  );
}

function InfoBlock() {
  const items = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1f58c6]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      ),
      title: "안내 사항",
      desc: "무료 질문권은 가입 직후 제공되며\n정책에 따라 사용됩니다.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1f58c6]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" strokeLinecap="round" />
          <path d="M7 13h4M7 16h2" strokeLinecap="round" />
        </svg>
      ),
      title: "무료 질문권 15장 제공",
      desc: "회원가입 즉시 15장의\n무료 질문권이 지급됩니다.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1f58c6]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeLinecap="round" />
        </svg>
      ),
      title: "한 멘토당 최대 3개 질문",
      desc: "무료 질문은 한 멘토에게\n최대 3개까지 가능합니다.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1f58c6]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="8" cy="9" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M2 20c0-3.31 2.69-6 6-6M16 14c3.31 0 6 2.69 6 6" strokeLinecap="round" />
          <path d="M9 20c0-3.31 2.69-6 7-6" strokeLinecap="round" />
        </svg>
      ),
      title: "여러 멘토에게 사용 가능",
      desc: "무료 질문권은 다양한 멘토에게\n나눠서 사용할 수 있습니다.",
    },
  ];

  return (
    <section className="grid grid-cols-4 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((item, idx) => (
        <div
          key={item.title}
          className={`p-5 ${idx !== items.length - 1 ? "border-r border-slate-200" : ""}`}
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <p className="text-[14px] font-extrabold text-slate-900">{item.title}</p>
          </div>
          {item.desc && (
            <p className="mt-2 whitespace-pre-line text-[13px] font-medium leading-5 text-slate-500">
              {item.desc}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

type LoginPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage(props: LoginPageProps) {
  const termsUrl = process.env.NEXT_PUBLIC_LEGAL_TERMS_URL;
  const privacyUrl = process.env.NEXT_PUBLIC_LEGAL_PRIVACY_URL;
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;
  const sp = (await props.searchParams) ?? {};
  const raw = sp.next;
  const nextVal = (typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null) ?? null;
  const nextQ = nextVal ? `?next=${encodeURIComponent(nextVal)}` : "";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[64px] w-full max-w-[1200px] items-center justify-between px-6">
          <BrandLogo />
          <nav className="flex items-center gap-8">
            <Link href="/mentors" className="text-[15px] font-semibold text-slate-700 hover:text-slate-900">
              멘토 찾기
            </Link>
            <Link href="/login" className="text-[15px] font-semibold text-slate-700 hover:text-slate-900">
              질문방
            </Link>
            <Link href="/community" className="text-[15px] font-semibold text-slate-700 hover:text-slate-900">
              커뮤니티
            </Link>
            <Link href="/custom-request" className="text-[15px] font-semibold text-slate-700 hover:text-slate-900">
              맞춤의뢰
            </Link>
            <Link href="/cash" className="text-[15px] font-semibold text-slate-700 hover:text-slate-900">
              캐시결제
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="검색"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            >
              <SearchIcon />
            </button>
            <Link
              href="/login"
              className="inline-flex h-[38px] min-w-[80px] items-center justify-center rounded-[10px] border border-[#cdd7ee] px-4 text-[14px] font-bold text-[#1d3f86] hover:bg-slate-50"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-[38px] min-w-[88px] items-center justify-center rounded-[10px] bg-[#0b63ff] px-4 text-[14px] font-bold text-white hover:bg-[#0052e0]"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-6 pb-14 pt-10">
        {/* Page title */}
        <h1 className="text-center text-[40px] font-black leading-none tracking-[-0.04em] text-[#0f63ff]">
          로그인이 필요해요
        </h1>
        <p className="mt-3 text-center text-[16px] font-semibold tracking-[-0.01em] text-slate-500">
          학생과 멘토 각각의 서비스를 이용해보세요.
        </p>

        {/* Cards */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          <LandingCard
            role="student"
            badge="질문하고 배우는 학생이라면"
            title="학생 로그인"
            line1="전문 멘토에게 질문하고"
            line2="맞춤형 답변을 받아보세요."
            ctaLabel="학생 로그인"
            loginPath={`/login/student${nextQ}`}
            signupPath="/signup"
            signupLabel="학생 회원가입"
            benefits={[
              { icon: <GiftIcon />, title: "가입 시 무료 질문권", description: "15장 제공" },
              { icon: <ChatIcon />, title: "무료 질문은", description: "한 멘토당 최대 3개" },
              { icon: <PeopleIcon />, title: "여러 멘토에게", description: "나눠서 사용 가능" },
            ]}
          />
          <LandingCard
            role="mentor"
            badge="답변하고 성장하는 멘토라면"
            title="멘토 로그인"
            line1="학생 질문에 답변하고"
            line2="지식과 경험을 나눠주세요."
            ctaLabel="멘토 로그인"
            loginPath={`/login/mentor${nextQ}`}
            signupPath="/signup"
            signupLabel="멘토 회원가입"
            benefits={[
              { icon: <MentorChatIcon />, title: "질문방 관리 및", description: "답변 작성" },
              { icon: <DocIcon />, title: "연결노트·콘텐츠", description: "작성 및 업로드" },
              { icon: <MoneyIcon />, title: "정산 확인 및", description: "수익 관리" },
            ]}
          />
        </div>

        {/* Info block */}
        <div className="mt-5">
          <InfoBlock />
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 pt-8">
          <div className="flex items-end justify-between">
            <div>
              <BrandLogo />
              <nav className="mt-3 flex items-center gap-5 text-[13px] font-semibold text-slate-600">
                {termsUrl ? (
                  <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">
                    이용약관
                  </a>
                ) : (
                  <span>이용약관</span>
                )}
                {privacyUrl ? (
                  <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">
                    개인정보처리방침
                  </a>
                ) : (
                  <span>개인정보처리방침</span>
                )}
                {supportUrl ? (
                  <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">
                    고객센터
                  </a>
                ) : (
                  <span>고객센터</span>
                )}
              </nav>
              <p className="mt-1.5 text-[12px] font-medium text-slate-400">© SSAMBESHIP. All rights reserved.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-[#d4efdf] bg-[#f4fcf7] px-5 py-4">
              <div className="mt-0.5 flex-shrink-0">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#16a34a]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.38C16.6 22.15 20 17.25 20 12V6l-8-4z" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-extrabold text-slate-900">안전한 결제 시스템</p>
                <p className="mt-0.5 text-[12px] font-medium text-slate-500">모든 결제 정보는 안전하게 암호화되어 보호됩니다.</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
