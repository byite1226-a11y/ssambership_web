# 쌤버십 웹 개발 실행 가이드
> Cursor / Claude Code에서 복붙만 하면 됩니다. 코딩 몰라도 OK.

---

## 📋 지금 당장 해야 할 것 (순서대로)

### STEP 0 — 토스 카드 결제창 테스트 (5분)

**PowerShell에서 실행:**
```powershell
cd D:\dev\ssambership_web
```

**Cursor AI Chat에 복붙:**
```
components/cash/CashChargeWidget.tsx 파일을 열고,
requestPayment 호출 안에 아래 card 옵션을 추가해줘.
기존 코드를 지우지 말고 card: { ... } 블록만 추가해:

card: {
  useEscrow: false,
  flowMode: "DEFAULT",
  useCardPoint: false,
  useAppCardOnly: false,
},

추가 후 npx tsc --noEmit 로 타입 오류 없는지 확인해줘.
```

**테스트 카드:** `4330000000000000` / `12/26` / `000101` / `00`

**Supabase SQL 확인:**
```sql
SELECT * FROM cash_ledger ORDER BY created_at DESC LIMIT 5;
```

---

## 📁 CLAUDE.md 파일 생성 (프로젝트 루트에 넣기)

**이 파일을 `D:\dev\ssambership_web\CLAUDE.md`로 저장하세요:**

```markdown
# CLAUDE.md — 쌤버십 프로젝트 컨텍스트

## 프로젝트 정의
쌤버십은 학생이 대학생 멘토를 구독하고, 멘토별 질문방에서 질문을 누적하며,
연결노트로 장기 학습 관리를 받는 구독형 질문 멘토링 + 교육형 커뮤니티 플랫폼.

## 기술 스택
- Frontend: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- Backend: Supabase (Auth, Postgres, Storage, Realtime, Edge Functions)
- 결제: 토스페이먼츠 (@tosspayments/tosspayments-sdk)
- 경로: D:\dev\ssambership_web
- GitHub: byite1226-a11y/ssambeship_web

## 브랜드 컬러 (절대 변경 금지)
- Primary Blue: #1A56DB (쌤버십 로고, 버튼, 강조)
- Secondary: #3F83F8
- Accent: #F59E0B (별점, 포인트)
- Success: #10B981
- Danger: #EF4444
- Background: #F9FAFB
- Text Primary: #111827
- Text Secondary: #6B7280

## 절대 잠금값 (변경 금지)
- 상단 네비: 멘토 찾기 │ 질문방 │ 커뮤니티 │ 맞춤의뢰 │ 캐시결제 │ 마이페이지
- 요금제: Limited 주4개 / Standard 주9개 / Premium FUP(내부16개)
- cap: 1.0 / 2.5 / 4.5
- 수수료: 구독 플랫폼30%/멘토70%, 맞춤의뢰 플랫폼20%/멘토80%
- 질문방 구조: mentor_student_room → question_threads → question_messages
- 연결노트: thread 단위 아님, room 전체 단위
- 리뷰 조건: 동일 멘토 2회 연속 결제 성공 시에만 가능

## 주요 라우트
- /                      → 랜딩
- /mentors               → 멘토 찾기
- /mentors/[mentorId]    → 멘토 상세
- /subscribe             → 구독 요금제 선택
- /question-room         → 학생 질문방
- /mentor/question-room  → 멘토 질문방
- /community             → 커뮤니티 홈
- /community/shortform   → 숏폼
- /community/board       → 게시판
- /custom-request        → 맞춤의뢰
- /wallet/charge         → 캐시 충전
- /wallet/ledger         → 캐시 사용내역
- /mypage                → 학생 마이페이지
- /mentor/dashboard      → 멘토 대시보드
- /mentor/profile/edit   → 멘토 프로필 관리
- /mentor/payouts        → 멘토 정산
- /admin/dashboard       → 관리자 대시보드

## 핵심 DB 테이블
users, mentor_profiles, subscriptions, plans,
mentor_student_rooms, question_threads, question_messages, connection_notes,
cash_wallets, cash_ledger, payment_orders,
community_posts, shortform_posts, comments, reports,
custom_request_posts, custom_request_applications, custom_request_orders,
custom_order_messages, custom_order_deliverables,
payouts, refunds, disputes, notifications,
admin_action_logs, reviews

## 코딩 규칙
- TypeScript strict mode
- 서버 컴포넌트 우선, 클라이언트는 'use client' 명시
- Tailwind 클래스 사용, 인라인 style 금지
- Supabase RLS 반드시 적용
- 관리자 server action: 첫 줄 requireRole("admin")
- 멘토 페이지: requireRole("mentor")
- 컴포넌트 파일명: PascalCase.tsx
- 에러는 반드시 try/catch + toast 알림
```

