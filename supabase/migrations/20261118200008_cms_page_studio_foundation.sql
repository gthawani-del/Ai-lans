-- M2.1: protected page inventory and create/duplicate/preview foundation.
-- All browser writes pass through authenticated, role-checking RPC functions.

create schema if not exists cms_private;
revoke all on schema cms_private from public, anon, authenticated;

create table if not exists public.cms_template_registry (
  template_id text primary key,
  name text not null,
  description text not null default '',
  version smallint not null default 1 check (version > 0),
  allowed_sections jsonb not null default '[]'::jsonb check (jsonb_typeof(allowed_sections) = 'array'),
  starter_document jsonb not null default '{"version":1,"sections":[]}'::jsonb check (jsonb_typeof(starter_document) = 'object'),
  is_active boolean not null default true,
  is_protected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 2 and 160),
  template_id text not null references public.cms_template_registry(template_id),
  template_version smallint not null check (template_version > 0),
  status text not null default 'draft' check (status in ('draft','in_review','published','archived')),
  draft_revision_id uuid,
  published_revision_id uuid,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_pages(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object'),
  change_summary text not null default 'Created from template' check (char_length(change_summary) <= 500),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (page_id, revision_number)
);

alter table public.cms_pages
  add constraint cms_pages_draft_revision_fk foreign key (draft_revision_id)
  references public.cms_page_revisions(id) on delete restrict deferrable initially deferred;
alter table public.cms_pages
  add constraint cms_pages_published_revision_fk foreign key (published_revision_id)
  references public.cms_page_revisions(id) on delete restrict deferrable initially deferred;

create table if not exists public.cms_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id),
  action text not null check (action in ('page_created','page_duplicated','page_previewed')),
  page_id uuid references public.cms_pages(id) on delete set null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.cms_template_registry enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_page_revisions enable row level security;
alter table public.cms_audit_events enable row level security;
revoke all on public.cms_template_registry, public.cms_pages, public.cms_page_revisions, public.cms_audit_events from public, anon, authenticated;
grant all on public.cms_template_registry, public.cms_pages, public.cms_page_revisions, public.cms_audit_events to service_role;
grant usage, select on sequence public.cms_audit_events_id_seq to service_role;

insert into public.cms_template_registry (template_id, name, description, allowed_sections, starter_document, is_protected)
values
  ('standard_information','Standard information','A clear page for explaining a service, organisation or topic.','["hero","rich_text","image_text","cta","faq"]','{"version":1,"sections":[]}',false),
  ('landing_campaign','Landing / campaign','A focused campaign page with a concise message and next step.','["hero","image_text","stats","faq","cta"]','{"version":1,"sections":[]}',false),
  ('workshop_event','Workshop / event','A workshop page for verified event details, agenda and application link.','["hero","rich_text","timeline","speaker","faq","form_embed","cta"]','{"version":1,"sections":[]}',false),
  ('editorial_article','Editorial article','An article structure ready for Phase 4 editorial content.','["breadcrumb","hero","rich_text","image_text","related_content"]','{"version":1,"sections":[]}',false),
  ('resource_project','Resource / project','A practical resource or project overview with steps and downloads.','["hero","rich_text","timeline","video","downloads","related_content","cta"]','{"version":1,"sections":[]}',false),
  ('faq_knowledge','FAQ / knowledge','A topic-led question and answer page.','["breadcrumb","hero","faq","rich_text","related_content"]','{"version":1,"sections":[]}',false),
  ('legal_trust','Legal / trust','A protected structure for owner-approved legal or trust content.','["breadcrumb","hero","rich_text"]','{"version":1,"sections":[]}',true),
  ('form_landing','Form landing','Instructions and guidance around an approved form.','["hero","rich_text","faq","form_embed"]','{"version":1,"sections":[]}',false)
on conflict (template_id) do update set
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  allowed_sections = excluded.allowed_sections,
  is_protected = excluded.is_protected,
  updated_at = now();

