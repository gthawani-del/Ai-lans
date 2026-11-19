-- M2.5: private uploads and approved public CMS media.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('cms-media-private','cms-media-private',false,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
  ('cms-media-public','cms-media-public',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.cms_media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_path text unique,
  file_name text not null,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','image/avif')),
  file_size bigint not null check(file_size between 1 and 10485760),
  width integer,
  height integer,
  alt_text text not null default '',
  caption text not null default '',
  source_url text not null default '',
  rights_notes text not null default '',
  tags text[] not null default '{}',
  status text not null default 'draft' check(status in ('draft','approved','archived')),
  replaced_asset_id uuid references public.cms_media_assets(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz
);
alter table public.cms_media_assets enable row level security;
revoke all on public.cms_media_assets from anon,authenticated;

drop policy if exists cms_media_private_admin_all on storage.objects;
create policy cms_media_private_admin_all on storage.objects for all to authenticated
using(bucket_id='cms-media-private' and exists(select 1 from public.backoffice_users u where u.user_id=auth.uid() and u.is_active and u.role='super_admin'))
with check(bucket_id='cms-media-private' and exists(select 1 from public.backoffice_users u where u.user_id=auth.uid() and u.is_active and u.role='super_admin'));
drop policy if exists cms_media_public_admin_write on storage.objects;
create policy cms_media_public_admin_write on storage.objects for insert to authenticated
with check(bucket_id='cms-media-public' and exists(select 1 from public.backoffice_users u where u.user_id=auth.uid() and u.is_active and u.role='super_admin'));
drop policy if exists cms_media_public_admin_update on storage.objects;
create policy cms_media_public_admin_update on storage.objects for update to authenticated
using(bucket_id='cms-media-public' and exists(select 1 from public.backoffice_users u where u.user_id=auth.uid() and u.is_active and u.role='super_admin'))
with check(bucket_id='cms-media-public' and exists(select 1 from public.backoffice_users u where u.user_id=auth.uid() and u.is_active and u.role='super_admin'));
drop policy if exists cms_media_public_admin_delete on storage.objects;
create policy cms_media_public_admin_delete on storage.objects for delete to authenticated
using(bucket_id='cms-media-public' and exists(select 1 from public.backoffice_users u where u.user_id=auth.uid() and u.is_active and u.role='super_admin'));

create or replace function public.cms_admin_list_media(p_query text default null,p_status text default null,p_tag text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_rows jsonb;
begin
 v_actor:=cms_private.require_cms_super_admin();
 select coalesce(jsonb_agg(to_jsonb(m)||jsonb_build_object('usage_count',(
   select count(*) from public.cms_page_revisions r where r.document::text like '%'||m.id::text||'%' or r.seo::text like '%'||m.id::text||'%'
 )) order by m.updated_at desc),'[]'::jsonb) into v_rows
 from public.cms_media_assets m
 where (p_status is null or m.status=p_status)
 and (coalesce(trim(p_query),'')='' or m.file_name ilike '%'||trim(p_query)||'%' or m.alt_text ilike '%'||trim(p_query)||'%')
 and (coalesce(trim(p_tag),'')='' or trim(p_tag)=any(m.tags));
 return v_rows;
end $$;
create or replace function public.cms_admin_register_media(p_storage_path text,p_file_name text,p_mime_type text,p_file_size bigint,p_width integer,p_height integer,p_alt text default '',p_caption text default '',p_source_url text default '',p_rights_notes text default '',p_tags text[] default '{}',p_replaces uuid default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_id uuid;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if p_storage_path !~ '^[a-f0-9-]{36}/[a-zA-Z0-9._-]{1,180}$' or p_file_name='' or p_file_size not between 1 and 10485760 or p_mime_type not in ('image/jpeg','image/png','image/webp','image/avif') then raise exception using errcode='22023',message='Invalid media upload metadata'; end if;
 if length(coalesce(p_alt,''))>300 or length(coalesce(p_caption,''))>1000 or length(coalesce(p_rights_notes,''))>2000 or cardinality(coalesce(p_tags,'{}'))>20 then raise exception using errcode='22023',message='Media metadata exceeds its allowed length'; end if;
 insert into public.cms_media_assets(storage_path,file_name,mime_type,file_size,width,height,alt_text,caption,source_url,rights_notes,tags,replaced_asset_id,created_by)
 values(p_storage_path,p_file_name,p_mime_type,p_file_size,p_width,p_height,coalesce(p_alt,''),coalesce(p_caption,''),coalesce(p_source_url,''),coalesce(p_rights_notes,''),coalesce(p_tags,'{}'),p_replaces,v_actor) returning id into v_id;
 return jsonb_build_object('id',v_id);
end $$;
create or replace function public.cms_admin_update_media(p_id uuid,p_alt text,p_caption text,p_source_url text,p_rights_notes text,p_tags text[],p_status text default null,p_public_path text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_row public.cms_media_assets%rowtype;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if p_status is not null and p_status not in ('draft','approved','archived') then raise exception using errcode='22023',message='Invalid media status'; end if;
 if p_status='approved' and (coalesce(trim(p_rights_notes),'')='' or coalesce(trim(p_alt),'')='' or p_public_path is null) then raise exception using errcode='22023',message='Approved media needs rights notes, alt text and a public asset path'; end if;
 update public.cms_media_assets set alt_text=coalesce(p_alt,''),caption=coalesce(p_caption,''),source_url=coalesce(p_source_url,''),rights_notes=coalesce(p_rights_notes,''),tags=coalesce(p_tags,'{}'),status=coalesce(p_status,status),public_path=case when p_status='approved' then p_public_path when p_status='archived' then null else public_path end,approved_by=case when p_status='approved' then v_actor else approved_by end,approved_at=case when p_status='approved' then now() else approved_at end,updated_at=now() where id=p_id returning * into v_row;
 if not found then raise exception using errcode='P0002',message='Media asset not found'; end if;
 return to_jsonb(v_row);
end $$;
revoke all on function public.cms_admin_list_media(text,text,text) from public,anon;
revoke all on function public.cms_admin_register_media(text,text,text,bigint,integer,integer,text,text,text,text,text[],uuid) from public,anon;
revoke all on function public.cms_admin_update_media(uuid,text,text,text,text,text[],text,text) from public,anon;
grant execute on function public.cms_admin_list_media(text,text,text) to authenticated;
grant execute on function public.cms_admin_register_media(text,text,text,bigint,integer,integer,text,text,text,text,text[],uuid) to authenticated;
grant execute on function public.cms_admin_update_media(uuid,text,text,text,text,text[],text,text) to authenticated;