---

## 🚀 주요 기능 개발 프롬프트 (우선순위 순)

### [P1] 구독 결제 연동 (토스 → subscriptions + room 생성)

**Cursor AI Chat에 복붙:**
```
쌤버십 프로젝트에서 멘토 구독 결제를 완성해줘.

목표:
1. /subscribe?mentorId=[id] 페이지에서 Limited/Standard/Premium 중 하나 선택
2. 토스페이먼츠로 결제 진행 (캐시 충전과 동일한 방식)
3. 결제 성공 시:
   - subscriptions 테이블에 INSERT (student_id, mentor_id, plan_id, status='active', expires_at)
   - mentor_student_rooms 테이블에 INSERT (없으면 생성, 있으면 skip)
   - cash_ledger에 debit 기록
4. 결제 실패 시 실패 페이지로 리다이렉트

참고 파일:
- app/api/toss/confirm/route.ts (캐시 충전 성공 처리 참고)
- app/(student)/wallet/charge/page.tsx (결제 UI 참고)
- components/cash/CashChargeWidget.tsx (결제창 호출 방식 참고)

이미 존재하는 plans 테이블의 price 컬럼을 사용해.
구독 결제 API 라우트: app/api/toss/subscribe/confirm/route.ts
구독 페이지: app/(student)/subscribe/page.tsx
```

---

### [P1] 리뷰 시스템 구현

**Cursor AI Chat에 복붙:**
```
쌤버십 리뷰 시스템을 구현해줘.

정책 (절대 변경 금지):
- 동일 멘토에게 2회 연속 결제 성공한 학생만 리뷰 작성 가능
- 무료체험만 한 학생은 리뷰 불가
- 1개월만 사용한 학생 불가
- 멘토 답글 가능
- 별점 1~5점

구현할 것:
1. reviews 테이블 생성 SQL:
   CREATE TABLE reviews (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     mentor_id uuid REFERENCES mentor_profiles(id),
     student_id uuid REFERENCES users(id),
     subscription_count integer NOT NULL, -- 연속 결제 횟수
     rating integer CHECK (rating BETWEEN 1 AND 5),
     content text,
     mentor_reply text,
     is_hidden boolean DEFAULT false,
     created_at timestamptz DEFAULT now()
   );

2. 리뷰 작성 가능 여부 체크 함수 (lib/reviews/checkReviewEligibility.ts)
3. 멘토 상세 페이지 하단 리뷰 표시 컴포넌트 (components/mentor/MentorReviewList.tsx)
4. 리뷰 작성 모달 (components/reviews/ReviewWriteModal.tsx)
5. RLS: 본인 리뷰만 수정, 관리자는 전체 관리

멘토 상세 라우트: /mentors/[mentorId]
```

---

### [P1] 학생 마이페이지 구독 현황 수정

**Cursor AI Chat에 복붙:**
```
app/(student)/mypage/page.tsx 의 구독 현황 카드가 로딩 오류가 있어.

수정해줘:
1. subscriptions 테이블에서 현재 로그인 유저의 active 구독 목록 조회
2. 각 구독에 대해 mentor_profiles JOIN해서 멘토 이름, 사진, 플랜명 표시
3. 구독 만료일(expires_at) 표시
4. 질문 가능 횟수(이번달 남은 질문 수) 표시
5. 로딩 중 스켈레톤 UI
6. 구독 없을 경우 "구독한 멘토가 없어요. 멘토 찾기로 이동하세요" 빈 상태

에러 처리: try/catch + "구독 정보를 불러올 수 없습니다" 토스트
```

---

### [P2] 커뮤니티 게시판 완성

**Cursor AI Chat에 복붙:**
```
쌤버십 커뮤니티 게시판을 완성해줘. 

화면 구조 (좌측 사이드바 + 중앙 콘텐츠 + 우측 사이드바):
- 좌측: 홈 / 숏폼 / 게시판 / 내 활동 / 내 게시글 / 스크랩 / 팔로우 + 내 포인트/배지
- 중앙: 게시글 목록 (카테고리 탭: 학습법/내신/진로/대학생활/자유)
- 우측: 인기 해시태그, 인기 멘토 랭킹

구현 목록:
1. /community 홈 (app/(student)/community/page.tsx)
2. 게시글 목록 (커서 기반 무한 스크롤)
3. 게시글 작성 (/community/new) - 카테고리 선택, 본문, 태그, 이미지 업로드
4. 게시글 상세 (/community/board/[id]) - 댓글, 좋아요, 스크랩, 신고
5. 댓글 대댓글 (최대 2depth)

DB 테이블: community_posts, comments, post_reactions, bookmarks, reports
RLS: 로그인 유저만 작성/댓글, 비로그인도 읽기 가능
```

