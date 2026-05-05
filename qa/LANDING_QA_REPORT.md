# 랜딩 반응형 QA 리포트 — `fix/mobile-landing-responsive`

이 문서는 Claude 리뷰·실기기 QA용으로 정리했습니다. **Vercel Preview URL**과 **캡처 이미지**는 Preview가 뜬 뒤 아래 빈칸/폴더에 채워 주세요.

---

## 1. Vercel Preview 배포 확인

- **상태 (자동 확인 불가)**: 이 환경에서는 Vercel 대시보드·GitHub API에 접근할 수 없어, Preview 생성 여부는 **직접 확인**이 필요합니다.
- **확인 방법**:
  1. [Vercel Dashboard](https://vercel.com/dashboard) → 해당 프로젝트 → **Deployments**
  2. 브랜치 `fix/mobile-landing-responsive`에 연결된 배포가 있는지 확인
  3. 또는 GitHub에서 해당 브랜치/PR의 **Checks**에서 Vercel 항목 확인

**Preview URL (기입):** `_______________________________`

---

## 2. 로컬 자동화 한계 (참고)

- `next start`로 `/`를 열 때 **Supabase URL/Key**가 없으면 랜딩 SSR이 실패해, 로컬만으로는 본 QA 캡처를 만들기 어렵습니다.
- **권장**: 위 Preview URL(프로덕션과 동일 env)에서 DevTools·실기기 QA를 진행합니다.
- 선택: `npm i -D playwright` 후 `npx playwright install chromium`, Preview가 뜬 뒤  
  `BASE_URL=https://xxxx.vercel.app node scripts/qa-landing-screenshots.mjs`  
  (스크립트는 `color-scheme: dark` 브라우저 설정으로 랜딩이 라이트로 유지되는지 보조 확인용)

---

## 3. `git diff --stat` (vs `origin/main`)

```
 app/globals.css                       |  13 ++--
 app/layout.tsx                        |  14 +++-
 components/landing/HeroSection.tsx    |  41 +++++------
 components/landing/LandingLayout.tsx  |   4 +-
 components/landing/LandingMainNav.tsx |   6 +-
 components/landing/LandingTopNav.tsx  | 125 ++++++++++++++++++++++++++--------
 components/landing/NoticeBanner.tsx   |  34 +++++----
 7 files changed, 161 insertions(+), 76 deletions(-)
```

---

## 4. 변경 파일 목록

| 파일 |
|------|
| `app/globals.css` |
| `app/layout.tsx` |
| `components/landing/HeroSection.tsx` |
| `components/landing/LandingLayout.tsx` |
| `components/landing/LandingMainNav.tsx` |
| `components/landing/LandingTopNav.tsx` |
| `components/landing/NoticeBanner.tsx` |

---

## 5. 파일별 핵심 변경 이유

| 파일 | 이유 |
|------|------|
| `app/globals.css` | `prefers-color-scheme: dark`에 따른 `:root` 변수 전환 **제거**로 OS 다크와 무관하게 기본 라이트 유지. `html { color-scheme: light; }`로 UA 테마 힌트 고정. Tailwind v4용 **`@custom-variant dark`**로 `dark:`는 **`.dark` 클래스** 기준만 사용. |
| `app/layout.tsx` | 루트에 `scheme-light` 보강, `lang="ko"`. |
| `components/landing/LandingLayout.tsx` | 랜딩 래퍼에 `overflow-x-hidden`, `min-w-0`, `scheme-light`, 메인 좌우 패딩 `px-4 sm:px-6`로 좁은 화면 오버플로 완화. |
| `components/landing/LandingMainNav.tsx` | `LANDING_NAV_ITEMS` export(모바일 패널과 목록 공유), 데스크톱 간격 소폭 조정. |
| `components/landing/LandingTopNav.tsx` | **`md` 이상만 가로 네비**; 모바일은 햄버거 + 세로 링크 패널. 로고·CTA·로그인 프로필 **줄바꿈/트렁케이션**으로 깨짐 방지. |
| `components/landing/HeroSection.tsx` | 반응형 제목/여백/히어로 높이, 플로팅 카드는 작은 화면에서 **숨김 또는 안쪽 inset**으로 가로 넘침 방지, 섹션 `overflow-x-hidden`. |
| `components/landing/NoticeBanner.tsx` | 모바일에서 줄바꿈·패딩·닫기 버튼 영역 확보로 배너 높이/겹침 완화. |

---

## 6. 빌드·린트 (로컬, `ssambership_web`)

| 단계 | 결과 |
|------|------|
| `npm run build` | 성공 (Next 16.2.4) |
| `npm run lint` | 기존 `RecommendedMentorsSection.tsx`의 `<img>` 경고 1건(이번 브랜치 범위 밖) |

---

## 7. PR 생성

`gh` CLI가 이 PC에 없어 PR은 **웹에서 생성**하는 것이 가장 빠릅니다.

- **Compare / PR 열기**:  
  https://github.com/byite1226-a11y/ssambership_web/compare/main...fix/mobile-landing-responsive?expand=1

**PR 제목 (예시)**  
`fix(landing): mobile responsive, light theme, overflow`

**PR 본문에 붙일 요약 (예시)**

```markdown
## 목적
모바일 랜딩 라이트 테마 고정, 헤더/히어로 반응형, 가로 스크롤 완화

## 변경 요약
- globals: OS 다크 자동 전환 제거, color-scheme light, class 기반 dark variant
- LandingTopNav: md+ 데스크톱 네비, 모바일 햄버거 메뉴
- HeroSection: 반응형 타이포/높이, 플로팅 카드 오버플로 방지
- LandingLayout / NoticeBanner: overflow·패딩·배너 레이아웃

## 빌드
- [x] `npm run build` 성공

## QA
- [ ] Vercel Preview (PC 1440+ / 모바일 390·412 DevTools)
- [ ] 실제 기기 (Chrome / Samsung Internet)
```

---

## 8. main 머지

- **아직 머지하지 않음.** Claude 리뷰 + 실기기 QA 통과 후, 위 PR에서 **Squash merge** 등으로 `main` 반영 → Production 배포로 진행하는 것을 권장합니다.

---

## 9. QA 체크리스트 (Preview URL 기준)

| 항목 | 확인 |
|------|------|
| PC(1440px+) 랜딩이 기존과 크게 다르지 않음 | ☐ |
| 모바일에서 **라이트 테마** (배경/본문이 다크로 깔리지 않음) | ☐ |
| 모바일 헤더 가로 네비가 **한 글자씩 세로로 깨지지 않음** | ☐ |
| **햄버거 메뉴** 열기/닫기·링크 이동 정상 | ☐ |
| Hero 제목·버튼·이미지·플로팅 카드가 **뷰포트 밖으로 나가지 않음** | ☐ |
| **가로 스크롤 없음** (특히 `/` 상단~히어로) | ☐ |
| NoticeBanner가 모바일에서 **과도하게 높아지거나 겹치지 않음** | ☐ |
| **비로그인** 헤더(로그인·회원가입) 깨짐 없음 | ☐ |
| **로그인** 헤더(아이콘·프로필) 깨짐 없음 | ☐ |
| **다른 페이지**(`/login` 등) 배경·글자색이 의도치 않게 바뀌지 않음 | ☐ |

---

## 10. 캡처 첨부 위치 (Claude 리뷰용)

아래 폴더에 파일을 넣고 PR 설명에 첨부하거나 이 리포트에 경로를 적어 주세요.

- `qa/screenshots/pc-1440.png` — PC 랜딩 상단~히어로
- `qa/screenshots/mobile-390-1.png` — 모바일 랜딩 (닫힌 메뉴)
- `qa/screenshots/mobile-390-2.png` — 모바일 햄버거 **열림**
- (선택) `qa/screenshots/mobile-412.png` — 412 폭

**현재**: Preview·실기기에서 아직 캡처를 채우지 않았습니다. 위 URL 확인 후 촬영해 주세요.
