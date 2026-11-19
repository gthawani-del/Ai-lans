-- M2.5 follow-up: allow only rights-approved CMS library assets in shared SEO metadata.
create or replace function cms_private.validate_cms_page_seo(
  p_page_id uuid, p_page_title text, p_template_id text, p_seo jsonb
)
returns text
language plpgsql
set search_path = pg_catalog, public, cms_private
as $$
declare
  v_page public.cms_pages%rowtype;
  v_title text;
  v_description text;
  v_canonical text;
  v_indexable boolean;
  v_references jsonb;
  v_structured_type text;
  v_author text;
  v_media_id uuid;
begin
  if jsonb_typeof(coalesce(p_seo,'{}'::jsonb))<>'object' then return 'SEO settings must be an object.'; end if;
  if (p_seo-array['seo_title','meta_description','canonical_path','indexable','follow_links','og_title','og_description','og_image_asset_id','og_image_url','social_image_alt','og_type','locale','structured_data_type','author_name','references'])<>'{}'::jsonb then
    return 'SEO settings contain an unsupported field.';
  end if;
  select * into v_page from public.cms_pages where id=p_page_id;
  if not found then return 'Page not found.'; end if;

  v_title:=trim(coalesce(nullif(p_seo->>'seo_title',''),p_page_title));
  v_description:=trim(coalesce(p_seo->>'meta_description',''));
  v_canonical:=trim(coalesce(nullif(p_seo->>'canonical_path',''),'/'||v_page.slug));
  v_indexable:=coalesce((p_seo->>'indexable')::boolean,false);
  v_references:=coalesce(p_seo->'references','[]'::jsonb);
  v_structured_type:=coalesce(p_seo->>'structured_data_type','WebPage');
  v_author:=trim(coalesce(p_seo->>'author_name',''));

  if jsonb_typeof(p_seo->'indexable') not in ('boolean','null') or jsonb_typeof(p_seo->'follow_links') not in ('boolean','null') then
    return 'Indexing and link-follow settings must be boolean values.';
  end if;
  if char_length(v_title)>160 or char_length(v_description)>320 then return 'SEO title or description exceeds its field limit.'; end if;
  if v_indexable and (v_title='' or v_description='') then return 'An indexable page needs an SEO title and meta description.'; end if;
  if v_indexable and (v_title~* '\{\{[^}]+\}\}|lorem ipsum|\m(tbd|todo|placeholder)\M' or v_description~* '\{\{[^}]+\}\}|lorem ipsum|\m(tbd|todo|placeholder)\M') then
    return 'Replace placeholder text before making this page indexable.';
  end if;
  if v_canonical !~ '^/[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$' then
    return 'Canonical path must be a lowercase path on weareailabs.com.';
  end if;
  if coalesce(p_seo->>'og_image_asset_id','brand_home') not in ('brand_home','brand_volunteer','workshop_mvp','workshop_problem') then
    if coalesce(p_seo->>'og_image_asset_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return 'Choose an approved social image.'; end if;
    v_media_id := (p_seo->>'og_image_asset_id')::uuid;
    if not exists(select 1 from public.cms_media_assets m where m.id=v_media_id and m.status='approved' and m.public_path is not null and p_seo->>'og_image_url'='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/cms-media-public/'||m.public_path) then return 'Choose an approved media library image.'; end if;
  end if;
  if char_length(coalesce(p_seo->>'social_image_alt',''))>300 then return 'Social image alt text is too long.'; end if;
  if coalesce(p_seo->>'locale','en-IN') !~ '^[a-z]{2}(-[A-Z]{2})?$' then return 'Locale must use a language or language-region value such as en-IN.'; end if;
  if coalesce(p_seo->>'og_type','website') not in ('website','article') then return 'Unsupported Open Graph type.'; end if;
  if v_structured_type not in ('WebPage','Article') then return 'Unsupported structured-data type.'; end if;
  if v_structured_type='Article' and (p_template_id<>'editorial_article' or v_author='') then return 'Article structured data requires an editorial template and author.'; end if;
  if jsonb_typeof(v_references)<>'array' then return 'References must be an array of at most 20 HTTPS URLs.'; end if;
  if jsonb_array_length(v_references)>20 then return 'References must be an array of at most 20 HTTPS URLs.'; end if;
  if exists(select 1 from jsonb_array_elements_text(v_references) ref where ref !~* '^https://[^[:space:]/?#]+(:[0-9]+)?([/?#][^[:space:]]*)?$') then
    return 'Each reference must be a valid HTTPS URL.';
  end if;
  if v_indexable and exists(
    select 1 from public.cms_pages other
    join public.cms_page_revisions published on published.id=other.published_revision_id
    where other.id<>p_page_id and other.status='published'
      and coalesce((published.seo->>'indexable')::boolean,false)
      and lower(trim(coalesce(nullif(published.seo->>'seo_title',''),other.title)))=lower(v_title)
  ) then return 'Another published indexable CMS page already uses this SEO title.'; end if;
  return null;
exception when invalid_text_representation then
  return 'Indexing settings must use valid boolean values.';
end;
$$;
revoke all on function cms_private.validate_cms_page_seo(uuid,text,text,jsonb) from public,anon,authenticated;

create or replace function public.cms_admin_save_page_draft(
  p_page_id uuid,p_expected_revision integer,p_title text,p_document jsonb,p_seo jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare
  v_actor uuid; v_page public.cms_pages%rowtype; v_current public.cms_page_revisions%rowtype;
  v_allowed jsonb; v_section jsonb; v_props jsonb; v_type text; v_id text; v_href text; v_image text;
  v_count integer; v_distinct_count integer; v_revision_id uuid:=gen_random_uuid(); v_revision_number integer;
  v_title text:=trim(coalesce(p_title,'')); v_seo jsonb; v_error text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002',message='Page not found'; end if;
  if v_page.status not in ('draft','published') then raise exception using errcode='22023',message='Only draft or published pages can be edited'; end if;
  if char_length(v_title)<2 or char_length(v_title)>160 then raise exception using errcode='22023',message='Title must be 2 to 160 characters'; end if;
  if jsonb_typeof(p_document)<>'object' or coalesce((p_document->>'version')::integer,0)<>1
    or jsonb_typeof(p_document->'sections')<>'array' or jsonb_array_length(p_document->'sections')>50 then
    raise exception using errcode='22023',message='Page content must use a supported version and contain at most 50 sections';
  end if;
  select * into v_current from public.cms_page_revisions where id=coalesce(v_page.draft_revision_id,v_page.published_revision_id);
  if not found then raise exception using errcode='P0002',message='Page revision not found'; end if;
  if v_current.revision_number<>p_expected_revision then raise exception using errcode='40001',message='This page changed after you opened it. Close and reopen it before saving.'; end if;
  select allowed_sections into v_allowed from public.cms_template_registry where template_id=v_page.template_id and is_active=true;
  if v_allowed is null then raise exception using errcode='22023',message='This page template is no longer available'; end if;
  select count(*),count(distinct value->>'id') into v_count,v_distinct_count from jsonb_array_elements(p_document->'sections');
  if v_count<>v_distinct_count then raise exception using errcode='22023',message='Each section needs a unique ID'; end if;
  for v_section in select value from jsonb_array_elements(p_document->'sections') loop
    if jsonb_typeof(v_section)<>'object' then raise exception using errcode='22023',message='Each section must be an object'; end if;
    v_type:=v_section->>'type'; v_id:=v_section->>'id'; v_props:=v_section->'props';
    if v_type not in ('hero','rich_text','image_text','cta','faq') or not (v_allowed ? v_type)
      or v_id is null or char_length(v_id)<1 or char_length(v_id)>100
      or jsonb_typeof(v_props)<>'object' or octet_length(v_props::text)>20000 then
      raise exception using errcode='22023',message='This section contains unsupported content';
    end if;
    if jsonb_typeof(v_section->'visible') not in ('boolean','null') or jsonb_typeof(v_section->'order') not in ('number','null') then
      raise exception using errcode='22023',message='Section visibility or order is invalid';
    end if;
    if (v_type='hero' and v_props-array['eyebrow','heading','body','cta_label','cta_href']<>'{}'::jsonb)
      or (v_type='rich_text' and v_props-array['heading','body']<>'{}'::jsonb)
      or (v_type='image_text' and v_props-array['heading','body','image_url','alt']<>'{}'::jsonb)
      or (v_type='cta' and v_props-array['heading','body','label','href']<>'{}'::jsonb)
      or (v_type='faq' and v_props-array['heading','items']<>'{}'::jsonb) then
      raise exception using errcode='22023',message='A section contains fields not supported by its type';
    end if;
    if v_type='faq' and (jsonb_typeof(coalesce(v_props->'items','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(v_props->'items','[]'::jsonb))>25) then
      raise exception using errcode='22023',message='FAQ sections can contain at most 25 question and answer pairs';
    end if;
    if v_type in ('hero','cta') then
      v_href:=coalesce(v_props->>'cta_href',v_props->>'href','');
      if v_href<>'' and not ((left(v_href,1)='/' and left(v_href,2)<>'//' and v_href !~ '[[:space:]]') or v_href~'^https://[^[:space:]/?#]+(:[0-9]+)?([/?#][^[:space:]]*)?$') then
        raise exception using errcode='22023',message='Buttons must use a site path or HTTPS URL';
      end if;
    end if;
    if v_type='image_text' then
      v_image:=coalesce(v_props->>'image_url','');
      if v_image<>'' and (left(v_image,1)<>'/' or left(v_image,2)='//' or v_image~'[[:space:]]|\.\.') then
        raise exception using errcode='22023',message='Use an approved site asset path beginning with one slash';
      end if;
    end if;
  end loop;
  v_seo:=jsonb_build_object(
    'seo_title',coalesce(nullif(trim(p_seo->>'seo_title'),''),v_page.title),
    'meta_description',coalesce(trim(p_seo->>'meta_description'),''),
    'canonical_path',coalesce(nullif(trim(p_seo->>'canonical_path'),''),'/'||v_page.slug),
    'indexable',coalesce((p_seo->>'indexable')::boolean,false),
    'follow_links',coalesce((p_seo->>'follow_links')::boolean,true),
    'og_title',coalesce(trim(p_seo->>'og_title'),''),
    'og_description',coalesce(trim(p_seo->>'og_description'),''),
    'og_image_asset_id',coalesce(nullif(p_seo->>'og_image_asset_id',''),'brand_home'),
    'og_image_url',coalesce(nullif(trim(p_seo->>'og_image_url'),''),''),
    'social_image_alt',coalesce(trim(p_seo->>'social_image_alt'),''),
    'og_type',coalesce(p_seo->>'og_type','website'),
    'locale',coalesce(p_seo->>'locale','en-IN'),
    'structured_data_type',coalesce(p_seo->>'structured_data_type','WebPage'),
    'author_name',coalesce(trim(p_seo->>'author_name'),''),
    'references',coalesce(p_seo->'references','[]'::jsonb)
  );
  v_error:=cms_private.validate_cms_page_seo(p_page_id,v_title,v_page.template_id,v_seo);
  if v_error is not null then raise exception using errcode='22023',message=v_error; end if;
  select coalesce(max(revision_number),0)+1 into v_revision_number from public.cms_page_revisions where page_id=p_page_id;
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_revision_id,p_page_id,v_revision_number,p_document||jsonb_build_object('page_title',v_title),v_seo,'Updated page content and SEO',v_actor);
  update public.cms_pages set title=v_title,draft_revision_id=v_revision_id,updated_by=v_actor,updated_at=now() where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_draft_saved',p_page_id,jsonb_build_object('revision_number',v_revision_number,'section_count',jsonb_array_length(p_document->'sections'),'seo_changed',true,'indexable',v_seo->'indexable'));
  return jsonb_build_object('page',jsonb_build_object('id',p_page_id,'slug',v_page.slug,'title',v_title,'status',v_page.status),
    'revision',jsonb_build_object('id',v_revision_id,'revision_number',v_revision_number,'document',p_document,'seo',v_seo));
end;
$$;
revoke all on function public.cms_admin_save_page_draft(uuid,integer,text,jsonb,jsonb) from public,anon;
grant execute on function public.cms_admin_save_page_draft(uuid,integer,text,jsonb,jsonb) to authenticated;


-- Prevent archiving a media file that any saved page revision still references.
create or replace function public.cms_admin_update_media(p_id uuid,p_alt text,p_caption text,p_source_url text,p_rights_notes text,p_tags text[],p_status text default null,p_public_path text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_row public.cms_media_assets%rowtype;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if p_status is not null and p_status not in ('draft','approved','archived') then raise exception using errcode='22023',message='Invalid media status'; end if;
 select * into v_row from public.cms_media_assets where id=p_id for update;
 if not found then raise exception using errcode='P0002',message='Media asset not found'; end if;
 if p_status='archived' and exists(
   select 1 from public.cms_page_revisions r
   where r.seo::text like '%'||p_id::text||'%'
      or (v_row.public_path is not null and (r.document::text like '%'||v_row.public_path||'%' or r.seo::text like '%'||v_row.public_path||'%'))
      or r.document::text like '%'||v_row.storage_path||'%'
 ) then raise exception using errcode='22023',message='This media asset is still referenced by a page revision. Replace the page usage before archiving it.'; end if;
 if p_status='approved' and (coalesce(trim(p_rights_notes),'')='' or coalesce(trim(p_alt),'')='' or p_public_path is null) then raise exception using errcode='22023',message='Approved media needs rights notes, alt text and a public asset path'; end if;
 update public.cms_media_assets set alt_text=coalesce(p_alt,''),caption=coalesce(p_caption,''),source_url=coalesce(p_source_url,''),rights_notes=coalesce(p_rights_notes,''),tags=coalesce(p_tags,'{}'),status=coalesce(p_status,status),public_path=case when p_status='approved' then p_public_path when p_status='archived' then null else public_path end,approved_by=case when p_status='approved' then v_actor else approved_by end,approved_at=case when p_status='approved' then now() else approved_at end,updated_at=now() where id=p_id returning * into v_row;
 return to_jsonb(v_row);
end $$;
revoke all on function public.cms_admin_update_media(uuid,text,text,text,text,text[],text,text) from public,anon;
grant execute on function public.cms_admin_update_media(uuid,text,text,text,text,text[],text,text) to authenticated;


-- Preserve the stable asset ID and public URL when an administrator replaces a file.
create table if not exists public.cms_media_asset_versions (
 id uuid primary key default gen_random_uuid(),
 asset_id uuid not null references public.cms_media_assets(id),
 storage_path text not null,
 public_path text,
 file_name text not null,
 mime_type text not null,
 file_size bigint not null,
 width integer,
 height integer,
 replaced_at timestamptz not null default now(),
 replaced_by uuid not null references auth.users(id)
);
alter table public.cms_media_asset_versions enable row level security;
revoke all on public.cms_media_asset_versions from public,anon,authenticated;

create or replace function public.cms_admin_replace_media(p_id uuid,p_storage_path text,p_file_name text,p_mime_type text,p_file_size bigint,p_width integer,p_height integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_row public.cms_media_assets%rowtype;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if p_storage_path !~ ('^'||v_actor::text||'/[a-zA-Z0-9._-]{1,180}$') or p_file_name='' or p_file_size not between 1 and 10485760 or p_mime_type not in ('image/jpeg','image/png','image/webp','image/avif') then raise exception using errcode='22023',message='Invalid replacement upload metadata'; end if;
 select * into v_row from public.cms_media_assets where id=p_id for update;
 if not found then raise exception using errcode='P0002',message='Media asset not found'; end if;
 if v_row.status='archived' then raise exception using errcode='22023',message='Restore this asset before replacing its file'; end if;
 insert into public.cms_media_asset_versions(asset_id,storage_path,public_path,file_name,mime_type,file_size,width,height,replaced_by)
 values(v_row.id,v_row.storage_path,v_row.public_path,v_row.file_name,v_row.mime_type,v_row.file_size,v_row.width,v_row.height,v_actor);
 update public.cms_media_assets set storage_path=p_storage_path,file_name=p_file_name,mime_type=p_mime_type,file_size=p_file_size,width=p_width,height=p_height,updated_at=now() where id=p_id returning * into v_row;
 return to_jsonb(v_row);
end $$;
revoke all on function public.cms_admin_replace_media(uuid,text,text,text,bigint,integer,integer) from public,anon;
grant execute on function public.cms_admin_replace_media(uuid,text,text,text,bigint,integer,integer) to authenticated;
