# D 조사: 멘토 claim 자격 하드 차단 설계

작성일: 2026-06-19  
범위: 읽기 전용 조사 + 설계 제안. 코드/SQL/DB/커밋 변경 없음. 이 문서는 D 적용 단계 검토용이다.

## 1. claim RPC 시그니처/본문 인용 + escrow 불변식

### 현재 claim RPC

위치: `supabase/sql/070_individual_question_schema_escrow.sql:592`

```sql
create or replace function public.claim_individual_question(
  p_question_id uuid,
  p_mentor_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_question public.individual_questions%rowtype;
begin
  if p_question_id is null or p_mentor_id is null then
    return (false, 'invalid_input', 'question_id and mentor_id are required', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if not public.individual_question_user_is_approved_mentor(p_mentor_id) then
    return (false, 'mentor_not_approved', 'mentor is not approved for individual questions', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

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

  if not found then
    return (false, 'not_available', 'question is already claimed, expired, or unavailable', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  return (true, 'claimed', 'individual question claimed', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
end;
$function$;
```

### 현재 claim execute 권한

위치: `supabase/sql/070_individual_question_schema_escrow.sql:888`

```sql
revoke all on function public.claim_individual_question(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_individual_question(uuid, uuid) to service_role;
```

### claim 호출 경로

| 계층 | 위치 | 현재 동작 |
|---|---|---|
| 멘토 화면 | `app/(mentor)/mentor/individual-questions/page.tsx` | 승인 멘토면 공개 질문 목록 `fetchOpenIndividualQuestionsForMentor` 로드 |
| 공개 질문 카드 | `components/individualQuestion/IndividualQuestionViews.tsx` | 각 카드의 `답변하기` form이 `claimOpenIndividualQuestionAction` 호출 |
| 서버 액션 | `lib/individualQuestion/individualQuestionActions.ts:335` | `requireRole("mentor")` + `assertMentorApprovedForAction` 뒤 service-role RPC 호출 |
| RPC | `supabase/sql/070_individual_question_schema_escrow.sql:592` | `claim_individual_question(p_question_id, p_mentor_id)` |

현재 서버 액션 핵심:

```ts
export async function claimOpenIndividualQuestionAction(formData: FormData) {
  const { user } = await requireRole("mentor");
  const questionId = textValue(formData, "questionId");
  if (!questionId) actionError(MENTOR_LIST_PATH, "질문 정보가 올바르지 않습니다.");

  const supabase = await createClient();
  const approval = await assertMentorApprovedForAction(supabase, user.id);
  if (!approval.ok) actionError(MENTOR_LIST_PATH, "승인 완료 후 공개 질문을 가져갈 수 있어요.");

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("claim_individual_question", {
    p_question_id: questionId,
    p_mentor_id: user.id,
  });
  ...
}
```

### claim 불변식

| 불변식 | 현재 근거 | D 적용 시 보존 방식 |
|---|---|---|
| RPC 직접 실행 제한 | `claim_individual_question` execute는 `service_role` only | `claim_individual_question_v2`도 동일하게 service_role only |
| 멘토 승인 확인 | RPC 안에서 `individual_question_user_is_approved_mentor(p_mentor_id)` 확인 | v2에 동일 검사 복사 |
| 서버 액션 role 확인 | `requireRole("mentor")`, `assertMentorApprovedForAction` | 호출부 교체 시 유지 |
| 공개 질문만 claim | UPDATE `question_type='open'` | v2 최종 UPDATE에 동일 조건 유지 |
| open 상태만 claim | UPDATE `status='open'` | v2 최종 UPDATE에 동일 조건 유지 |
| 선점 1회 | UPDATE `claimed_mentor_id is null` | v2 최종 UPDATE에 동일 조건 유지 |
| 만료 질문 차단 | UPDATE `expires_at is null or expires_at > now()` | v2 최종 UPDATE에 동일 조건 유지 |
| 자기 질문 claim 차단 | UPDATE `student_id <> p_mentor_id` | v2 최종 UPDATE에 동일 조건 유지 |
| 동시성 방어 | 명시적 `for update`는 없고, 위 조건을 포함한 단일 UPDATE가 first-claim 원자성 담당 | v2도 최종 상태 전이는 단일 UPDATE로 유지 |
| 원장/지갑 미변경 | claim RPC는 cash_ledger/cash_wallets를 건드리지 않음. hold는 생성 시 이미 걸림 | 자격 미달 early return은 상태/원장/지갑 모두 미변경 |
| 재시도 멱등성 | 별도 idempotency key 없음. 이미 claim된 뒤 재시도하면 `not_available` | v2도 동일. 필요하면 UX만 개선 |

