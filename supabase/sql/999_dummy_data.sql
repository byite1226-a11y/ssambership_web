-- =============================================================================
-- 쌤버십 UI 검증용 더미 데이터 (로컬/스테이징)
-- =============================================================================
-- 1) Supabase Auth에서 테스트 계정 3개를 만든 뒤, 아래 UUID를 auth.users.id 와 맞추거나
--    본 파일의 UUID를 회원가입 시 metadata로 지정하세요.
-- 2) SQL Editor에서 이 파일 전체 실행 (service_role 또는 RLS 우회 권한)
-- 3) 앱에서 student@demo.local / mentor@demo.local / admin@demo.local 로 로그인해 확인
--
-- 고정 UUID (auth.users.id 와 동일해야 함)
--   학생  a0000000-0000-4000-8000-000000000001
--   멘토  a0000000-0000-4000-8000-000000000002
--   관리자 a0000000-0000-4000-8000-000000000003
-- =============================================================================

-- extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
insert into public.users (id, role, status, full_name, nickname, email)
values
  ('a0000000-0000-4000-8000-000000000001', 'student', 'active', '김학생', '쌤버학생', 'student@demo.local'),
  ('a0000000-0000-4000-8000-000000000002', 'mentor', 'active', '이멘토', '서울대멘토', 'mentor@demo.local'),
  ('a0000000-0000-4000-8000-000000000003', 'admin', 'active', '박관리', '운영자', 'admin@demo.local')
on conflict (id) do update set
  role = excluded.role,
  status = excluded.status,
  full_name = excluded.full_name,
  nickname = excluded.nickname,
  email = excluded.email,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- mentor_profiles (승인된 멘토 1명)
-- -----------------------------------------------------------------------------
insert into public.mentor_profiles (
  user_id,
  university_name,
  department_name,
  teaching_subjects,
  high_school_name,
  intro_line,
  verification_status
)
values (
  'a0000000-0000-4000-8000-000000000002',
  '서울대학교',
  '경영학과',
  array['수능 국어', '수능 수학', '논술'],
  '○○고등학교',
  '수능·내신 전략을 데이터로 정리해 드립니다. 질문방에서 꾸준히 피드백해요.',
  'approved'
)
on conflict (user_id) do update set
  university_name = excluded.university_name,
  department_name = excluded.department_name,
  teaching_subjects = excluded.teaching_subjects,
  high_school_name = excluded.high_school_name,
  intro_line = excluded.intro_line,
  verification_status = excluded.verification_status,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- mentor_plans (price_cents = 원×100 minor 단위)
-- Limited 55,000 / Standard 114,900 / Premium 249,900 캐시
-- -----------------------------------------------------------------------------
delete from public.mentor_plans
where mentor_id = 'a0000000-0000-4000-8000-000000000002';

insert into public.mentor_plans (mentor_id, plan_tier, amount_cents, label)
values
  ('a0000000-0000-4000-8000-000000000002', 'limited', 5500000, 'Limited'),
  ('a0000000-0000-4000-8000-000000000002', 'standard', 11490000, 'Standard'),
  ('a0000000-0000-4000-8000-000000000002', 'premium', 24990000, 'Premium');

-- -----------------------------------------------------------------------------
-- cash_wallets (balance_cents = 캐시×100)
-- -----------------------------------------------------------------------------
insert into public.cash_wallets (user_id, balance_cents)
values
  ('a0000000-0000-4000-8000-000000000001', 10000000),
  ('a0000000-0000-4000-8000-000000000002', 0)
on conflict (user_id) do update set balance_cents = excluded.balance_cents;

-- -----------------------------------------------------------------------------
-- cash_topup_packages (충전 패키지 5종)
-- -----------------------------------------------------------------------------
insert into public.cash_topup_packages (id, label, amount_cents, price_cents, display_order, active)
values
  ('b1000000-0000-4000-8000-000000000001', '1만 캐시', 1000000, 10000, 1, true),
  ('b1000000-0000-4000-8000-000000000002', '3만 캐시', 3000000, 30000, 2, true),
  ('b1000000-0000-4000-8000-000000000003', '5만 캐시', 5000000, 50000, 3, true),
  ('b1000000-0000-4000-8000-000000000004', '10만 캐시', 10000000, 100000, 4, true),
  ('b1000000-0000-4000-8000-000000000005', '30만 캐시', 30000000, 300000, 5, true)
on conflict (id) do update set
  label = excluded.label,
  amount_cents = excluded.amount_cents,
  price_cents = excluded.price_cents,
  display_order = excluded.display_order,
  active = excluded.active;

-- -----------------------------------------------------------------------------
-- subscriptions + mentor_student_rooms (학생↔멘토 연결)
-- -----------------------------------------------------------------------------
insert into public.subscriptions (id, student_id, mentor_id, plan_tier, status)
values (
  'c1000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'limited',
  'active'
)
on conflict (id) do update set
  plan_tier = excluded.plan_tier,
  status = excluded.status,
  updated_at = now();

insert into public.mentor_student_rooms (id, student_id, mentor_id, subscription_id)
values (
  'd1000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000001'
)
on conflict (id) do update set
  subscription_id = excluded.subscription_id,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- reviews (멘토 상세·리뷰 관리 화면)
-- mentor_id = mentor_profiles.user_id
-- -----------------------------------------------------------------------------
insert into public.reviews (
  id,
  mentor_id,
  student_id,
  subscription_count,
  rating,
  content,
  is_hidden
)
values (
  'e1000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001',
  2,
  5,
  '질문 답변이 빠르고 연결노트가 체계적이에요. 수능 국어 전략이 특히 도움이 됐습니다.',
  false
)
on conflict (id) do update set
  rating = excluded.rating,
  content = excluded.content,
  is_hidden = excluded.is_hidden;

-- -----------------------------------------------------------------------------
-- disputes 샘플 (관리자 신고·분쟁 화면)
-- -----------------------------------------------------------------------------
insert into public.disputes (id, student_id, mentor_id, status, body)
values (
  'f1000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'open',
  '테스트용 분쟁 접수 건입니다. UI 검증 후 삭제하세요.'
)
on conflict (id) do nothing;

comment on table public.users is '999_dummy_data: student/mentor/admin 데모 계정';
