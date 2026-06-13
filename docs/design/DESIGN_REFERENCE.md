# Design Reference

이 문서는 레포에 실제 정의된 값만 정리한다. Tailwind 유틸리티 색은 `tailwind.config.*`가 없으므로 Tailwind v4 기본 팔레트 값으로 동작한다. 레포 안에 hex로 직접 정의된 값과 Tailwind 클래스에서 오는 값은 구분해 적었다.

## 1. 컬러 토큰

### 전역 CSS 변수

출처: `app/globals.css`, `styles/design-system-tokens.css`

| 이름 | 값(hex) | 용도 |
|---|---:|---|
| `--background` | `#ffffff` | `body` 배경, `--color-background` 원본 |
| `--foreground` | `#171717` | `body` 글자색, `--color-foreground` 원본 |
| `--ds-text-primary` | `#0f172a` | 제목/본문 주요 텍스트 |
| `--ds-text-secondary` | `#475569` | 보조 설명 |
| `--ds-text-tertiary` | `#94a3b8` | 캡션/메타 |
| `--ds-bg-surface` | `#ffffff` | 카드/표면 |
| `--ds-bg-muted` | `#f8fafc` | 약한 배경 |
| `--ds-border-subtle` | `#e2e8f0` | 기본 테두리 |
| `--ds-border-emphasis` | `#cbd5e1` | 강조 카드 테두리 |
| `--ds-accent-student` | `#2563eb` | 학생/primary accent |
| `--ds-accent-student-muted` | `#eff6ff` | 학생 accent 약한 배경 |
| `--ds-accent-mentor` | `#059669` | 멘토 accent |
| `--ds-accent-mentor-muted` | `#ecfdf5` | 멘토 accent 약한 배경 |
| `--ds-status-success-bg` | `#ecfdf5` | 성공 상태 배경 |
| `--ds-status-success-fg` | `#047857` | 성공 상태 글자 |
| `--ds-status-success-border` | `#a7f3d0` | 성공 상태 테두리 |
| `--ds-status-warning-bg` | `#fffbeb` | 경고 상태 배경 |
| `--ds-status-warning-fg` | `#b45309` | 경고 상태 글자 |
| `--ds-status-warning-border` | `#fde68a` | 경고 상태 테두리 |
| `--ds-status-danger-bg` | `#fef2f2` | 위험 상태 배경 |
| `--ds-status-danger-fg` | `#b91c1c` | 위험 상태 글자 |
| `--ds-status-danger-border` | `#fecaca` | 위험 상태 테두리 |
| `--ds-status-info-bg` | `#f0f9ff` | 정보 상태 배경 |
| `--ds-status-info-fg` | `#0369a1` | 정보 상태 글자 |
| `--ds-status-info-border` | `#bae6fd` | 정보 상태 테두리 |
| `--ds-status-neutral-bg` | `#f1f5f9` | 중립 상태 배경 |
| `--ds-status-neutral-fg` | `#334155` | 중립 상태 글자 |
| `--ds-status-neutral-border` | `#e2e8f0` | 중립 상태 테두리 |

### Tailwind v4 `@theme inline`

출처: `app/globals.css`, `styles/design-system-tokens.css`