create or replace function cms_private.require_cms_super_admin()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1 from public.backoffice_users
    where user_id = v_user_id and is_active = true and role = 'super_admin'
  ) then
    raise exception using errcode = '42501', message = 'CMS access denied';
  end if;
  return v_user_id;
end;
$$;
revoke all on function cms_private.require_cms_super_admin() from public, anon, authenticated;

create or replace function public.cms_admin_list_templates()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare v_actor uuid; v_result jsonb;
begin
  v_actor := cms_private.require_cms_super_admin();
  select coalesce(jsonb_agg(jsonb_build_object(
    'template_id', template_id, 'name', name, 'description', description,
    'version', version, 'allowed_sections', allowed_sections, 'is_protected', is_protected
  ) order by name), '[]'::jsonb)
  into v_result from public.cms_template_registry where is_active = true;
  return v_result;
end;
$$;

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
    raise exception using errcode = '22023', message = 'Invalid status filter';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'template_id', p.template_id,
    'template_name', t.name, 'template_protected', t.is_protected, 'status', p.status,
    'created_at', p.created_at, 'updated_at', p.updated_at,
    'revision_number', coalesce(r.revision_number, 0), 'has_draft', p.draft_revision_id is not null,
    'has_published', p.published_revision_id is not null
  ) order by p.updated_at desc), '[]'::jsonb)
  into v_result
  from public.cms_pages p
  join public.cms_template_registry t on t.template_id = p.template_id
  left join public.cms_page_revisions r on r.id = p.draft_revision_id
  where (p_status is null or p.status = p_status)
    and (p_template_id is null or p.template_id = p_template_id)
    and (v_query = '' or position(lower(v_query) in lower(p.title)) > 0 or position(lower(v_query) in lower(p.slug)) > 0)
  limit 300;
  return v_result;
end;
$$;

