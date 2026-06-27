# C 조사: 학생 공개질문 자격 조건 작성·저장 설계

작성일: 2026-06-19  
범위: 읽기 전용 조사 + 설계 제안. 코드/SQL/DB/커밋 변경 없음. 이 문서는 다음 적용 단계 검토용이다.

## 1. 생성 RPC 시그니처·본문 인용 + escrow 불변식

### 현재 생성 RPC

위치: `supabase/sql/070_individual_question_schema_escrow.sql:386`

```sql
create or replace function public.create_individual_question_with_hold(
  p_student_id uuid,
  p_question_type text,
  p_mentor_id uuid,
  p_subject text,
  p_topic text,
  p_title text,
  p_body text,
  p_price_cents int,
  p_idempotency_key text
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
```

핵심 본문 인용:

```sql
-- student role 확인
if not exists (select 1 from public.users u where u.id = p_student_id and u.role = 'student') then
  return (false, 'invalid_student', 'student must be a student user', null, null, null, null)::public.individual_question_escrow_result;
end if;

-- question_type 검증
if v_type not in ('direct', 'open') then
  return (false, 'invalid_type', 'question_type must be direct or open', null, null, null, null)::public.individual_question_escrow_result;
end if;

-- direct 멘토 필수 + 승인 멘토 확인
if v_type = 'direct' and p_mentor_id is null then
  return (false, 'mentor_required', 'direct question requires mentor_id', null, null, null, null)::public.individual_question_escrow_result;
end if;

if v_type = 'direct' and not public.individual_question_user_is_approved_mentor(p_mentor_id) then
  return (false, 'mentor_not_approved', 'mentor is not approved for individual questions', null, null, null, null)::public.individual_question_escrow_result;
end if;

-- 금액 상한/하한
if p_price_cents is null or p_price_cents <= 0 then
  return (false, 'invalid_price', 'price_cents must be positive', null, null, null, null)::public.individual_question_escrow_result;
end if;

if p_price_cents > 1000000000 then
  return (false, 'price_too_large', 'price_cents is too large', null, null, null, null)::public.individual_question_escrow_result;
end if;

-- 1차 멱등성 확인
select *
  into v_question
from public.individual_questions
where create_idempotency_key = v_idem;

if found then
  select balance_cents
    into v_wallet_balance
  from public.cash_wallets
  where user_id = p_student_id;

  return (
    true,
    'already_exists',
    'individual question already created for idempotency key',
    v_question.id,
    v_question.status,
    v_question.hold_ledger_id,
    v_wallet_balance
  )::public.individual_question_escrow_result;
end if;

-- 지갑 row lock
insert into public.cash_wallets (user_id, balance_cents)
values (p_student_id, 0)
on conflict (user_id) do nothing;

select balance_cents
  into v_wallet_balance
from public.cash_wallets
where user_id = p_student_id
for update;

-- lock 뒤 2차 멱등성 확인
select *
  into v_question
from public.individual_questions
where create_idempotency_key = v_idem;

if found then
  return (
    true,
    'already_exists',
    'individual question already created for idempotency key',
    v_question.id,
    v_question.status,
    v_question.hold_ledger_id,
    v_wallet_balance
  )::public.individual_question_escrow_result;
end if;

-- 잔액 부족 차단
if coalesce(v_wallet_balance, 0) < p_price_cents then
  return (
    false,
    'insufficient_cash',
    'CASH_INSUFFICIENT',
    null,
    null,
    null,
    coalesce(v_wallet_balance, 0)
  )::public.individual_question_escrow_result;
end if;

v_status := case when v_type = 'direct' then 'assigned' else 'open' end;

-- 질문 생성
insert into public.individual_questions (
  student_id,
  question_type,
  designated_mentor_id,
  subject,
  topic,
  title,
  body,
  price_cents,
  status,
  create_idempotency_key
)
values (
  p_student_id,
  v_type,
  case when v_type = 'direct' then p_mentor_id else null end,
  nullif(trim(coalesce(p_subject, '')), ''),
  nullif(trim(coalesce(p_topic, '')), ''),
  trim(p_title),
  trim(p_body),
  p_price_cents,
  v_status,
  v_idem
)
returning * into v_question;

-- hold 원장 insert, 원장 멱등키
insert into public.cash_ledger (
  user_id,
  delta_cents,
  reason,
  ref_type,
  ref_id,
  idempotency_key
)
values (
  p_student_id,
  -p_price_cents,
  'individual_question_escrow_hold',
  'individual_questions',
  v_question.id,
  'iq_hold:' || v_question.id::text
)
on conflict (idempotency_key) do nothing
returning id into v_ledger_id;

if v_ledger_id is null then
  raise exception 'INDIVIDUAL_QUESTION_HOLD_LEDGER_CONFLICT';
end if;

-- 지갑 차감 재확인
update public.cash_wallets
set balance_cents = balance_cents - p_price_cents
where user_id = p_student_id
  and balance_cents >= p_price_cents
returning balance_cents into v_wallet_balance;

get diagnostics v_wallet_rows = row_count;
if coalesce(v_wallet_rows, 0) = 0 then
  raise exception 'CASH_INSUFFICIENT_AFTER_LOCK' using errcode = 'P0001';
end if;

update public.individual_questions
set hold_ledger_id = v_ledger_id
where id = v_question.id
returning * into v_question;
```

