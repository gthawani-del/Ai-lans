-- M2.6-F: gated public form lifecycle. No owner privacy, retention, recipient,
-- or sender values are seeded. The production public gate remains off.

alter table public.cms_form_retention_policies
  add column if not exists retention_days integer check (retention_days is null or retention_days between 1 and 36500),
  add column if not exists review_owner text not null default '' check (char_length(review_owner)<=160),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.cms_form_privacy_policy_config (
  singleton boolean primary key default true check(singleton),
  document_id text not null default '',
  version_id text not null default '',
  public_url text not null default '',
  snapshot_hash text not null default '',
  owner_approved boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  check((owner_approved and approved_by is not null and approved_at is not null) or not owner_approved)
);
insert into public.cms_form_privacy_policy_config(singleton) values(true) on conflict(singleton) do nothing;

create table if not exists public.cms_form_notification_rules (
  form_id uuid primary key references public.cms_forms(id) on delete restrict,
  enabled boolean not null default false,
  recipient_email text not null default '' check(char_length(recipient_email)<=254),
  owner_approved boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  check((owner_approved and approved_by is not null and approved_at is not null) or not owner_approved)
);

create table if not exists public.cms_form_rate_limit_buckets (
  form_id uuid not null references public.cms_forms(id) on delete cascade,
  client_hash text not null check(client_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check(request_count>=0),
  updated_at timestamptz not null default now(),
  primary key(form_id,client_hash)
);
alter table public.cms_form_studio_config
  add column if not exists public_rate_limit_count integer not null default 10 check(public_rate_limit_count between 1 and 100),
  add column if not exists public_rate_limit_minutes integer not null default 60 check(public_rate_limit_minutes between 1 and 1440);
alter table public.cms_form_submissions add column if not exists payload_hash text not null default '';
create index if not exists cms_form_rate_limit_expiry_idx on public.cms_form_rate_limit_buckets(updated_at);

alter table public.cms_form_privacy_policy_config enable row level security;
alter table public.cms_form_notification_rules enable row level security;
alter table public.cms_form_rate_limit_buckets enable row level security;
revoke all on public.cms_form_privacy_policy_config,public.cms_form_notification_rules,public.cms_form_rate_limit_buckets from public,anon,authenticated;
grant all on public.cms_form_privacy_policy_config,public.cms_form_notification_rules,public.cms_form_rate_limit_buckets to service_role;

create or replace function public.cms_admin_set_form_privacy_policy(
  p_document_id text,p_version_id text,p_public_url text,p_snapshot_hash text,p_owner_approved boolean
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_row public.cms_form_privacy_policy_config%rowtype;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if p_owner_approved and (coalesce(trim(p_document_id),'')='' or coalesce(trim(p_version_id),'')='' or coalesce(trim(p_snapshot_hash),'')='' or coalesce(trim(p_public_url),'') !~ '^https://') then
    raise exception using errcode='22023',message='An approved policy needs its real document ID, version, HTTPS URL and snapshot hash';
  end if;
  update public.cms_form_privacy_policy_config set document_id=left(trim(coalesce(p_document_id,'')),160),version_id=left(trim(coalesce(p_version_id,'')),160),public_url=left(trim(coalesce(p_public_url,'')),1000),snapshot_hash=left(trim(coalesce(p_snapshot_hash,'')),128),owner_approved=coalesce(p_owner_approved,false),approved_by=case when p_owner_approved then v_actor else null end,approved_at=case when p_owner_approved then now() else null end,updated_at=now() where singleton returning * into v_row;
  insert into public.cms_form_audit_events(actor_id,action,details) values(v_actor,'privacy_policy_configured',jsonb_build_object('owner_approved',v_row.owner_approved,'document_id',v_row.document_id,'version_id',v_row.version_id));
  return jsonb_build_object('configured',v_row.owner_approved,'document_id',v_row.document_id,'version_id',v_row.version_id,'public_url',v_row.public_url);
end $$;

create or replace function public.cms_admin_save_form_retention_policy(p_policy_id uuid,p_policy_key text,p_label text,p_purpose text,p_retention_days integer,p_review_owner text,p_owner_approved boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_row public.cms_form_retention_policies%rowtype;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if p_retention_days is not null and p_retention_days not between 1 and 36500 then raise exception using errcode='22023',message='Retention days must be a valid positive period'; end if;
  if coalesce(trim(p_policy_key),'') !~ '^[a-z0-9][a-z0-9_-]{1,79}$' or char_length(trim(coalesce(p_label,''))) not between 2 and 160 or char_length(trim(coalesce(p_purpose,'')))<2 then raise exception using errcode='22023',message='Enter a valid category, label and purpose'; end if;
  if p_owner_approved and (p_retention_days is null or char_length(trim(coalesce(p_review_owner,'')))<2) then raise exception using errcode='22023',message='An approved retention category needs an owner-entered period and review owner'; end if;
  if p_policy_id is null then
    insert into public.cms_form_retention_policies(policy_key,label,purpose,retention_days,review_owner,owner_approved,approved_by,approved_at,updated_at)
    values(trim(p_policy_key),trim(p_label),trim(p_purpose),p_retention_days,left(trim(coalesce(p_review_owner,'')),160),coalesce(p_owner_approved,false),case when p_owner_approved then v_actor end,case when p_owner_approved then now() end,now()) returning * into v_row;
  else
    update public.cms_form_retention_policies set policy_key=trim(p_policy_key),label=trim(p_label),purpose=trim(p_purpose),retention_days=p_retention_days,review_owner=left(trim(coalesce(p_review_owner,'')),160),owner_approved=coalesce(p_owner_approved,false),approved_by=case when p_owner_approved then v_actor else null end,approved_at=case when p_owner_approved then now() else null end,updated_at=now() where id=p_policy_id returning * into v_row;
    if not found then raise exception using errcode='P0002',message='Retention category not found'; end if;
  end if;
  insert into public.cms_form_audit_events(actor_id,form_id,action,details) values(v_actor,null,'retention_policy_configured',jsonb_build_object('policy_id',v_row.id,'owner_approved',v_row.owner_approved,'retention_days',v_row.retention_days));
  return jsonb_build_object('id',v_row.id,'policy_key',v_row.policy_key,'label',v_row.label,'purpose',v_row.purpose,'retention_days',v_row.retention_days,'review_owner',v_row.review_owner,'owner_approved',v_row.owner_approved);
end $$;

create or replace function public.cms_admin_save_form_notification_rule(p_form_id uuid,p_enabled boolean,p_recipient_email text,p_owner_approved boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_row public.cms_form_notification_rules%rowtype; v_email text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if not exists(select 1 from public.cms_forms where id=p_form_id and kind='standard') then raise exception using errcode='P0002',message='Form not found'; end if;
  v_email:=lower(trim(coalesce(p_recipient_email,'')));
  if p_enabled and p_owner_approved and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception using errcode='22023',message='Enter a valid, owner-authorised notification recipient'; end if;
  insert into public.cms_form_notification_rules(form_id,enabled,recipient_email,owner_approved,approved_by,approved_at,updated_at)
  values(p_form_id,coalesce(p_enabled,false),v_email,coalesce(p_owner_approved,false),case when p_owner_approved then v_actor end,case when p_owner_approved then now() end,now())
  on conflict(form_id) do update set enabled=excluded.enabled,recipient_email=excluded.recipient_email,owner_approved=excluded.owner_approved,approved_by=excluded.approved_by,approved_at=excluded.approved_at,updated_at=now()
  returning * into v_row;
  insert into public.cms_form_audit_events(actor_id,form_id,action,details) values(v_actor,p_form_id,'notification_rule_configured',jsonb_build_object('enabled',v_row.enabled,'owner_approved',v_row.owner_approved));
  return jsonb_build_object('enabled',v_row.enabled,'configured',v_row.owner_approved,'recipient_email',v_row.recipient_email);
end $$;

create or replace function public.cms_admin_get_form_publication_settings(p_form_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_form public.cms_forms%rowtype; v_cfg public.cms_form_privacy_policy_config%rowtype; v_rule public.cms_form_notification_rules%rowtype; v_policies jsonb; v_gate boolean;
begin
 v_actor:=cms_private.require_cms_super_admin();
 select * into v_form from public.cms_forms where id=p_form_id and kind='standard';
 if not found then raise exception using errcode='P0002',message='Form not found'; end if;
 select * into v_cfg from public.cms_form_privacy_policy_config where singleton;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'policy_key',policy_key,'label',label,'purpose',purpose,'retention_days',retention_days,'review_owner',review_owner,'owner_approved',owner_approved) order by label),'[]'::jsonb) into v_policies from public.cms_form_retention_policies;
 select * into v_rule from public.cms_form_notification_rules where form_id=p_form_id;
 select public_submissions_enabled into v_gate from public.cms_form_studio_config where singleton;
 return jsonb_build_object('public_gate',coalesce(v_gate,false),'privacy_policy',jsonb_build_object('configured',coalesce(v_cfg.owner_approved,false),'document_id',v_cfg.document_id,'version_id',v_cfg.version_id,'public_url',v_cfg.public_url,'snapshot_hash',v_cfg.snapshot_hash),'retention_policies',v_policies,'retention_policy_id',v_form.retention_policy_id,'notification',jsonb_build_object('enabled',coalesce(v_rule.enabled,false),'configured',coalesce(v_rule.owner_approved,false),'recipient_email',coalesce(v_rule.recipient_email,''),'provider_configured',false));
end $$;

create or replace function public.cms_admin_set_form_retention(p_form_id uuid,p_policy_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_form public.cms_forms%rowtype;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if not exists(select 1 from public.cms_form_retention_policies where id=p_policy_id and owner_approved and retention_days is not null) then raise exception using errcode='22023',message='Choose an owner-approved retention category'; end if;
 update public.cms_forms set retention_policy_id=p_policy_id,updated_by=v_actor,updated_at=now() where id=p_form_id and kind='standard' returning * into v_form;
 if not found then raise exception using errcode='P0002',message='Form not found'; end if;
 insert into public.cms_form_audit_events(actor_id,form_id,action,details) values(v_actor,p_form_id,'retention_policy_assigned',jsonb_build_object('policy_id',p_policy_id));
 return jsonb_build_object('retention_policy_id',p_policy_id);
end $$;

create or replace function public.cms_admin_set_form_public_submissions_enabled(p_enabled boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_gate boolean;
begin
 v_actor:=cms_private.require_cms_super_admin();
 if coalesce(p_enabled,false) then
   if not exists(select 1 from public.cms_form_privacy_policy_config where singleton and owner_approved and char_length(version_id)>0 and char_length(snapshot_hash)>0 and public_url ~ '^https://') then raise exception using errcode='22023',message='Record the actual approved privacy policy version before enabling public forms'; end if;
   if not exists(select 1 from public.cms_form_retention_policies where owner_approved and retention_days is not null and char_length(review_owner)>1) then raise exception using errcode='22023',message='Add an owner-approved retention category before enabling public forms'; end if;
   if exists(select 1 from public.cms_forms where lifecycle_status='published' and (retention_policy_id is null or not exists(select 1 from public.cms_form_retention_policies rp where rp.id=cms_forms.retention_policy_id and rp.owner_approved and rp.retention_days is not null))) then raise exception using errcode='22023',message='Every published form must have an approved retention category'; end if;
 end if;
 update public.cms_form_studio_config set public_submissions_enabled=coalesce(p_enabled,false),updated_at=now() where singleton returning public_submissions_enabled into v_gate;
 insert into public.cms_form_audit_events(actor_id,action,details) values(v_actor,'public_submissions_gate_changed',jsonb_build_object('enabled',v_gate));
 return jsonb_build_object('public_submissions_enabled',v_gate);
end $$;

create or replace function public.cms_admin_publish_form(p_form_id uuid,p_expected_draft_version_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_form public.cms_forms%rowtype; v_version public.cms_form_versions%rowtype; v_policy public.cms_form_retention_policies%rowtype; v_privacy public.cms_form_privacy_policy_config%rowtype; v_public_enabled boolean; v_fields jsonb;
begin
 v_actor:=cms_private.require_cms_super_admin();
 select * into v_form from public.cms_forms where id=p_form_id and kind='standard' for update;
 if not found then raise exception using errcode='P0002',message='Form not found'; end if;
 if v_form.lifecycle_status='archived' then raise exception using errcode='55000',message='Archived forms must be restored before publishing'; end if;
 if v_form.draft_version_id is distinct from p_expected_draft_version_id then raise exception using errcode='40001',message='Draft changed in another session. Reload before publishing.'; end if;
 select * into v_version from public.cms_form_versions where id=v_form.draft_version_id and form_id=v_form.id;
 if not found then raise exception using errcode='P0002',message='A saved draft is required before publishing'; end if;
 if char_length(trim(v_form.purpose))<2 then raise exception using errcode='22023',message='A collection purpose is required'; end if;
 if jsonb_typeof(v_version.definition_json->'fields') is distinct from 'array' or jsonb_array_length(v_version.definition_json->'fields')>50 then raise exception using errcode='22023',message='The saved form schema is invalid'; end if;
 if not exists(select 1 from jsonb_array_elements(v_version.definition_json->'fields') f where f->>'type' not in ('section_text','hidden_context')) then raise exception using errcode='22023',message='Add at least one answer field before publishing'; end if;
 if exists(select 1 from jsonb_array_elements(v_version.definition_json->'fields') f where coalesce(f->>'label','')='' or (f->>'type' in ('select','radio','checkbox_group') and (jsonb_typeof(f->'options') is distinct from 'array' or jsonb_array_length(f->'options')=0))) then raise exception using errcode='22023',message='Every published field needs a label and choice fields need at least one option'; end if;
 if exists(select 1 from jsonb_array_elements(v_version.definition_json->'fields') f where f->>'type'='hidden_context') then raise exception using errcode='22023',message='Verified context fields require a configured trusted context adapter'; end if;
 select * into v_policy from public.cms_form_retention_policies where id=v_form.retention_policy_id and owner_approved and retention_days is not null;
 if not found then raise exception using errcode='22023',message='Assign an owner-approved retention category before publishing'; end if;
 select * into v_privacy from public.cms_form_privacy_policy_config where singleton and owner_approved and char_length(version_id)>0 and char_length(snapshot_hash)>0 and public_url ~ '^https://';
 if not found then raise exception using errcode='22023',message='Configure the approved privacy policy version before publishing'; end if;
 select public_submissions_enabled into v_public_enabled from public.cms_form_studio_config where singleton;
 if not coalesce(v_public_enabled,false) then raise exception using errcode='55000',message='Public form submissions are disabled by the production safety gate'; end if;
 update public.cms_form_versions set published_by=v_actor,published_at=now() where id=v_version.id and published_at is null;
 update public.cms_forms set published_version_id=v_version.id,lifecycle_status='published',updated_by=v_actor,updated_at=now() where id=v_form.id returning * into v_form;
 insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details) values(v_actor,v_form.id,v_version.id,'form_published',jsonb_build_object('version_no',v_version.version_no));
 return jsonb_build_object('form_id',v_form.id,'handle',v_form.handle,'published_version_id',v_version.id,'version_no',v_version.version_no,'published_at',v_version.published_at);
end $$;

create or replace function public.cms_public_get_form(p_handle text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_id uuid; v_gate boolean;
begin
 select public_submissions_enabled into v_gate from public.cms_form_studio_config where singleton;
 if not coalesce(v_gate,false) then return null; end if;
 select id into v_id from public.cms_forms where handle=lower(trim(coalesce(p_handle,''))) and kind='standard' and lifecycle_status='published';
 if not found then return null; end if;
 return public.cms_public_get_form_by_id(v_id);
end $$;

create or replace function public.cms_public_get_form_by_id(p_form_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_form public.cms_forms%rowtype; v_version public.cms_form_versions%rowtype; v_policy public.cms_form_retention_policies%rowtype; v_privacy public.cms_form_privacy_policy_config%rowtype; v_gate boolean;
begin
 select public_submissions_enabled into v_gate from public.cms_form_studio_config where singleton;
 if not coalesce(v_gate,false) then return null; end if;
 select * into v_form from public.cms_forms where id=p_form_id and kind='standard' and lifecycle_status='published';
 if not found then return null; end if;
 select * into v_version from public.cms_form_versions where id=v_form.published_version_id and form_id=v_form.id and published_at is not null;
 if not found then return null; end if;
 select * into v_policy from public.cms_form_retention_policies where id=v_form.retention_policy_id and owner_approved and retention_days is not null;
 select * into v_privacy from public.cms_form_privacy_policy_config where singleton and owner_approved;
 if not found or v_policy.id is null then return null; end if;
 return jsonb_build_object('id',v_form.id,'handle',v_form.handle,'title',v_version.definition_json->>'title','description',v_version.definition_json->>'description','submit_label',v_version.definition_json->>'submit_label','success',jsonb_build_object('type','message','text',coalesce(v_version.definition_json->'success'->>'text','Your response has been received.')),'fields',v_version.definition_json->'fields','version_id',v_version.id,'version_no',v_version.version_no,'availability_status',v_form.availability_status,'closed_message',coalesce(nullif(v_form.closed_message,''),'This form is currently closed.'),'privacy_policy',jsonb_build_object('url',v_privacy.public_url,'version_id',v_privacy.version_id),'consent_policy',jsonb_build_object('document_id',v_privacy.document_id,'version_id',v_privacy.version_id,'snapshot_hash',v_privacy.snapshot_hash));
end $$;

create or replace function public.cms_private_consume_form_rate_limit(p_form_id uuid,p_client_hash text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_count integer; v_minutes integer; v_max integer; v_started timestamptz; v_now timestamptz:=clock_timestamp();
begin
 if p_client_hash !~ '^[a-f0-9]{64}$' then return false; end if;
 select public_rate_limit_count,public_rate_limit_minutes into v_max,v_minutes from public.cms_form_studio_config where singleton and public_submissions_enabled;
 if not found then return false; end if;
 insert into public.cms_form_rate_limit_buckets(form_id,client_hash,window_started_at,request_count,updated_at) values(p_form_id,p_client_hash,v_now,1,v_now)
 on conflict(form_id,client_hash) do update set window_started_at=case when cms_form_rate_limit_buckets.window_started_at+make_interval(mins=>v_minutes)<=v_now then v_now else cms_form_rate_limit_buckets.window_started_at end,
 request_count=case when cms_form_rate_limit_buckets.window_started_at+make_interval(mins=>v_minutes)<=v_now then 1 else cms_form_rate_limit_buckets.request_count+1 end,updated_at=v_now
 returning request_count into v_count;
 delete from public.cms_form_rate_limit_buckets where updated_at < v_now-interval '48 hours';
 return v_count<=v_max;
end $$;

create or replace function public.cms_public_submit_form(
 p_form_id uuid,p_version_id uuid,p_answers jsonb,p_source_page_id uuid,p_context_id text,p_idempotency_hash text,p_client_hash text,p_consents jsonb
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_form public.cms_forms%rowtype; v_version public.cms_form_versions%rowtype; v_policy public.cms_form_retention_policies%rowtype; v_privacy public.cms_form_privacy_policy_config%rowtype; v_submission public.cms_form_submissions%rowtype; v_existing public.cms_form_submissions%rowtype; v_outbox public.cms_form_notification_outbox%rowtype; v_rule public.cms_form_notification_rules%rowtype; v_gate boolean; v_field jsonb; v_key text;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Service role required'; end if;
 if jsonb_typeof(p_answers) is distinct from 'object' or octet_length(p_answers::text)>24000 then raise exception using errcode='22023',message='Invalid submission payload'; end if;
 if jsonb_typeof(p_consents) is distinct from 'array' or jsonb_array_length(p_consents)>20 then raise exception using errcode='22023',message='Invalid consent evidence'; end if;
 if p_idempotency_hash !~ '^[a-f0-9]{64}$' or p_client_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023',message='Invalid submission protection token'; end if;
 select public_submissions_enabled into v_gate from public.cms_form_studio_config where singleton;
 if not coalesce(v_gate,false) then raise exception using errcode='55000',message='Public submissions are disabled'; end if;
 select * into v_form from public.cms_forms where id=p_form_id and lifecycle_status='published' and availability_status='open' for share;
 if not found or v_form.published_version_id is distinct from p_version_id then raise exception using errcode='40001',message='This form has changed or is unavailable. Reload the page.'; end if;
 if p_source_page_id is not null and not exists(
   select 1 from public.cms_pages p join public.cms_page_revisions r on r.id=p.published_revision_id
   cross join lateral jsonb_array_elements(coalesce(r.document->'sections','[]'::jsonb)) section
   where p.id=p_source_page_id and p.status='published' and section.value->>'type'='form_embed'
   and section.value->'props'->>'form_id'=p_form_id::text
 ) then raise exception using errcode='22023',message='This form embed is not available on the requested page'; end if;
 select * into v_version from public.cms_form_versions where id=p_version_id and form_id=p_form_id and published_at is not null;
 if not found then raise exception using errcode='40001',message='This form has changed or is unavailable. Reload the page.'; end if;
 select * into v_policy from public.cms_form_retention_policies where id=v_form.retention_policy_id and owner_approved and retention_days is not null;
 select * into v_privacy from public.cms_form_privacy_policy_config where singleton and owner_approved;
 if v_policy.id is null or v_privacy.version_id is null then raise exception using errcode='55000',message='Required privacy configuration is unavailable'; end if;
 select * into v_existing from public.cms_form_submissions where form_id=p_form_id and idempotency_key_hash=p_idempotency_hash;
 if found then
   if v_existing.payload_hash=md5(p_answers::text) and v_existing.form_version_id=p_version_id then return jsonb_build_object('ok',true,'submission_id',v_existing.id,'duplicate',true); end if;
   raise exception using errcode='40001',message='The request key was already used for a different response. Reload and submit again.';
 end if;
 if exists(select 1 from jsonb_object_keys(p_answers) k where k ~ '(^__proto__$|^constructor$|^prototype$|^_.*$)') then raise exception using errcode='22023',message='Unsupported answer key'; end if;
 insert into public.cms_form_submissions(form_id,form_version_id,answers_json,source_page_id,context_id,idempotency_key_hash,schema_hash,payload_hash)
 values(p_form_id,p_version_id,p_answers,p_source_page_id,null,p_idempotency_hash,v_version.validation_hash,md5(p_answers::text))
 on conflict(form_id,idempotency_key_hash) do nothing returning * into v_submission;
 if not found then
   select * into v_existing from public.cms_form_submissions where form_id=p_form_id and idempotency_key_hash=p_idempotency_hash;
   if found then
     if v_existing.payload_hash=md5(p_answers::text) and v_existing.form_version_id=p_version_id then return jsonb_build_object('ok',true,'submission_id',v_existing.id,'duplicate',true); end if;
     raise exception using errcode='40001',message='The request key was already used for a different response. Reload and submit again.';
   end if;
   raise exception using errcode='40001',message='Submission could not be confirmed. Retry with the same request key.';
 end if;
 for v_field in select value from jsonb_array_elements(v_version.definition_json->'fields') loop
   v_key:=v_field->>'key';
   if v_field->>'type'='consent' and p_answers->>v_key='true' and p_consents ? v_key then
     insert into public.cms_form_consent_records(submission_id,purpose,policy_document_id,policy_version_id,policy_snapshot_hash,accepted,accepted_at)
     values(v_submission.id,left(coalesce(v_field->>'label',v_form.purpose),500),v_privacy.document_id,v_privacy.version_id,v_privacy.snapshot_hash,true,now());
   elsif v_field->>'type'='boolean_checkbox' and v_key='marketing_opt_in' and p_answers->>v_key='true' and p_consents ? v_key then
     insert into public.cms_form_consent_records(submission_id,purpose,policy_document_id,policy_version_id,policy_snapshot_hash,accepted,accepted_at)
     values(v_submission.id,'Optional marketing updates',v_privacy.document_id,v_privacy.version_id,v_privacy.snapshot_hash,true,now());
   end if;
 end loop;
 insert into public.cms_form_submission_events(submission_id,action,details) values(v_submission.id,'submitted',jsonb_build_object('version_id',p_version_id,'source_page_id',p_source_page_id is not null));
 select * into v_rule from public.cms_form_notification_rules where form_id=p_form_id;
 if coalesce(v_rule.enabled,false) and coalesce(v_rule.owner_approved,false) and char_length(v_rule.recipient_email)>3 then
   insert into public.cms_form_notification_outbox(submission_id,rule_key,status,last_error_code) values(v_submission.id,'new_submission','pending','delivery_pending') on conflict(submission_id,rule_key) do nothing returning * into v_outbox;
 else
   insert into public.cms_form_notification_outbox(submission_id,rule_key,status,last_error_code) values(v_submission.id,'new_submission','disabled','recipient_not_configured') on conflict(submission_id,rule_key) do nothing;
 end if;
 return jsonb_build_object('ok',true,'submission_id',v_submission.id,'outbox_id',v_outbox.id,'duplicate',false,'notification_status',case when v_outbox.id is not null then 'pending' else 'disabled' end);
end $$;

create or replace function public.cms_service_get_form_notification(p_outbox_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_row public.cms_form_notification_outbox%rowtype; v_form public.cms_forms%rowtype; v_rule public.cms_form_notification_rules%rowtype; v_submission public.cms_form_submissions%rowtype;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Service role required'; end if;
 select * into v_row from public.cms_form_notification_outbox where id=p_outbox_id and status in ('pending','retry');
 if not found then return null; end if;
 select * into v_submission from public.cms_form_submissions where id=v_row.submission_id;
 select * into v_form from public.cms_forms where id=v_submission.form_id;
 select * into v_rule from public.cms_form_notification_rules where form_id=v_form.id and enabled and owner_approved;
 if not found or v_rule.recipient_email='' then return null; end if;
 return jsonb_build_object('outbox_id',v_row.id,'recipient_email',v_rule.recipient_email,'form_name',v_form.name,'form_handle',v_form.handle,'submission_id',v_submission.id);
end $$;

create or replace function public.cms_admin_get_form_submission(p_submission_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_submission public.cms_form_submissions%rowtype; v_version public.cms_form_versions%rowtype; v_form public.cms_forms%rowtype; v_consents jsonb; v_notification jsonb;
begin
 v_actor:=cms_private.require_cms_super_admin();
 select * into v_submission from public.cms_form_submissions where id=p_submission_id and deleted_at is null;
 if not found then raise exception using errcode='P0002',message='Submission not found'; end if;
 select * into v_form from public.cms_forms where id=v_submission.form_id;
 select * into v_version from public.cms_form_versions where id=v_submission.form_version_id and form_id=v_submission.form_id;
 select coalesce(jsonb_agg(jsonb_build_object('purpose',purpose,'policy_document_id',policy_document_id,'policy_version_id',policy_version_id,'policy_snapshot_hash',policy_snapshot_hash,'accepted',accepted,'accepted_at',accepted_at) order by created_at),'[]'::jsonb) into v_consents from public.cms_form_consent_records where submission_id=p_submission_id;
 select jsonb_build_object('id',id,'status',status,'attempts',attempts,'last_error_code',last_error_code,'sent_at',sent_at) into v_notification from public.cms_form_notification_outbox where submission_id=p_submission_id and rule_key='new_submission';
 if v_notification is null then v_notification:=jsonb_build_object('status','disabled','last_error_code','notification_not_configured'); end if;
 insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details) values(v_actor,v_form.id,v_version.id,'submission_viewed',jsonb_build_object('submission_id',p_submission_id));
 return jsonb_build_object('form',jsonb_build_object('id',v_form.id,'name',v_form.name,'handle',v_form.handle),'submission',jsonb_build_object('id',v_submission.id,'submitted_at',v_submission.submitted_at,'status',v_submission.status,'answers',v_submission.answers_json,'context_id',v_submission.context_id,'version_id',v_version.id,'version_no',v_version.version_no,'definition',v_version.definition_json,'consents',v_consents),'notification',v_notification);
end $$;

create or replace function public.cms_admin_retry_form_notification(p_submission_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_outbox public.cms_form_notification_outbox%rowtype; v_submission public.cms_form_submissions%rowtype;
begin
 v_actor:=cms_private.require_cms_super_admin();
 select * into v_submission from public.cms_form_submissions where id=p_submission_id and deleted_at is null;
 if not found then raise exception using errcode='P0002',message='Submission not found'; end if;
 if not exists(select 1 from public.cms_form_notification_rules where form_id=v_submission.form_id and enabled and owner_approved and recipient_email<>'') then raise exception using errcode='22023',message='No owner-approved notification recipient is configured for this form'; end if;
 update public.cms_form_notification_outbox set status='pending',next_attempt_at=null,last_error_code='manual_retry_requested' where submission_id=p_submission_id and rule_key='new_submission' and status in ('retry','failed','disabled') returning * into v_outbox;
 if not found then raise exception using errcode='55000',message='Notification is already sent or has no retryable outbox record'; end if;
 insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details) values(v_actor,v_submission.form_id,v_submission.form_version_id,'notification_retry_requested',jsonb_build_object('submission_id',p_submission_id,'outbox_id',v_outbox.id));
 return jsonb_build_object('outbox_id',v_outbox.id,'status',v_outbox.status);
end $$;

create or replace function public.cms_service_mark_form_notification(p_outbox_id uuid,p_status text,p_error_code text default null,p_provider_message_id text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_row public.cms_form_notification_outbox%rowtype;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Service role required'; end if;
 if p_status not in ('sent','retry','failed','disabled') then raise exception using errcode='22023',message='Invalid notification status'; end if;
 update public.cms_form_notification_outbox set status=p_status,attempts=attempts+case when p_status in ('sent','retry','failed') then 1 else 0 end,next_attempt_at=case when p_status='retry' then now()+make_interval(mins=>least(60,greatest(1,attempts*5))) else null end,provider_message_id=left(coalesce(p_provider_message_id,''),200),last_error_code=left(coalesce(p_error_code,''),80),sent_at=case when p_status='sent' then now() else null end where id=p_outbox_id returning * into v_row;
 if not found then raise exception using errcode='P0002',message='Notification outbox row not found'; end if;
 return jsonb_build_object('id',v_row.id,'status',v_row.status,'attempts',v_row.attempts);
end $$;

revoke all on function public.cms_admin_set_form_privacy_policy(text,text,text,text,boolean) from public,anon;
revoke all on function public.cms_admin_save_form_retention_policy(uuid,text,text,text,integer,text,boolean) from public,anon;
revoke all on function public.cms_admin_save_form_notification_rule(uuid,boolean,text,boolean) from public,anon;
revoke all on function public.cms_admin_get_form_publication_settings(uuid) from public,anon;
revoke all on function public.cms_admin_set_form_retention(uuid,uuid) from public,anon;
revoke all on function public.cms_admin_set_form_public_submissions_enabled(boolean) from public,anon;
revoke all on function public.cms_admin_publish_form(uuid,uuid) from public,anon;
revoke all on function public.cms_public_get_form(text) from public;
revoke all on function public.cms_public_get_form_by_id(uuid) from public;
revoke all on function public.cms_private_consume_form_rate_limit(uuid,text) from public,anon,authenticated;
revoke all on function public.cms_public_submit_form(uuid,uuid,jsonb,uuid,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.cms_service_mark_form_notification(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.cms_service_get_form_notification(uuid) from public,anon,authenticated;
revoke all on function public.cms_admin_retry_form_notification(uuid) from public,anon;
grant execute on function public.cms_admin_set_form_privacy_policy(text,text,text,text,boolean) to authenticated;
grant execute on function public.cms_admin_save_form_retention_policy(uuid,text,text,text,integer,text,boolean) to authenticated;
grant execute on function public.cms_admin_save_form_notification_rule(uuid,boolean,text,boolean) to authenticated;
grant execute on function public.cms_admin_get_form_publication_settings(uuid) to authenticated;
grant execute on function public.cms_admin_set_form_retention(uuid,uuid) to authenticated;
grant execute on function public.cms_admin_set_form_public_submissions_enabled(boolean) to authenticated;
grant execute on function public.cms_admin_publish_form(uuid,uuid) to authenticated;
grant execute on function public.cms_public_get_form(text) to anon,authenticated,service_role;
grant execute on function public.cms_public_get_form_by_id(uuid) to anon,authenticated,service_role;
grant execute on function public.cms_private_consume_form_rate_limit(uuid,text) to service_role;
grant execute on function public.cms_public_submit_form(uuid,uuid,jsonb,uuid,text,text,text,jsonb) to service_role;
grant execute on function public.cms_service_mark_form_notification(uuid,text,text,text) to service_role;
grant execute on function public.cms_service_get_form_notification(uuid) to service_role;
grant execute on function public.cms_admin_retry_form_notification(uuid) to authenticated;
