-- P0: 맞춤의뢰 주문방 — disputes insert 를 학생·멘토(주문 당사자)로 제한.
-- 선행: 004_p0_cash_disputes_admin_draft.sql (disputes, custom_request_orders)
-- 기본 004 `dispute_ins` 는 student_id = auth.uid() 만 허용 → 멘토 신청 불가. 본 정책으로 교체.

drop policy if exists "dispute_ins" on public.disputes;
create policy "dispute_ins" on public.disputes
  for insert to authenticated
  with check (
    (select auth.uid()) in (student_id, mentor_id)
    and custom_request_order_id is not null
    and exists (
      select 1
      from public.custom_request_orders o
      where o.id = custom_request_order_id
        and o.student_id = student_id
        and o.mentor_id = mentor_id
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