---

### [P2] 숏폼 업로드 & 재생

**Cursor AI Chat에 복붙:**
```
쌤버십 숏폼(짧은 학습 영상) 기능을 구현해줘.

화면:
1. 숏폼 목록 (/community/shortform) - 세로형 카드 그리드, 카테고리 필터
2. 숏폼 상세 (/community/shortform/[id]) - 비디오 플레이어, 댓글, 좋아요, 공유
3. 숏폼 업로드 (/community/new?type=shortform):
   - 제목, 카테고리 선택
   - mp4/mov 파일 업로드 (최대 3분, 500MB)
   - 썸네일 선택 (영상에서 자동 추출 or 직접 업로드)
   - 설명, 태그 (최대 5개), 출처 입력
   - 권리 보유 확인 체크박스 (필수)
   - 임시저장 / 발행하기

업로드: Supabase Storage 'shortform-videos' 버킷
테이블: shortform_posts (id, creator_id, title, category, video_url, thumbnail_url, description, tags, status, view_count, like_count)
멘토만 업로드 가능 (requireRole("mentor"))
```

---

### [P2] 맞춤의뢰 학생 플로우

**Cursor AI Chat에 복붙:**
```
쌤버십 맞춤의뢰 학생 플로우를 구현해줘.

화면 순서:
1. 맞춤의뢰 메인 (/custom-request): 카테고리 카드, 4단계 안내, 최근 의뢰 미리보기
2. 의뢰 등록 (/custom-request/new):
   - 카테고리, 제목, 설명, 파일 첨부, 마감일, 예산 범위 입력
   - 금지어 필터: "대필", "대신 써줘", "복붙" 포함 시 경고
   - 임시저장 가능
3. 의뢰 확인 (/custom-request/new/review): 입력 내용 확인 후 제출
4. 지원 대기 (/custom-request/[postId]/applications/waiting): 멘토 지원 현황
5. 멘토 선택 (/custom-request/[postId]/applications): 지원서 비교 후 선택
6. 주문방 (/custom-request/orders/[orderId]): 채팅 + 파일 + 상태 타임라인
7. 납품 확인 (/custom-request/orders/[orderId]/review): 수락/수정요청/분쟁
8. 주문 완료 (/custom-request/orders/[orderId]/complete)

DB: custom_request_posts, custom_request_applications, custom_request_orders, custom_order_messages, custom_order_deliverables
수수료: 플랫폼 20% / 멘토 80%
```

---

### [P2] 맞춤의뢰 멘토 플로우

**Cursor AI Chat에 복붙:**
```
쌤버십 맞춤의뢰 멘토 플로우를 구현해줘. 
(학생 플로우가 완성된 후 이걸 구현해)

멘토용 사이드바 메뉴:
대시보드 / 새 의뢰 목록(N) / 제안한 의뢰 / 수락된 의뢰 / 진행 중 / 납품 대기 / 수정 요청 / 납품 완료 / 제안 내역 / 의뢰 가이드

화면 목록:
1. 멘토 대시보드 (/mentor/custom-request/dashboard): KPI 카드 + 진행 중 목록 + 수익 현황
2. 새 의뢰 목록 (/mentor/custom-request/posts): 필터 + 의뢰 목록
3. 의뢰 상세 (/mentor/custom-request/posts/[postId]): 내용 확인 + 제안서 작성
4. 제안서 작성 (/mentor/custom-request/posts/[postId]/apply): 가격/기간/설명/파일
5. 작업방 (/mentor/custom-request/orders/[orderId]/room): 채팅 + 파일 탭
6. 파일 업로드 (/mentor/custom-request/orders/[orderId]/files): 버전별 납품 파일
7. 수정 요청 대응 (/mentor/custom-request/orders/[orderId]/revision)
8. 종료된 의뢰 (/mentor/custom-request/completed)
```

---

### [P2] 멘토 정산 화면

