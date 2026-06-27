# 217 B Classification Design Audit

기준일: 2026-06-19 KST  
범위: 학교군·전공계열 분류표 관리자화(B) 조사 및 설계 제안.  
실행 금지: 코드 수정, SQL 파일 생성, DB 적용, 커밋, 푸시.  
허용 변경: 이 보고서 파일 생성만.

## 1. 077 CHECK 정의와 충돌 판정

`supabase/sql/077_mentor_school_verification.sql`의 `mentor_school_verifications`는 `verified_major_category`, `school_tier`에 인라인 CHECK를 둔다. 제약명은 SQL에 명시되지 않았고, 실제 DB에서는 Postgres가 자동 제약명을 만들 가능성이 높다.

### 1.1 `verified_major_category` CHECK

위치: `supabase/sql/077_mentor_school_verification.sql:20-32`

```sql
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
```

### 1.2 `school_tier` CHECK

위치: `supabase/sql/077_mentor_school_verification.sql:34-43`

```sql
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
```

### 1.3 충돌 판정

| 항목 | 판정 |
|---|---|
| 관리자 표에서 새 코드 추가 | 충돌. 예: `의약`, `SKY`, `상위권` 같은 새 값을 077에 저장하면 CHECK 위반 |
| 관리자 표에서 기존 코드의 표시 라벨만 변경 | 충돌 없음. 저장값은 `서연고`, `메디컬` 등 기존 코드 그대로 유지 |
| 관리자 표에서 기존 코드를 비활성화 | DB 충돌은 없음. 단 이미 승인된 077 row 표시/필터 fallback 정책 필요 |
| 077 CHECK를 FK로 전환 | 가능하지만 고위험. 기존 검증 row, 관리자 승인 액션, 078 공개 RPC, A-4 필터 흐름에 영향 |

결론: B 1차는 `077 CHECK 유지 + 표는 라벨/순서/활성/학교 매핑을 관리`하는 방식이 가장 안전하다. `mentor_school_verifications.school_tier`와 `verified_major_category`에는 계속 077 CHECK가 허용하는 불변 코드만 저장해야 한다.

## 2. 상수 사용처 전수

원본 상수: `lib/mentor/schoolVerificationConstants.ts`

```ts
export const VERIFIED_MAJOR_CATEGORIES = [
  "메디컬",
  "교육",
  "인문",
  "사회상경",
  "자연",
  "공학",
  "예체능",
  "기타",
] as const;

export const SCHOOL_TIERS = ["서연고", "서성한", "중경외시", "그외", "미분류"] as const;

export const SCHOOL_VERIFICATION_REVIEW_STATUSES = ["pending", "resubmit_required"] as const;
```

| 사용처 | 용도 | B 전환 시 처리 |
|---|---|---|
| `components/admin/AdminMentorApprovalWorkspace.tsx:16,347,362` | 관리자 학교·전공 심사 드롭다운 옵션 | DB catalog를 우선 로드해서 prop으로 전달. 실패/빈값이면 상수 fallback |
| `lib/admin/mentorSchoolVerificationReviewActions.ts:10-15,44-50,104-127` | 승인 액션 입력값 검증, 077 update payload | DB active code 검증을 추가하되 077 CHECK 호환 상수도 최종 방어선으로 유지 |
| `lib/admin/mentorSchoolVerificationReview.ts:5,42` | 심사 대상 status 목록 | 학교군/계열과 별개. `SCHOOL_VERIFICATION_REVIEW_STATUSES`는 그대로 상수 유지 가능 |
| `lib/mentor/mentorsListSearchParams.ts:1-7,80-99,122-124` | 멘토찾기 필터 옵션/URL param 허용값 | 현재 동기 상수 기반. DB 전환 시 page/query에서 옵션을 로드하거나, URL parsing은 문자열로 받고 필터 적용 단계에서 catalog 검증 |
| `lib/mentor/mentorPublicProfileDisplay.ts:57-73` | 학교 인증 배지 라벨과 메타 표시 | 상수 직접 import 없음. `display.schoolTier`, `display.verifiedMajorCategory` 표시값을 catalog label로 매핑할 수 있음 |
| `lib/mentor/publicMentorsListQueries.ts:260-323` | 필터 적용. `school_tier`, `verified_major_category` 기준 | 저장 코드는 계속 동일하므로 로직은 유지 가능. 표시 옵션만 catalog화 가능 |
| `lib/auth/mentorPublicRead.ts:15-64` | 078 v2 RPC 응답 타입/매핑 | 078은 raw code를 반환. catalog label은 앱 레이어에서 별도 매핑하거나 추후 v3 RPC에서 조인 |
| `app/(mentor)/mentor/verification/page.tsx:46-54` | 멘토 본인 검증값 요약 표시 | 직접 상수 import 없음. 필요 시 label mapping만 적용 |

