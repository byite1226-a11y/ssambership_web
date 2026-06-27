# 멘토 정산 계좌 저장 설계 조사

## 1. 저장 위치·컬럼 + 현재 저장 흐름

### 저장 위치

- 현재 정산 계좌 저장 위치는 별도 테이블이 아니라 `public.mentor_profiles` 확장 컬럼이다.
- 관련 SQL: `supabase/sql/041_mentor_payout_account.sql`
- 컬럼:
  - `payout_bank_name text`
  - `payout_account_number text`
- `041`은 `alter table ... add column if not exists`만 수행하므로 두 컬럼 모두 `nullable`이고 기본값은 없다.
- 컬럼 주석상 `payout_account_number`는 "서버 저장, UI 마스킹" 용도로 정의되어 있다.

### 현재 저장 흐름 상태

- 서버 액션은 존재한다: `lib/mentor/mentorPayoutAccountActions.ts`
  - `requireRole("mentor")`로 멘토만 호출 가능.
  - `bankName`은 trim만 한다.
  - `accountNumber`는 `replace(/\D/g, "")`로 숫자만 남긴다.
  - 은행명 필수, 계좌번호 최소 8자리 미만이면 실패.
  - `mentor_profiles`에서 `payout_bank_name`/`bank_name`, `payout_account_number`/`bank_account_number`/`account_number` 후보 컬럼을 찾아 `user_id = auth.uid()` 행을 update한다.
- 그러나 이 액션을 import하거나 호출하는 화면은 현재 검색되지 않는다.
  - `git grep "mentorPayoutAccountActions"` 결과 없음.
  - `bankName`, `accountNumber` 입력 필드도 해당 액션 파일 외에는 발견되지 않았다.
- 정산 페이지 데이터 로더는 계좌 읽기 함수를 갖고 있다: `lib/mentor/mentorPayoutsService.ts`
  - `loadMentorPayoutBankAccount()`가 `mentor_profiles`에서 계좌 컬럼을 읽고 마스킹 문자열을 만든다.
  - `MentorPayoutSummary`에 `bankDisplay`, `bankEditable`을 담는다.
- 하지만 현재 정산 화면 컴포넌트에서 `bankDisplay`/`bankEditable`은 렌더링되지 않는다.
  - `components/mentor/payouts/MentorPayoutsRightPanel.tsx`는 "매월 10일 · 등록 계좌"라는 일반 문구만 표시.
  - "정산받을 계좌" 또는 "계좌 변경" 폼 UI는 연결되지 않은 상태.

판정: 저장 컬럼과 서버 액션은 일부 존재하지만, 멘토 정산 화면의 계좌 입력/변경 UI가 연결되지 않아 부분/스텁 상태다.

## 2. 현재 RLS·공개 노출 재확인

### `mentor_profiles` RLS

기본 RLS는 `supabase/sql/001_initial_auth_profile.sql`에 있다.

- `mentor_select_own`: authenticated 사용자는 `user_id = auth.uid()`인 자기 행만 select.
- `mentor_insert_own`: 자기 행만 insert.
- `mentor_update_own`: 자기 행만 update.
- anon/public 직접 조회 정책은 없다.
- 관리자 전용 select/update 정책은 현재 없다.

관리자 화면은 `lib/admin/mentorProfilesAdminRead.ts`에서 service_role 클라이언트를 우선 사용한다. 즉 관리자 콘솔 조회는 애플리케이션 가드 + service_role 우회에 기대고 있으며, RLS 자체가 "본인 + 관리자 read"를 표현하고 있지는 않다.

보안 판정:

- 본인 read/write: 현재 RLS로 충족.
- 관리자 read: service_role 우회로 동작 가능하지만 RLS 정책으로는 미충족.
- 공개/비로그인 차단: RLS 정책상 직접 select 불가.

### 078 공개 RPC 재확인

관련 SQL: `supabase/sql/078_p0_public_mentor_read_rpc_v2.sql`

- `mentor_profiles_for_directory_v2(p_ids uuid[])`는 `returns table (...)` 화이트리스트 방식이다.
- 반환 컬럼은 다음 공개 필드뿐이다.
  - `user_id`
  - `university_name`
  - `department_name`
  - `teaching_subjects`
  - `intro_line`
  - `verification_status`
  - `created_at`
  - 학교 인증 표시용 `verified_*`, `school_tier`, `school_verified`
- `payout_bank_name`, `payout_account_number`는 반환 구조에 없다.
- 앱 코드도 v2 RPC만 호출한다: `lib/auth/mentorPublicRead.ts`
  - `mentor_directory_list_v2`
  - `mentor_user_public_v2`
  - `mentor_profiles_for_directory_v2`
