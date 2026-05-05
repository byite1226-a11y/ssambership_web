# 변경 후 소스 스냅샷 (Claude 첨부용)

`fix/mobile-landing-responsive` 브랜치 기준.

## `app/globals.css`

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #171717;
}

html {
  color-scheme: light;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

## `app/layout.tsx`

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "쌤버십 웹",
  description: "학생-멘토 질문/구독/커뮤니티 플랫폼",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scheme-light`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

## `components/landing/LandingLayout.tsx`

```tsx
import { LandingTopNav } from "@/components/landing/LandingTopNav";
import { NoticeBanner } from "@/components/landing/NoticeBanner";
import type { User } from "@supabase/supabase-js";
import type { UserRow } from "@/lib/types/user";
import type { ReactNode } from "react";

export function LandingLayout(props: { user: User | null; profile: UserRow | null; children: ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-white text-slate-900 scheme-light">
      <NoticeBanner />
      <LandingTopNav user={props.user} profile={props.profile} />
      {/* overflow-x only under header so sticky TopNav is not inside an overflow-x clip ancestor */}
      <main className="mx-auto w-full min-w-0 max-w-[1280px] overflow-x-hidden px-4 sm:px-6">{props.children}</main>
    </div>
  );
}
```

## `components/landing/LandingTopNav.tsx`

전문은 저장소에서 열기 (약 210줄). `qa/CLAUDE_REVIEW_PACK.md` §4–§5 요약과 동일.

## `components/landing/HeroSection.tsx`

전문은 저장소에서 열기 (약 120줄). `qa/CLAUDE_REVIEW_PACK.md` §6 요약과 동일.