| 이름 | 값 | 용도 |
|---|---|---|
| `--color-background` | `var(--background)` | Tailwind color token |
| `--color-foreground` | `var(--foreground)` | Tailwind color token |
| `--font-sans` | `var(--font-geist-sans)` | Tailwind sans font token |
| `--font-mono` | `var(--font-geist-mono)` | Tailwind mono font token |
| `--color-ds-primary` | `var(--ds-text-primary)` | `text-ds-primary` |
| `--color-ds-secondary` | `var(--ds-text-secondary)` | `text-ds-secondary` |
| `--color-ds-tertiary` | `var(--ds-text-tertiary)` | `text-ds-tertiary` |
| `--color-ds-surface` | `var(--ds-bg-surface)` | `bg-ds-surface` |
| `--color-ds-muted` | `var(--ds-bg-muted)` | `bg-ds-muted` |
| `--color-ds-border-subtle` | `var(--ds-border-subtle)` | `border-ds-border-subtle` |
| `--color-ds-border-emphasis` | `var(--ds-border-emphasis)` | `border-ds-border-emphasis` |
| `--color-ds-accent-student` | `var(--ds-accent-student)` | 학생 accent utility |
| `--color-ds-accent-student-muted` | `var(--ds-accent-student-muted)` | 학생 muted utility |
| `--color-ds-accent-mentor` | `var(--ds-accent-mentor)` | 멘토 accent utility |
| `--color-ds-accent-mentor-muted` | `var(--ds-accent-mentor-muted)` | 멘토 muted utility |
| `--color-ds-success-bg` | `var(--ds-status-success-bg)` | 성공 배경 utility |
| `--color-ds-success-fg` | `var(--ds-status-success-fg)` | 성공 글자 utility |
| `--color-ds-warning-bg` | `var(--ds-status-warning-bg)` | 경고 배경 utility |
| `--color-ds-warning-fg` | `var(--ds-status-warning-fg)` | 경고 글자 utility |
| `--color-ds-danger-bg` | `var(--ds-status-danger-bg)` | 위험 배경 utility |
| `--color-ds-danger-fg` | `var(--ds-status-danger-fg)` | 위험 글자 utility |
| `--color-ds-info-bg` | `var(--ds-status-info-bg)` | 정보 배경 utility |
| `--color-ds-info-fg` | `var(--ds-status-info-fg)` | 정보 글자 utility |
| `--color-ds-neutral-bg` | `var(--ds-status-neutral-bg)` | 중립 배경 utility |
| `--color-ds-neutral-fg` | `var(--ds-status-neutral-fg)` | 중립 글자 utility |

### 맞춤의뢰 스코프 변수

출처: `app/(public)/custom-request/landing.css`, `.cr-landing`

| 이름 | 값(hex) | 용도 |
|---|---:|---|
| `--c-primary` | `#0f172a` | 맞춤의뢰 주요 글자 |
| `--c-secondary` | `#3f4b5f` | 맞춤의뢰 보조 글자 |
| `--c-tertiary` | `#8a96a8` | 맞춤의뢰 메타/힌트 |
| `--c-border` | `#e2e8f2` | 맞춤의뢰 기본 테두리 |
| `--c-border-strong` | `#d8e0ec` | 맞춤의뢰 강한 테두리 |
| `--c-band` | `#f3f6fc` | 맞춤의뢰 band/form action 배경 |
| `--c-fill` | `#eef3fb` | 맞춤의뢰 fill |
| `--c-blue` | `#2563eb` | 맞춤의뢰 primary blue |
| `--c-blue-weak` | `#e9f0ff` | 맞춤의뢰 weak blue |

다크모드 변수 블록: 정의 없음. `app/globals.css`에는 `@custom-variant dark (&:where(.dark, .dark *));`만 있다.

## 2. 타이포 / 폰트

출처: `app/layout.tsx`, `app/globals.css`, `styles/design-system-tokens.css`

| 항목 | 값 |
|---|---|
| 로드 폰트 | `Geist`, `Geist_Mono` |
| 로드 방식 | `next/font/google` |
| CSS 변수 | `--font-geist-sans`, `--font-geist-mono` |
| subsets | `["latin"]` |
| Tailwind font token | `--font-sans: var(--font-geist-sans)`, `--font-mono: var(--font-geist-mono)` |
| `body` font-family | `Arial, Helvetica, sans-serif` |
| Pretendard | 정의 없음 |
| 전역 기본 font-size/font-weight | 정의 없음 |

타이포 스케일 출처: `styles/design-system-tokens.css`

| 이름 | font-size | line-height | letter-spacing | font-weight |
|---|---:|---:|---:|---:|
| `--text-ds-display` | `2.25rem` | `1.1` | `-0.025em` | `800` |
| `--text-ds-h1` | `1.5rem` | `1.25` | `-0.02em` | `800` |
| `--text-ds-h2` | `1.125rem` | `1.35` | 정의 없음 | `700` |
| `--text-ds-h3` | `1rem` | `1.4` | 정의 없음 | `700` |
| `--text-ds-body` | `0.875rem` | `1.5` | 정의 없음 | `500` |
| `--text-ds-label` | `0.75rem` | `1.4` | 정의 없음 | `600` |
| `--text-ds-caption` | `0.6875rem` | `1.45` | 정의 없음 | `500` |

## 3. 라운드 / 간격 / 그림자

출처: `styles/design-system-tokens.css`, `lib/design-system/tokens.ts`