### 불변식 목록

| 불변식 | 현재 근거 | C 적용 시 보존 방식 |
|---|---|---|
| 학생만 생성 가능 | `users.id = p_student_id and role = 'student'` 확인 | v2 함수에도 동일 검사 복사 |
| 질문 타입 제한 | `direct/open`만 허용 | v2 함수에도 동일 검사 복사 |
| direct 질문 멘토 필수/승인 | direct일 때 `p_mentor_id` 필수 + `individual_question_user_is_approved_mentor` | C는 공개형 자격 조건이므로 direct 흐름은 원본 함수 유지 또는 v2에서 자격값 null 강제 |
| 금액 하한/상한 | `p_price_cents > 0`, `<= 1000000000` | v2 함수에도 동일 검사 복사 |
| 생성 멱등성 | `individual_questions.create_idempotency_key unique` + lock 전후 2회 조회 | v2 함수에도 동일 흐름 복사 |
| wallet lock | `cash_wallets where user_id = p_student_id for update` | v2 함수에도 동일 흐름 복사 |
| 잔액 음수 방지 | lock 후 잔액 확인 + update `balance_cents >= p_price_cents` | v2 함수에도 동일 흐름 복사 |
| 원장 멱등성 | `cash_ledger.idempotency_key = 'iq_hold:' || question.id`, conflict 차단 | v2 함수에도 동일 흐름 복사 |
| 질문 hold 연결 | 생성 후 `hold_ledger_id` 갱신 | v2 함수에도 동일 흐름 복사 |
| 권한 표면 | RPC execute는 service_role only | v2도 `revoke all ... from public, anon, authenticated; grant execute ... to service_role` |

현재 grant:

```sql
revoke all on function public.create_individual_question_with_hold(uuid, text, uuid, text, text, text, text, int, text) from public, anon, authenticated;
grant execute on function public.create_individual_question_with_hold(uuid, text, uuid, text, text, text, text, int, text) to service_role;
```

현재 학생 작성 액션은 service-role client로 RPC를 호출한다.

- direct: `lib/individualQuestion/individualQuestionActions.ts:213`
- open: `lib/individualQuestion/individualQuestionActions.ts:276`

## 2. 개별질문 스키마 + 자격 컬럼 추가 SQL 초안

현재 `individual_questions` 컬럼:

```sql
create table if not exists public.individual_questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  question_type text not null check (question_type in ('direct', 'open')),
  designated_mentor_id uuid references public.users(id) on delete set null,
  claimed_mentor_id uuid references public.users(id) on delete set null,
  claimed_at timestamptz,
  subject text,
  topic text,
  title text not null,
  body text not null,
  price_cents int not null check (price_cents > 0),
  status text not null default 'escrowed' check (...),
  expires_at timestamptz,
  answered_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  hold_ledger_id uuid references public.cash_ledger(id) on delete set null,
  release_ledger_id uuid references public.cash_ledger(id) on delete set null,
  refund_ledger_id uuid references public.cash_ledger(id) on delete set null,
  create_idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint individual_questions_direct_mentor_required check (
    question_type <> 'direct' or designated_mentor_id is not null
  ),
  constraint individual_questions_open_claim_consistency check (
    question_type <> 'open' or designated_mentor_id is null
  )
);
```

현재 자격 조건 컬럼은 없다. C 적용 후보는 `individual_questions`에 nullable 단일 조건 컬럼을 추가하는 방식이다.

권장 데이터 모델:

