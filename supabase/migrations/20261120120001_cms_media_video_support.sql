-- Extend the existing CMS Media Library with carefully limited MP4/WebM support.
alter table public.cms_media_assets drop constraint if exists cms_media_assets_mime_type_check;
alter table public.cms_media_assets add constraint cms_media_assets_mime_type_check
 check(mime_type in ('image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'));
alter table public.cms_media_assets drop constraint if exists cms_media_assets_file_size_check;
alter table public.cms_media_assets add constraint cms_media_assets_file_size_check check(file_size between 1 and 10485760);
alter table public.cms_media_asset_versions drop constraint if exists cms_media_asset_versions_mime_type_check;
alter table public.cms_media_asset_versions add constraint cms_media_asset_versions_mime_type_check
 check(mime_type in ('image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'));
alter table public.cms_media_asset_versions drop constraint if exists cms_media_asset_versions_file_size_check;
alter table public.cms_media_asset_versions add constraint cms_media_asset_versions_file_size_check check(file_size between 1 and 10485760);
update storage.buckets set allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'] where id in ('cms-media-private','cms-media-public');

create or replace function public.cms_admin_register_media(p_storage_path text,p_file_name text,p_mime_type text,p_file_size bigint,p_width integer,p_height integer,p_alt text default '',p_caption text default '',p_source_url text default '',p_rights_notes text default '',p_tags text[] default '{}',p_replaces uuid default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_id uuid;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if p_storage_path !~ '^[a-f0-9-]{36}/[a-zA-Z0-9._-]{1,180}$' or p_file_name='' or p_file_size not between 1 and 10485760 or p_mime_type not in ('image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm') then raise exception using errcode='22023',message='Invalid media upload metadata'; end if;
 if p_mime_type like 'image/%' and p_file_size>10485760 then raise exception using errcode='22023',message='Images must be 10 MB or smaller'; end if;
 if length(coalesce(p_alt,''))>300 or length(coalesce(p_caption,''))>1000 or length(coalesce(p_rights_notes,''))>2000 or cardinality(coalesce(p_tags,'{}'))>20 then raise exception using errcode='22023',message='Media metadata exceeds its allowed length'; end if;
 insert into public.cms_media_assets(storage_path,file_name,mime_type,file_size,width,height,alt_text,caption,source_url,rights_notes,tags,replaced_asset_id,created_by)
 values(p_storage_path,p_file_name,p_mime_type,p_file_size,p_width,p_height,coalesce(p_alt,''),coalesce(p_caption,''),coalesce(p_source_url,''),coalesce(p_rights_notes,''),coalesce(p_tags,'{}'),p_replaces,v_actor) returning id into v_id;
 return jsonb_build_object('id',v_id);
end $$;
revoke all on function public.cms_admin_register_media(text,text,text,bigint,integer,integer,text,text,text,text,text[],uuid) from public,anon;
grant execute on function public.cms_admin_register_media(text,text,text,bigint,integer,integer,text,text,text,text,text[],uuid) to authenticated;

create or replace function public.cms_admin_replace_media(p_id uuid,p_storage_path text,p_file_name text,p_mime_type text,p_file_size bigint,p_width integer,p_height integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_row public.cms_media_assets%rowtype;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if p_storage_path !~ ('^'||v_actor::text||'/[a-zA-Z0-9._-]{1,180}$') or p_file_name='' or p_file_size not between 1 and 10485760 or p_mime_type not in ('image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm') then raise exception using errcode='22023',message='Invalid replacement upload metadata'; end if;
 select * into v_row from public.cms_media_assets where id=p_id for update;
 if not found then raise exception using errcode='P0002',message='Media asset not found'; end if;
 if v_row.status='archived' then raise exception using errcode='22023',message='Restore this asset before replacing it'; end if;
 if (v_row.mime_type like 'image/%') is distinct from (p_mime_type like 'image/%') then raise exception using errcode='22023',message='Replace an image with an image or a video with a video'; end if;
 insert into public.cms_media_asset_versions(asset_id,storage_path,public_path,file_name,mime_type,file_size,width,height,replaced_by)
 values(v_row.id,v_row.storage_path,v_row.public_path,v_row.file_name,v_row.mime_type,v_row.file_size,v_row.width,v_row.height,v_actor);
 update public.cms_media_assets set storage_path=p_storage_path,file_name=p_file_name,mime_type=p_mime_type,file_size=p_file_size,width=p_width,height=p_height,updated_at=now() where id=p_id returning * into v_row;
 return to_jsonb(v_row);
end $$;
revoke all on function public.cms_admin_replace_media(uuid,text,text,text,bigint,integer,integer) from public,anon;
grant execute on function public.cms_admin_replace_media(uuid,text,text,text,bigint,integer,integer) to authenticated;
