-- M2.6-C: private response inbox, version-aware detail, status history and explicit export grants.
-- Public data collection is still disabled, so newly deployed inboxes start empty.

create table if not exists public.cms_form_export_grants (
  user_id uuid primary key references auth.users(id) on delete restrict,
  granted_by uuid not null references auth.users(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  check((revoked_at is null and revoked_by is null) or (revoked_at is not null and revoked_by is not null))
);
alter table public.cms_form_export_grants enable row level security;
revoke all on public.cms_form_export_grants from public,anon,authenticated;
grant all on public.cms_form_export_grants to service_role;

create or replace function cms_private.require_cms_form_export()
returns uuid language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if not exists(select 1 from public.cms_form_export_grants where user_id=v_actor and revoked_at is null) then
    raise exception using errcode='42501',message='Form response export permission has not been granted to this account';
  end if;
  return v_actor;
end $$;
revoke all on function cms_private.require_cms_form_export() from public,anon;
grant execute on function cms_private.require_cms_form_export() to authenticated;

create or replace function public.cms_admin_list_form_submissions(
  p_form_id uuid,
  p_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_form public.cms_forms%rowtype; v_total bigint; v_rows jsonb;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_form from public.cms_forms where id=p_form_id and kind='standard';
  if not found then raise exception using errcode='P0002',message='Form not found'; end if;
  if p_status is not null and p_status not in ('new','in_review','resolved','spam_review') then raise exception using errcode='22023',message='Invalid submission status filter'; end if;
  select count(*) into v_total from public.cms_form_submissions where form_id=p_form_id and deleted_at is null and (p_status is null or status=p_status);
  insert into public.cms_form_audit_events(actor_id,form_id,action,details)
  values(v_actor,p_form_id,'submissions_listed',jsonb_build_object('status',p_status,'limit',least(greatest(coalesce(p_limit,50),1),100),'offset',greatest(coalesce(p_offset,0),0)));
  select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'submitted_at',s.submitted_at,'status',s.status,'version_id',s.form_version_id,'version_no',v.version_no,'context_id',s.context_id) order by s.submitted_at desc),'[]'::jsonb)
    into v_rows
    from (select * from public.cms_form_submissions where form_id=p_form_id and deleted_at is null and (p_status is null or status=p_status) order by submitted_at desc limit least(greatest(coalesce(p_limit,50),1),100) offset greatest(coalesce(p_offset,0),0)) s
    join public.cms_form_versions v on v.id=s.form_version_id and v.form_id=s.form_id;
  return jsonb_build_object('form',jsonb_build_object('id',v_form.id,'name',v_form.name,'handle',v_form.handle),'total',v_total,'limit',least(greatest(coalesce(p_limit,50),1),100),'offset',greatest(coalesce(p_offset,0),0),'rows',v_rows);
end $$;

create or replace function public.cms_admin_get_form_submission(p_submission_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_submission public.cms_form_submissions%rowtype; v_version public.cms_form_versions%rowtype; v_form public.cms_forms%rowtype; v_consents jsonb;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_submission from public.cms_form_submissions where id=p_submission_id and deleted_at is null;
  if not found then raise exception using errcode='P0002',message='Submission not found'; end if;
  select * into v_form from public.cms_forms where id=v_submission.form_id;
  select * into v_version from public.cms_form_versions where id=v_submission.form_version_id and form_id=v_submission.form_id;
  select coalesce(jsonb_agg(jsonb_build_object('purpose',purpose,'policy_document_id',policy_document_id,'policy_version_id',policy_version_id,'accepted',accepted,'accepted_at',accepted_at) order by created_at),'[]'::jsonb)
    into v_consents from public.cms_form_consent_records where submission_id=p_submission_id;
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details)
  values(v_actor,v_form.id,v_version.id,'submission_viewed',jsonb_build_object('submission_id',p_submission_id));
  return jsonb_build_object('form',jsonb_build_object('id',v_form.id,'name',v_form.name,'handle',v_form.handle),'submission',jsonb_build_object('id',v_submission.id,'submitted_at',v_submission.submitted_at,'status',v_submission.status,'answers',v_submission.answers_json,'context_id',v_submission.context_id,'version_id',v_version.id,'version_no',v_version.version_no,'definition',v_version.definition_json,'consents',v_consents));
