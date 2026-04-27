-- P0: 학생(의뢰자) 전용 수정 요청 insert, order_events insert(주문 당사자)
-- 선행: 003_p0_custom_request_draft.sql (custom_request_orders, custom_order_revisions, order_events)

-- -----------------------------------------------------------------------------
-- custom_order_revisions: author=본인 + 의뢰자(학생) 당사자만 insert
-- -----------------------------------------------------------------------------
drop policy if exists "crev_ins" on public.custom_order_revisions;
create policy "crev_ins" on public.custom_order_revisions
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.custom_request_orders o
      where o.id = custom_request_order_id
        and (
          o.student_id = (select auth.uid())
          or o.buyer_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid())
        )
    )
  );

-- -----------------------------------------------------------------------------
-- order_events: 당사자 insert(메시지/수정요청 이벤트 기록)
-- -----------------------------------------------------------------------------
drop policy if exists "oev_insert" on public.order_events;
create policy "oev_insert" on public.order_events
  for insert to authenticated
  with check (
    exists (
      select 1 from public.custom_request_orders o
      where
        o.id = custom_request_order_id
        and (
          o.student_id = (select auth.uid())
          or o.mentor_id = (select auth.uid())
          or o.buyer_id = (select auth.uid())
          or o.user_id = (select auth.uid())
          or o.client_id = (select auth.uid())
          or o.author_id = (select auth.uid())
          or o.requester_id = (select auth.uid())
        )
    )
  );
