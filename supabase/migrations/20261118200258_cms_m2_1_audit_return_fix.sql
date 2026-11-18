-- Keep create/duplicate audit events truthful: returning a new draft must not
-- also record a preview the editor did not request.

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
  return jsonb_build_object('page',jsonb_build_object('id',v_page_id,'title',v_title,'slug',v_slug,'template_id',v_template.template_id,'status','draft'),
    'template',jsonb_build_object('name',v_template.name,'is_protected',v_template.is_protected),
    'revision',jsonb_build_object('id',v_revision_id,'revision_number',1,'document',v_template.starter_document));
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
  v_actor uuid; v_source public.cms_pages%rowtype; v_source_revision public.cms_page_revisions%rowtype; v_template public.cms_template_registry%rowtype;
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
  select * into v_template from public.cms_template_registry where template_id=v_source.template_id;
  insert into public.cms_pages(id,slug,title,template_id,template_version,status,created_by,updated_by)
  values(v_page_id,v_slug,v_title,v_source.template_id,v_source.template_version,'draft',v_actor,v_actor);
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_revision_id,v_page_id,1,v_source_revision.document,v_source_revision.seo,'Duplicated from page '||v_source.id,v_actor);
  update public.cms_pages set draft_revision_id=v_revision_id where id=v_page_id;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_duplicated',v_page_id,jsonb_build_object('source_page_id',v_source.id,'slug',v_slug));
  return jsonb_build_object('page',jsonb_build_object('id',v_page_id,'title',v_title,'slug',v_slug,'template_id',v_source.template_id,'status','draft'),
    'template',jsonb_build_object('name',v_template.name,'is_protected',v_template.is_protected),
    'revision',jsonb_build_object('id',v_revision_id,'revision_number',1,'document',v_source_revision.document));
exception when unique_violation then
  raise exception using errcode='23505', message='That page path is already in use';
end;
$$;

revoke all on function public.cms_admin_create_page(text,text,text) from public, anon;
revoke all on function public.cms_admin_duplicate_page(uuid,text,text) from public, anon;
grant execute on function public.cms_admin_create_page(text,text,text) to authenticated;
grant execute on function public.cms_admin_duplicate_page(uuid,text,text) to authenticated;
