-- Job 1-A: homepage editing on the existing CMS revision, permission and audit model.
-- The internal CMS row stays draft-only and is never exposed as a public CMS route.
alter table public.cms_audit_events drop constraint if exists cms_audit_events_action_check;
alter table public.cms_audit_events add constraint cms_audit_events_action_check check (action in (
  'page_created','page_duplicated','page_previewed','page_draft_saved','page_published','page_archived','page_revision_restored',
  'homepage_draft_saved','homepage_published','homepage_revision_restored'
));

create unique index if not exists cms_single_homepage_system_page on public.cms_pages(slug) where slug='__homepage';

create or replace function public.cms_admin_get_homepage(p_document jsonb,p_seo jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; p public.cms_pages%rowtype; r public.cms_page_revisions%rowtype;
begin
 a:=cms_private.require_cms_super_admin();
 select * into p from public.cms_pages where slug='__homepage' for update;
 if not found then
  insert into public.cms_pages(slug,title,template_id,template_version,status,created_by,updated_by)
  values('__homepage','Home Page','landing_campaign',1,'draft',a,a) returning * into p;
  insert into public.cms_page_revisions(page_id,revision_number,document,seo,change_summary,created_by)
  values(p.id,1,p_document,p_seo,'Imported current live homepage as the initial draft',a) returning * into r;
  update public.cms_pages set draft_revision_id=r.id where id=p.id returning * into p;
 end if;
 select * into r from public.cms_page_revisions where id=coalesce(p.draft_revision_id,p.published_revision_id);
 return jsonb_build_object('page',jsonb_build_object('id',p.id,'title',p.title,'status',case when p.published_revision_id is null then 'draft' else 'published' end,'updated_at',p.updated_at),
  'draft_revision',case when p.draft_revision_id is null then null else (select to_jsonb(x) from public.cms_page_revisions x where x.id=p.draft_revision_id) end,
  'published_revision',case when p.published_revision_id is null then null else (select to_jsonb(x) from public.cms_page_revisions x where x.id=p.published_revision_id) end,
  'revision',to_jsonb(r));
end $$;

create or replace function public.cms_admin_save_homepage_draft(p_expected_revision integer,p_document jsonb,p_seo jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; p public.cms_pages%rowtype; cur public.cms_page_revisions%rowtype; next_no integer; new_id uuid:=gen_random_uuid(); s jsonb; src text; aid uuid; path text; title text; descr text; canon text;
begin
 a:=cms_private.require_cms_super_admin();
 select * into p from public.cms_pages where slug='__homepage' for update;
 if not found then raise exception using errcode='P0002',message='Open Home Page once to initialize its CMS draft'; end if;
 select * into cur from public.cms_page_revisions where id=p.draft_revision_id;
 if cur.revision_number<>p_expected_revision then raise exception using errcode='40001',message='Homepage changed after you opened it. Refresh before saving.'; end if;
 if jsonb_typeof(p_document)<>'object' or coalesce((p_document->>'version')::integer,0)<>1 or jsonb_typeof(p_document->'homepage')<>'object' or octet_length(p_document::text)>250000 then raise exception using errcode='22023',message='Homepage content is invalid or too large'; end if;
 if jsonb_typeof(p_seo)<>'object' or (p_seo-array['seo_title','meta_description','canonical_path','indexable','follow_links','og_title','og_description','og_image_asset_id','og_image_url','social_image_alt','og_type','locale','structured_data_type'])<>'{}'::jsonb then raise exception using errcode='22023',message='Homepage SEO contains unsupported fields'; end if;
 title:=trim(coalesce(p_seo->>'seo_title','')); descr:=trim(coalesce(p_seo->>'meta_description','')); canon:=coalesce(p_seo->>'canonical_path','/');
 if length(title)<1 or length(title)>160 or length(descr)<1 or length(descr)>320 or canon<>'/' then raise exception using errcode='22023',message='Add a page title and description; the homepage canonical must be /'; end if;
 if jsonb_typeof(p_seo->'indexable')<>'boolean' or jsonb_typeof(p_seo->'follow_links') not in ('boolean','null') then raise exception using errcode='22023',message='Index and follow controls must be boolean'; end if;
 if coalesce(p_seo->>'og_type','website')<>'website' or coalesce(p_seo->>'structured_data_type','WebPage')<>'WebPage' then raise exception using errcode='22023',message='Homepage structured data must use WebPage'; end if;
 src:=p_document#>>'{homepage,hero,source,type}';
 if src not in ('image','video','youtube') then raise exception using errcode='22023',message='Choose an image, uploaded video or YouTube URL for the hero'; end if;
 if src in ('image','video') then
   begin aid:=(p_document#>>'{homepage,hero,source,asset_id}')::uuid; exception when others then aid:=null; end;
   if src='image' and aid is null and p_document#>>'{homepage,hero,source,url}'='/images/ai-lab/workshop-teal.webp' then null;
   else
    if aid is null then raise exception using errcode='22023',message='Choose an approved media asset'; end if;
    select public_path into path from public.cms_media_assets where id=aid and status='approved' and public_path is not null and ((src='image' and mime_type like 'image/%') or (src='video' and mime_type in ('video/mp4','video/webm')));
    if path is null or p_document#>>'{homepage,hero,source,url}' <> 'https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/cms-media-public/'||path then raise exception using errcode='22023',message='Hero media must be approved in the Media Library'; end if;
   end if;
   if src='video' then
     begin aid:=(p_document#>>'{homepage,hero,source,poster_asset_id}')::uuid; exception when others then aid:=null; end;
     if aid is null and coalesce(p_document#>>'{homepage,hero,source,poster_url}','')<>'/images/ai-lab/workshop-teal.webp' then raise exception using errcode='22023',message='Choose an approved video poster image'; end if;
     if aid is not null and not exists(select 1 from public.cms_media_assets where id=aid and status='approved' and mime_type like 'image/%' and public_path is not null and p_document#>>'{homepage,hero,source,poster_url}'='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/cms-media-public/'||public_path) then raise exception using errcode='22023',message='Choose an approved video poster image'; end if;
   end if;
 elsif src='youtube' and coalesce(p_document#>>'{homepage,hero,source,video_id}','') !~ '^[A-Za-z0-9_-]{11}$' then raise exception using errcode='22023',message='Enter a valid YouTube video URL';
 end if;
 if src='youtube' then
   begin aid:=(p_document#>>'{homepage,hero,source,poster_asset_id}')::uuid; exception when others then aid:=null; end;
   if aid is null and coalesce(p_document#>>'{homepage,hero,source,poster_url}','') not in ('','/images/ai-lab/workshop-teal.webp') then raise exception using errcode='22023',message='Choose an approved YouTube poster image'; end if;
   if aid is not null and not exists(select 1 from public.cms_media_assets where id=aid and status='approved' and mime_type like 'image/%' and public_path is not null and p_document#>>'{homepage,hero,source,poster_url}'='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/cms-media-public/'||public_path) then raise exception using errcode='22023',message='Choose an approved YouTube poster image'; end if;
 end if;
 if coalesce(p_seo->>'og_image_asset_id','brand_home') !~* '^(brand_home|[0-9a-f-]{36})$' then raise exception using errcode='22023',message='Choose an approved social image'; end if;
 if coalesce(p_seo->>'og_image_asset_id','brand_home')<>'brand_home' then
   begin aid:=(p_seo->>'og_image_asset_id')::uuid; exception when others then raise exception using errcode='22023',message='Choose an approved social image'; end;
   select public_path into path from public.cms_media_assets where id=aid and status='approved' and mime_type like 'image/%';
   if path is null or p_seo->>'og_image_url'<>'https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/cms-media-public/'||path then raise exception using errcode='22023',message='Choose an approved social image'; end if;
 end if;
 for s in select value from jsonb_array_elements(coalesce(p_document#>'{homepage,faqs}','[]'::jsonb)) loop
   if length(coalesce(s->>'question',''))>240 or length(coalesce(s->>'answer',''))>2000 then raise exception using errcode='22023',message='FAQ content exceeds its field limit'; end if;
 end loop;
 select coalesce(max(revision_number),0)+1 into next_no from public.cms_page_revisions where page_id=p.id;
 insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by) values(new_id,p.id,next_no,p_document,p_seo,'Saved homepage content and SEO draft',a);
 update public.cms_pages set draft_revision_id=new_id,updated_by=a,updated_at=now() where id=p.id;
 insert into public.cms_audit_events(actor_id,action,page_id,details) values(a,'homepage_draft_saved',p.id,jsonb_build_object('revision_number',next_no));
 return jsonb_build_object('revision_id',new_id,'revision_number',next_no);
end $$;

create or replace function public.cms_admin_publish_homepage_draft(p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; p public.cms_pages%rowtype; r public.cms_page_revisions%rowtype; n integer; id uuid:=gen_random_uuid();
begin
 a:=cms_private.require_cms_super_admin(); select * into p from public.cms_pages where slug='__homepage' for update;
 if not found then raise exception using errcode='P0002',message='Homepage draft not found'; end if;
 select * into r from public.cms_page_revisions where id=p.draft_revision_id;
 if not found or r.revision_number<>p_expected_revision then raise exception using errcode='40001',message='Homepage draft changed. Refresh and retry.'; end if;
 if p.published_revision_id=p.draft_revision_id then raise exception using errcode='22023',message='There are no unpublished homepage changes'; end if;
 if coalesce((r.seo->>'indexable')::boolean,false) and (coalesce(r.seo->>'seo_title','')='' or coalesce(r.seo->>'meta_description','')='') then raise exception using errcode='22023',message='Indexable homepage needs a title and description'; end if;
 select coalesce(max(revision_number),0)+1 into n from public.cms_page_revisions where page_id=p.id;
 insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by) values(id,p.id,n,r.document,r.seo,'Published homepage snapshot',a);
 update public.cms_pages set published_revision_id=id,draft_revision_id=id,status='draft',updated_by=a,updated_at=now() where id=p.id;
 insert into public.cms_audit_events(actor_id,action,page_id,details) values(a,'homepage_published',p.id,jsonb_build_object('revision_number',n));
 return jsonb_build_object('revision_number',n,'published',true);
end $$;

create or replace function public.cms_admin_list_homepage_revisions()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; p uuid; outp jsonb;
begin a:=cms_private.require_cms_super_admin(); select id into p from public.cms_pages where slug='__homepage';
 if p is null then return '[]'::jsonb; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'revision_number',r.revision_number,'change_summary',r.change_summary,'created_at',r.created_at,'is_draft',r.id=c.draft_revision_id,'is_published',r.id=c.published_revision_id) order by r.revision_number desc),'[]'::jsonb) into outp from public.cms_pages c join public.cms_page_revisions r on r.page_id=c.id where c.id=p;
 return outp; end $$;

create or replace function public.cms_admin_restore_homepage_revision(p_revision_id uuid,p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; p public.cms_pages%rowtype; cur public.cms_page_revisions%rowtype; src public.cms_page_revisions%rowtype; n integer; id uuid:=gen_random_uuid();
begin a:=cms_private.require_cms_super_admin(); select * into p from public.cms_pages where slug='__homepage' for update;
 if not found then raise exception using errcode='P0002',message='Homepage not found'; end if;
 select * into cur from public.cms_page_revisions where id=p.draft_revision_id;
 if cur.revision_number<>p_expected_revision then raise exception using errcode='40001',message='Homepage draft changed. Refresh history and retry.'; end if;
 select * into src from public.cms_page_revisions where id=p_revision_id and page_id=p.id;
 if not found then raise exception using errcode='P0002',message='Revision not found'; end if;
 select coalesce(max(revision_number),0)+1 into n from public.cms_page_revisions where page_id=p.id;
 insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by) values(id,p.id,n,src.document,src.seo,'Restored homepage revision '||src.revision_number,a);
 update public.cms_pages set draft_revision_id=id,updated_by=a,updated_at=now() where id=p.id;
 insert into public.cms_audit_events(actor_id,action,page_id,details) values(a,'homepage_revision_restored',p.id,jsonb_build_object('revision_number',n));
 return jsonb_build_object('revision_number',n); end $$;

create or replace function public.cms_public_get_homepage()
returns jsonb language sql security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('revision_number',r.revision_number,'document',r.document,'seo',r.seo,'updated_at',r.created_at)
 from public.cms_pages p join public.cms_page_revisions r on r.id=p.published_revision_id where p.slug='__homepage' and p.status='draft'
$$;

-- Hide the internal revision record from the generic Page Studio listing.
create or replace function public.cms_admin_list_pages(p_status text default null,p_template_id text default null,p_search text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; outp jsonb; q text:=left(trim(coalesce(p_search,'')),120);
begin a:=cms_private.require_cms_super_admin();
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'slug',p.slug,'title',p.title,'template_id',p.template_id,'template_name',t.name,'template_protected',t.is_protected,'status',p.status,'created_at',p.created_at,'updated_at',p.updated_at,'revision_number',coalesce(dr.revision_number,pr.revision_number,0),'has_draft',p.draft_revision_id is not null,'has_published',p.published_revision_id is not null,'has_unpublished_changes',p.draft_revision_id is not null and p.draft_revision_id is distinct from p.published_revision_id,'published_revision_number',pr.revision_number) order by p.updated_at desc),'[]'::jsonb) into outp
 from public.cms_pages p join public.cms_template_registry t on t.template_id=p.template_id left join public.cms_page_revisions dr on dr.id=p.draft_revision_id left join public.cms_page_revisions pr on pr.id=p.published_revision_id
 where p.slug<>'__homepage' and (p_status is null or p.status=p_status) and (p_template_id is null or p.template_id=p_template_id) and (q='' or position(lower(q) in lower(p.title))>0 or position(lower(q) in lower(p.slug))>0);
 return outp; end $$;

revoke all on function public.cms_admin_get_homepage(jsonb,jsonb),public.cms_admin_save_homepage_draft(integer,jsonb,jsonb),public.cms_admin_publish_homepage_draft(integer),public.cms_admin_list_homepage_revisions(),public.cms_admin_restore_homepage_revision(uuid,integer) from public,anon;
grant execute on function public.cms_admin_get_homepage(jsonb,jsonb),public.cms_admin_save_homepage_draft(integer,jsonb,jsonb),public.cms_admin_publish_homepage_draft(integer),public.cms_admin_list_homepage_revisions(),public.cms_admin_restore_homepage_revision(uuid,integer) to authenticated;
revoke all on function public.cms_public_get_homepage() from public;
grant execute on function public.cms_public_get_homepage() to anon,authenticated;