판정: claim은 결제성 hold를 새로 만들거나 지급/환불하지 않고, 이미 예치된 공개 질문의 담당 멘토와 상태만 바꾸는 경로다. 그래도 `claimed_mentor_id/status`가 payout 경로의 대상 멘토를 결정하므로 서버 SQL 레벨 하드 차단이 필요하다.

## 2. approved 검증값 · 질문 required_* 읽기 경로

### 멘토 학교·전공 검증값

위치: `supabase/sql/077_mentor_school_verification.sql`

```sql
create table if not exists public.mentor_school_verifications (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'resubmit_required')
  ),
  verified_university_name text,
  verified_university_id text,
  verified_major_category text check (
    verified_major_category is null
    or verified_major_category in (
      '메디컬',
      '교육',
      '인문',
      '사회상경',
      '자연',
      '공학',
      '예체능',
      '기타'
    )
  ),
  verified_department_name text,
  school_tier text check (
    school_tier is null
    or school_tier in (
      '서연고',
      '서성한',
      '중경외시',
      '그외',
      '미분류'
    )
  ),
  ...
);
```

주의: 077 원본은 학교군 5값이고, 079가 `건동홍`을 추가 확장한다. D 적용은 079와 080이 운영 DB에 적용된 뒤를 전제로 해야 한다.

현재 공개 멘토 RPC 078은 approved 검증값을 다음 방식으로 읽는다.

```sql
left join lateral (
  select
    msv.mentor_id,
    msv.verified_university_name,
    msv.verified_department_name,
    msv.verified_major_category,
    msv.school_tier
  from public.mentor_school_verifications msv
  where msv.mentor_id = mp.user_id
    and msv.status = 'approved'
  order by coalesce(msv.reviewed_at, msv.updated_at, msv.created_at) desc, msv.created_at desc
  limit 1
) sv on true
```

권장: claim_v2도 같은 "최신 approved 1건" 기준을 사용한다. 단순 `EXISTS`를 필드별로 따로 쓰면 과거 approved 행의 학교군과 최신 approved 행의 전공계열이 섞여 자격을 과하게 허용할 수 있다. 따라서 한 행에서 `school_tier`와 `verified_major_category`를 같이 비교하는 편이 안전하다.

approved 행 처리:

| 상태 | 판정 |
|---|---|
| 질문 required_* 둘 다 null | 검증값 없어도 claim 허용 |
| required_* 하나 이상 존재 + approved 행 없음 | 차단 |
| 최신 approved 행은 있으나 필요한 필드가 null | 차단 |
| required_school_tier 존재 + 최신 approved.school_tier 불일치 | 차단 |
| required_major_category 존재 + 최신 approved.verified_major_category 불일치 | 차단 |
| 둘 다 존재하면 둘 다 같은 최신 approved 행에서 일치 | 허용 |

### 질문 자격 조건

C 적용 파일: `supabase/sql/080_c_individual_question_qualification.sql`

```sql
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
```

현재 코드에서 `required_*`는 공개질문 생성 액션만 RPC v2에 전달한다.

```ts
const { data, error } = await admin.rpc("create_individual_question_with_hold_v2", {
  ...
  p_required_school_tier: requiredSchoolTier,
  p_required_major_category: requiredMajorCategory,
});
```

현재 읽기/claim에는 아직 연결되지 않았다.

## 3. claim 확장 권장안 + 자격 가드 위치

### 권장: `claim_individual_question_v2` 신규 + 호출부 교체

권장안은 새 SQL 후보 `081_d_claim_gate.sql`에서 `claim_individual_question_v2`를 만들고, 서버 액션의 RPC 호출만 v2로 교체하는 것이다.

이유:

- 070 원본 claim 함수/권한/comment를 보존한다.
- 상태 전이 UPDATE 조건을 원본과 그대로 둘 수 있다.
- D 적용 전/후 롤백 표면이 명확하다.
- 자격 미달 시 상태/원장/지갑 변경 전 early return을 만들 수 있다.
- 기존 함수 replace는 작은 변경처럼 보여도 claim 경로 전체를 직접 바꾸므로 위험하다.

### 비권장: 기존 `claim_individual_question` replace

기존 함수를 `create or replace`로 덮으면 호출부 변경은 적지만, 070 원본의 검증/상태 전이 경로를 직접 변경한다. 이 작업은 에스크로 상태 전이 경로이므로 v2 패턴이 더 안전하다.