create or replace function public.cms_admin_create_page(p_title text, p_slug text, p_template_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare
  v_actor uuid; v_template public.cms_template_registry%rowtype;
  v_page_id uuid := gen_random_uuid(); v_revision_id uuid := gen_random_uuid(); v_title text := trim(coalesce(p_title,'')); v_slug text := trim(coalesce(p_slug,''));
begin
  v_actor := cms_private.require_cms_super_admin();
  if char_length(v_title) < 2 or char_length(v_title) > 160 then raise exception using errcode='22023', message='Title must be 2 to 160 characters'; end if;
  if char_length(v_slug) < 1 or char_length(v_slug) > 180 or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$' then raise exception using errcode='22023', message='Use a lowercase URL path with letters, numbers and hyphens'; end if;
  if split_part(v_slug,'/',1) = any(array['api','backoffice','lms','register','register-rhf-test','volunteer','privacy','_next','.well-known']) then raise exception using errcode='22023', message='This path is reserved for the existing website'; end if;
  select * into v_template from public.cms_template_registry where template_id=p_template_id and is_active=true;
  if not found then raise exception using errcode='22023', message='Choose an available page template'; end if;

  insert into public.cms_pages(id,slug,title,template_id,template_version,status,created_by,updated_by)
  values(v_page_id,v_slug,v_title,v_template.template_id,v_template.version,'draft',v_actor,v_actor);
  insert into public.cms_page_revisions(id,page_id,revision_number,document,change_summary,created_by)
  values(v_revision_id,v_page_id,1,v_template.starter_document,'Created from template: '||v_template.name,v_actor);
  update public.cms_pages set draft_revision_id=v_revision_id where id=v_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_created',v_page_id,jsonb_build_object('slug',v_slug,'template_id',v_template.template_id));
  return public.cms_admin_get_page_preview(v_page_id);
exception when unique_violation then
  raise exception using errcode='23505', message='That page path is already in use';
end;
$$;

create or replace function public.cms_admin_duplicate_page(p_page_id uuid, p_new_title text, p_new_slug text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cms_private
as $$
declare
  v_actor uuid; v_source public.cms_pages%rowtype; v_source_revision public.cms_page_revisions%rowtype;
  v_page_id uuid := gen_random_uuid(); v_revision_id uuid := gen_random_uuid(); v_title text := trim(coalesce(p_new_title,'')); v_slug text := trim(coalesce(p_new_slug,''));
begin
  v_actor := cms_private.require_cms_super_admin();
  if char_length(v_title) < 2 or char_length(v_title) > 160 then raise exception using errcode='22023', message='Title must be 2 to 160 characters'; end if;
  if char_length(v_slug) < 1 or char_length(v_slug) > 180 or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$' then raise exception using errcode='22023', message='Use a lowercase URL path with letters, numbers and hyphens'; end if;
  if split_part(v_slug,'/',1) = any(array['api','backoffice','lms','register','register-rhf-test','volunteer','privacy','_next','.well-known']) then raise exception using errcode='22023', message='This path is reserved for the existing website'; end if;
  select * into v_source from public.cms_pages where id=p_page_id;
  if not found then raise exception using errcode='P0002', message='Page not found'; end if;
  select * into v_source_revision from public.cms_page_revisions where id=coalesce(v_source.draft_revision_id,v_source.published_revision_id);
  if not found then raise exception using errcode='P0002', message='Page revision not found'; end if;
  insert into public.cms_pages(id,slug,title,template_id,template_version,status,created_by,updated_by)
  values(v_page_id,v_slug,v_title,v_source.template_id,v_source.template_version,'draft',v_actor,v_actor);
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_revision_id,v_page_id,1,v_source_revision.document,v_source_revision.seo,'Duplicated from page '||v_source.id,v_actor);
  update public.cms_pages set draft_revision_id=v_revision_id where id=v_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_duplicated',v_page_id,jsonb_build_object('source_page_id',v_source.id,'slug',v_slug));
  return public.cms_admin_get_page_preview(v_page_id);
exception when unique_violation then
  raise exception using errcode='23505', message='That page path is already in use';
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
    'page', jsonb_build_object('id',p.id,'slug',p.slug,'title',p.title,'template_id',p.template_id,'template_version',p.template_version,'status',p.status,'updated_at',p.updated_at),
    'template', jsonb_build_object('name',t.name,'description',t.description,'is_protected',t.is_protected,'allowed_sections',t.allowed_sections),
    'revision', jsonb_build_object('id',r.id,'revision_number',r.revision_number,'document',r.document,'seo',r.seo,'created_at',r.created_at)
  ) into v_result
  from public.cms_pages p
  join public.cms_template_registry t on t.template_id=p.template_id
  join public.cms_page_revisions r on r.id=coalesce(p.draft_revision_id,p.published_revision_id)
  where p.id=p_page_id;
  if v_result is null then raise exception using errcode='P0002', message='Page or draft revision not found'; end if;
  insert into public.cms_audit_events(actor_id,action,page_id,details) values(v_actor,'page_previewed',p_page_id,'{}'::jsonb);
  return v_result;
end;
$$;

revoke all on function public.cms_admin_list_templates() from public, anon;
revoke all on function public.cms_admin_list_pages(text,text,text) from public, anon;
revoke all on function public.cms_admin_create_page(text,text,text) from public, anon;
revoke all on function public.cms_admin_duplicate_page(uuid,text,text) from public, anon;
revoke all on function public.cms_admin_get_page_preview(uuid) from public, anon;
grant execute on function public.cms_admin_list_templates() to authenticated;
grant execute on function public.cms_admin_list_pages(text,text,text) to authenticated;
grant execute on function public.cms_admin_create_page(text,text,text) to authenticated;
grant execute on function public.cms_admin_duplicate_page(uuid,text,text) to authenticated;
grant execute on function public.cms_admin_get_page_preview(uuid) to authenticated;
