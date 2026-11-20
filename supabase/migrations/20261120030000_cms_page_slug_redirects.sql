-- CMS page URL changes are super-admin-only and keep public routes permanent.
create table if not exists public.cms_page_redirects (
  source_path text primary key check (source_path ~ '^/[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$'),
  destination_path text not null check (destination_path ~ '^/[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (source_path <> destination_path)
);
alter table public.cms_page_redirects enable row level security;
revoke all on public.cms_page_redirects from public, anon, authenticated;
grant all on public.cms_page_redirects to service_role;

alter table public.cms_audit_events drop constraint if exists cms_audit_events_action_check;
alter table public.cms_audit_events add constraint cms_audit_events_action_check check (action in (
  'page_created','page_duplicated','page_previewed','page_draft_saved','page_published',
  'page_archived','page_revision_restored','page_seo_saved','page_slug_changed'
));

create or replace function public.cms_admin_change_page_slug(p_page_id uuid, p_new_slug text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare
  v_actor uuid; v_page public.cms_pages%rowtype; v_revision public.cms_page_revisions%rowtype;
  v_old_path text; v_new_path text; v_revision_id uuid:=gen_random_uuid(); v_revision_number integer;
  v_seo jsonb; v_published_id uuid;
begin
  v_actor:=cms_private.require_cms_super_admin();
  v_new_path:='/'||trim(both '/' from coalesce(p_new_slug,''));
  if char_length(v_new_path)<2 or char_length(v_new_path)>181
    or substring(v_new_path from 2) !~ '^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$' then
    raise exception using errcode='22023',message='Use a lowercase URL path with letters, numbers and hyphens';
  end if;
  if split_part(substring(v_new_path from 2),'/',1)=any(array['api','backoffice','lms','register','register-rhf-test','volunteer','privacy','_next','.well-known','forms']) then
    raise exception using errcode='22023',message='This path is reserved for the existing website';
  end if;
  select * into v_page from public.cms_pages where id=p_page_id for update;
  if not found then raise exception using errcode='P0002',message='Page not found'; end if;
  if v_page.status not in ('draft','published') then raise exception using errcode='22023',message='Only draft or published pages can change URL'; end if;
  v_old_path:='/'||v_page.slug;
  if v_new_path=v_old_path then return jsonb_build_object('page_id',v_page.id,'slug',v_page.slug,'status',v_page.status); end if;
  if exists(select 1 from public.cms_pages where slug=substring(v_new_path from 2) and id<>p_page_id)
    or exists(select 1 from public.cms_page_redirects where source_path=v_new_path) then
    raise exception using errcode='23505',message='That URL is already used by a page or permanent redirect';
  end if;
  if v_page.status='published' and v_page.draft_revision_id is distinct from v_page.published_revision_id then
    raise exception using errcode='40001',message='Publish or discard pending edits before changing a published page URL';
  end if;
  select * into v_revision from public.cms_page_revisions where id=coalesce(v_page.draft_revision_id,v_page.published_revision_id);
  if not found then raise exception using errcode='P0002',message='Page revision not found'; end if;
  v_seo:=v_revision.seo;
  if coalesce(v_seo->>'canonical_path',v_old_path)=v_old_path then v_seo:=jsonb_set(v_seo,'{canonical_path}',to_jsonb(v_new_path),true); end if;
  select coalesce(max(revision_number),0)+1 into v_revision_number from public.cms_page_revisions where page_id=p_page_id;
  insert into public.cms_page_revisions(id,page_id,revision_number,document,seo,change_summary,created_by)
  values(v_revision_id,p_page_id,v_revision_number,v_revision.document,v_seo,'Page URL changed',v_actor);
  if v_page.status='published' then v_published_id:=v_revision_id; else v_published_id:=v_page.published_revision_id; end if;
  update public.cms_pages set slug=substring(v_new_path from 2),draft_revision_id=v_revision_id,
    published_revision_id=v_published_id,updated_by=v_actor,updated_at=now() where id=p_page_id;
  if v_page.status='published' then
    -- Collapse old chains to their newest destination before creating the next hop.
    update public.cms_page_redirects set destination_path=v_new_path where destination_path=v_old_path;
    insert into public.cms_page_redirects(source_path,destination_path,created_by) values(v_old_path,v_new_path,v_actor)
      on conflict(source_path) do update set destination_path=excluded.destination_path,created_by=excluded.created_by,created_at=now();
  end if;
  insert into public.cms_audit_events(actor_id,action,page_id,details)
  values(v_actor,'page_slug_changed',p_page_id,jsonb_build_object('old_path',v_old_path,'new_path',v_new_path,'revision_number',v_revision_number,'permanent_redirect',v_page.status='published'));
  return jsonb_build_object('page_id',p_page_id,'slug',substring(v_new_path from 2),'status',v_page.status,'revision_number',v_revision_number,'redirect_status',case when v_page.status='published' then 308 else null end);
end;
$$;
revoke all on function public.cms_admin_change_page_slug(uuid,text) from public,anon;
grant execute on function public.cms_admin_change_page_slug(uuid,text) to authenticated;

create or replace function public.cms_public_resolve_page_redirect(p_path text)
returns text language sql stable security definer set search_path=pg_catalog,public as $$
  select r.destination_path
  from public.cms_page_redirects r
  join public.cms_pages p on p.slug=substring(r.destination_path from 2) and p.status='published' and p.published_revision_id is not null
  where r.source_path=left(coalesce(p_path,''),182)
  limit 1
$$;
revoke all on function public.cms_public_resolve_page_redirect(text) from public;
grant execute on function public.cms_public_resolve_page_redirect(text) to anon,authenticated;