### 자격 가드 위치

권장 순서:

1. `p_question_id`, `p_mentor_id` null 검사
2. 기존 `individual_question_user_is_approved_mentor(p_mentor_id)` 검사
3. 현재 claim 가능한 질문인지 읽기: `question_type='open'`, `status='open'`, `claimed_mentor_id is null`, not expired, `student_id <> p_mentor_id`
4. 질문의 `required_school_tier`, `required_major_category` 확인
5. 둘 다 null이면 자격 검사 통과
6. 하나라도 있으면 최신 approved `mentor_school_verifications` 1건을 읽어 같은 행 기준으로 비교
7. 자격 미달이면 early return. 상태/원장/지갑 미변경
8. 최종 상태 전이는 원본과 동일한 UPDATE 조건으로 수행

중요: 3번의 SELECT로 상태를 확인해도, 최종 8번 UPDATE는 원본 조건을 다시 걸어야 한다. SELECT와 UPDATE 사이에 다른 멘토가 claim할 수 있으므로 최종 UPDATE가 first-claim 원자성의 마지막 방어선이다.

## 4. 검사 SQL 초안 + 에러 UX + 만료 환불

다음은 적용 금지, 다음 단계 SQL 초안이다.

```sql
begin;

create or replace function public.claim_individual_question_v2(
  p_question_id uuid,
  p_mentor_id uuid
)
returns public.individual_question_escrow_result
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_question public.individual_questions%rowtype;
  v_required_school_tier text;
  v_required_major_category text;
  v_verified_school_tier text;
  v_verified_major_category text;
begin
  if p_question_id is null or p_mentor_id is null then
    return (false, 'invalid_input', 'question_id and mentor_id are required', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if not public.individual_question_user_is_approved_mentor(p_mentor_id) then
    return (false, 'mentor_not_approved', 'mentor is not approved for individual questions', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  select
    q.required_school_tier,
    q.required_major_category
    into v_required_school_tier, v_required_major_category
  from public.individual_questions q
  where q.id = p_question_id
    and q.question_type = 'open'
    and q.status = 'open'
    and q.claimed_mentor_id is null
    and (q.expires_at is null or q.expires_at > now())
    and q.student_id <> p_mentor_id;

  if not found then
    return (false, 'not_available', 'question is already claimed, expired, or unavailable', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  if v_required_school_tier is not null or v_required_major_category is not null then
    select
      msv.school_tier,
      msv.verified_major_category
      into v_verified_school_tier, v_verified_major_category
    from public.mentor_school_verifications msv
    where msv.mentor_id = p_mentor_id
      and msv.status = 'approved'
    order by coalesce(msv.reviewed_at, msv.updated_at, msv.created_at) desc, msv.created_at desc
    limit 1;

    if not found then
      return (false, 'mentor_school_verification_required', 'mentor school verification is required for this question', p_question_id, null, null, null)::public.individual_question_escrow_result;
    end if;

    if v_required_school_tier is not null
       and coalesce(v_verified_school_tier, '') <> v_required_school_tier then
      return (false, 'mentor_qualification_not_met', 'mentor school tier does not match this question requirement', p_question_id, null, null, null)::public.individual_question_escrow_result;
    end if;

    if v_required_major_category is not null
       and coalesce(v_verified_major_category, '') <> v_required_major_category then
      return (false, 'mentor_qualification_not_met', 'mentor major category does not match this question requirement', p_question_id, null, null, null)::public.individual_question_escrow_result;
    end if;
  end if;

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

  if not found then
    return (false, 'not_available', 'question is already claimed, expired, or unavailable', p_question_id, null, null, null)::public.individual_question_escrow_result;
  end if;

  return (true, 'claimed', 'individual question claimed', v_question.id, v_question.status, null, null)::public.individual_question_escrow_result;
end;
$function$;

revoke all on function public.claim_individual_question_v2(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.claim_individual_question_v2(uuid, uuid)
  to service_role;

comment on function public.claim_individual_question_v2(uuid, uuid) is
  'Q1 open individual question first-claim v2. Enforces required school/major qualification against latest approved mentor_school_verifications row. service_role only.';

commit;
```

### 서버 액션 변경 제안

적용 시 변경 후보:

```ts
const { data, error } = await admin.rpc("claim_individual_question_v2", {
  p_question_id: questionId,
  p_mentor_id: user.id,
});
```

