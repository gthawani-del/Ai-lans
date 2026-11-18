-- M2.3: explicit publish, immutable revision history/restore, archive and
-- published-only public rendering. No draft is published by this migration.

alter table public.cms_audit_events
  drop constraint if exists cms_audit_events_action_check;
alter table public.cms_audit_events
  add constraint cms_audit_events_action_check
  check (action in (
    'page_created','page_duplicated','page_previewed','page_draft_saved',
    'page_published','page_archived','page_revision_restored'
  ));

create or replace function public.cms_admin_list_pages(p_status text default null, p_template_id text default null, p_search text default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare v_actor uuid; v_result jsonb; v_query text := left(trim(coalesce(p_search,'')), 120);
begin
  v_actor := cms_private.require_cms_super_admin();
  if p_status is not null and p_status not in ('draft','in_review','published','archived') then
    raise exception using errcode='22023', message='Invalid status filter';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'template_id', p.template_id,
    'template_name', t.name, 'template_protected', t.is_protected, 'status', p.status,
    'created_at', p.created_at, 'updated_at', p.updated_at,
    'revision_number', coalesce(dr.revision_number, pr.revision_number, 0),
    'has_draft', p.draft_revision_id is not null,
    'has_published', p.published_revision_id is not null,
    'has_unpublished_changes', p.draft_revision_id is not null and p.draft_revision_id is distinct from p.published_revision_id,
    'published_revision_number', pr.revision_number
  ) order by p.updated_at desc), '[]'::jsonb)
  into v_result
  from public.cms_pages p
  join public.cms_template_registry t on t.template_id=p.template_id
  left join public.cms_page_revisions dr on dr.id=p.draft_revision_id
  left join public.cms_page_revisions pr on pr.id=p.published_revision_id
  where (p_status is null or p.status=p_status)
    and (p_template_id is null or p.template_id=p_template_id)
    and (v_query='' or position(lower(v_query) in lower(p.title))>0 or position(lower(v_query) in lower(p.slug))>0);
  return v_result;
end;
$$;