end $$;

create or replace function public.cms_admin_update_form_submission_status(p_submission_id uuid,p_status text,p_note text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_submission public.cms_form_submissions%rowtype; v_form public.cms_forms%rowtype; v_old_status text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if p_status is null or p_status not in ('new','in_review','resolved','spam_review') then raise exception using errcode='22023',message='Invalid submission status'; end if;
  select * into v_submission from public.cms_form_submissions where id=p_submission_id and deleted_at is null for update;
  if not found then raise exception using errcode='P0002',message='Submission not found'; end if;
  v_old_status:=v_submission.status;
  if v_submission.status='resolved' and p_status='new' then raise exception using errcode='22023',message='Resolved responses can return to review, not directly to New'; end if;
  update public.cms_form_submissions set status=p_status where id=p_submission_id returning * into v_submission;
  select * into v_form from public.cms_forms where id=v_submission.form_id;
  insert into public.cms_form_submission_events(submission_id,actor_id,action,details)
  values(p_submission_id,v_actor,'status_changed',jsonb_build_object('from',v_old_status,'to',p_status,'note',left(coalesce(trim(p_note),''),500)));
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details)
  values(v_actor,v_submission.form_id,v_submission.form_version_id,'submission_status_changed',jsonb_build_object('submission_id',p_submission_id,'status',p_status));
  return jsonb_build_object('id',v_submission.id,'status',v_submission.status,'updated_at',now());
end $$;

create or replace function public.cms_admin_export_form_submissions(p_form_id uuid,p_limit integer default 1000)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_rows jsonb; v_count integer;
begin
  v_actor:=cms_private.require_cms_form_export();
  if not exists(select 1 from public.cms_forms where id=p_form_id and kind='standard') then raise exception using errcode='P0002',message='Form not found'; end if;
  with selected as (
    select s.*,v.version_no,v.definition_json
    from public.cms_form_submissions s join public.cms_form_versions v on v.id=s.form_version_id and v.form_id=s.form_id
    where s.form_id=p_form_id and s.deleted_at is null order by s.submitted_at desc limit least(greatest(coalesce(p_limit,1000),1),1000)
  ), labelled as (
    select s.id,s.submitted_at,s.status,s.version_no,
      coalesce((select jsonb_agg(jsonb_build_object('label',field.value->>'label','key',field.value->>'key','value',s.answers_json->(field.value->>'key')) order by field.ordinality)
        from jsonb_array_elements(s.definition_json->'fields') with ordinality as field(value,ordinality) where s.answers_json ? (field.value->>'key')),'[]'::jsonb) as answers
    from selected s
  )
  select count(*),coalesce(jsonb_agg(to_jsonb(labelled) order by submitted_at desc),'[]'::jsonb) into v_count,v_rows from labelled;
  insert into public.cms_form_audit_events(actor_id,form_id,action,details)
  values(v_actor,p_form_id,'submissions_exported',jsonb_build_object('row_count',v_count));
  return jsonb_build_object('count',v_count,'rows',v_rows);
end $$;

revoke all on function public.cms_admin_list_form_submissions(uuid,text,integer,integer) from public,anon;
revoke all on function public.cms_admin_get_form_submission(uuid) from public,anon;
revoke all on function public.cms_admin_update_form_submission_status(uuid,text,text) from public,anon;
revoke all on function public.cms_admin_export_form_submissions(uuid,integer) from public,anon;
grant execute on function public.cms_admin_list_form_submissions(uuid,text,integer,integer) to authenticated;
grant execute on function public.cms_admin_get_form_submission(uuid) to authenticated;
grant execute on function public.cms_admin_update_form_submission_status(uuid,text,text) to authenticated;
grant execute on function public.cms_admin_export_form_submissions(uuid,integer) to authenticated;