## 3. 기존 관리자 CRUD 패턴

가장 가까운 패턴은 관리자 공지/프로모션 관리다.

| 층 | 위치 | 패턴 |
|---|---|---|
| SQL 테이블/RLS | `supabase/sql/031_p1_admin_notices_promotions.sql:24-169` | 테이블 생성, `set_admin_content_updated_at` trigger, RLS enable, admin insert/update/delete, public active select |
| 관리자 페이지 | `app/(admin)/admin/(console)/notices/page.tsx:11-58` | `PageScaffold`, 목록 + 작성 폼, 서버에서 query load |
| 조회 | `lib/admin/adminNoticesQueries.ts:131-187` | 정해진 table에서 list load, mapper로 UI row 변환 |
| 입력 액션 | `lib/admin/adminNoticesActions.ts:18-52` | `requireRole("admin")`, formData 검증, mutation helper 호출, `revalidatePath`, redirect |
| mutation helper | `lib/admin/adminNoticesMutations.ts:23-72` | 세션 Supabase client로 insert, RLS에 admin 쓰기 정책 의존 |
| UI | `components/admin/AdminNoticesFormSkeleton.tsx`, `components/admin/AdminNoticesList.tsx` | list table + compact form |

B에 재사용할 점:

| 재사용 | 적용 |
|---|---|
| `requireRole("admin")` 후 세션 클라이언트 쓰기 | catalog/mapping CRUD도 RLS를 타게 함 |
| `is_admin()` 기반 RLS | admin 전체 쓰기, public/authenticated는 active row만 읽기 |
| `PageScaffold` + list + form | `/admin/school-classifications` 또는 `/admin/settings` 하위 섹션 |
| `revalidatePath` | `/admin/mentor-approval`, `/mentors`, `/mentors/[id]` 계열 갱신 |
| admin action log | 분류표 변경은 `admin_action_logs`에 별도 기록 권장 |

주의점:

- 공지 테이블은 `created_by` 같은 운영자 UUID가 public select에 노출될 수 있는 구조다. B catalog는 공개 읽기가 필요하므로 public-readable table에는 관리자 UUID·내부 메모를 넣지 않는 편이 안전하다.
- 분류표는 인증/공개 필터의 기준값이라, “삭제”보다는 `is_active=false` soft disable이 더 안전하다.

## 4. 매핑 필요성

| 요구 | 라벨 목록만으로 가능? | 매핑 표 필요? | 이유 |
|---|---:|---:|---|
| 학교군 드롭다운 라벨/순서 관리 | 가능 | 아니오 | `서연고`, `서성한` 등 코드의 표시 라벨/순서만 필요 |
| 전공계열 드롭다운 라벨/순서 관리 | 가능 | 아니오 | `메디컬`, `공학` 등 코드의 표시 라벨/순서만 필요 |
| “서울대학교는 서연고”를 운영자가 관리 | 불가 | 예 | 학교명/학교ID를 학교군 코드에 연결하는 별도 row가 필요 |
| 승인 화면에서 학교명 입력 시 학교군 자동 추천 | 불가 | 예 | `verified_university_id` 또는 정규화 학교명으로 mapping 조회 필요 |
| “치의학과는 메디컬” 같은 전공 자동 추천 | 불가 | 예 | 학과명 패턴/키워드 → 전공계열 코드 mapping 필요 |
| C/D에서 학생 조건과 멘토 검증값을 기계적으로 비교 | 라벨 목록만으로는 부족 | 조건 저장 + 코드 비교 필요 | 학생 질문 조건은 `school_tier`, `verified_major_category` 코드로 저장되어야 함 |

판정: B 최소 구현은 라벨 catalog만으로도 가능하지만, 운영자가 학교별 학교군까지 관리하려면 `university_school_tier_mappings`가 필요하다. 전공계열도 자동 추천/운영 관리까지 가려면 `department_major_category_rules`가 필요하지만, 이는 B-2로 분리해도 된다.

## 5. CHECK 처리 방침 3안

