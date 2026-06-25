-- =============================================================================
-- 093_scan_annotations_and_withdrawals.sql
-- Purpose: Restore two app-referenced objects that the backend never created:
--          (1) scan_annotations table + 'scan-annotations' Storage bucket
--              (스캔 첨삭: 멘토/학생이 스캔 원본에 주석을 얹어 저장/조회)
--          (2) withdrawals table (멘토 출금 "요청 로그")
--          plus RLS for the tables and the storage bucket.
--
-- 🗂️ Schema-gate + 🔑 Permission-gate notes:
--   - 신규 테이블/버킷 추가(additive). 기존 객체 수정/삭제 없음.
--   - annotation_json 은 반드시 TEXT. 앱은 정규화 주석을 String 으로 보내고
--     String 으로 읽는다(scan_annotation.dart fromMap: annotation_json as String?).
--     jsonb 로 만들면 읽을 때 Map 이 와서 조용히 데이터가 깨진다 → TEXT 고정.
--   - scan_annotations 접근: 해당 mentor_student_rooms 의 당사자(student_id 또는
--     mentor_id = auth.uid())만 select/insert/update. author_id 는 본인만.
--   - 버킷 'scan-annotations' 는 비공개. 경로 1번째 폴더 = roomId 로 방 당사자만
--     읽기/쓰기.
--
-- 💰 Money-gate note (withdrawals):
--   - withdrawals 는 "출금 요청 로그"까지만. 잔액 검증/실제 차감/송금은 하지 않는다.
--     'paid' 전이 및 지급은 서버/관리자(finance-settlement) 책임 — authenticated
--     는 status='requested' 행만 insert 가능, update/delete 불가(자가 'paid' 차단).
--   - 금액 단위는 원=캐시(정수). amount_cash 그대로 저장(×/÷100 없음).
--
-- Safety:
--   - 모든 객체 if-not-exists / drop-if-exists 후 생성으로 멱등.
--   - set_updated_at() 트리거 함수는 기존 마이그레이션에 존재한다고 가정(재사용).
--
-- Rollback:
--   drop table if exists public.scan_annotations;
--   drop table if exists public.withdrawals;
--   delete from storage.buckets where id = 'scan-annotations';
--   (storage.objects 정책은 아래 drop policy 문 참조)
-- =============================================================================

begin;

-- ===========================================================================
-- (1) scan_annotations
-- ===========================================================================
create table if not exists public.scan_annotations (
  id uuid primary key default gen_random_uuid(),
  mentor_student_room_id uuid not null
    references public.mentor_student_rooms(id) on delete cascade,
  author_id uuid not null references public.users(id),
  author_role text not null check (author_role in ('student', 'mentor')),
  annotation_json text not null default '{}',
  scan_image_path text,
  preview_path text,
  has_annotations boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scan_annotations_room_created
  on public.scan_annotations (mentor_student_room_id, created_at desc);

drop trigger if exists trg_scan_annotations_updated_at on public.scan_annotations;
create trigger trg_scan_annotations_updated_at
  before update on public.scan_annotations
  for each row execute function public.set_updated_at();

alter table public.scan_annotations enable row level security;

-- 방 당사자만 조회.
drop policy if exists "scan_annotations_select_party" on public.scan_annotations;
create policy "scan_annotations_select_party" on public.scan_annotations
  for select to authenticated
  using (
    exists (
      select 1 from public.mentor_student_rooms r
      where r.id = scan_annotations.mentor_student_room_id
        and ((select auth.uid()) = r.student_id
             or (select auth.uid()) = r.mentor_id)
    )
  );

-- 본인 글, 방 당사자만 작성.
drop policy if exists "scan_annotations_insert_author" on public.scan_annotations;
create policy "scan_annotations_insert_author" on public.scan_annotations
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (
      select 1 from public.mentor_student_rooms r
      where r.id = scan_annotations.mentor_student_room_id
        and ((select auth.uid()) = r.student_id
             or (select auth.uid()) = r.mentor_id)
    )
  );

