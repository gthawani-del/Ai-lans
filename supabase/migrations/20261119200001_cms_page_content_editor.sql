-- M2.2: save structured page content through a role-checked, revisioned RPC.
-- The browser cannot write CMS tables directly; this function is the only
-- authenticated draft-edit path and accepts a constrained section schema.

alter table public.cms_audit_events
  drop constraint if exists cms_audit_events_action_check;
alter table public.cms_audit_events
  add constraint cms_audit_events_action_check
  check (action in ('page_created','page_duplicated','page_previewed','page_draft_saved'));

create or replace function public.cms_admin_save_page_draft(
  p_page_id uuid,
  p_expected_revision integer,
  p_title text,
  p_document jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare
  v_actor uuid;
  v_page public.cms_pages%rowtype;
  v_current public.cms_page_revisions%rowtype;
  v_allowed jsonb;
  v_section jsonb;
  v_props jsonb;
  v_type text;
  v_id text;
  v_href text;
  v_image text;
  v_count integer;
  v_revision_id uuid := gen_random_uuid();
  v_revision_number integer;
  v_title text := trim(coalesce(p_title,''));
begin
  v_actor := cms_private.require_cms_super_admin();
  if char_length(v_title) < 2 or char_length(v_title) > 160 then
    raise exception using errcode='22023', message='Title must be 2 to 160 characters';
  end if;
  if jsonb_typeof(p_document) <> 'object'
    or coalesce((p_document->>'version')::integer,0) <> 1
    or jsonb_typeof(p_document->'sections') <> 'array'
    or jsonb_array_length(p_document->'sections') > 50 then
    raise exception using errcode='22023', message='Page content must use a supported version and contain at most 50 sections';
  end if;

  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002', message='Page not found'; end if;
  if v_page.status <> 'draft' then
    raise exception using errcode='22023', message='Only draft pages can be edited';
  end if;
  select * into v_current from public.cms_page_revisions where id=v_page.draft_revision_id;
  if not found then raise exception using errcode='P0002', message='Draft revision not found'; end if;
  if v_current.revision_number <> p_expected_revision then
    raise exception using errcode='40001', message='This draft changed after you opened it. Close and reopen it before saving.';
  end if;
  select allowed_sections into v_allowed from public.cms_template_registry where template_id=v_page.template_id and is_active=true;
  if v_allowed is null then raise exception using errcode='22023', message='This page template is no longer available'; end if;

  select count(*), count(distinct value->>'id') into v_count, v_revision_number
  from jsonb_array_elements(p_document->'sections');
  if v_count <> v_revision_number then
    raise exception using errcode='22023', message='Each section needs a unique ID';
  end if;

  for v_section in select value from jsonb_array_elements(p_document->'sections') loop
    if jsonb_typeof(v_section) <> 'object' then
      raise exception using errcode='22023', message='Each section must be an object';
    end if;
    v_type := v_section->>'type';
    v_id := v_section->>'id';
    v_props := v_section->'props';
    if v_type not in ('hero','rich_text','image_text','cta','faq')
      or not (v_allowed ? v_type)
      or v_id is null or char_length(v_id) < 1 or char_length(v_id) > 100
      or jsonb_typeof(v_props) <> 'object'
      or octet_length(v_props::text) > 20000 then
      raise exception using errcode='22023', message='This section contains unsupported content';
    end if;
    if jsonb_typeof(v_section->'visible') not in ('boolean','null')
      or jsonb_typeof(v_section->'order') not in ('number','null') then
      raise exception using errcode='22023', message='Section visibility or order is invalid';
    end if;
    if v_type='hero' and v_props - array['eyebrow','heading','body','cta_label','cta_href'] <> '{}'::jsonb
      or v_type='rich_text' and v_props - array['heading','body'] <> '{}'::jsonb
      or v_type='image_text' and v_props - array['heading','body','image_url','alt'] <> '{}'::jsonb
      or v_type='cta' and v_props - array['heading','body','label','href'] <> '{}'::jsonb
      or v_type='faq' and v_props - array['heading','items'] <> '{}'::jsonb then
      raise exception using errcode='22023', message='A section contains fields not supported by its type';
    end if;
    if v_type='faq' then
      if jsonb_typeof(coalesce(v_props->'items','[]'::jsonb)) <> 'array'
        or jsonb_array_length(coalesce(v_props->'items','[]'::jsonb)) > 25 then
        raise exception using errcode='22023', message='FAQ sections can contain at most 25 question and answer pairs';
      end if;
    end if;
    if v_type in ('hero','cta') then
      v_href := coalesce(v_props->>'cta_href',v_props->>'href','');
      if v_href <> '' and not (
        (left(v_href,1)='/' and left(v_href,2)<>'//' and v_href !~ '[[:space:]]')
        or v_href ~ '^https://[^[:space:]/?#]+(:[0-9]+)?([/?#][^[:space:]]*)?$'
      ) then
        raise exception using errcode='22023', message='Buttons must use a site path or HTTPS URL';
      end if;
    end if;
    if v_type='image_text' then
      v_image := coalesce(v_props->>'image_url','');
      if v_image <> '' and (left(v_image,1)<>'/' or left(v_image,2)='//' or v_image ~ '[[:space:]]|\.\.') then
        raise exception using errcode='22023', message='Use an approved site asset path beginning with one slash';
      end if;
    end if;
  end loop;

  select coalesce(max(revision_number),0)+1 into v_revision_number
  from public.cms_page_revisions where page_id=p_page_id;
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_revision_id,p_page_id,v_revision_number,p_document,v_current.seo,'Edited draft content',v_actor);
  update public.cms_pages set title=v_title,draft_revision_id=v_revision_id,updated_by=v_actor,updated_at=now()
  where id=p_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_draft_saved',p_page_id,jsonb_build_object('revision_number',v_revision_number,'section_count',jsonb_array_length(p_document->'sections')));

  return jsonb_build_object(
    'page',jsonb_build_object('id',p_page_id,'title',v_title,'slug',v_page.slug,'status','draft'),
    'revision',jsonb_build_object('id',v_revision_id,'revision_number',v_revision_number,'document',p_document)
  );
end;
$$;

revoke all on function public.cms_admin_save_page_draft(uuid,integer,text,jsonb) from public, anon;
grant execute on function public.cms_admin_save_page_draft(uuid,integer,text,jsonb) to authenticated;