| 안 | 설명 | 장점 | 위험 | 판정 |
|---|---|---|---|---|
| 가 | 077 CHECK 유지 + catalog/mapping은 기존 enum 코드를 관리 | 077/A-1 보안 구조 유지, 기존 approved row와 078 RPC 영향 최소, rollback 쉬움 | 새 코드를 즉시 추가할 수 없음 | 권장 |
| 나 | 077 CHECK 제거/완화 후 catalog FK로 전환 | 코드 확장 유연, DB 정규화 | 077 table 변경, 기존 RLS/trigger/action/RPC 영향. 잘못하면 멘토 검증 저장이 깨짐 | 비권장 |
| 다 | 077 CHECK enum 값 확장 | 제한적으로 새 코드 추가 가능 | 매번 새 SQL 필요, 기존 UI/필터/상수 동기화 필요 | 예외적 상황만 |

권장: **가안**. B의 목표는 “관리자화”이지 “검증값 enum 체계 변경”이 아니다. 저장 코드는 077 CHECK에 맞춰 고정하고, 운영자가 바꾸는 것은 label/order/active/mapping으로 제한하는 편이 안전하다.

## 6. 표 구조 SQL 초안

다음 빈 번호: 현재 최대 `078`, 초안 번호는 `079_b_school_classification_catalogs.sql`.  
주의: 이 절은 보고서 내 초안이다. SQL 파일을 만들거나 DB에 적용하지 않았다.

```sql
-- 079_b_school_classification_catalogs.sql
-- Draft only in 217 report. Do not apply without review.
-- Purpose: B-stage admin-managed school tier / major category catalogs
-- while keeping 077 mentor_school_verifications CHECK values unchanged.

begin;

create table if not exists public.school_tier_catalog (
  code text primary key,
  label text not null,
  description text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_tier_catalog_code_allowed check (
    code in ('서연고', '서성한', '중경외시', '그외', '미분류')
  ),
  constraint school_tier_catalog_label_nonempty check (char_length(trim(label)) > 0)
);

create table if not exists public.major_category_catalog (
  code text primary key,
  label text not null,
  description text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint major_category_catalog_code_allowed check (
    code in ('메디컬', '교육', '인문', '사회상경', '자연', '공학', '예체능', '기타')
  ),
  constraint major_category_catalog_label_nonempty check (char_length(trim(label)) > 0)
);

create table if not exists public.university_school_tier_mappings (
  university_id text primary key,
  university_name text not null,
  normalized_university_name text not null,
  aliases text[] not null default '{}',
  school_tier_code text not null references public.school_tier_catalog(code) on update restrict on delete restrict,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint university_school_tier_mappings_name_nonempty check (char_length(trim(university_name)) > 0),
  constraint university_school_tier_mappings_norm_nonempty check (char_length(trim(normalized_university_name)) > 0)
);

-- Optional B-2 candidate. Include only if admin wants department-name auto-suggest.
create table if not exists public.department_major_category_rules (
  id uuid primary key default gen_random_uuid(),
  match_type text not null default 'contains' check (match_type in ('exact', 'contains')),
  pattern text not null,
  major_category_code text not null references public.major_category_catalog(code) on update restrict on delete restrict,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint department_major_category_rules_pattern_nonempty check (char_length(trim(pattern)) > 0)
);

create index if not exists school_tier_catalog_active_order_idx
  on public.school_tier_catalog (is_active, display_order, code);
create index if not exists major_category_catalog_active_order_idx
  on public.major_category_catalog (is_active, display_order, code);
create index if not exists university_school_tier_mappings_active_norm_idx
  on public.university_school_tier_mappings (is_active, normalized_university_name);
create index if not exists university_school_tier_mappings_tier_idx
  on public.university_school_tier_mappings (school_tier_code);
create index if not exists department_major_category_rules_active_order_idx
  on public.department_major_category_rules (is_active, display_order);

drop trigger if exists trg_school_tier_catalog_set_updated_at on public.school_tier_catalog;
create trigger trg_school_tier_catalog_set_updated_at
  before update on public.school_tier_catalog
  for each row execute function public.set_updated_at();

drop trigger if exists trg_major_category_catalog_set_updated_at on public.major_category_catalog;
create trigger trg_major_category_catalog_set_updated_at
  before update on public.major_category_catalog
  for each row execute function public.set_updated_at();

drop trigger if exists trg_university_school_tier_mappings_set_updated_at on public.university_school_tier_mappings;
create trigger trg_university_school_tier_mappings_set_updated_at
  before update on public.university_school_tier_mappings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_department_major_category_rules_set_updated_at on public.department_major_category_rules;
create trigger trg_department_major_category_rules_set_updated_at
  before update on public.department_major_category_rules
  for each row execute function public.set_updated_at();

alter table public.school_tier_catalog enable row level security;
alter table public.major_category_catalog enable row level security;
alter table public.university_school_tier_mappings enable row level security;
alter table public.department_major_category_rules enable row level security;

-- Public/authenticated may read only active taxonomy rows.
-- Tables intentionally contain no admin user ids or internal notes.
create policy school_tier_catalog_select_active_or_admin
  on public.school_tier_catalog
  for select
  to anon, authenticated
  using (is_active = true or coalesce((select public.is_admin()), false) = true);

create policy major_category_catalog_select_active_or_admin
  on public.major_category_catalog
  for select
  to anon, authenticated
  using (is_active = true or coalesce((select public.is_admin()), false) = true);

create policy university_school_tier_mappings_select_active_or_admin
  on public.university_school_tier_mappings
  for select
  to anon, authenticated
  using (is_active = true or coalesce((select public.is_admin()), false) = true);

create policy department_major_category_rules_select_active_or_admin
  on public.department_major_category_rules
  for select
  to anon, authenticated
  using (is_active = true or coalesce((select public.is_admin()), false) = true);

-- Admin-only writes.
create policy school_tier_catalog_write_admin
  on public.school_tier_catalog
  for all
  to authenticated
  using (coalesce((select public.is_admin()), false) = true)
  with check (coalesce((select public.is_admin()), false) = true);

create policy major_category_catalog_write_admin
  on public.major_category_catalog
  for all
  to authenticated
  using (coalesce((select public.is_admin()), false) = true)
  with check (coalesce((select public.is_admin()), false) = true);

create policy university_school_tier_mappings_write_admin
  on public.university_school_tier_mappings
  for all
  to authenticated
  using (coalesce((select public.is_admin()), false) = true)
  with check (coalesce((select public.is_admin()), false) = true);

create policy department_major_category_rules_write_admin
  on public.department_major_category_rules
  for all
  to authenticated
  using (coalesce((select public.is_admin()), false) = true)
  with check (coalesce((select public.is_admin()), false) = true);

grant select on public.school_tier_catalog to anon, authenticated;
grant select on public.major_category_catalog to anon, authenticated;
grant select on public.university_school_tier_mappings to anon, authenticated;
grant select on public.department_major_category_rules to anon, authenticated;

grant insert, update, delete on public.school_tier_catalog to authenticated;
grant insert, update, delete on public.major_category_catalog to authenticated;
grant insert, update, delete on public.university_school_tier_mappings to authenticated;
grant insert, update, delete on public.department_major_category_rules to authenticated;

insert into public.school_tier_catalog (code, label, display_order, is_active)
values
  ('서연고', '서연고', 10, true),
  ('서성한', '서성한', 20, true),
  ('중경외시', '중경외시', 30, true),
  ('그외', '그외', 40, true),
  ('미분류', '미분류', 90, true)
on conflict (code) do nothing;

insert into public.major_category_catalog (code, label, display_order, is_active)
values
  ('메디컬', '메디컬', 10, true),
  ('교육', '교육', 20, true),
  ('인문', '인문', 30, true),
  ('사회상경', '사회상경', 40, true),
  ('자연', '자연', 50, true),
  ('공학', '공학', 60, true),
  ('예체능', '예체능', 70, true),
  ('기타', '기타', 90, true)
on conflict (code) do nothing;

commit;
```