| 항목 | 값 |
|---|---|
| `--ds-space-1` | `0.25rem` / 4px |
| `--ds-space-2` | `0.5rem` / 8px |
| `--ds-space-3` | `0.75rem` / 12px |
| `--ds-space-4` | `1rem` / 16px |
| `--ds-space-5` | `1.25rem` / 20px |
| `--ds-space-6` | `1.5rem` / 24px |
| `--ds-space-8` | `2rem` / 32px |
| `--ds-space-10` | `2.5rem` / 40px |
| 카드 라운드 | `--ds-radius-card: 1rem`, `rounded-2xl` |
| 버튼 라운드 | `--ds-radius-button: 0.75rem`, `rounded-xl` |
| 뱃지 라운드 | `--ds-radius-badge: 9999px`, `rounded-full` |
| 카드 패딩 기준 | `p-5` |
| 섹션 gap 기준 | `gap-6` |
| DS Button/Card/Badge shadow | 없음 |
| `PageScaffold` 기본 hero/card shadow | `shadow-sm` |
| 맞춤의뢰 `.btn-primary` shadow | `0 12px 22px -10px rgba(37,99,235,.5)` |
| 맞춤의뢰 `.btn-primary:hover` shadow | `0 16px 26px -10px rgba(37,99,235,.55)` |
| 맞춤의뢰 `.preview` shadow | `0 34px 64px -30px rgba(15,23,42,.30)` |
| 주문방 카드 shadow | `0_1px_3px_rgba(15,23,42,0.06)` |

## 4. 컴포넌트별 스펙

### Button

출처: `components/design-system/Button.tsx`

공통: `inline-flex items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed`

| 변형 | 배경 | 글자 | 테두리 | 라운드 | 패딩/높이 |
|---|---|---|---|---|---|
| `primary` student | `--ds-accent-student` `#2563eb` | `#ffffff` | 없음 | `rounded-xl` | size별 |
| `primary` mentor | `--ds-accent-mentor` `#059669` | `#ffffff` | 없음 | `rounded-xl` | size별 |
| `primary` neutral | `--ds-text-primary` `#0f172a` | `#ffffff` | 없음 | `rounded-xl` | size별 |
| `secondary` | `--ds-bg-surface` `#ffffff`, hover `--ds-bg-muted` `#f8fafc` | `--ds-text-primary` `#0f172a` | `--ds-border-subtle` `#e2e8f0` | `rounded-xl` | size별 |
| `ghost` | transparent, hover `--ds-bg-muted` `#f8fafc` | `--ds-text-secondary` `#475569`, hover `#0f172a` | 없음 | `rounded-xl` | size별 |

| size | class |
|---|---|
| `sm` | `min-h-9 px-3.5 text-ds-label` |
| `md` | `min-h-10 px-4 text-ds-body font-bold` |
| `lg` | `min-h-11 px-5 text-ds-body font-bold` |

맞춤의뢰 전용 버튼 출처: `app/(public)/custom-request/landing.css`

| 클래스 | 배경 | 글자 | 테두리 | 라운드 | 패딩/높이 |
|---|---|---|---|---|---|
| `.btn` | 정의 없음 | 정의 없음 | `1px solid transparent` | `14px` | `padding: 15px 28px`, `min-height: 54px`, `font-size: 15.5px`, `font-weight: 700` |
| `.btn-primary` | `#2563eb`, hover `#1d4ed8` | `#fff` | transparent | `14px` | `.btn` 상속 |
| `.btn-ghost` | `#fff` | `#3f4b5f`, hover `#0f172a` | `#d8e0ec`, hover `#c4cedd` | `14px` | `.btn` 상속 |
| `.btn-white` | `#fff`, hover `#f1f5ff` | `#2563eb` | transparent | `14px` | `.btn` 상속 |

### Card / 패널 래퍼

| 컴포넌트 | 배경 | 글자 | 테두리 | 라운드 | 패딩/폭 |
|---|---|---|---|---|---|
| `SurfaceCard` default | `--ds-bg-surface` `#ffffff` | 토큰 상속 | `--ds-border-subtle` `#e2e8f0` | `rounded-2xl` / 1rem | body `p-5` |
| `SurfaceCard` emphasis | `#ffffff` | 토큰 상속 | `--ds-border-emphasis` `#cbd5e1` | `rounded-2xl` | body `p-5` |
| `SurfaceCard` header | `--ds-bg-muted/40` | 토큰 상속 | bottom `#e2e8f0` | 카드 상속 | `px-5 py-4` |
| `PageScaffold` default hero | `#ffffff` | `text-slate-900` | `border-slate-200` | `rounded-xl` | `p-6`, `shadow-sm` |
| `PageScaffold` compact hero | `#F3F7FF` | slate 계열 | `border-slate-200/50` bottom | 없음 | `px-3 py-3`, `sm:px-4 sm:py-3.5` |
| `CustomRequestDetailShell` | `.cr-landing` | `.cr-landing` | 없음 | 없음 | `max-width: 880px`, `padding-left/right: 12px`, `sm: 16px` |
| `.cr-detail-card` | `#fff` | `#0f172a` 등 | `#e2e8f2` | `16px` | `20px 22px`, mobile `16px 18px` |
| `.form-shell` | `#fff` | 상속 | `#e2e8f2` | `20px` | overflow hidden |
| `.form-section` | `#fff` | 상속 | `#e2e8f2` | `16px` | `20px 22px`, sm `22px 24px` |

