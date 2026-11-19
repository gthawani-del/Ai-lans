-- M2.6-E: enable the final two generic draft templates and safe Page Studio references.
-- Public form publishing and submission remain disabled pending the recorded approvals.

create or replace function public.cms_admin_create_form(
  p_template_key text,
  p_name text,
  p_public_title text default null,
  p_handle text default null,
  p_purpose text default ''
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_template public.cms_form_template_registry%rowtype; v_form public.cms_forms%rowtype; v_definition jsonb; v_version public.cms_form_versions%rowtype; v_handle text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if not exists(select 1 from public.cms_form_studio_config where singleton and studio_enabled) then raise exception using errcode='42501',message='Form Studio is disabled'; end if;
  if p_template_key not in ('contact_v1','waitlist_v1','feedback_v1','newsletter_v1','workshop_registration_v1','custom_v1') then raise exception using errcode='22023',message='This form template is not available'; end if;
  select * into v_template from public.cms_form_template_registry where template_key=p_template_key and is_active;
  if not found then raise exception using errcode='22023',message='The selected form template is unavailable'; end if;
  if p_name is null or char_length(trim(p_name)) not between 2 and 160 then raise exception using errcode='22023',message='Form name must be between 2 and 160 characters'; end if;
  v_handle:=lower(trim(coalesce(p_handle,'')));
  if v_handle !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_handle)>120 then raise exception using errcode='22023',message='Form handle must use lowercase letters, numbers and hyphens'; end if;
  if exists(select 1 from public.cms_forms where handle=v_handle) then raise exception using errcode='23505',message='That form handle is already in use'; end if;
  v_definition:=v_template.starter_definition||jsonb_build_object(
    'title',coalesce(nullif(trim(p_public_title),''),v_template.starter_definition->>'title'),
    'description','',
    'fields',coalesce((select jsonb_agg(field.value||jsonb_build_object('id',gen_random_uuid()::text,'order',field.ordinality-1) order by field.ordinality) from jsonb_array_elements(v_template.starter_definition->'fields') with ordinality as field(value,ordinality)),'[]'::jsonb)
  );
  insert into public.cms_forms(handle,name,public_title,template_key,purpose,created_by,updated_by)
  values(v_handle,trim(p_name),coalesce(nullif(trim(p_public_title),''),v_template.starter_definition->>'title'),p_template_key,coalesce(trim(p_purpose),''),v_actor,v_actor) returning * into v_form;
  insert into public.cms_form_versions(form_id,version_no,schema_version,definition_json,validation_hash,created_by)
  values(v_form.id,1,1,v_definition,md5(v_definition::text),v_actor) returning * into v_version;
  update public.cms_forms set draft_version_id=v_version.id where id=v_form.id returning * into v_form;
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details) values(v_actor,v_form.id,v_version.id,'draft_created',jsonb_build_object('template_key',p_template_key));
  return jsonb_build_object('form',jsonb_build_object('id',v_form.id,'handle',v_form.handle,'name',v_form.name,'public_title',v_form.public_title,'template_key',v_form.template_key,'status',v_form.lifecycle_status,'purpose',v_form.purpose,'draft_version_id',v_version.id,'version_no',1,'definition',v_definition));
end $$;

revoke all on function public.cms_admin_create_form(text,text,text,text,text) from public,anon;
grant execute on function public.cms_admin_create_form(text,text,text,text,text) to authenticated;

-- The editor receives only active published generic forms that are safe to expose now,
-- plus fixed links to the two existing protected routes. No drafts or response data leave the DB.
create or replace function public.cms_admin_list_form_embed_options()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_enabled boolean; v_rows jsonb;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select public_submissions_enabled into v_enabled from public.cms_form_studio_config where singleton;
  select coalesce(jsonb_agg(row_value order by sort_key,name),'[]'::jsonb) into v_rows from (
    select jsonb_build_object('kind','standard','id',f.id,'name',f.name,'public_title',f.public_title,'current_version',fv.version_no,'status',f.lifecycle_status) as row_value, f.name, 0 as sort_key
    from public.cms_forms f join public.cms_form_versions fv on fv.id=f.published_version_id and fv.form_id=f.id
    where coalesce(v_enabled,false) and f.kind='standard' and f.lifecycle_status='published' and f.availability_status='open'
    union all
    select jsonb_build_object('kind','protected','protected_key','attendee','name','Attendee application','status','protected','public_path','/register'), 'Attendee application', 1
    union all
    select jsonb_build_object('kind','protected','protected_key','volunteer','name','Volunteer application','status','protected','public_path','/volunteer/apply'), 'Volunteer application', 1
  ) options;
  return v_rows;
end $$;