**Cursor AI Chat에 복붙:**
```
쌤버십 멘토 정산 화면을 구현해줘.

화면 1 - 정산 요약 (/mentor/payouts):
- 이번달 발생 수익 (구독 수익 + 맞춤의뢰 수익)
- 지급 예정액, 계좌 정보 (마스킹)
- 월별 수익 카드 (최근 6개월)

화면 2 - 정산 상세 (/mentor/payouts/detail):
- 필터: 기간, 유형(구독/맞춤의뢰)
- 테이블: 날짜, 내용, 금액, 수수료, 순수령액, 상태
- 총계 요약
- 엑셀 다운로드 버튼

계산식:
- 순수납 = 표시가 × 0.94 × (1 - 3.8%) × (1 - 3%)
- 구독 멘토 몫 = 순수납 × 70%
- 맞춤의뢰 멘토 몫 = 순수납 × 80%

DB: payouts, payout_items
```

---

### [P3] 관리자 백오피스

**Cursor AI Chat에 복붙:**
```
쌤버십 관리자 백오피스를 구현해줘.
관리자 셸은 일반 상단 네비와 분리된 별도 레이아웃 사용.

관리자 사이드바 메뉴:
대시보드 / 멘토 승인 / 콘텐츠 검수 / 리뷰 관리 / 신고/분쟁 / 환불/정산 / 이벤트 관리 / 활동 로그 / 시스템 설정

화면 구현:
1. 대시보드 (/admin/dashboard):
   - KPI 카드: 오늘 신규 가입, 승인 대기 멘토, 미처리 신고, 금일 캐시 거래액
   - 7일 가입/거래 추이 차트
   - 문의/신고 처리 상태 도넛 차트
   - 최근 운영 이슈 목록 (신고/콘텐츠검수/환불/분쟁)
   - 빠른 작업 버튼들
   - 오늘 일정

2. 멘토 승인 (/admin/mentor-approval):
   - 신청 목록 (학교/학과/제출일/상태)
   - 상세 패널: 학생증 확인, 승인/추가요청/반려 버튼

3. 신고/분쟁 (/admin/disputes):
   - 필터: 유형(신고/분쟁), 상태, 날짜
   - 처리: 완료/보류/제재

4. 환불/정산 (/admin/refunds-settlement)
5. 리뷰 관리 (/admin/reviews)
6. 콘텐츠 검수 (/admin/moderation)

모든 admin server action 첫 줄: await requireRole("admin")
모든 admin 작업은 admin_action_logs에 기록
```

---

### [P3] 이메일 알림

**Cursor AI Chat에 복붙:**
```
쌤버십 이메일 알림 시스템을 구현해줘.

사용할 서비스: Resend (npm install resend)
환경변수 추가 필요: RESEND_API_KEY

발송해야 할 이메일:
1. 회원가입 환영 이메일
2. 구독 결제 완료
3. 질문에 답변 도착
4. 맞춤의뢰 새 지원서 도착 (학생용)
5. 맞춤의뢰 선택됨 (멘토용)
6. 납품 완료
7. 수정 요청

구현:
- lib/email/sendEmail.ts : 공통 발송 함수
- lib/email/templates/*.ts : 각 템플릿 (한국어)
- Supabase Edge Function 또는 API route에서 호출

각 이메일은 쌤버십 브랜드 컬러(#1A56DB)로 HTML 템플릿 작성.
발송 기록: notifications 테이블에 INSERT
```

---

## 🔧 Supabase SQL 스크립트들

### 구독 결제 후 처리 RPC
**Supabase SQL Editor에 복붙:**
```sql
-- 구독 생성 + room 생성 트랜잭션
CREATE OR REPLACE FUNCTION record_subscription_payment(
  p_student_id uuid,
  p_mentor_id uuid,
  p_plan_id uuid,
  p_amount integer,
  p_toss_payment_key text
) RETURNS json AS $$
DECLARE
  v_room_id uuid;
  v_sub_id uuid;
BEGIN
  -- 1. subscriptions INSERT
  INSERT INTO subscriptions (student_id, mentor_id, plan_id, status, started_at, expires_at)
  VALUES (
    p_student_id, p_mentor_id, p_plan_id, 'active',
    now(), now() + interval '30 days'
  )
  RETURNING id INTO v_sub_id;

  -- 2. mentor_student_room 없으면 생성
  INSERT INTO mentor_student_rooms (student_id, mentor_id)
  VALUES (p_student_id, p_mentor_id)
  ON CONFLICT (student_id, mentor_id) DO NOTHING
  RETURNING id INTO v_room_id;

  -- 3. cash_ledger debit
  INSERT INTO cash_ledger (user_id, amount, type, description, reference_id)
  VALUES (p_student_id, -p_amount, 'subscription', '구독 결제', v_sub_id);

  -- 4. cash_wallets 차감
  UPDATE cash_wallets 
  SET balance = balance - p_amount 
  WHERE user_id = p_student_id;

  RETURN json_build_object('subscription_id', v_sub_id, 'room_id', v_room_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 리뷰 작성 가능 여부 확인 함수
```sql
CREATE OR REPLACE FUNCTION check_review_eligibility(
  p_student_id uuid,
  p_mentor_id uuid
) RETURNS boolean AS $$
DECLARE
  consecutive_count integer;