### Badge / Pill

출처: `components/design-system/StatusBadge.tsx`, `lib/design-system/statusBadge.ts`

공통: `inline-flex max-w-full items-center rounded-full border font-semibold`, shadow 없음.

| tone | 배경 | 글자 | 테두리 | 패딩 |
|---|---|---|---|---|
| `neutral` | `bg-slate-100` `#f1f5f9` | `text-slate-700` `#314158` | `border-slate-300` `#cad5e2` | sm `px-2 py-0.5`, md `px-2.5 py-0.5` |
| `info` | `bg-sky-100` `#dff2fe` | `text-sky-800` `#00598a` | `border-sky-300` `#74d4ff` | 동일 |
| `success` | `bg-emerald-100` `#d0fae5` | `text-emerald-800` `#006045` | `border-emerald-300` `#5ee9b5` | 동일 |
| `warning` | `bg-amber-100` `#fef3c6` | `text-amber-800` `#973c00` | `border-amber-300` `#ffd230` | 동일 |
| `danger` | `bg-red-50` `#fef2f2` | `text-red-800` `#9f0712` | `border-2 border-red-400` `#ff6467` | 동일 |
| `indigo` | `bg-indigo-100` `#e0e7ff` | `text-indigo-800` `#372aac` | `border-indigo-300` `#a3b3ff` | 동일 |

질문방 공통 배지 출처: `components/common/StatusBadge.tsx`

| tone | 배경 | 글자 | 라운드/패딩 |
|---|---:|---:|---|
| `pending` | `#fbf0e6` | `#b06a14` | `rounded-full px-2 py-0.5 text-[11px]` |
| `in_progress` | `#e9f0fc` | `#2660c4` | 동일 |
| `complete` | `#e8f5ec` | `#27733f` | 동일 |

### Input / Textarea

출처: `app/(public)/custom-request/landing.css`

| 요소 | 배경 | 글자 | 테두리 | 라운드 | 패딩/크기 |
|---|---|---|---|---|---|
| `.form-input` | `#fff` | `#0f172a` | `#e2e8f2` | `12px` | `padding: 12px 14px`, `font-size: 14px`, `font-weight: 500`, `min-height: 48px` |
| `.form-textarea` | `#fff` | `#0f172a` | `#e2e8f2` | `12px` | `padding: 12px 14px`, `min-height: 14rem`, `line-height: 1.6`, `resize: vertical` |
| placeholder | 정의 없음 | `#8a96a8` | 없음 | 없음 | `font-weight: 500` |
| focus | `#fff` | `#0f172a` | `#2563eb` | `12px` | `box-shadow: 0 0 0 3px rgba(37,99,235,.14)` |
| error | `#fff` | `#0f172a` | `#f87171` | `12px` | `box-shadow: 0 0 0 3px rgba(248,113,113,.18)` |
| `.form-error` | 없음 | `#b91c1c` | 없음 | 없음 | `font-size: 12px`, `font-weight: 700` |

### Tab / 탭바