### 6.1 초안에서 의도적으로 하지 않는 것

- `mentor_school_verifications` ALTER 없음.
- 077 CHECK 완화/삭제 없음.
- 078 public mentor RPC 변경 없음.
- 070 개별질문 claim/escrow 변경 없음.
- admin UUID나 내부 메모를 public-readable catalog table에 넣지 않음.

## 7. 읽기 전환과 fallback 제안

### 7.1 상수는 seed/fallback으로 유지

`lib/mentor/schoolVerificationConstants.ts`는 즉시 삭제하지 않는다. 역할을 “정본”에서 “fallback + 타입 안전 가드”로 낮춘다.

| 레이어 | 우선순위 | fallback |
|---|---|---|
| 관리자 심사 드롭다운 | DB active catalog | DB 실패/빈 row면 기존 상수 |
| 승인 액션 검증 | DB active/all catalog + 077 호환 상수 | DB 실패 시 기존 상수로만 검증 |
| 멘토찾기 필터 옵션 | DB active catalog | 기존 상수 |
| 공개 배지 메타 표시 | catalog label map | raw code 표시 |

### 7.2 코드 전환 포인트

| 위치 | 전환 방향 |
|---|---|
| `components/admin/AdminMentorApprovalWorkspace.tsx` | static import 대신 `schoolTierOptions`, `majorCategoryOptions` prop |
| `lib/admin/mentorSchoolVerificationReviewActions.ts` | `asMajorCategory`, `asSchoolTier`가 DB catalog를 확인하도록 변경. 단 최종적으로 077 CHECK 허용값인지도 확인 |
| `lib/mentor/mentorsListSearchParams.ts` | 동기 상수 옵션은 fallback으로 유지. DB 옵션은 `/mentors` page query에서 로드해 UI에 전달 |
| `lib/mentor/publicMentorsListQueries.ts` | 필터 비교는 code 기준 유지. 옵션 표시 label만 catalog map 적용 |
| `lib/mentor/mentorPublicProfileDisplay.ts` | `schoolTier`, `verifiedMajorCategory` raw code를 label map으로 변환하는 helper 추가 가능 |

