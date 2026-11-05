-- M7: buyer read models for requests (B-12) and evening deals (B-13).

create or replace function public.my_requests() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'vendor_id', q.vendor_id, 'vendor_name', v.display_name, 'society_name', s.name,
      'item_id', q.item_id, 'item_name', coalesce(i.name, q.free_text), 'qty', q.qty, 'note', q.note,
      'for_date', q.for_date, 'status', q.status, 'created_at', q.created_at, 'answered_at', q.answered_at
    ) order by q.for_date desc, q.created_at desc), '[]'::jsonb)
  from public.requests q
  join public.vendors v on v.user_id = q.vendor_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
  where q.buyer_id = auth.uid() and q.status <> 'cancelled' and q.for_date >= public.ist_today() - 14
$$;

-- Deals sent today by vendors I follow, with where each vendor is now (B-13).
create or replace function public.my_deals_today() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x order by x->>'sent_at' desc), '[]'::jsonb) from (
    select distinct on (d.vendor_id) jsonb_build_object(
      'vendor_id', d.vendor_id, 'vendor_name', v.display_name, 'photo_path', v.photo_path, 'sent_at', d.created_at,
      'society_id', f.society_id,
      'today', (select to_jsonb(t) from public.v_vendor_today(f.society_id) t where t.vendor_id = d.vendor_id limit 1),
      'items', (select coalesce(jsonb_agg(jsonb_build_object('item_id', mi.item_id, 'name', i.name, 'price', mi.price,
                  'unit', mi.unit, 'deal_price', mi.deal_price, 'sold_out', mi.is_sold_out) order by mi.sort), '[]'::jsonb)
                from public.daily_menus m join public.menu_items mi on mi.menu_id = m.id join public.items i on i.id = mi.item_id
                where m.vendor_id = d.vendor_id and m.date = d.date and mi.deal_price is not null)
    ) as x
    from public.deals d
    join public.follows f on f.vendor_id = d.vendor_id and f.buyer_id = auth.uid()
    join public.vendors v on v.user_id = d.vendor_id and v.status = 'verified'
    where d.date = public.ist_today()
    order by d.vendor_id, f.created_at
  ) s
$$;

-- Has the calling vendor already sent today's deal? (V-11 "already used today")
create or replace function public.my_deal_today() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('sent_at', d.created_at,
    'followers', (select count(*) from public.notifications n where n.type = 'deal' and n.payload->>'deal_id' = d.id::text))
  from public.deals d where d.vendor_id = auth.uid() and d.date = public.ist_today()
$$;

revoke execute on function public.my_requests(), public.my_deals_today(), public.my_deal_today() from anon;
