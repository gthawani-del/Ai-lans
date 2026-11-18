create table if not exists public.site_social_profiles (
  platform text primary key check (platform in ('facebook','youtube','instagram','x','linkedin')),
  handle text not null default '' check (char_length(handle) <= 120),
  profile_url text,
  is_enabled boolean not null default false,
  display_order smallint not null check (display_order between 1 and 5),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_social_profiles_https_url check (profile_url is null or profile_url ~ '^https://')
);

alter table public.site_social_profiles enable row level security;

grant select on public.site_social_profiles to anon, authenticated;
revoke insert, update, delete on public.site_social_profiles from anon, authenticated;

drop policy if exists "Public can read enabled social profiles" on public.site_social_profiles;
create policy "Public can read enabled social profiles"
  on public.site_social_profiles
  for select
  to anon, authenticated
  using (is_enabled = true and profile_url is not null);

insert into public.site_social_profiles (platform, handle, profile_url, is_enabled, display_order)
values
  ('facebook', 'weareailabs', 'https://www.facebook.com/weareailabs', true, 1),
  ('youtube', '@weare_ailabs', 'https://www.youtube.com/@weare_ailabs', true, 2),
  ('instagram', '', null, false, 3),
  ('x', '', null, false, 4),
  ('linkedin', '', null, false, 5)
on conflict (platform) do nothing;