### 7.3 078 RPC와의 관계

078 v2는 `verified_major_category`, `school_tier` raw code만 반환한다. B 1차에서는 이 구조를 유지하는 것이 안전하다. catalog label은 앱이 별도 public-readable table에서 읽어 매핑하면 된다. RPC에 label까지 넣는 v3는 나중에 필요할 때 별도 SQL로 검토한다.

## 8. 관리자 UI 제안

권장 위치: 새 관리자 route `/admin/school-classifications` 또는 `/admin/settings` 내부 섹션. `/admin/mentor-approval`은 심사 작업 화면이므로, 분류표 CRUD까지 넣으면 화면 책임이 커진다. 다만 멘토 심사 화면에는 “분류표 관리” 링크와 학교군 자동 추천 표시를 붙일 수 있다.

### 8.1 화면 구성

| 섹션 | 기능 |
|---|---|
| 학교군 catalog | `code`, `label`, `description`, `display_order`, `is_active` 수정 |
| 전공계열 catalog | `code`, `label`, `description`, `display_order`, `is_active` 수정 |
| 학교→학교군 mapping | `university_id`, `university_name`, `aliases`, `school_tier_code`, 활성 상태 관리 |
| 전공명→계열 rule | B-2 옵션. `exact/contains`, `pattern`, `major_category_code` 관리 |

### 8.2 서버 액션 패턴

- `requireRole("admin")` 선행.
- 세션 Supabase client 사용, RLS admin write 정책에 의존.
- 저장 전 code는 077 CHECK 호환 리스트로 재검증.
- delete는 가급적 막고 `is_active=false` 사용.
- 변경은 `admin_action_logs`에 `school_classification_*` 타입으로 기록.
- `revalidatePath("/admin/mentor-approval")`, `revalidatePath("/mentors")` 수행.

### 8.3 자동 추천 흐름

1. 관리자 심사에서 학교명/정규화 학교 키 입력.
2. `university_school_tier_mappings`에서 `university_id` 또는 `normalized_university_name`으로 학교군 추천.
3. 학과명 입력 시 B-2 rule에서 전공계열 추천.
4. 최종 저장은 관리자가 확인한 뒤 077에 기존 enum code로 저장.

## 9. 리스크와 미터치 확인

| 리스크 | 내용 | 대응 |
|---|---|---|
| 077 CHECK 충돌 | catalog가 새 code를 만들면 승인 update가 실패 | B 1차는 code를 CHECK 허용값으로 제한 |
| 공개 읽기 과다 노출 | catalog table을 anon select로 열면 컬럼 전체가 보임 | public-readable table에는 admin id/internal note를 넣지 않음 |
| 기존 approved row 표시 | 비활성 code가 기존 row에 남을 수 있음 | 표시 fallback은 raw code 유지, 필터 옵션에서만 inactive 숨김 여부 결정 |
| 078 적용 상태 | public mentor v2 SQL이 staging에 미적용이면 검증값 표시 확인 불가 | B 적용 전 078 적용/anon PII 차단 확인 필요 |
| 관리자 화면 복잡도 | 심사 화면에 CRUD까지 넣으면 과밀 | 별도 관리자 route 권장 |
| C/D 선행 오해 | B catalog만으로 claim 차단은 완성되지 않음 | C 조건 저장, D 070 RPC 하드차단은 별도 작업 |

미터치 확인:

- 077 트리거/RLS 완화 없음.
- 077 CHECK 변경 없음.
- 기존 SQL 수정 없음.
- 새 SQL 파일 생성 없음.
- 070/에스크로/정산 변경 없음.
- 코드 변경 없음.
- 커밋/푸시 없음.