- `required_school_tier text null`
- `required_major_category text null`
- `null` = 조건 없음
- 단일 선택 권장. 현재 제품 문맥의 예시가 `서연고 + 메디컬` 형태이고, D claim 가드도 단일 동치 비교가 가장 안전하다.
- 복수 조건은 `text[]` 또는 join table이 필요하고, claim 가드·인덱스·UI 설명이 복잡해진다. 공개질문 첫 버전에는 과하다.

새 SQL 후보 번호: 현재 최대가 `079_b_classification_catalog.sql`이므로 다음 적용은 `080_c_individual_question_qualification.sql` 후보.

SQL 초안(실행 금지, 다음 적용 단계 검토용):

```sql
begin;

alter table public.individual_questions
  add column if not exists required_school_tier text,
  add column if not exists required_major_category text;

alter table public.individual_questions
  drop constraint if exists individual_questions_required_school_tier_check,
  add constraint individual_questions_required_school_tier_check
    check (
      required_school_tier is null
      or required_school_tier in ('서연고', '서성한', '중경외시', '건동홍', '그외', '미분류')
    );

alter table public.individual_questions
  drop constraint if exists individual_questions_required_major_category_check,
  add constraint individual_questions_required_major_category_check
    check (
      required_major_category is null
      or required_major_category in ('메디컬', '교육', '인문', '사회상경', '자연', '공학', '예체능', '기타')
    );

create index if not exists idx_iq_open_required_qualification
  on public.individual_questions (
    required_school_tier,
    required_major_category,
    created_at desc
  )
  where question_type = 'open' and status = 'open';

comment on column public.individual_questions.required_school_tier is
  '공개 개별질문 claim 자격 조건: 요구 학교군. null이면 조건 없음.';

comment on column public.individual_questions.required_major_category is
  '공개 개별질문 claim 자격 조건: 요구 전공계열. null이면 조건 없음.';

commit;
```

RLS는 기존 `individual_questions` RLS를 따른다. 현재 일반 authenticated insert/update/delete 정책은 없고, 쓰기는 service-role server action/RPC만 경유한다.

주의: `건동홍`은 079가 적용되어야 운영 DB의 분류 catalog/077 CHECK와 완전히 맞는다. C의 CHECK는 079의 최종 학교군 목록을 기준으로 한다.

## 3. RPC 확장 방식 권장안

### 권장: `create_individual_question_with_hold_v2` 신규 함수

권장안은 새 함수 `create_individual_question_with_hold_v2`를 추가하고, 공개 질문 작성 액션만 v2로 교체하는 것이다.

이유:

- 원본 070 함수와 기존 direct/open 생성 흐름을 보존한다.
- 기존 함수 시그니처/grant/comment를 건드리지 않는다.
- 078 v2 공개 RPC와 같은 확장 패턴이다.
- "원본 create 후 update로 자격 컬럼만 채우기"는 hold 성공 후 qualification update 실패 시 무자격 질문이 열리는 부분 실패 위험이 있다. v2 함수 안의 단일 INSERT에 자격값을 포함하는 편이 안전하다.

v2 시그니처 초안:

```sql
create or replace function public.create_individual_question_with_hold_v2(
  p_student_id uuid,
  p_question_type text,
  p_mentor_id uuid,
  p_subject text,
  p_topic text,
  p_title text,
  p_body text,
  p_price_cents int,
  p_idempotency_key text,
  p_required_school_tier text default null,
  p_required_major_category text default null
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
```

v2 본문 변경점 초안:

```sql
declare
  v_type text := lower(trim(coalesce(p_question_type, '')));
  v_required_school_tier text := nullif(trim(coalesce(p_required_school_tier, '')), '');
  v_required_major_category text := nullif(trim(coalesce(p_required_major_category, '')), '');
  -- 나머지 변수는 070 원본과 동일
begin
  -- 070 원본 검증/멱등/lock/잔액 검사를 그대로 유지

  if v_required_school_tier is not null
     and v_required_school_tier not in ('서연고', '서성한', '중경외시', '건동홍', '그외', '미분류') then
    return (false, 'invalid_required_school_tier', 'required_school_tier is invalid', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_required_major_category is not null
     and v_required_major_category not in ('메디컬', '교육', '인문', '사회상경', '자연', '공학', '예체능', '기타') then
    return (false, 'invalid_required_major_category', 'required_major_category is invalid', null, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_type <> 'open' then
    v_required_school_tier := null;
    v_required_major_category := null;
  end if;

  insert into public.individual_questions (
    student_id,
    question_type,
    designated_mentor_id,
    subject,
    topic,
    title,
    body,
    price_cents,
    status,
    create_idempotency_key,
    required_school_tier,
    required_major_category
  )
  values (
    p_student_id,
    v_type,
    case when v_type = 'direct' then p_mentor_id else null end,
    nullif(trim(coalesce(p_subject, '')), ''),
    nullif(trim(coalesce(p_topic, '')), ''),
    trim(p_title),
    trim(p_body),
    p_price_cents,
    v_status,
    v_idem,
    v_required_school_tier,
    v_required_major_category
  )
  returning * into v_question;

  -- hold ledger / wallet debit / hold_ledger_id update는 원본과 동일
end;
```