BEGIN
  SELECT COUNT(*) INTO consecutive_count
  FROM (
    SELECT id FROM subscriptions
    WHERE student_id = p_student_id 
      AND mentor_id = p_mentor_id
      AND status IN ('active', 'expired')
    ORDER BY started_at DESC
    LIMIT 2
  ) recent_subs;
  
  RETURN consecutive_count >= 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 개발 진행 체크리스트

| 기능 | 상태 | 다음 액션 |
|---|---|---|
| 토스 캐시 충전 (카드 옵션 추가) | 🔶 거의 완료 | STEP 0 실행 |
| 구독 결제 연동 | ❌ 미완료 | P1 프롬프트 |
| 리뷰 시스템 | ❌ 미완료 | P1 프롬프트 |
| 학생 마이페이지 구독 현황 | 🔶 오류 있음 | P1 프롬프트 |
| 커뮤니티 게시판 완성 | 🔶 일부 완료 | P2 프롬프트 |
| 숏폼 업로드 & 재생 | ❌ 미완료 | P2 프롬프트 |
| 맞춤의뢰 학생 플로우 | ❌ 미완료 | P2 프롬프트 |
| 맞춤의뢰 멘토 플로우 | ❌ 미완료 | P2 프롬프트 |
| 멘토 정산 화면 | ❌ 미완료 | P2 프롬프트 |
| 관리자 백오피스 | ❌ 미완료 | P3 프롬프트 |
| 이메일 알림 | ❌ 미완료 | P3 프롬프트 |
| 질문 수 한도 차단 검증 | 🔶 로직 있음 | 별도 테스트 |
| 멘토 승인 플로우 | 🔶 미확인 | 관리자 구현 후 |

---

## 💡 Claude Code / Cursor 사용 팁

### 1. 화면 구현할 때 이미지 첨부하기
Cursor에서 이미지를 드래그하거나 클립보드에 복사 후:
```
이 UI 이미지를 참고해서 화면을 구현해줘.
브랜드 컬러는 Primary Blue #1A56DB 사용.
Tailwind CSS로 작성하고, TypeScript 사용.
```

### 2. 오류 생기면
```
이 오류를 해결해줘:
[오류 메시지 붙여넣기]

관련 파일: [파일 경로]
```

### 3. 화면 미리보기
```powershell
cd D:\dev\ssambership_web
npm run dev
```
브라우저에서 http://localhost:3000 열기

### 4. 타입 오류 체크
```powershell
npx.cmd tsc --noEmit
```

### 5. 코드 검증
```powershell
npm.cmd run lint
```

---

## 🎨 UI 구현 시 참고할 디자인 원칙

쌤버십 UI는 **신뢰감 있는 교육 플랫폼** 톤을 유지해야 합니다:

1. **헤더/네비**: 흰 배경, Primary Blue (#1A56DB) 액티브 상태, 그림자 없음
2. **카드**: 흰 배경, 연한 회색 테두리 (border-gray-200), rounded-xl, 그림자 shadow-sm
3. **버튼 Primary**: bg-blue-600 hover:bg-blue-700, text-white, rounded-lg
4. **버튼 Secondary**: bg-white border border-gray-300, text-gray-700
5. **뱃지 상태**: 
   - 진행 중: bg-blue-100 text-blue-700
   - 완료: bg-green-100 text-green-700
   - 대기: bg-yellow-100 text-yellow-700
   - 분쟁: bg-red-100 text-red-700
6. **요금제 추천 배지**: bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full
7. **반응형**: 모바일(1열) → 태블릿(2열) → 데스크톱(3열), md:grid-cols-2 lg:grid-cols-3

---

## ⚠️ 주의사항

1. **git push는 직접 명령할 때만**: 아래 명령어를 직접 입력할 때만 커밋/푸시
```powershell
git add .
git commit -m "메시지"
git push
```

2. **환경변수는 .env.local에만**: GitHub에 절대 올라가지 않도록 .gitignore 확인됨

3. **Supabase SQL은 SQL Editor에서**: 대시보드 → SQL Editor → New query → 붙여넣기 → Run

4. **스토리지 버킷은 항상 private**: public = false 유지

5. **맞춤의뢰 대필 금지어 필터**: "대필", "대신 써줘", "복붙 제출" 키워드 있으면 제출 막기
