-- Preserve the approved calendar-month schedule explicitly; days remain for compatibility.
alter table public.cms_form_retention_policies
  add column if not exists retention_months integer check(retention_months is null or retention_months between 1 and 1200);

update public.cms_form_retention_policies
set retention_months=12,retention_days=365,updated_at=now()
where policy_key='future-opportunities-12m' and retention_months is distinct from 12;

create or replace function public.cms_admin_register_existing_future_opportunities_retention()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_policy_id uuid; v_result jsonb;
begin
  perform cms_private.require_cms_super_admin();
  select id into v_policy_id from public.cms_form_retention_policies where policy_key='future-opportunities-12m';
  v_result:=public.cms_admin_save_form_retention_policy(v_policy_id,'future-opportunities-12m','Separately opted-in future opportunities','Separately opted-in future opportunities; renew permission after 12 months from opt-in.',365,'eliv8Lyf',true);
  update public.cms_form_retention_policies set retention_months=12,retention_days=365,updated_at=now() where id=(v_result->>'id')::uuid;
  return v_result||jsonb_build_object('retention_months',12);
end $$;
revoke all on function public.cms_admin_register_existing_future_opportunities_retention() from public,anon;
grant execute on function public.cms_admin_register_existing_future_opportunities_retention() to authenticated;
