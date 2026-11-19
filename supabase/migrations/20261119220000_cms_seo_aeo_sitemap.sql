-- M2.4: shared SEO/AEO fields on immutable page revisions and live sitemap reads.

alter table public.cms_audit_events
  drop constraint if exists cms_audit_events_action_check;
alter table public.cms_audit_events
  add constraint cms_audit_events_action_check
  check (action in (
    'page_created','page_duplicated','page_previewed','page_draft_saved',
    'page_published','page_archived','page_revision_restored','page_seo_saved'
  ));

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
begin
  if jsonb_typeof(coalesce(p_seo,'{}'::jsonb))<>'object' then return 'SEO settings must be an object.'; end if;
  if (p_seo-array['seo_title','meta_description','canonical_path','indexable','follow_links','og_title','og_description','og_image_asset_id','social_image_alt','og_type','locale','structured_data_type','author_name','references'])<>'{}'::jsonb then
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
    return 'Choose an approved social image.';
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

create or replace function public.cms_admin_publish_page_draft(p_page_id uuid,p_expected_revision integer)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare
  v_actor uuid; v_page public.cms_pages%rowtype; v_revision public.cms_page_revisions%rowtype;
  v_template public.cms_template_registry%rowtype; v_has_content boolean; v_seo_error text;
  v_published_id uuid:=gen_random_uuid(); v_published_number integer;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002',message='Page not found'; end if;
  if v_page.status not in ('draft','published') or v_page.draft_revision_id is null then raise exception using errcode='22023',message='This page has no publishable draft'; end if;
  if v_page.draft_revision_id is not distinct from v_page.published_revision_id then raise exception using errcode='22023',message='There are no unpublished changes to publish'; end if;
  select * into v_revision from public.cms_page_revisions where id=v_page.draft_revision_id;
  if not found then raise exception using errcode='P0002',message='Draft revision not found'; end if;
  if v_revision.revision_number<>p_expected_revision then raise exception using errcode='40001',message='This draft changed after it was opened. Refresh before publishing.'; end if;
  select * into v_template from public.cms_template_registry where template_id=v_page.template_id;
  if v_template.is_protected then raise exception using errcode='42501',message='Protected legal/trust pages cannot be published until a legal approval workflow is available'; end if;
  v_seo_error:=cms_private.validate_cms_page_seo(p_page_id,v_page.title,v_page.template_id,v_revision.seo);
  if v_seo_error is not null then raise exception using errcode='22023',message=v_seo_error; end if;
  select exists(
    select 1 from jsonb_array_elements(v_revision.document->'sections') s
    where coalesce((s->>'visible')::boolean,true) and (
      nullif(trim(coalesce(s->'props'->>'heading','')),'') is not null
      or nullif(trim(coalesce(s->'props'->>'body','')),'') is not null
      or nullif(trim(coalesce(s->'props'->>'question','')),'') is not null
      or nullif(trim(coalesce(s->'props'->>'eyebrow','')),'') is not null
      or nullif(trim(coalesce(s->'props'->>'label','')),'') is not null
      or jsonb_array_length(coalesce(s->'props'->'items','[]'::jsonb))>0
    )
  ) into v_has_content;
  if not v_has_content then raise exception using errcode='22023',message='Add visible page content before publishing'; end if;
  select coalesce(max(revision_number),0)+1 into v_published_number from public.cms_page_revisions where page_id=p_page_id;
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_published_id,p_page_id,v_published_number,v_revision.document||jsonb_build_object('page_title',v_page.title),v_revision.seo,'Published snapshot',v_actor);
  update public.cms_pages set published_revision_id=v_published_id,draft_revision_id=v_published_id,status='published',updated_by=v_actor,updated_at=now() where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_published',p_page_id,jsonb_build_object('revision_id',v_published_id,'revision_number',v_published_number,'slug',v_page.slug));
  return jsonb_build_object('page_id',p_page_id,'slug',v_page.slug,'title',v_page.title,'status','published','revision_number',v_published_number);
end;
$$;
revoke all on function public.cms_admin_publish_page_draft(uuid,integer) from public,anon;
grant execute on function public.cms_admin_publish_page_draft(uuid,integer) to authenticated;

create or replace function public.cms_public_list_sitemap_pages()
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug',p.slug,'canonical_path',coalesce(r.seo->>'canonical_path','/'||p.slug),'last_modified',r.created_at
  ) order by p.slug),'[]'::jsonb)
  from public.cms_pages p
  join public.cms_page_revisions r on r.id=p.published_revision_id
  where p.status='published'
    and coalesce((r.seo->>'indexable')::boolean,false)=true
    and coalesce(r.seo->>'canonical_path','/'||p.slug)='/'||p.slug
    and p.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$';
$$;
revoke all on function public.cms_public_list_sitemap_pages() from public;
grant execute on function public.cms_public_list_sitemap_pages() to anon,authenticated;