grant 초안:

```sql
revoke all on function public.create_individual_question_with_hold_v2(
  uuid, text, uuid, text, text, text, text, int, text, text, text
) from public, anon, authenticated;

grant execute on function public.create_individual_question_with_hold_v2(
  uuid, text, uuid, text, text, text, text, int, text, text, text
) to service_role;
```

### 비권장: 기존 함수 `create or replace` + 기본값 파라미터

기존 함수 끝에 default 파라미터를 추가하는 방식은 호출부 호환은 가능해 보이지만, 070 본체를 직접 바꾸며 grant/comment/signature 관리가 꼬일 수 있다. 결제성 hold RPC라 변경 표면이 너무 크다. 이번 C는 원본 보존 + v2 교체가 더 안전하다.

### 공개 목록/카드용 읽기 RPC

현재 멘토 공개 질문 목록은 `list_open_individual_questions_for_mentor(p_limit)`가 whitelist 필드만 반환한다.

현재 반환 필드:

```sql
returns table (
  id uuid,
  subject text,
  topic text,
  title text,
  price_cents int,
  expires_at timestamptz,
  created_at timestamptz
)
```

자격 배지를 보이려면 SQL 반환 필드가 늘어야 한다. 원본 070 미터치 원칙을 지키려면 `list_open_individual_questions_for_mentor_v2`를 새로 만들고 호출부만 교체하는 편이 안전하다.

v2 반환 추가 후보:

```sql
required_school_tier text,
required_major_category text
```

C 단계에서는 단순 노출만 하고, D 단계에서 이 RPC가 "내가 claim 가능한 질문만" 보여줄지, 아니면 "조건 배지 표시 + claim 시 하드차단"으로 둘지 결정하면 된다. 보안상 핵심은 D의 `claim_individual_question_v2` SQL 가드다.

## 4. 작성 UI 변경 제안 + 만료 환불 연계 확인

### 학생 작성 UI

공개 질문 작성 화면:

- 위치: `app/(student)/individual-questions/new/page.tsx`
- 현재 서버 액션: `createOpenIndividualQuestionAction`
- 현재 입력: 과목, 단원/개념, 제시 금액, 제목, 본문, 첨부
- 제안 입력:
  - 학교군 드롭다운: `requiredSchoolTier`, 기본값 `""` = 조건 없음
  - 전공계열 드롭다운: `requiredMajorCategory`, 기본값 `""` = 조건 없음
  - 옵션은 `loadSchoolClassificationCatalogs`로 079 catalog를 읽고, 실패/빈값이면 `schoolVerificationConstants.ts` fallback 사용
  - 안내 문구: "조건을 걸면 해당 검증값을 승인받은 멘토만 답변을 맡을 수 있어요."

지정형 질문 작성 화면:

- 위치: `app/(student)/mentors/[mentorId]/individual-question/new/page.tsx`
- 멘토가 이미 지정되어 있으므로 C의 공개질문 자격 조건 대상이 아니다.
- direct 액션은 원본 `create_individual_question_with_hold` 유지 권장.

서버 액션 변경:

- 위치: `lib/individualQuestion/individualQuestionActions.ts`
- `createOpenIndividualQuestionAction`에서 formData의 `requiredSchoolTier`, `requiredMajorCategory`를 읽고 허용값 검증
- RPC 호출을 `create_individual_question_with_hold_v2`로 교체
- 기존 금액 변환 `amountCentsFromCashKrw(priceCash)`, idempotency key, expiry, attachment 업로드 흐름은 그대로 유지

### 읽기 타입/카드

수정 후보:

