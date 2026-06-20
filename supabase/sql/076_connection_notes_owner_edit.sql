-- =============================================================================
-- 076_connection_notes_owner_edit.sql
--
-- 보안 수정: connection_notes 의 cn_update / cn_delete 정책이 "room 당사자"만
-- 검사하고 작성자(author_id)를 검사하지 않아, 같은 방의 상대가 남의 노트를
-- 수정/삭제할 수 있었다. 작성자 본인(author_id = auth.uid())만 허용하도록 좁힌다.
-- (cn_select 는 room 당사자 열람 그대로 유지 — 상대 노트는 읽기만.)
--
-- 안전:
--   - 기존 SQL(002) 미수정. 본 파일에서 정책을 drop 후 author 제약으로 재생성.
--   - 완화가 아니라 "강화"(권한 축소). 멱등(drop if exists).
--   - 선례: 003_p0(author_id = (select auth.uid())), 001(user_id = (select auth.uid())).
--   - author_id 가 null 인 레거시 노트는 본인 제약상 수정/삭제 불가(불변) — 의도된 동작.
--
-- 실행: Supabase SQL Editor. (0) 점검 → 본문 → (확인).
-- =============================================================================

-- (0) 점검 — 현재 정책
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'connection_notes'
-- order by cmd;

alter table public.connection_notes enable row level security;

drop policy if exists "cn_update" on public.connection_notes;
create policy "cn_update" on public.connection_notes
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "cn_delete" on public.connection_notes;
create policy "cn_delete" on public.connection_notes
  for delete to authenticated
  using (author_id = (select auth.uid()));

-- (확인) cn_update/cn_delete 의 qual 에 author_id 제약이 들어갔는지
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'connection_notes' and policyname in ('cn_update','cn_delete');