- 구 RPC `mentor_profiles_for_directory(p_ids uuid[])`는 `returns setof public.mentor_profiles`라 041 이후 계좌 컬럼까지 노출할 수 있는 위험한 형태였지만, 078에서 anon/authenticated/public execute를 revoke한다.

재확인 범위:

- 이 조사는 로컬 코드/SQL 기준 확인이다.
- 실제 Supabase DB에 078이 적용되었는지는 런타임 DB 조회를 하지 않았다.
- 운영 DB에서 078 미적용이면 구 RPC가 `mentor_profiles` 전체 row를 반환할 수 있으므로 금융 PII 노출 위험이 있다.

### 기타 공개 경로

- 공개 멘토 상세는 `fetchMentorProfileForPublicMentor()` -> `mentor_profiles_for_directory_v2`를 사용한다.
- 일부 공개/랜딩 코드가 `mentor_profiles` count 또는 안전 컬럼만 직접 조회하지만, RLS 때문에 anon은 본인 행 정책에 걸리지 않는다.
- `lib/mentor/mentorProfileQueries.ts`의 `fetchMentorProfileRow()`는 `select("*")`를 사용하지만 현재 사용처는 멘토 본인 화면 또는 관리자 내부 화면이다. 관리자 상세는 현재 RLS 관리자 정책이 없어 세션 클라이언트만으로는 실패 가능성이 있다.

## 3. 권장 저장/RLS 방식 + SQL 초안

### 권장 방식

새 테이블보다는 기존 `mentor_profiles.payout_bank_name`, `mentor_profiles.payout_account_number`를 재사용하는 것이 현실적이다.

이유:

- 이미 041에서 컬럼과 서버 액션 후보가 있다.
- 계좌는 멘토 프로필의 지급 설정 성격이라 1:1 행에 보관해도 모델상 무리는 없다.
- 공개 RPC가 v2 화이트리스트로 막혀 있어 공개 노출은 별도 RPC 실수만 막으면 통제 가능하다.

단, RLS 보강은 필요하다.

- 현재 RLS는 소유자 본인 read/write만 명시한다.
- 요구사항인 "본인 + 관리자 read"를 DB 정책으로 보장하려면 관리자 select 정책을 추가해야 한다.
- 관리자 정산 목록에서 계좌를 표시할 경우 원문 컬럼을 직접 UI에 넘기지 말고 서버 DTO에서 마스킹해서 내려야 한다.

### SQL 필요 여부

필요.

목적은 새 저장소 생성이 아니라 기존 컬럼 재사용 + 관리자 read RLS 보강이다. 다음 빈 번호 기준 초안 파일명은 `085_mentor_payout_account_rls.sql`이 적절하다. 아래는 적용 금지, 검토용 초안이다.

```sql
-- =============================================================================
-- 085_mentor_payout_account_rls.sql
-- 목적: 멘토 정산 계좌 컬럼 재확인 및 관리자 read RLS 보강
-- 적용: 검토 후 Supabase SQL Editor에서 수동 실행
-- 선행: 001 mentor_profiles/users/is_admin(), 041 payout account columns
-- 주의: 결제/정산/에스크로/환불/070/077 로직 변경 없음. 공개 RPC 변경 없음.
-- =============================================================================

alter table public.mentor_profiles
  add column if not exists payout_bank_name text,
  add column if not exists payout_account_number text;

comment on column public.mentor_profiles.payout_bank_name is '정산 입금 은행명. 멘토 본인 및 관리자 전용.';
comment on column public.mentor_profiles.payout_account_number is '정산 입금 계좌번호. 멘토 본인 및 관리자 전용. 공개 RPC 반환 금지.';

alter table public.mentor_profiles enable row level security;

-- 기존 mentor_select_own / mentor_update_own 은 유지한다.
-- 관리자 콘솔이 session client로도 읽을 수 있게 관리자 read만 추가한다.
drop policy if exists mentor_profiles_select_admin on public.mentor_profiles;
create policy mentor_profiles_select_admin
  on public.mentor_profiles
  for select
  to authenticated
  using ((select public.is_admin()) = true);

-- anon 직접 접근은 정책이 없으므로 차단된다. 권한도 명시적으로 닫아 둔다.
revoke all on public.mentor_profiles from anon;

comment on policy mentor_profiles_select_admin on public.mentor_profiles is
  '관리자 콘솔에서 멘토 프로필 및 정산 계좌를 조회하기 위한 read 정책. 공개 노출 아님.';
```

선택 검토:

- 관리자에게 계좌 수정까지 허용할지 여부는 별도 정책 판단이 필요하다. 현재 요구사항은 "소유자 write / 본인+관리자 read"이므로 관리자 update 정책은 초안에 넣지 않았다.
- 더 강한 격리가 필요하면 `mentor_payout_accounts` 별도 테이블도 가능하지만, 현 코드와 041 컬럼을 살리는 방향에서는 과하다.