create or replace function public.cms_admin_list_form_page_usages(p_form_id uuid default null,p_protected_key text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_rows jsonb;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if (p_form_id is null and p_protected_key not in ('attendee','volunteer')) or (p_form_id is not null and p_protected_key is not null) then
    raise exception using errcode='22023',message='Choose one valid form reference';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'page_id',refs.page_id,'title',refs.title,'slug',refs.slug,'page_status',refs.page_status,
    'revision_kind',refs.revision_kind,'section_id',refs.section_id,
    'mode',case when refs.protected_key is not null then 'navigate' else 'follow_published' end
  ) order by refs.title,refs.revision_kind,refs.section_id),'[]'::jsonb) into v_rows
  from (
    select p.id as page_id,p.title,p.slug,p.status as page_status,'draft'::text as revision_kind,
      section.value->>'id' as section_id,section.value->'props'->>'form_id' as form_id,
      nullif(section.value->'props'->>'protected_key','') as protected_key
    from public.cms_pages p join public.cms_page_revisions r on r.id=p.draft_revision_id
    cross join lateral jsonb_array_elements(coalesce(r.document->'sections','[]'::jsonb)) section(value)
    where section.value->>'type'='form_embed'
    union all
    select p.id,p.title,p.slug,p.status,'published'::text,section.value->>'id',
      section.value->'props'->>'form_id',nullif(section.value->'props'->>'protected_key','')
    from public.cms_pages p join public.cms_page_revisions r on r.id=p.published_revision_id
    cross join lateral jsonb_array_elements(coalesce(r.document->'sections','[]'::jsonb)) section(value)
    where section.value->>'type'='form_embed' and p.published_revision_id is distinct from p.draft_revision_id
  ) refs
  where (p_form_id is not null and refs.form_id=p_form_id::text)
     or (p_protected_key is not null and refs.protected_key=p_protected_key);
  return v_rows;
end $$;

revoke all on function public.cms_admin_list_form_embed_options() from public,anon;
revoke all on function public.cms_admin_list_form_page_usages(uuid,text) from public,anon;
grant execute on function public.cms_admin_list_form_embed_options() to authenticated;
grant execute on function public.cms_admin_list_form_page_usages(uuid,text) to authenticated;

