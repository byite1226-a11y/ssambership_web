-- =============================================================================
-- 085_connection_notes_author_rls.sql
--
-- C-5/H-3 security hardening: connection_notes write policies must verify the
-- authenticated writer, not only room membership.
--
-- Background:
--   - 002 created cn_insert/cn_update/cn_delete with room-party checks only.
--   - 048 added nullable author_id / author_role.
--   - 076 narrowed update/delete to author_id = auth.uid(), but cn_insert still
--     allowed a room party to submit another participant's author_id.
--
-- This file replaces only write policies. cn_select is intentionally left as-is:
-- room participants may continue to read each other's connection notes.
-- Existing SQL files are not modified.
-- =============================================================================

-- Review before execution:
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'connection_notes'
-- order by cmd, policyname;

alter table public.connection_notes enable row level security;

-- Insert: a room participant may create only their own note.
drop policy if exists "cn_insert" on public.connection_notes;
create policy "cn_insert" on public.connection_notes
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.mentor_student_rooms r
      where r.id = mentor_student_room_id
        and (select auth.uid()) in (r.student_id, r.mentor_id)
    )
  );

-- Update: only the original author may update their own note, while still being
-- a participant of the note's room. The WITH CHECK clause prevents changing the
-- row into a state owned by another author or outside the actor's rooms.
drop policy if exists "cn_update" on public.connection_notes;
create policy "cn_update" on public.connection_notes
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.mentor_student_rooms r
      where r.id = connection_notes.mentor_student_room_id
        and (select auth.uid()) in (r.student_id, r.mentor_id)
    )
  )
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.mentor_student_rooms r
      where r.id = mentor_student_room_id
        and (select auth.uid()) in (r.student_id, r.mentor_id)
    )
  );

-- Delete: only the original author may delete their own note, while still being
-- a participant of the note's room.
drop policy if exists "cn_delete" on public.connection_notes;
create policy "cn_delete" on public.connection_notes
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.mentor_student_rooms r
      where r.id = connection_notes.mentor_student_room_id
        and (select auth.uid()) in (r.student_id, r.mentor_id)
    )
  );

-- Verify after execution:
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'connection_notes'
--   and policyname in ('cn_select', 'cn_insert', 'cn_update', 'cn_delete')
-- order by cmd, policyname;
--
-- Expected behavior:
--   - Same-room student inserting a mentor author_id is rejected.
--   - Same-room participant updating/deleting someone else's note is rejected.
--   - The original author can create/update/delete their own note.
--   - cn_select remains participant-readable and is not recreated here.
-- =============================================================================