현재 액션은 모든 실패를 `"이미 다른 멘토가 답변을 맡았어요..."`로 포장한다. D 적용 시 결과 코드별 UX를 분기하는 것이 필요하다.

권장 UX:

| RPC code | 사용자 메시지 |
|---|---|
| `mentor_school_verification_required` | `이 질문은 학교·전공 인증을 완료한 멘토만 답변할 수 있어요.` |
| `mentor_qualification_not_met` | `이 질문은 학생이 지정한 학교군·전공계열 인증 멘토만 답변할 수 있어요.` |
| `not_available` | 기존 메시지 유지: `이미 다른 멘토가 답변을 맡았어요. 목록을 새로 확인해 주세요.` |
| `mentor_not_approved` | `승인 완료 후 공개 질문을 가져갈 수 있어요.` |

정확한 요구 코드(`서연고`, `메디컬`)까지 보여주려면 list RPC 또는 별도 조회가 필요하다. claim 실패 메시지는 민감정보가 아니므로 코드값 노출은 가능하지만, RPC result 타입에는 별도 필드가 없어서 우선 일반 메시지가 더 단순하다.

### 만료 환불 무관 확인

현재 만료 배치:

```ts
const { data, error } = await supabase
  .from("individual_questions")
  .select("id, student_id, title, status, expires_at")
  .in("status", EXPIRABLE_STATUSES)
  .lte("expires_at", atIso)
  .order("expires_at", { ascending: true })
  .limit(individualQuestionExpiryBatchLimit());
```

환불은 `refund_individual_question_hold(p_question_id)`만 호출하고, RPC 내부에서 `for update`, `hold_ledger_id`, `refund_ledger_id`, `release_ledger_id`, `status`를 기준으로 처리한다. 자격 조건은 만료/환불 대상 선정과 환불 원장 생성에 영향을 주지 않는다.

판정: 자격자가 기한 내 claim하지 않거나 claim 후 답변하지 못한 질문은 기존 cron이 그대로 환불한다. D 적용으로 환불 RPC 수정은 필요 없어 보인다.

## 5. 목록 노출 선택지

하드 차단 핵심은 claim_v2다. 목록 숨김은 부가다.

| 선택지 | 장점 | 단점 | 권장 |
|---|---|---|---|
| 목록은 그대로, claim만 차단 | SQL 변경 최소. 하드 보안은 충족 | 멘토가 누른 뒤 거절 메시지를 봄 | 1차 적용 기본 |
| 목록에 자격 배지 표시 | UX가 명확. required_*는 민감정보 아님 | list RPC v2와 타입/UI 변경 필요 | D 또는 D+1에서 권장 |
| 자격 미달 질문 숨김 | 멘토가 못 받을 질문을 안 봄 | 학생 질문 노출이 줄고, 목록 SQL이 복잡 | 하드 차단 후 후속 선택 |

목록 배지를 하려면 원본 `list_open_individual_questions_for_mentor` 보존 + `list_open_individual_questions_for_mentor_v2` 신규가 안전하다. 반환 후보:

```sql
required_school_tier text,
required_major_category text,
claim_eligible boolean
```

숨김을 하더라도 claim_v2 하드 차단은 반드시 유지해야 한다. 목록 필터는 UX일 뿐 보안 경계가 아니다.

## 6. 리스크·미터치 확인

| 항목 | 위험도 | 이유 | 완화 |
|---|---|---|---|
| claim_v2 상태 전이 | 높음 | payout 대상 멘토를 결정하는 상태 전이 | 원본 UPDATE 조건 그대로 유지 |
| approved 다중 행 | 중간 | 오래된 approved 행이 남으면 EXISTS 방식은 과허용 가능 | 078과 같은 최신 approved 1건 기준 |
| 자격 미달 UX | 낮음 | 현재 실패 메시지가 전부 not_available처럼 보임 | RPC code별 메시지 분기 |
| 목록 숨김 | 중간 | list RPC 변경 범위 증가 | 1차는 claim 하드 차단, 목록은 후속 |
| 079/080 미적용 | 높음 | `건동홍`, required_* 컬럼, create_v2 전제 불충족 | D 적용 전 079/080 실행 확인 |

미터치 확인:

- 기존 070 `claim_individual_question` 편집/삭제/revoke 금지.
- 기존 070 create/release/refund 함수 미터치.
- 054~057, 063, 019, 020, 결제, 030/068/069, 077 트리거/RLS 미터치.
- 기존 RLS 완화 금지.
- D 조사는 코드/SQL/DB/커밋 변경 없음. 이 문서만 생성했다.