create or replace function public.cms_admin_get_page_preview(p_page_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare v_actor uuid; v_result jsonb;
begin
  v_actor := cms_private.require_cms_super_admin();
  select jsonb_build_object(
    'page',jsonb_build_object(
      'id',p.id,'slug',p.slug,'title',p.title,'template_id',p.template_id,
      'template_version',p.template_version,'status',p.status,'updated_at',p.updated_at,
      'has_unpublished_changes',p.draft_revision_id is not null and p.draft_revision_id is distinct from p.published_revision_id
    ),
    'template',jsonb_build_object('name',t.name,'description',t.description,'is_protected',t.is_protected,'allowed_sections',t.allowed_sections),
    'revision',jsonb_build_object('id',r.id,'revision_number',r.revision_number,'document',r.document,'seo',r.seo,'created_at',r.created_at)
  ) into v_result
  from public.cms_pages p
  join public.cms_template_registry t on t.template_id=p.template_id
  join public.cms_page_revisions r on r.id=coalesce(p.draft_revision_id,p.published_revision_id)
  where p.id=p_page_id;
  if v_result is null then raise exception using errcode='P0002', message='Page or revision not found'; end if;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_previewed',p_page_id,'{}'::jsonb);
  return v_result;
end;
$$;

create or replace function public.cms_admin_save_page_draft(
  p_page_id uuid, p_expected_revision integer, p_title text, p_document jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare
  v_actor uuid; v_page public.cms_pages%rowtype; v_current public.cms_page_revisions%rowtype;
  v_allowed jsonb; v_section jsonb; v_props jsonb; v_type text; v_id text; v_href text; v_image text;
  v_count integer; v_distinct_count integer; v_revision_id uuid := gen_random_uuid(); v_revision_number integer;
  v_title text := trim(coalesce(p_title,''));
begin
  v_actor := cms_private.require_cms_super_admin();
  if char_length(v_title)<2 or char_length(v_title)>160 then
    raise exception using errcode='22023', message='Title must be 2 to 160 characters';
  end if;
  if jsonb_typeof(p_document)<>'object' or coalesce((p_document->>'version')::integer,0)<>1
    or jsonb_typeof(p_document->'sections')<>'array' or jsonb_array_length(p_document->'sections')>50 then
    raise exception using errcode='22023', message='Page content must use a supported version and contain at most 50 sections';
  end if;
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002', message='Page not found'; end if;
  if v_page.status not in ('draft','published') then
    raise exception using errcode='22023', message='Only draft or published pages can be edited';
  end if;
  select * into v_current from public.cms_page_revisions where id=coalesce(v_page.draft_revision_id,v_page.published_revision_id);
  if not found then raise exception using errcode='P0002', message='Page revision not found'; end if;
  if v_current.revision_number<>p_expected_revision then
    raise exception using errcode='40001', message='This draft changed after you opened it. Close and reopen it before saving.';
  end if;
  select allowed_sections into v_allowed from public.cms_template_registry where template_id=v_page.template_id and is_active=true;
  if v_allowed is null then raise exception using errcode='22023', message='This page template is no longer available'; end if;
  select count(*),count(distinct value->>'id') into v_count,v_distinct_count from jsonb_array_elements(p_document->'sections');
  if v_count<>v_distinct_count then raise exception using errcode='22023', message='Each section needs a unique ID'; end if;
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
  select coalesce(max(revision_number),0)+1 into v_revision_number from public.cms_page_revisions where page_id=p_page_id;
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_revision_id,p_page_id,v_revision_number,p_document||jsonb_build_object('page_title',v_title),v_current.seo,'Edited draft content',v_actor);
  update public.cms_pages set title=v_title,draft_revision_id=v_revision_id,updated_by=v_actor,updated_at=now() where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_draft_saved',p_page_id,jsonb_build_object('revision_number',v_revision_number,'section_count',jsonb_array_length(p_document->'sections')));
  return jsonb_build_object('page',jsonb_build_object('id',p_page_id,'title',v_title,'slug',v_page.slug,'status',v_page.status),
    'revision',jsonb_build_object('id',v_revision_id,'revision_number',v_revision_number,'document',p_document));
end;
$$;

create or replace function public.cms_admin_list_page_revisions(p_page_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare v_actor uuid; v_result jsonb;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if not exists(select 1 from public.cms_pages where id=p_page_id) then raise exception using errcode='P0002',message='Page not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'revision_number',r.revision_number,'change_summary',r.change_summary,'created_at',r.created_at,
    'created_by',coalesce(u.email,'Administrator'),'is_draft',r.id=p.draft_revision_id,'is_published',r.id=p.published_revision_id
  ) order by r.revision_number desc),'[]'::jsonb)
  into v_result from public.cms_pages p join public.cms_page_revisions r on r.page_id=p.id
  left join public.backoffice_users u on u.user_id=r.created_by where p.id=p_page_id;
  return v_result;
end;
$$;

create or replace function public.cms_admin_restore_page_revision(p_page_id uuid,p_revision_id uuid,p_expected_revision integer)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare v_actor uuid; v_page public.cms_pages%rowtype; v_current public.cms_page_revisions%rowtype; v_source public.cms_page_revisions%rowtype;
  v_new_id uuid:=gen_random_uuid(); v_next integer;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002',message='Page not found'; end if;
  if v_page.status='archived' then
    select * into v_current from public.cms_page_revisions where id=coalesce(v_page.draft_revision_id,v_page.published_revision_id);
  else
    select * into v_current from public.cms_page_revisions where id=coalesce(v_page.draft_revision_id,v_page.published_revision_id);
  end if;
  if not found then raise exception using errcode='P0002',message='Current revision not found'; end if;
  if v_current.revision_number<>p_expected_revision then raise exception using errcode='40001',message='Page changed after history was opened. Refresh the history and retry.'; end if;
  select * into v_source from public.cms_page_revisions where id=p_revision_id and page_id=p_page_id;
  if not found then raise exception using errcode='P0002',message='Selected revision does not belong to this page'; end if;
  select coalesce(max(revision_number),0)+1 into v_next from public.cms_page_revisions where page_id=p_page_id;
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_new_id,p_page_id,v_next,v_source.document,v_source.seo,'Restored from revision '||v_source.revision_number,v_actor);
  update public.cms_pages set draft_revision_id=v_new_id,title=coalesce(v_source.document->>'page_title',title),status=case when status='archived' then 'draft' else status end,
    updated_by=v_actor,updated_at=now() where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_revision_restored',p_page_id,jsonb_build_object('source_revision_id',p_revision_id,'source_revision_number',v_source.revision_number,'revision_number',v_next));
  return jsonb_build_object('page_id',p_page_id,'revision_id',v_new_id,'revision_number',v_next,'status',case when v_page.status='archived' then 'draft' else v_page.status end);