| 위치 | 활성 배경/글자 | 비활성 배경/글자 | 테두리 | 라운드 | 패딩 |
|---|---|---|---|---|---|
| `communityFilterChipClass(md)` | `#e8f0fe` / `#2563eb`, `font-semibold` | `#f4f5f7` / `#4b5563`, hover `#eceef1` | 없음 | `rounded-full` | `px-4 py-2`, `text-sm font-medium` |
| `communityFilterChipClass(sm)` | 동일 | 동일 | 없음 | `rounded-full` | `px-3.5 py-1.5`, `text-xs font-bold` |
| `CommunityMeTabNav` container | 없음 | `bg-slate-50/90` | `border-slate-200` | `rounded-xl` | `p-2`, `gap-2`, `shadow-inner` |
| `CommunityMeTabNav` tab active | `bg-blue-600` `#155dfc` / `#fff` | 없음 | ring `blue-500/30` (`#2b7fff` with alpha) | `rounded-full` | `px-4 py-2`, `text-sm font-extrabold` |
| `CommunityMeTabNav` tab inactive | `#fff` / `text-slate-700` | hover `bg-slate-50` | `border-slate-200/80`, hover `border-slate-300` | `rounded-full` | `px-4 py-2` |
| `CustomRequestStudentPostsList` tab active | `#1A56DB` / `#fff` | 없음 | 없음 | `rounded-full` | `px-3.5 py-1.5`, `text-xs font-bold` |
| `CustomRequestStudentPostsList` tab inactive | `#fff` / `text-slate-700` | 없음 | `border-slate-200` | `rounded-full` | `px-3.5 py-1.5`, `text-xs font-bold` |

### 페이지 레이아웃 래퍼

출처: `components/shell/AppShell.tsx`, `components/shell/PageScaffold.tsx`, `app/(public)/custom-request/landing.css`, `lib/customRequest/orderLifecycleConstants.ts`

| 항목 | 실제 값 |
|---|---|
| AppShell root | `min-h-screen bg-white text-slate-900` |
| Header | `sticky top-0 z-50`, `border-b border-slate-200`, `bg-white/95`, `backdrop-blur-md` |
| Header inner | `mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8` |
| Main | `mx-auto w-full max-w-7xl px-4 py-8 sm:px-6` |
| `.cr-landing .wrap` | `max-width:1120px; margin:0 auto; padding:0 24px` |
| `.cr-landing .band` | `padding:76px 0` |
| 주문방 content max | `mx-auto w-full max-w-7xl` |

## 5. 상태색 매핑

### 범용 DS `StatusBadge`

출처: `lib/design-system/statusBadge.ts`

| 상태/kind | tone | 색(hex) |
|---|---|---|
| `default` | `neutral` | border `#cad5e2`, bg `#f1f5f9`, text `#314158` |
| `pending` | `warning` | border `#ffd230`, bg `#fef3c6`, text `#973c00` |
| `active` | `info` | border `#74d4ff`, bg `#dff2fe`, text `#00598a` |
| `success` | `success` | border `#5ee9b5`, bg `#d0fae5`, text `#006045` |
| `warning` | `warning` | border `#ffd230`, bg `#fef3c6`, text `#973c00` |
| `error` | `danger` | border `#ff6467`, bg `#fef2f2`, text `#9f0712` |
| `info` | `info` | border `#74d4ff`, bg `#dff2fe`, text `#00598a` |
| `delivery` | `indigo` | border `#a3b3ff`, bg `#e0e7ff`, text `#372aac` |

### 멘토 맞춤의뢰 post 상태

출처: `lib/customRequest/mentorCustomRequestDisplay.ts`, `components/customRequest/MentorPostStatusBadge.tsx`

| 상태 | 라벨 | 색(hex) |
|---|---|---|
| `open`, `published` | 모집 중 | DS `info`: border `#74d4ff`, bg `#dff2fe`, text `#00598a` |
| `submitted` | 지원서 제출됨 | DS `warning`: border `#ffd230`, bg `#fef3c6`, text `#973c00` |
| `selected`, `in_progress` | 진행 중 | DS `success`: border `#5ee9b5`, bg `#d0fae5`, text `#006045` |
| `complete`, `completed` | 완료 | DS `success`: border `#5ee9b5`, bg `#d0fae5`, text `#006045` |
| `closed`, `archived` | 마감 | DS `neutral`: border `#cad5e2`, bg `#f1f5f9`, text `#314158` |
| `cancelled`, `canceled` | 취소됨 | DS `neutral`: border `#cad5e2`, bg `#f1f5f9`, text `#314158` |
| `draft` | 작성 중 | DS `neutral`: border `#cad5e2`, bg `#f1f5f9`, text `#314158` |
| empty/unknown | 상태 확인 필요 | DS `neutral`: border `#cad5e2`, bg `#f1f5f9`, text `#314158` |

### 학생 맞춤의뢰 post 목록 상태

출처: `lib/customRequest/studentPostDisplay.ts`

