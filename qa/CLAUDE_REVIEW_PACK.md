# Claude 정밀 리뷰 패키지 — `fix/mobile-landing-responsive`

**브랜치:** `fix/mobile-landing-responsive`  
**전체 diff (로컬 생성):** 저장소 루트에서  
`git diff main...fix/mobile-landing-responsive`  
(또는 PR Files changed 탭)

**Vercel Preview URL:** Vercel 대시보드에서 복사 후 여기에 붙여넣기: `________________`

**스크린샷 (Preview에서 촬영 후 PR에 첨부):**

- PC 1440px+ 랜딩 상단 1장  
- 모바일 390 또는 412, 메뉴 닫힘 1장  
- 모바일 동일, **햄버거 열림** 1장  

---

## 1. Tailwind / dark variant

| 항목 | 결과 |
|------|------|
| `package.json` | `tailwindcss: ^4`, `@tailwindcss/postcss: ^4` → **Tailwind v4** |
| `@custom-variant dark` in `globals.css` | v4 CSS-first 설정에 맞는 방식. `dark:`는 **`.dark` 조상**에서만 활성화. |
| v3 `darkMode: "class"` | v4에서는 `tailwind.config` 없이 위 `@custom-variant`로 동등 목적 달성. |

---

## 2. `scheme-light` / 라이트 고정

| 수단 | 설명 |
|------|------|
| `globals.css` | `html { color-scheme: light; }` |
| `app/layout.tsx` | `export const viewport: Viewport = { colorScheme: "light", themeColor: "#ffffff", ... }` (Next 메타) |
| `app/layout.tsx` | `<html ... className="... scheme-light" style={{ colorScheme: "light" }}>` — Tailwind `scheme-light` 유틸 + **인라인 이중 고정** |
| `LandingLayout.tsx` | 루트 래퍼에 `scheme-light` (랜딩 서브트리 보강) |

Tailwind v4에서 `scheme-light`는 표준 유틸로 `color-scheme: light`를 적용합니다. 인라인 `style`은 UA/접근성 도구와의 일치를 위해 추가했습니다.

---

## 3. `globals.css` 영향 범위 (grep)

- `prefers-color-scheme`: **앱 `app/`·`components/` 코드에 없음** (문서 `qa/LANDING_QA_REPORT.md`에만 단어 등장).
- `dark:`: **`app/`·`components/`에 0건** — 이번 `@custom-variant`로도 다른 페이지에 새 `dark:` 의존 없음.
- **결론:** 랜딩 외 페이지는 예전과 같이 **OS 자동 다크에 `globals`가 끌려가지 않음**(이전에 제거한 `:root` 다크 미디어 쿼리 기준). 다른 라우트는 각자 클래스/레이아웃으로 색을 쓰는 현 상태 유지.

---

## 4. 모바일 Header 폭 (390 / 412)

**조치 (비로그인, `md` 미만):**

- 상단 바: **로고 + 햄버거만** (검색·로그인·회원가입 제거).
- 햄버거 패널 하단 **「계정」** 블록: 검색(준비 중 라벨)·로그인·회원가입 링크.

**로그인 상태:** 검색(44px 터치)·아바타·햄버거 유지 (기존 정책).

---

## 5. 햄버거 접근성 / 동작

| 항목 | 구현 |
|------|------|
| `aria-label` | 열림/닫힘 문구 전환 |
| `aria-expanded` | 토글 버튼에 연동 |
| `aria-controls` | `landing-mobile-nav` |
| 백드롭 | `createPortal` → `document.body`, `z-[45]`, 헤더 바는 `z-[60]` 위에 유지 |
| 닫기 | 백드롭 클릭, **Escape**, 햄버거 재클릭, 내부 링크 이동 시 |
| 터치 타겟 | 햄버거·(로그인 시) 검색 버튼 **최소 44×44px** |

---

## 6. HeroSection

- 이미지는 **`absolute inset-0 overflow-hidden`** 안에만 있어, **플로팅 카드는 그 형제**로 두어 카드가 이미지 `overflow`에 잘리지 않음.
- PC에서 `main`의 `overflow-x-hidden`이 카드를 가로로 잘라 **음수 `right`/`left` 제거** → `lg:right-4`, `lg:left-4`로 조정.
- 섹션에서 `overflow-x-hidden` 제거(가로 클립은 `main`에서만).

---

## 7. `overflow-x-hidden` vs `sticky`

- **문제:** 조상에 `overflow-x-hidden`이 있으면 `position: sticky`가 기대대로 동작하지 않는 경우가 있음.
- **조치:** `LandingLayout` 최외곽에서는 제거하고, **`main`에만** `overflow-x-hidden` 적용 → `LandingTopNav`는 clip 조상 밖에 위치.

---

## 8. 최종 QA (에이전트가 대체 불가한 항목)

아래는 **Vercel Preview + 실기기**에서 직접 확인 필요합니다.

- PC 1440+, 모바일 390 / 412 DevTools  
- 실제 Chrome / Samsung Internet, **OS 다크 ON**  
- 모바일 데스크톱 모드  

체크: 랜딩 라이트 유지, 헤더 세로 깨짐 없음, 햄버거·Hero·가로 스크롤, 타 페이지 색상 이상 없음.

---

## 9. `git diff --stat` (vs `main`, 브랜치 HEAD 기준)

로컬에서 `git diff main...fix/mobile-landing-responsive --stat` 실행 결과는 PR 생성 직전에 다시 받는 것이 가장 정확합니다.  
(문서 작성 시점 이후 **최종 QA 커밋**이 추가될 수 있음.)

---

## 10. `package.json` 버전 발췌

```json
"next": "16.2.4",
"react": "19.2.4",
"tailwindcss": "^4",
"@tailwindcss/postcss": "^4"
```

---

## 11. 변경 후 핵심 파일

전문 스냅샷: **`qa/CLAUDE_REVIEW_SOURCES.md`** (globals, layout, LandingLayout, LandingTopNav, HeroSection).

추가로 `git diff main...fix/mobile-landing-responsive` 출력을 붙이면 diff 전체를 한 번에 볼 수 있습니다.

---

## 12. 빌드

- `npm run build`: **성공**
- `npm run lint`: **에러 0** (기존 `RecommendedMentorsSection` `<img>` 경고 1건만)
