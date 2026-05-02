-- =============================================================================
-- 036_p1_prelaunch_rls_tightening.sql
-- P1 prelaunch RLS audit — 초안 (SQL Editor에 바로 적용하지 말 것)
-- =============================================================================
-- 목적
--   • custom_order_revisions INSERT: 학생 수정 요청 전용 — 주문 FK + 의뢰자(학생) 측
--     사용자만 insert (007 대비 mentor_id·is_admin 단독 insert 제거).
--   • disputes INSERT: custom_request_order_id·주문 정합·분쟁 row의 student/mentor
--     정합 + 호출자가 주문 당사자 또는 admin (004/008 정렬, 정상 분쟁 신청 유지).
-- 위험도
--   • crev_ins: 낮~중. 스키마가 의뢰자만 student_id 에 넣지 않고 mentor_id 만
--     채우는 비정규 데이터면 insert 거부 가능 — 스테이징에서 검증.
--   • dispute_ins: 중. 스테이징에서 학생·멘토·(선택) admin insert 시뮬 권장.
-- 선행 마이그레이션
--   • 003_p0_custom_request_draft.sql (custom_request_orders, custom_order_revisions, is_admin)
--   • 004_p0_cash_disputes_admin_draft.sql (disputes, is_admin)
--   • 007_p0_custom_order_revisions_and_order_events_rls.sql (crev_ins)
--   • 008_p0_disputes_insert_party_rls.sql (dispute_ins)
-- 금지
--   • 본 파일은 DML 없음 / RLS 비활성화 없음 / GRANT 확대 없음 / DROP TABLE 없음.
-- =============================================================================

alter table if exists public.custom_order_revisions enable row level security;
alter table if exists public.disputes enable row level security;

-- -----------------------------------------------------------------------------
-- 1) custom_order_revisions — INSERT "crev_ins"
--     쌤버십: 학생의 수정 요청만. mentor_id 일치만으로는 insert 불가.
--     관리자 수동 보정은 service_role / 별도 DANGEROUS 스크립트 권장( is_admin insert 없음 ).
--     crev_all_party SELECT 의 mentor/admin 읽기는 본 파일에서 변경하지 않음.
-- -----------------------------------------------------------------------------
drop policy if exists "crev_ins" on public.custom_order_revisions;

create policy "crev_ins" on public.custom_order_revisions
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.custom_request_orders o
      where o.id = custom_request_order_id
        and (
          o.student_id = (select auth.uid())
          or o.buyer_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid())
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 2) disputes — INSERT "dispute_ins"
--     • custom_request_order_id 가 null 이 아니고 public.custom_request_orders.id 와 연결됨.
--     • 분쟁 행의 student_id / mentor_id 가 해당 주문 행과 동일(위조 방지).
--     • 호출자: 분쟁 행 기준 student 또는 mentor 이거나 is_admin(); 주문 상에서는
--       학생 측 후보 열(buyer/client/user/author/requester) 또는 멘토/학생 본인으로
--       당사자임이 입증되어야 함( orderDisputeActions + 008 의도 유지 ).
-- -----------------------------------------------------------------------------
drop policy if exists "dispute_ins" on public.disputes;

create policy "dispute_ins" on public.disputes
  for insert to authenticated
  with check (
    custom_request_order_id is not null
    and (
      (select public.is_admin()) = true
      or (select auth.uid()) in (student_id, mentor_id)
    )
    and exists (
      select 1
      from public.custom_request_orders o
      where o.id = custom_request_order_id
        and o.student_id = student_id
        and o.mentor_id = mentor_id
        and (
          (select public.is_admin()) = true
          or (select auth.uid()) in (o.student_id, o.mentor_id)
          or o.buyer_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid())
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 3) custom_request_orders — UPDATE "cro_update"
--     실제 DROP/CREATE 는 이 파일에서 하지 않음(보류).
--     현재 서버 액션 정상 경로가 인증 클라이언트에서 custom_request_orders 에
--     직접 update 를 수행하므로( orderStudentActions.ts / orderMentorActions.ts ),
--     RLS 를 여기서 좁히면 주문 진행이 깨질 수 있음. 별도 RPC(SECURITY DEFINER)
--     등으로 전환한 뒤 정책 축소를 검토하는 것이 안전.
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
-- 부록: disputes 에 public.order_id (custom_request_orders FK) 만 있는 경우
--       information_schema 로 컬럼 존재를 확인한 뒤 별 policy 를 추가하는 것이 안전.
--       lib/disputes/disputeQueries · orderDisputeActions 의 FK 후보 목록과 맞출 것.
-- -----------------------------------------------------------------------------