| 상태 | 라벨 | 색(hex) |
|---|---|---|
| `draft` | 임시저장 | border `#ddd6ff`, bg `#ede9fe`, text `#4d179a` |
| waiting bucket | 지원대기 | border `#fee685`, bg `#fef3c6`, text `#7b3306` |
| active bucket | 진행중 | border `#bedbff`, bg `#dbeafe`, text `#1c398e` |
| done bucket | 완료 | border `#a4f4cf`, bg `#d0fae5`, text `#004f3b` |
| cancel/rejected | 취소 | border `#e2e8f0`, bg `#f1f5f9`, text `#45556c` |

### 주문/작업 상태

출처: `lib/customRequest/orderLifecycleConstants.ts`, `components/customRequest/order/OrderStatusBadge.tsx`

| 상태 | 라벨 | 색(hex) |
|---|---|---|
| `pending`, `unpaid` | 작업 대기 | border `#e2e8f0`, bg `#f1f5f9`, text `#1d293d` |
| `open`, `in_progress`, `submitted`, `in_review`, `waiting_review`, `pending_review` | 작업 중/납품 대기 | border `#b8e6fe`, bg `#dff2fe`, text `#024a70` |
| `delivered`, `delivered_pending_review`, `redelivered`, `delivery_submitted` | 납품 대기 | border `#fee685`, bg `#fef3c6`, text `#461901` |
| `completed`, `accepted`, `paid`, `done`, `resolved`, `finished` | 완료/수락됨 | border `#a4f4cf`, bg `#d0fae5`, text `#002c22` |
| `revision_requested` | 수정 요청 | border `#ffd6a7`, bg `#ffedd4`, text `#441306` |
| `disputed`, `rejected` | 종료됨/분쟁 계열 | border `#ffc9c9`, bg `#ffe2e2`, text `#460809` |
| `cancelled`, `canceled`, `refunded`, `closed` | 종료됨 | border `#e2e8f0`, bg `#f1f5f9`, text `#1d293d` |

멘토 주문 목록/대시보드 공통 상태 출처: `lib/design-system/mentorOrderStatusBadge.ts`

| 화면 상태 | kind | 색(hex) |
|---|---|---|
| 분쟁 | `error` | DS `danger`: border `#ff6467`, bg `#fef2f2`, text `#9f0712` |
| 작업 대기 | `pending` | DS `warning`: border `#ffd230`, bg `#fef3c6`, text `#973c00` |
| 수정 요청 | `warning` | DS `warning`: border `#ffd230`, bg `#fef3c6`, text `#973c00` |
| 납품 대기 | `delivery` | DS `indigo`: border `#a3b3ff`, bg `#e0e7ff`, text `#372aac` |
| 종료됨 | `default` | DS `neutral`: border `#cad5e2`, bg `#f1f5f9`, text `#314158` |
| 작업 중 | `active` | DS `info`: border `#74d4ff`, bg `#dff2fe`, text `#00598a` |

### 질문방 상태

출처: `components/common/StatusBadge.tsx`

| 상태 | 색(hex) | 정의 위치 |
|---|---|---|
| 답변 대기 | bg `#fbf0e6`, text `#b06a14` | `STYLES.pending` |
| 진행 중 | bg `#e9f0fc`, text `#2660c4` | `STYLES.in_progress` |
| 답변 완료 | bg `#e8f5ec`, text `#27733f` | `STYLES.complete` |

## 6. 페이지 기본 배경 hex

`body` 기본 배경은 `var(--background)`이며 `--background = #ffffff`이다. 실제 앱 래퍼 `AppShell`도 `bg-white`를 사용하므로 기본 페이지 배경 hex는 `#ffffff`이다.

역할/페이지별로 덮는 배경:

| 위치 | 배경 |
|---|---|
| `body` | `#ffffff` |
| `AppShell` root | `bg-white` = `#ffffff` |
| `PageScaffold` compact hero | `#F3F7FF` |
| 맞춤의뢰 `.cr-landing .hero` | `linear-gradient(180deg,#e8f0ff,#ffffff 78%)` |
| 맞춤의뢰 `.cr-landing .band` 일부 | 페이지에서 inline style로 `#f3f6fc` 사용 |

## Tailwind 설정

`tailwind.config.*`: 정의 없음. 이 레포는 `app/globals.css`의 `@import "tailwindcss";`와 CSS `@theme inline` 토큰을 사용한다. 따라서 `theme.extend.colors`, `fontFamily`, `borderRadius`, `spacing`, `boxShadow` 커스텀 값은 설정 파일 기준으로는 정의 없음.