## 4. 마스킹·검증 규칙

### 현재 마스킹

`lib/mentor/mentorPayoutsService.ts`의 `maskBankDisplay()`:

- 은행/계좌 모두 없으면 `DEFAULT_MASKED_BANK_DISPLAY`를 반환.
- 현재 기본값은 `카카오뱅크 3333-**-****789`로 실제 계좌처럼 보이는 더미 문구다.
- 계좌 숫자가 4자리 이상이면 `은행명 앞4-**-****뒤3` 형식.
- 짧으면 `은행명 ****`.

현재 문제:

- 본인 화면에도 전체 계좌가 아니라 마스킹 표시만 준비되어 있다.
- 실제 정산 화면에는 `bankDisplay`가 렌더링되지 않는다.
- 기본값이 "미등록"이 아니라 가짜 계좌처럼 보여 혼동 위험이 있다.

### 권장 마스킹

- 멘토 본인:
  - 입력/수정 폼에서는 전체 계좌번호 표시 가능.
  - 저장 후 요약 카드에서는 `은행명 ****1234` 또는 `은행명 1234-****-1234` 형태로 마스킹 권장.
  - "계좌 변경" 클릭 시만 전체값을 input defaultValue로 넣는 방식이 현실적이다.
- 관리자 정산 목록:
  - 원문 금지.
  - `은행명 ****1234`처럼 뒷 4자리만 표시.
  - 엑셀 다운로드에도 원문 포함 금지. 지급 실행용 원문이 필요한 운영 절차가 있다면 별도 권한/감사 로그가 있는 상세 조회로 분리한다.
- 공개/비관리자:
  - 계좌 관련 필드/API 반환 금지.

### 입력 검증

현재 검증:

- 은행명 비어 있으면 실패.
- 계좌번호는 숫자만 남김.
- 계좌번호 8자리 미만이면 실패.

권장 검증:

- 은행명은 free text보다 은행 코드/은행명 select 권장.
- 계좌번호는 저장 전 숫자만 보관.
- 길이: 국내 계좌 실무 범위를 고려해 8~20자리 또는 8~24자리로 제한.
- 하이픈/공백은 입력 허용하되 저장은 숫자만.
- 너무 반복적인 테스트값(`00000000`, `12345678`) 차단은 선택.
- 저장 성공/실패 메시지에 원문 계좌번호를 포함하지 않는다.

## 5. 리스크·미터치 확인

### 리스크

- 금융 PII가 `mentor_profiles` 같은 넓은 프로필 테이블에 함께 들어간다. 공개 RPC가 화이트리스트라 현재 설계는 방어 가능하지만, 향후 `select("*")` 기반 공개 API/RPC를 만들면 즉시 노출 위험이 생긴다.
- 005 구 RPC는 `returns setof public.mentor_profiles`라 041 이후 위험하다. 078이 운영 DB에 실제 적용되어 있어야 한다.
- 관리자 목록/감사/범용 테이블에서 `select("*")` 결과를 그대로 렌더링하면 계좌 원문이 노출될 수 있다. 관리자 정산 계좌 표시는 마스킹 DTO를 별도로 만들어야 한다.
- 현재 기본 마스킹 문구가 실제 계좌처럼 보이는 더미값이다. 미등록 상태는 "정산 계좌 미등록" 같은 명시 문구로 바꾸는 것이 안전하다.
- Supabase 일반 컬럼 저장은 앱 관점에서 평문 저장이다. Supabase의 인프라 암호화와 별개로 앱 레벨 필드 암호화는 적용되어 있지 않다.

### 암호화 옵션

- 1차 권장: 엄격 RLS, 공개 RPC 화이트리스트, 관리자 UI 마스킹, 감사 로그.
- 옵션: 앱단 암호화 또는 DB 암호화 확장 사용.
  - 장점: DB 원문 노출 리스크 감소.
  - 단점: 키 관리, 마이그레이션, 운영 지급 절차, 검색/마스킹 구현 복잡도 증가.
- 현재 단계에서는 기존 컬럼 + RLS 보강 + 공개 RPC 차단 확인이 최소선이다. 금융 PII 정책 수준이 높아지면 별도 테이블 + 암호화로 재검토한다.

### 미터치 확인

- 결제/에스크로/070/077/환불 로직은 조사만 했고 변경하지 않는다.
- 기존 SQL은 수정하지 않는다.
- 새 SQL은 파일 생성 없이 이 문서 안에 초안 텍스트로만 남긴다.
- 코드 변경/커밋 없음.