-- 본인 글, 방 당사자만 수정.
drop policy if exists "scan_annotations_update_author" on public.scan_annotations;
create policy "scan_annotations_update_author" on public.scan_annotations
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check (
    (select auth.uid()) = author_id
    and exists (
      select 1 from public.mentor_student_rooms r
      where r.id = scan_annotations.mentor_student_room_id
        and ((select auth.uid()) = r.student_id
             or (select auth.uid()) = r.mentor_id)
    )
  );

comment on table public.scan_annotations is
  '스캔 첨삭 주석 행. annotation_json 은 0~1 정규화 주석을 TEXT 로 보관(앱이 String 으로 주고받음). 방 당사자/작성자 한정 RLS.';

-- ===========================================================================
-- (2) scan-annotations Storage bucket (private)
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('scan-annotations', 'scan-annotations', false)
on conflict (id) do nothing;

-- 경로 규칙: '<roomId>/<stamp>-original.jpg' | '<roomId>/<stamp>-preview.png'
-- 1번째 폴더 = roomId. 해당 방 당사자만 read/write.
drop policy if exists "scan_annotations_obj_select" on storage.objects;
create policy "scan_annotations_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'scan-annotations'
    and exists (
      select 1 from public.mentor_student_rooms r
      where r.id = ((storage.foldername(name))[1])::uuid
        and ((select auth.uid()) = r.student_id
             or (select auth.uid()) = r.mentor_id)
    )
  );

drop policy if exists "scan_annotations_obj_insert" on storage.objects;
create policy "scan_annotations_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'scan-annotations'
    and exists (
      select 1 from public.mentor_student_rooms r
      where r.id = ((storage.foldername(name))[1])::uuid
        and ((select auth.uid()) = r.student_id
             or (select auth.uid()) = r.mentor_id)
    )
  );

drop policy if exists "scan_annotations_obj_update" on storage.objects;
create policy "scan_annotations_obj_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'scan-annotations'
    and exists (
      select 1 from public.mentor_student_rooms r
      where r.id = ((storage.foldername(name))[1])::uuid
        and ((select auth.uid()) = r.student_id
             or (select auth.uid()) = r.mentor_id)
    )
  )
  with check (
    bucket_id = 'scan-annotations'
    and exists (
      select 1 from public.mentor_student_rooms r
      where r.id = ((storage.foldername(name))[1])::uuid
        and ((select auth.uid()) = r.student_id
             or (select auth.uid()) = r.mentor_id)
    )
  );

-- ===========================================================================
-- (3) withdrawals (멘토 출금 요청 로그)
-- ===========================================================================
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.users(id),
  amount_cash integer not null check (amount_cash > 0),
  status text not null default 'requested' check (status in ('requested', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_withdrawals_mentor_created
  on public.withdrawals (mentor_id, created_at desc);

drop trigger if exists trg_withdrawals_updated_at on public.withdrawals;
create trigger trg_withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function public.set_updated_at();

alter table public.withdrawals enable row level security;

-- 본인 출금 내역만 조회.
drop policy if exists "withdrawals_select_self" on public.withdrawals;
create policy "withdrawals_select_self" on public.withdrawals
  for select to authenticated
  using ((select auth.uid()) = mentor_id);

-- 본인 명의로 'requested' 상태만 생성(자가 'paid' 차단).
drop policy if exists "withdrawals_insert_self_requested" on public.withdrawals;
create policy "withdrawals_insert_self_requested" on public.withdrawals
  for insert to authenticated
  with check (
    (select auth.uid()) = mentor_id
    and status = 'requested'
  );

-- update/delete 정책 없음 → authenticated 는 상태 변경/삭제 불가.
-- 'paid' 전이·실제 지급은 service_role/관리자 책임(돈 사고 방지).

comment on table public.withdrawals is
  '멘토 출금 요청 로그. authenticated 는 본인 requested 행만 insert/select. paid 전이·지급은 서버/관리자 책임. amount_cash 단위=원=캐시(정수).';

commit;
