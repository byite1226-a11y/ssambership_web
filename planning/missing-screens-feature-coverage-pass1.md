# Missing screens & feature coverage — Pass 1

**Branch:** `ui-ia-cta-simplify`  
**Date:** 2026-05-16  
**Scope:** Web areas — 랜딩, 멘토 찾기, 질문방, 커뮤니티, 맞춤의뢰, 캐시결제, 마이페이지, 관리자. No new payment/settlement/upload backends; no SQL/migrations; no fake user-facing data.

## Route audit (summary)

| Area | Routes found |
|------|----------------|
| Auth | `/login`, `/login/student`, `/login/mentor`, `/signup`, `/admin/login` |
| Auth missing (before pass) | `/forgot-password`, `/auth/update-password` |
| Question room | `/question-room`, `/question-room/[roomId]` (student); `/mentor/question-room`, `/mentor/question-room/[roomId]`; legacy `/questions`, `/mentor/questions` redirects |
| Notifications | `/notifications` (public shell + hub query) |
| Mypage | `/mypage` (student shell) |
| Subscriptions | `/subscribe` (student), `/subscriptions` |
| Subscribe result | (added in pass) `/subscribe/success`, `/subscribe/cancelled`, `/subscribe/failed` |
| Cash | `/cash`, `/wallet`, `/wallet/charge`, `/wallet/ledger`, `/cash-history` |
| Custom request | `/custom-request`, orders, mentor workspace |
| Community | `/community`, board, shorts, shortform, `/community/me` |
| Support (student) | `/support/disputes`, `/support/disputes/[id]` — reports/refunds shells added in pass |
| Admin | `(console)/mentor-approvals`, `reports`, `reviews`, `disputes`, `disputes/[id]`, `refunds` (list only before pass), `settlements`, `notices`, `audit-logs` |
| Legal | (added in pass) `/legal/*` policy shells |
| Reviews (UI) | Public mentor bundle lists reviews; no eligibility API found |
| Reports | `content_reports` + `submitCommunityContentReportAction` (community board/shortform only) |

## Coverage matrix