end;
$$;

create or replace function public.cms_admin_publish_page_draft(p_page_id uuid,p_expected_revision integer)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare v_actor uuid; v_page public.cms_pages%rowtype; v_revision public.cms_page_revisions%rowtype; v_template public.cms_template_registry%rowtype; v_has_content boolean;
  v_published_id uuid:=gen_random_uuid(); v_published_number integer;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002',message='Page not found'; end if;
  if v_page.status not in ('draft','published') or v_page.draft_revision_id is null then
    raise exception using errcode='22023',message='This page has no publishable draft';
  end if;
  if v_page.draft_revision_id is not distinct from v_page.published_revision_id then
    raise exception using errcode='22023',message='There are no unpublished changes to publish';
  end if;
  select * into v_revision from public.cms_page_revisions where id=v_page.draft_revision_id;
  if not found then raise exception using errcode='P0002',message='Draft revision not found'; end if;
  if v_revision.revision_number<>p_expected_revision then raise exception using errcode='40001',message='This draft changed after it was opened. Refresh before publishing.'; end if;
  select * into v_template from public.cms_template_registry where template_id=v_page.template_id;
  if v_template.is_protected then raise exception using errcode='42501',message='Protected legal/trust pages cannot be published until a legal approval workflow is available'; end if;
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
  update public.cms_pages set published_revision_id=v_published_id,draft_revision_id=v_published_id,status='published',updated_by=v_actor,updated_at=now()
  where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_published',p_page_id,jsonb_build_object('revision_id',v_published_id,'revision_number',v_published_number,'slug',v_page.slug));
  return jsonb_build_object('page_id',p_page_id,'slug',v_page.slug,'title',v_page.title,'status','published','revision_number',v_published_number);
end;
$$;

create or replace function public.cms_admin_archive_page(p_page_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare v_actor uuid; v_page public.cms_pages%rowtype;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002',message='Page not found'; end if;
  if v_page.status='archived' then raise exception using errcode='22023',message='This page is already archived'; end if;
  update public.cms_pages set status='archived',updated_by=v_actor,updated_at=now() where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details) values(v_actor,'page_archived',p_page_id,jsonb_build_object('slug',v_page.slug,'previous_status',v_page.status));
  return jsonb_build_object('page_id',p_page_id,'slug',v_page.slug,'status','archived');
end;
$$;

create or replace function public.cms_public_get_page(p_slug text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'page',jsonb_build_object('slug',p.slug,'title',coalesce(r.document->>'page_title',p.title),'template_id',p.template_id),
    'template',jsonb_build_object('name',t.name),
    'revision',jsonb_build_object('revision_number',r.revision_number,'document',r.document,'seo',r.seo,'created_at',r.created_at)
  )
  from public.cms_pages p
  join public.cms_template_registry t on t.template_id=p.template_id
  join public.cms_page_revisions r on r.id=p.published_revision_id
  where p.slug=trim(both '/' from coalesce(p_slug,'')) and p.status='published'
  limit 1;
$$;

revoke all on function public.cms_admin_list_page_revisions(uuid) from public,anon;
revoke all on function public.cms_admin_restore_page_revision(uuid,uuid,integer) from public,anon;
revoke all on function public.cms_admin_publish_page_draft(uuid,integer) from public,anon;
revoke all on function public.cms_admin_archive_page(uuid) from public,anon;
revoke all on function public.cms_public_get_page(text) from public;
grant execute on function public.cms_admin_list_page_revisions(uuid) to authenticated;
grant execute on function public.cms_admin_restore_page_revision(uuid,uuid,integer) to authenticated;
grant execute on function public.cms_admin_publish_page_draft(uuid,integer) to authenticated;
grant execute on function public.cms_admin_archive_page(uuid) to authenticated;
grant execute on function public.cms_public_get_page(text) to anon,authenticated;
