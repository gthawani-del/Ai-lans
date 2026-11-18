alter table public.site_social_profiles
  drop constraint site_social_profiles_platform_check,
  add constraint site_social_profiles_platform_check
    check (platform in ('facebook','youtube','instagram','x','linkedin','whatsapp')),
  drop constraint site_social_profiles_display_order_check,
  add constraint site_social_profiles_display_order_check
    check (display_order between 1 and 6);

insert into public.site_social_profiles (platform, handle, profile_url, is_enabled, display_order)
values ('whatsapp', '', null, false, 6)
on conflict (platform) do nothing;
