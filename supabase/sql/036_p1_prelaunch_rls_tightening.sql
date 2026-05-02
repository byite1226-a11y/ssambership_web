-- =============================================================================
-- 036_p1_prelaunch_rls_tightening.sql
-- P1 prelaunch RLS audit — 초안 (SQL Editor에 바로 적용하지 말 것)
-- =============================================================================
-- 스테이징 스키마 전제(요약)
--   • custom_request_orders: student_id / mentor_id NOT NULL; buyer_id 등 nullable
--   • custom_order_revisions: custom_request_order_id NOT NULL;
--     custom_order_id / order_id / request_order_id 는 legacy nullable(RLS 판단 미사용)
--   • disputes: custom_request_order_id / student_id / mentor_id nullable
-- 목적
--   • custom_order_revisions INSERT: 학생만 — o.id = custom_request_order_id 이고
--     o.student_id = auth.uid() ( mentor 전용·admin 단독 insert 없음 ).
--   • disputes INSERT: 주문 존재 + dispute.student_id/mentor_id 가 주문과 충돌 없음 +
--     admin 또는 주문의 student/mentor 본인.
-- 위험도
--   • crev_ins: 낮. staging 에서 student_id NOT NULL 이므로 의뢰자=student_id 전제와 일치.
--   • dispute_ins: 중. 스테이징에서 학생·멘토·admin insert 시뮬 권장.
-- 선행 마이그레이션
--   • 003_p0_custom_request_draft.sql (custom_request_orders, custom_order_revisions, is_admin)
--   • 004_p0_cash_disputes_admin_draft.sql (disputes, is_admin)
--   • 007_p0_custom_order_revisions_and_order_events_rls.sql (crev_ins)
--   • 008_p0_disputes_insert_party_rls.sql (dispute_ins)
-- 금지
--   • 본 파일은 DML 없음 / RLS 비활성화 없음 / GRANT 확대 없음 / DROP TABLE 없음 /
--     ALTER DROP COLUMN 없음 / service_role 권한 확대 없음.
-- =============================================================================

alter table if exists public.custom_order_revisions enable row level security;
alter table if exists public.disputes enable row level security;

-- -----------------------------------------------------------------------------
-- 1) custom_order_revisions — INSERT "crev_ins"
--     연결: 오직 custom_request_order_id → custom_request_orders.id ( legacy FK 열은 RLS 에 사용 안 함 ).
--     revisions.author_id 는 003 스키마상 존재. requester_id 등은 revisions 테이블에 없으면 참조하지 않음.
--     crev_all_party SELECT 는 본 파일에서 변경하지 않음.
-- -----------------------------------------------------------------------------
drop policy if exists "crev_ins" on public.custom_order_revisions;

create policy "crev_ins" on public.custom_order_revisions
  for insert to authenticated
  with check (
    custom_order_revisions.author_id = (select auth.uid())
    and exists (
      select 1
      from public.custom_request_orders o
      where o.id = custom_order_revisions.custom_request_order_id
        and o.student_id = (select auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- 2) disputes — INSERT "dispute_ins"
--     WITH CHECK 내 bare student_id / mentor_id / custom_request_order_id 는 삽입 대상 disputes 행.
--     서브쿼리 alias o = custom_request_orders 로 충돌 방지.
-- -----------------------------------------------------------------------------
drop policy if exists "dispute_ins" on public.disputes;

create policy "dispute_ins" on public.disputes
  for insert to authenticated
  with check (
    disputes.custom_request_order_id is not null
    and exists (
      select 1
      from public.custom_request_orders o
      where o.id = disputes.custom_request_order_id
        and (disputes.student_id is null or disputes.student_id = o.student_id)
        and (disputes.mentor_id is null or disputes.mentor_id = o.mentor_id)
        and (
          (select public.is_admin()) = true
          or (select auth.uid()) = o.student_id
          or (select auth.uid()) = o.mentor_id
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 3) custom_request_orders — UPDATE "cro_update"
--     이번 036 에서는 cro_update 교체/축소/추가 없음(보류).
--     현재 서버 액션 정상 경로가 인증 클라이언트에서 custom_request_orders 에
--     직접 update 를 수행하므로( orderStudentActions.ts / orderMentorActions.ts ),
--     별도 RPC 전환 후 RLS 정리 권장.
-- -----------------------------------------------------------------------------
-- 권장 후속(적용 전 확인 필요):
--   • 상태 전이를 RPC/서비스 레이어로 모은 뒤 cro_update 축소.
--   • student 전용 / mentor 전용 policy 분리 + WITH CHECK 불변식(트리거 병행 권장).
--
-- 예시(실행 금지 — 검토용 스케치):
-- /*
-- drop policy if exists "cro_update" on public.custom_request_orders;
-- create policy "cro_update" on public.custom_request_orders
--   for update to authenticated
--   using ( ... 동일 ... )
--   with check ( ... 동일 + 불변식 ... );
-- */

-- -----------------------------------------------------------------------------
-- 부록: disputes 가 custom_request_order_id 없이 legacy order FK 만 쓰는 배포는
--       본 정책이 적용 불가 — 별 migration 으로 정렬 후 적용.
-- -----------------------------------------------------------------------------