-- Extend the existing Page Studio save path. It still validates the shared SEO payload,
-- and form references are accepted only for templates whose registry permits form_embed.
create or replace function public.cms_admin_save_page_draft(
  p_page_id uuid,p_expected_revision integer,p_title text,p_document jsonb,p_seo jsonb
)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare
  v_actor uuid; v_page public.cms_pages%rowtype; v_current public.cms_page_revisions%rowtype;
  v_allowed jsonb; v_section jsonb; v_props jsonb; v_type text; v_id text; v_href text; v_image text;
  v_count integer; v_distinct_count integer; v_revision_id uuid:=gen_random_uuid(); v_revision_number integer;
  v_title text:=trim(coalesce(p_title,'')); v_seo jsonb; v_error text; v_form public.cms_forms%rowtype;
  v_form_id text; v_protected_key text; v_embed_mode text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002',message='Page not found'; end if;
  if v_page.status not in ('draft','published') then raise exception using errcode='22023',message='Only draft or published pages can be edited'; end if;
  if char_length(v_title)<2 or char_length(v_title)>160 then raise exception using errcode='22023',message='Title must be 2 to 160 characters'; end if;
  if jsonb_typeof(p_document)<>'object' or coalesce((p_document->>'version')::integer,0)<>1 or jsonb_typeof(p_document->'sections')<>'array' or jsonb_array_length(p_document->'sections')>50 then
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
    if v_type not in ('hero','rich_text','image_text','cta','faq','form_embed') or not (v_allowed ? v_type)
      or v_id is null or char_length(v_id)<1 or char_length(v_id)>100 or jsonb_typeof(v_props)<>'object' or octet_length(v_props::text)>20000 then
      raise exception using errcode='22023',message='This section contains unsupported content';
    end if;
    if jsonb_typeof(v_section->'visible') not in ('boolean','null') or jsonb_typeof(v_section->'order') not in ('number','null') then raise exception using errcode='22023',message='Section visibility or order is invalid'; end if;
    if (v_type='hero' and v_props-array['eyebrow','heading','body','cta_label','cta_href']<>'{}'::jsonb)
      or (v_type='rich_text' and v_props-array['heading','body']<>'{}'::jsonb)
      or (v_type='image_text' and v_props-array['heading','body','image_url','alt']<>'{}'::jsonb)
      or (v_type='cta' and v_props-array['heading','body','label','href']<>'{}'::jsonb)
      or (v_type='faq' and v_props-array['heading','items']<>'{}'::jsonb)
      or (v_type='form_embed' and v_props-array['form_id','protected_key','mode','label','description']<>'{}'::jsonb) then
      raise exception using errcode='22023',message='A section contains fields not supported by its type';
    end if;
    if v_type='form_embed' then
      if v_page.template_id not in ('form_landing','workshop_event') then raise exception using errcode='22023',message='Forms can only be added to Form Landing or Workshop / event pages'; end if;
      v_form_id:=nullif(v_props->>'form_id',''); v_protected_key:=nullif(v_props->>'protected_key',''); v_embed_mode:=coalesce(v_props->>'mode','follow_published');
      if char_length(coalesce(v_props->>'label',''))>160 or char_length(coalesce(v_props->>'description',''))>500 then raise exception using errcode='22023',message='Form embed text is too long'; end if;
      if v_form_id is null and v_protected_key is null then null;
      elsif v_protected_key is not null then
        if v_form_id is not null or v_protected_key not in ('attendee','volunteer') or v_embed_mode<>'navigate' then raise exception using errcode='22023',message='Choose a supported protected application route'; end if;
      else
        if v_page.template_id not in ('form_landing','workshop_event') or v_form_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or v_embed_mode<>'follow_published' or coalesce(v_props->>'protected_key','')<>'' then
          raise exception using errcode='22023',message='Choose a currently published generic form';
        end if;
        select * into v_form from public.cms_forms where id=v_form_id::uuid and kind='standard' and lifecycle_status='published' and published_version_id is not null and availability_status='open';
        if not found or not exists(select 1 from public.cms_form_studio_config where singleton and public_submissions_enabled) then raise exception using errcode='22023',message='This form is not available for public embedding'; end if;
      end if;
    end if;
    if v_type='faq' and (jsonb_typeof(coalesce(v_props->'items','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(v_props->'items','[]'::jsonb))>25) then raise exception using errcode='22023',message='FAQ sections can contain at most 25 question and answer pairs'; end if;
    if v_type in ('hero','cta') then
      v_href:=coalesce(v_props->>'cta_href',v_props->>'href','');
      if v_href<>'' and not ((left(v_href,1)='/' and left(v_href,2)<>'//' and v_href !~ '[[:space:]]') or v_href~'^https://[^[:space:]/?#]+(:[0-9]+)?([/?#][^[:space:]]*)?$') then raise exception using errcode='22023',message='Buttons must use a site path or HTTPS URL'; end if;
    end if;
    if v_type='image_text' then
      v_image:=coalesce(v_props->>'image_url','');
      if v_image<>'' and (left(v_image,1)<>'/' or left(v_image,2)='//' or v_image~'[[:space:]]|\.\.') then raise exception using errcode='22023',message='Use an approved site asset path beginning with one slash'; end if;
    end if;
  end loop;
  v_seo:=jsonb_build_object(
    'seo_title',coalesce(nullif(trim(p_seo->>'seo_title'),''),v_page.title),'meta_description',coalesce(trim(p_seo->>'meta_description'),''),
    'canonical_path',coalesce(nullif(trim(p_seo->>'canonical_path'),''),'/'||v_page.slug),'indexable',coalesce((p_seo->>'indexable')::boolean,false),
    'follow_links',coalesce((p_seo->>'follow_links')::boolean,true),'og_title',coalesce(trim(p_seo->>'og_title'),''),'og_description',coalesce(trim(p_seo->>'og_description'),''),
    'og_image_asset_id',coalesce(nullif(p_seo->>'og_image_asset_id',''),'brand_home'),'og_image_url',coalesce(nullif(trim(p_seo->>'og_image_url'),''),''),
    'social_image_alt',coalesce(trim(p_seo->>'social_image_alt'),''),'og_type',coalesce(p_seo->>'og_type','website'),'locale',coalesce(p_seo->>'locale','en-IN'),
    'structured_data_type',coalesce(p_seo->>'structured_data_type','WebPage'),'author_name',coalesce(trim(p_seo->>'author_name'),''),'references',coalesce(p_seo->'references','[]'::jsonb));
  v_error:=cms_private.validate_cms_page_seo(p_page_id,v_title,v_page.template_id,v_seo);
  if v_error is not null then raise exception using errcode='22023',message=v_error; end if;
  select coalesce(max(revision_number),0)+1 into v_revision_number from public.cms_page_revisions where page_id=p_page_id;
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_revision_id,p_page_id,v_revision_number,p_document||jsonb_build_object('page_title',v_title),v_seo,'Updated page content and SEO',v_actor);
  update public.cms_pages set title=v_title,draft_revision_id=v_revision_id,updated_by=v_actor,updated_at=now() where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details) values(v_actor,'page_draft_saved',p_page_id,jsonb_build_object('revision_number',v_revision_number,'section_count',jsonb_array_length(p_document->'sections'),'seo_changed',true,'indexable',v_seo->'indexable'));
  return jsonb_build_object('page',jsonb_build_object('id',p_page_id,'slug',v_page.slug,'title',v_title,'status',v_page.status),'revision',jsonb_build_object('id',v_revision_id,'revision_number',v_revision_number,'document',p_document,'seo',v_seo));
end $$;

revoke all on function public.cms_admin_save_page_draft(uuid,integer,text,jsonb,jsonb) from public,anon;
grant execute on function public.cms_admin_save_page_draft(uuid,integer,text,jsonb,jsonb) to authenticated;