- `lib/individualQuestion/individualQuestionQueries.ts`
  - `IndividualQuestionRow`
  - `OpenIndividualQuestionBrowseRow`
  - `QUESTION_COLUMNS`
  - `fetchOpenIndividualQuestionsForMentor`는 `list_open_individual_questions_for_mentor_v2`로 교체 후보
- `components/individualQuestion/IndividualQuestionViews.tsx`
  - 공개 질문 카드에 "자격 필요: 서연고 · 메디컬" 배지 표시
  - null/null이면 "전체 멘토 가능" 또는 배지 미표시

### 만료 환불

현재 cron:

- route: `app/api/cron/individual-question-expiry/route.ts`
- batch: `lib/individualQuestion/individualQuestionExpiryBatch.ts`
- 대상 status: `open`, `assigned`, `claimed`
- 조회 컬럼: `id, student_id, title, status, expires_at`
- 환불 RPC: `refund_individual_question_hold(p_question_id)`

환불 RPC는 `individual_questions` row를 `for update`로 잠그고, `hold_ledger_id`, `refund_ledger_id`, `release_ledger_id`, `status`만 기준으로 원장/지갑을 처리한다. 자격 컬럼은 환불 조건에 영향을 주지 않는다.

판정: 자격 멘토가 기한 내 claim/answer하지 못한 공개질문도 기존 `expires_at` 만료 배치가 그대로 환불한다. C 적용으로 환불 RPC 수정은 필요 없어 보인다.

## 5. D 연동 포인트, 리스크·미터치 확인

### D claim 가드 위치

현재 claim RPC:

```sql
create or replace function public.claim_individual_question(
  p_question_id uuid,
  p_mentor_id uuid
)
```

현재 핵심 update:

```sql
update public.individual_questions
set
  claimed_mentor_id = p_mentor_id,
  claimed_at = now(),
  status = 'claimed'
where id = p_question_id
  and question_type = 'open'
  and status = 'open'
  and claimed_mentor_id is null
  and (expires_at is null or expires_at > now())
  and student_id <> p_mentor_id
returning * into v_question;
```

D에서는 원본을 보존하고 `claim_individual_question_v2`를 만드는 것을 권장한다. 이 update의 `where`에 다음 조건을 추가하는 구조가 안전하다.

```sql
and (
  required_school_tier is null
  or exists (
    select 1
    from public.mentor_school_verifications msv
    where msv.mentor_id = p_mentor_id
      and msv.status = 'approved'
      and msv.school_tier = required_school_tier
  )
)
and (
  required_major_category is null
  or exists (
    select 1
    from public.mentor_school_verifications msv
    where msv.mentor_id = p_mentor_id
      and msv.status = 'approved'
      and msv.verified_major_category = required_major_category
  )
)
```

실제 D에서는 최신 approved 1건 정책을 정해야 한다. 077은 이력 보존형이라 `approved`가 여러 건 있을 가능성을 완전히 배제하지 않는다. 조건 일치 여부만 보면 다중 approved가 있어도 보수적으로 동작하지만, 표시/감사 관점에서는 "최신 approved" 기준을 별도로 정하는 편이 낫다.

### 리스크

| 항목 | 위험도 | 이유 | 완화 |
|---|---|---|---|
| 생성 RPC v2 복사 | 높음 | 돈/escrow hold 본문 복사 중 누락 가능 | 원본 070 본문과 diff 최소화, 불변식 체크리스트로 리뷰 |
| 기존 함수 교체 | 높음 | 시그니처/grant/caller 영향 | 비권장, v2 신규 함수 권장 |
| create 후 update 방식 | 높음 | hold 성공 후 자격 update 실패 시 무자격 공개질문 생성 | 비권장, v2 INSERT에 컬럼 포함 |
| 복수 조건 모델 | 중간 | claim SQL/인덱스/UI 복잡도 증가 | C 1차는 단일 조건 + null |
| list RPC 반환 변경 | 중간 | 기존 반환 타입 의존 | v2 신규 `list_open_individual_questions_for_mentor_v2` 권장 |
| 079 미적용 상태 | 중간 | catalog/건동홍 DB CHECK 불일치 | 079 적용 확인 후 C 적용 |

### 미터치 확인

- 070 원본 SQL 파일 편집 금지. 적용 시에도 새 `080_*` SQL로만 확장.
- 054~057, 063, 019, 020, 030/068/069, 결제/정산/환불 RPC 미터치.
- 기존 RLS 완화 금지.
- C 조사에서는 코드/SQL/DB/커밋 변경 없음. 이 문서만 생성했다.

