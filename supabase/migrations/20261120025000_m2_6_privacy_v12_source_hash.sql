-- Correct the preset's source snapshot hash to match the v1.2 policy on main.
create or replace function public.cms_admin_set_existing_privacy_v12()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
begin
  perform cms_private.require_cms_super_admin();
  return public.cms_admin_set_form_privacy_policy('/privacy','1.2','https://weareailabs.com/privacy','63fe85493b1eecbd46c2451a1ccabb06f51d583d4018c87e82ff9ae480f46237',true);
end $$;
revoke all on function public.cms_admin_set_existing_privacy_v12() from public,anon;
grant execute on function public.cms_admin_set_existing_privacy_v12() to authenticated;
