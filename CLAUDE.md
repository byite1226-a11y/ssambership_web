# CLAUDE.md — 쌤버십 프로젝트 컨텍스트

> 이 파일을 D:\dev\ssambership_web\CLAUDE.md 로 저장하세요.
> Claude Code와 Cursor가 프로젝트 전체 맥락을 이해합니다.

## 프로젝트 정의
쌤버십은 학생이 대학생 멘토를 구독하고, 멘토별 질문방에서 질문을 누적하며,
연결노트로 장기 학습 관리를 받는 구독형 질문 멘토링 + 교육형 커뮤니티 플랫폼.

웹 본체 범위: 랜딩 · 멘토 찾기 · 질문방 · 커뮤니티 · 맞춤의뢰 · 캐시결제 · 마이페이지 · 관리자

## 기술 스택
- Frontend: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- Backend: Supabase (Auth, Postgres, Storage, Realtime, Edge Functions)
- 결제: 토스페이먼츠 (@tosspayments/tosspayments-sdk)
- GitHub: byite1226-a11y/ssambeship_web
- 프로젝트 경로: D:\dev\ssambership_web

## 브랜드 컬러 (절대 변경 금지)
- Primary Blue: #1A56DB
- Secondary: #3F83F8
- Accent/별점: #F59E0B
- Success: #10B981
- Danger: #EF4444
- Background: #F9FAFB
- Text Primary: #111827
- Text Secondary: #6B7280

## 절대 잠금값 (변경 금지)
- 상단 네비: 멘토 찾기 │ 질문방 │ 커뮤니티 │ 맞춤의뢰 │ 캐시결제 │ 마이페이지
- 요금제(표기): 베이직 주4개 / 스탠다드 주9개 / 프리미엄 FUP(내부16개) — 내부 tier id: limited/standard/premium
- cap: 1.0 / 2.5 / 4.5
- 수수료: 구독 플랫폼30%/멘토70%, 맞춤의뢰 플랫폼20%/멘토80%
- 질문방 구조: mentor_student_room → question_threads → question_messages
- 연결노트: thread 단위 아님, room 전체 단위
- 멘토 노트: 비공개 토글 없이 공개형만
- 커뮤니티: 숏폼 / 게시판 분리
- 리뷰 조건: 동일 멘토 2회 연속 결제 성공 시에만 가능
- 재무 분리: 맞춤의뢰와 캐시결제 모듈 반드시 분리

## 라우트 구조
```
/                            랜딩
/login                       로그인
/signup                      회원가입
/mentors                     멘토 찾기
/mentors/[mentorId]          멘토 상세
/subscribe                   구독 요금제 선택
/question-room               학생 질문방
/community                   커뮤니티 홈
/community/shortform         숏폼 목록
/community/shortform/[id]    숏폼 상세
/community/board/[id]        게시판 상세
/community/new               커뮤니티 작성
/custom-request              맞춤의뢰 메인
/custom-request/new          의뢰 등록
/custom-request/[postId]/applications  멘토 선택
/custom-request/orders/[orderId]       주문방
/wallet/charge               캐시 충전
/wallet/ledger               캐시 사용내역
/mypage                      학생 마이페이지

/mentor/dashboard            멘토 대시보드
/mentor/question-room        멘토 질문방
/mentor/profile/edit         멘토 프로필 관리
/mentor/payouts              멘토 정산
/mentor/custom-request/dashboard  멘토 맞춤의뢰 대시보드

/admin/dashboard             관리자 대시보드
/admin/mentor-approval       멘토 승인
/admin/moderation            콘텐츠 검수
/admin/reviews               리뷰 관리
/admin/disputes              신고/분쟁
/admin/refunds-settlement    환불/정산
/admin/notices               이벤트/공지
/admin/logs                  활동 로그
/admin/settings              시스템 설정
```

## 핵심 DB 테이블
```
users                        사용자 (role: student | mentor | admin)
mentor_profiles              멘토 프로필
plans                        요금제 (Limited/Standard/Premium)
subscriptions                구독 계약
mentor_student_rooms         질문방 (학생-멘토 room)
question_threads             개별 질문 카드
question_messages            질문 메시지
connection_notes             연결노트 (room 단위)

cash_wallets                 캐시 지갑
cash_ledger                  캐시 원장 (append-only)
payment_orders               결제 주문

community_posts              게시판 글
shortform_posts              숏폼
comments                     댓글
post_reactions               좋아요/반응
bookmarks                    스크랩
reports                      신고

custom_request_posts         맞춤의뢰 공고
custom_request_applications  지원서
custom_request_orders        주문
custom_order_messages        주문방 채팅
custom_order_deliverables    납품 파일

reviews                      리뷰/별점
payouts                      멘토 정산
refunds                      환불
disputes                     분쟁
notifications                알림
admin_action_logs            관리자 활동 로그
```

## 코딩 규칙
1. TypeScript strict mode 유지
2. 서버 컴포넌트 기본, 상태/이벤트 있을 때만 'use client'
3. Tailwind CSS 사용, 인라인 style 금지
4. Supabase RLS 반드시 적용 (Row Level Security)
5. 관리자 server action: 첫 줄 `await requireRole("admin")`
6. 멘토 전용 페이지: `await requireRole("mentor")`
7. 컴포넌트 파일명: PascalCase.tsx
8. 에러: try/catch + toast 알림
9. 로딩: Skeleton UI 사용 (Suspense or 조건부 렌더링)
10. Storage 버킷: 항상 public = false

## 토스페이먼츠 환경변수
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_24xLea5zVA9qeN1pwNK2VQAMYNwW
TOSS_SECRET_KEY=test_sk_4yKeq5bgrpPWOO44v1bJrGX0lzW6
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## UI 디자인 원칙
- 카드: bg-white border border-gray-200 rounded-xl shadow-sm p-6
- 버튼 Primary: bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2
- 버튼 Secondary: bg-white border border-gray-300 text-gray-700 rounded-lg
- 상태 뱃지 진행중: bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full
- 상태 뱃지 완료: bg-green-100 text-green-700
- 상태 뱃지 대기: bg-yellow-100 text-yellow-700
- 상태 뱃지 분쟁: bg-red-100 text-red-700
- 요금제 추천: bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full
- 반응형: 모바일 1열 → md:2열 → lg:3열

## 맞춤의뢰 금지어 필터
다음 단어 포함 시 제출 막고 경고 표시:
["대필", "대신 써줘", "대신 작성", "복붙", "복사 붙여넣기", "그대로 써줘", "제출용"]