| Area | Missing screen/function | Current route/file? | Backend/action? | Pass 1 action | Remaining TODO |
|------|-------------------------|---------------------|-------------------|---------------|----------------|
| A Auth | 비밀번호 재설정 | 없음 → `app/(public)/forgot-password/page.tsx`, `app/(public)/auth/update-password/page.tsx` | Supabase `resetPasswordForEmail` + `updateUser` (client) | Shell + 연결 | `NEXT_PUBLIC_SITE_URL`·Supabase Redirect URLs 정합 |
| A Auth | 비밀번호 찾기 로그인 링크 | `RoleLoginForm.tsx` | — | `/forgot-password` 링크 | — |
| A Auth | 멘토 인증 전용 허브 | `/mentor/profile` 일부 | `mentor_profiles` verification 읽기 | `app/(mentor)/mentor/verification/page.tsx` | 반려 사유 필드·재제출 워크플로우 세부 |
| B Subscribe | 결제 성공/실패/취소 URL | `/subscribe`만 | 결제 완료는 PG/웹훅 미연결 가정 | `subscribe/success|failed|cancelled` shell + query 표시 | 실제 `subscription_id`·영수증 조회 |
| B Subscribe | 구독 관리 탭(전체/구독중…) 클릭만 | `/subscriptions` | `loadStudentMypageBundle` 일부 | 정책 문구·비활성 안내 보강(별도 PR) | 탭을 실제 필터·데이터와 연결 |
| B Subscribe | Quota 소진 전용 화면 | 질문방·가드 메시지 | `assertThreadCreationSubscriptionAllowed` | 질문방 URL 피드백 + 배너 문구 | `weekly_new_questions` 집계 구현 (`questionThreadSubscriptionGuard` TODO) |
| C QnA | 학생 새 thread UI | `QuestionRoomWorkspace` detail | `createQuestionThreadAction` | 학생 전용 생성 폼 | 첨부 업로드 스키마 연동 시 표시 |
| C QnA | 멘토 thread 생성 불가 | 액션만 학생 구분 없음 | `createQuestionThread` | **멘토 actor 시 액션 거절** | — |
| C QnA | Room 단위 메모 라벨·학생/멘토 UX | `QuestionRoomWorkspace` | `saveConnectionNote` 단일 행 upsert 가능 | 라벨·학생/멘토 패널 분리·저장 한계 안내 | `student_note`/`mentor_note` 컬럼 또는 복수 행 스키마 |
| D Notifications | 알림 설정 | `/notifications` | 토글 API 없음 | `NotificationSettingsPanel` disabled + 정책 | preferences 테이블·액션 |
| E Reviews | 자격·작성·신고·멘토 답글 | 멘토 상세 리뷰 요약만 | eligibility 쿼리 없음 | `ReviewEligibilityBanner`, `ReviewWritePanel`, `ReviewReportButton` (disabled+정책) | 2연속 결제·무료체험·1개월 규칙용 집계 API |
| F Reports | 공통 신고 다이얼로그 | 커뮤니티만 | `submitCommunityContentReportAction` | `ReportDialog` — 커뮤니티만 연결, 나머지 disabled | custom_request·question_message·review insert 정책 |
| F Support | 내 신고·환불 목록 | 분쟁만 | 목록 쿼리 없음 | `support/reports`, `support/refunds` shell | 테이블 조회·RLS |
| F Admin | 신고·환불·승인·리뷰 상세 | 목록만 | disputes 상세는 있음 | `reports/[id]`, `refunds/[id]`, `mentor-approvals/[id]`, `reviews/[reviewId]` shell | action log·`admin_action_logs` 연동 |
| G Legal | 약관·개인정보·환불 등 | env 외부 링크 위주 | — | `/legal/*` 정책 안내 초안 | 법무 확정본 반영 |
| G Safety | 맞춤의뢰 대필·연락처 안내 | 일부 카피 | validator 없음 | `CustomRequestPolicyNotice` + 주문방 배너 | 연락처 탐지 서버 검증 |
| H Mypage | 허브 링크 | `/mypage` | bundle | 링크 보강 | — |
| I Community | 내 활동 | `/community/me` | 일부 쿼리 | P1: 스크랩·검수 상태는 문서 TODO | moderation 테이블 |
| J Custom request | 예외 상태 배너 | 주문방 컴포넌트 | 상태 상수 있음 | `CustomRequestStatusBanner` | 자동취소·지연 규칙과 백엔드 동기 |
| K Admin | 정산 배치·audit 상세 | 부분 라우트 | — | 문서 TODO | settlements batch UI |
| L Common | 공통 empty/error | 산재 | — | `components/common/*` | 기존 화면 점진 도입 |

---

## Product checks (Pass 1 end)

- 멘토 `createQuestionThreadAction`: 서버에서 거절.
- 학생/멘토 메모: DB가 단일 `connection_notes` 행이면 UI에서 한계 안내(가짜 분리 없음).
- 캐시 vs 맞춤의뢰: 기존 라우트 유지; 문서로 구분 명시.
- 리뷰 정책: UI 배너·작성 패널에 반영(데이터 없으면 disabled).
- 출처/권리: 멘토 커뮤니티 작성은 기존 검증 유지; 맞춤의뢰는 정책 컴포넌트 추가.
- 외부 연락처/대필: 맞춤의뢰 정책 컴포넌트로 안내.

## 검증 (로컬, Pass 1 실행 시점)

- `npm run lint`: **통과 (exit 0)**. 경고 다수는 기존 브랜치 작업 파일(맞춤의뢰·멘토 편집 등)에서 발생. 이번에 추가한 파일 관련 경고는 수정함.
- `npx tsc --noEmit`: **통과** (`forgot-password` sent 비교, `toAdminDisplayError` context 수정 후).
- `href="#"` 검색 (`app`, `components`): **매칭 없음** (`MentorCustomRequestSubNav`의 `#` 링크는 실제 경로로 교체).
- 금지 문구 일괄 검색(`준비 중입니다` 등): 레포 내 기존 문구·유사 표현이 남을 수 있음. 새로 추가한 Pass 1 파일에는 해당 패턴을 넣지 않음. `QuestionRoomWorkspace` 스레드 미리보기 기본값은 `요약 없음`.
- `tsconfig.tsbuildinfo`: 작업 후 `git restore`로 되돌림.
