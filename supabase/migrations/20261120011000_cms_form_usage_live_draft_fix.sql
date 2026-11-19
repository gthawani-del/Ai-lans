-- Keep the page-usage map precise when a published page has an unchanged draft pointer.
create or replace function public.cms_admin_list_form_page_usages(p_form_id uuid default null,p_protected_key text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_rows jsonb;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if (p_form_id is null and (p_protected_key is null or p_protected_key not in ('attendee','volunteer'))) or (p_form_id is not null and p_protected_key is not null) then
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
    where section.value->>'type'='form_embed' and p.draft_revision_id is not null
      and (p.published_revision_id is null or p.draft_revision_id is distinct from p.published_revision_id)
    union all
    select p.id,p.title,p.slug,p.status,'published'::text,section.value->>'id',
      section.value->'props'->>'form_id',nullif(section.value->'props'->>'protected_key','')
    from public.cms_pages p join public.cms_page_revisions r on r.id=p.published_revision_id
    cross join lateral jsonb_array_elements(coalesce(r.document->'sections','[]'::jsonb)) section(value)
    where section.value->>'type'='form_embed' and p.published_revision_id is not null
  ) refs
  where (p_form_id is not null and refs.form_id=p_form_id::text)
     or (p_protected_key is not null and refs.protected_key=p_protected_key);
  return v_rows;
end $$;
revoke all on function public.cms_admin_list_form_page_usages(uuid,text) from public,anon;
grant execute on function public.cms_admin_list_form_page_usages(uuid,text) to authenticated;
