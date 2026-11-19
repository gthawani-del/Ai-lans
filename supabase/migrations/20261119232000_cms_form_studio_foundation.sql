-- M2.6-A: additive Form Studio foundation. Existing attendee/volunteer systems are not modified.

create table if not exists public.cms_form_studio_config (
  singleton boolean primary key default true check (singleton),
  studio_enabled boolean not null default true,
  public_submissions_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.cms_form_studio_config(singleton,studio_enabled,public_submissions_enabled)
values(true,true,false) on conflict(singleton) do nothing;

create table if not exists public.cms_form_template_registry (
  template_key text primary key,
  name text not null,
  summary text not null,
  complexity text not null check(complexity in ('Simple','Moderate')),
  starter_definition jsonb not null check(jsonb_typeof(starter_definition)='object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.cms_form_template_registry(template_key,name,summary,complexity,starter_definition) values
('contact_v1','Contact','Collect a general enquiry with a clear purpose and minimal fields.','Simple',
 '{"schema_version":1,"title":"General Enquiry","submit_label":"Send enquiry","success":{"type":"message","text":"Your message has been received."},"fields":[{"key":"full_name","type":"short_text","label":"Full name","required":true,"constraints":{"max_length":120}},{"key":"email","type":"email","label":"Email","required":true,"constraints":{"max_length":254}},{"key":"subject","type":"select","label":"Subject","required":true,"options":[{"value":"workshop","label":"Workshop"},{"value":"volunteering","label":"Volunteering"},{"value":"partnership","label":"Partnership"},{"value":"other","label":"Other"}]},{"key":"subject_other","type":"short_text","label":"Please specify","required":true,"constraints":{"max_length":120},"visibility":{"field_key":"subject","operator":"equals","value":"other"}},{"key":"message","type":"long_text","label":"Message","required":true,"constraints":{"max_length":3000}}]}'),
('workshop_registration_v1','Workshop Registration','Register interest in a verified workshop. This is separate from the protected attendee application.','Moderate',
 '{"schema_version":1,"title":"Workshop Registration","submit_label":"Submit registration","success":{"type":"message","text":"Your registration details have been received."},"fields":[{"key":"full_name","type":"short_text","label":"Full name","required":true,"constraints":{"max_length":120}},{"key":"email","type":"email","label":"Email","required":true,"constraints":{"max_length":254}},{"key":"phone","type":"phone","label":"Phone","required":false,"constraints":{"max_length":40}},{"key":"workshop_id","type":"select","label":"Workshop","required":true,"options":[]},{"key":"experience_level","type":"select","label":"Experience level","required":false,"options":[{"value":"beginner","label":"Beginner"},{"value":"some_experience","label":"Some experience"},{"value":"advanced","label":"Advanced"}]},{"key":"question","type":"long_text","label":"Question (optional)","required":false,"constraints":{"max_length":1000}}]}'),
('waitlist_v1','Waitlist','Collect interest for a future workshop or programme without implying newsletter consent.','Simple',
 '{"schema_version":1,"title":"Join the waitlist","submit_label":"Join waitlist","success":{"type":"message","text":"Your request has been received."},"fields":[{"key":"full_name","type":"short_text","label":"Full name","required":true,"constraints":{"max_length":120}},{"key":"email","type":"email","label":"Email","required":true,"constraints":{"max_length":254}},{"key":"interest","type":"select","label":"What are you interested in?","required":true,"options":[]},{"key":"city","type":"short_text","label":"City (optional)","required":false,"constraints":{"max_length":100}},{"key":"comments","type":"long_text","label":"Additional comments (optional)","required":false,"constraints":{"max_length":1000}}]}'),
('feedback_v1','Feedback / Survey','Collect a rating and optional comments; identity and quote consent are not assumed.','Simple',
 '{"schema_version":1,"title":"Share feedback","submit_label":"Send feedback","success":{"type":"message","text":"Your feedback has been received."},"fields":[{"key":"experience_rating","type":"rating","label":"How would you rate your experience?","required":true,"constraints":{"min":1,"max":5,"integer":true}},{"key":"what_worked","type":"long_text","label":"What worked well?","required":false,"constraints":{"max_length":2000}},{"key":"what_to_improve","type":"long_text","label":"What could be improved?","required":false,"constraints":{"max_length":2000}},{"key":"consent_to_quote","type":"boolean_checkbox","label":"I agree that my feedback may be quoted with my permission.","required":false,"default_value":false}]}'),
('newsletter_v1','Newsletter Signup','Collect an explicit optional subscription choice; no campaign sending is included.','Simple',
 '{"schema_version":1,"title":"Newsletter signup","submit_label":"Continue","success":{"type":"message","text":"Your request has been received."},"fields":[{"key":"email","type":"email","label":"Email","required":true,"constraints":{"max_length":254}},{"key":"first_name","type":"short_text","label":"First name (optional)","required":false,"constraints":{"max_length":120}},{"key":"marketing_opt_in","type":"boolean_checkbox","label":"I would like to receive marketing updates.","required":false,"default_value":false}]}'),
('custom_v1','Custom Blank','Start with a blank, controlled form definition. It cannot publish without a meaningful answer field and approved purpose and retention settings.','Moderate',
 '{"schema_version":1,"title":"Untitled form","submit_label":"Submit","success":{"type":"message","text":"Your response has been received."},"fields":[]}')
on conflict(template_key) do update set name=excluded.name,summary=excluded.summary,complexity=excluded.complexity,starter_definition=excluded.starter_definition,is_active=true,updated_at=now();

create table if not exists public.cms_form_retention_policies (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null unique,
  label text not null,
  purpose text not null,
  owner_approved boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check((owner_approved and approved_by is not null and approved_at is not null) or not owner_approved)
);

create table if not exists public.cms_forms (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique check(handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check(char_length(name) between 2 and 160),
  public_title text not null default '' check(char_length(public_title)<=160),
  template_key text not null references public.cms_form_template_registry(template_key),
  kind text not null default 'standard' check(kind in ('standard','protected')),
  lifecycle_status text not null default 'draft' check(lifecycle_status in ('draft','published','paused','archived')),
  purpose text not null default '',
  owner_user_id uuid references auth.users(id),
  retention_policy_id uuid references public.cms_form_retention_policies(id),
  draft_version_id uuid,
  published_version_id uuid,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.cms_forms(id) on delete restrict,
  version_no integer not null check(version_no>0),
  schema_version integer not null default 1 check(schema_version>0),
  definition_json jsonb not null check(jsonb_typeof(definition_json)='object'),
  validation_hash text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  published_by uuid references auth.users(id),
  published_at timestamptz,
  unique(form_id,version_no),
  unique(id,form_id)
);
alter table public.cms_forms drop constraint if exists cms_forms_draft_version_fk;
alter table public.cms_forms add constraint cms_forms_draft_version_fk foreign key(draft_version_id,id) references public.cms_form_versions(id,form_id) deferrable initially deferred;
alter table public.cms_forms drop constraint if exists cms_forms_published_version_fk;
alter table public.cms_forms add constraint cms_forms_published_version_fk foreign key(published_version_id,id) references public.cms_form_versions(id,form_id) deferrable initially deferred;

create or replace function cms_private.prevent_published_form_version_mutation()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if old.published_at is not null then raise exception using errcode='55000',message='Published form versions are immutable'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
drop trigger if exists cms_form_versions_immutable on public.cms_form_versions;
create trigger cms_form_versions_immutable before update or delete on public.cms_form_versions for each row execute function cms_private.prevent_published_form_version_mutation();

create table if not exists public.cms_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.cms_forms(id) on delete restrict,
  form_version_id uuid not null,
  submitted_at timestamptz not null default now(),
  answers_json jsonb not null check(jsonb_typeof(answers_json)='object'),
  source_page_id uuid references public.cms_pages(id) on delete set null,
  context_id text,
  status text not null default 'new' check(status in ('new','in_review','resolved','spam_review')),
  idempotency_key_hash text not null,
  schema_hash text not null default '',
  deleted_at timestamptz,
  unique(form_id,idempotency_key_hash),
  unique(id,form_id),
  foreign key(form_version_id,form_id) references public.cms_form_versions(id,form_id) on delete restrict
);
create index if not exists cms_form_submissions_form_submitted_idx on public.cms_form_submissions(form_id,submitted_at desc);

create table if not exists public.cms_form_submission_events (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.cms_form_submissions(id) on delete restrict,
  actor_id uuid references auth.users(id),
  action text not null,
  details jsonb not null default '{}'::jsonb check(jsonb_typeof(details)='object'),
  created_at timestamptz not null default now()
);

create table if not exists public.cms_form_consent_records (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.cms_form_submissions(id) on delete restrict,
  purpose text not null,
  policy_document_id text,
  policy_version_id text,
  policy_snapshot_hash text,
  accepted boolean not null check(accepted=true),
  accepted_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_form_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.cms_form_submissions(id) on delete restrict,
  rule_key text not null,
  status text not null default 'pending' check(status in ('pending','sent','retry','failed','disabled')),
  attempts integer not null default 0 check(attempts>=0),
  next_attempt_at timestamptz,
  provider_message_id text,
  last_error_code text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(submission_id,rule_key)
);

create table if not exists public.cms_form_page_usages (
  form_id uuid not null references public.cms_forms(id) on delete restrict,
  page_id uuid not null references public.cms_pages(id) on delete restrict,
  embed_mode text not null default 'follow_published' check(embed_mode in ('follow_published','pin_revision')),
  pinned_version_id uuid,
  updated_at timestamptz not null default now(),
  primary key(form_id,page_id),
  foreign key(pinned_version_id,form_id) references public.cms_form_versions(id,form_id) on delete restrict,
  check((embed_mode='pin_revision' and pinned_version_id is not null) or (embed_mode='follow_published' and pinned_version_id is null))
);

create table if not exists public.cms_form_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  form_id uuid references public.cms_forms(id) on delete set null,
  version_id uuid references public.cms_form_versions(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb check(jsonb_typeof(details)='object'),
  created_at timestamptz not null default now()
);

alter table public.cms_form_studio_config enable row level security;
alter table public.cms_form_template_registry enable row level security;
alter table public.cms_form_retention_policies enable row level security;
alter table public.cms_forms enable row level security;
alter table public.cms_form_versions enable row level security;
alter table public.cms_form_submissions enable row level security;
alter table public.cms_form_submission_events enable row level security;
alter table public.cms_form_consent_records enable row level security;
alter table public.cms_form_notification_outbox enable row level security;
alter table public.cms_form_page_usages enable row level security;
alter table public.cms_form_audit_events enable row level security;
revoke all on public.cms_form_studio_config,public.cms_form_template_registry,public.cms_form_retention_policies,public.cms_forms,public.cms_form_versions,public.cms_form_submissions,public.cms_form_submission_events,public.cms_form_consent_records,public.cms_form_notification_outbox,public.cms_form_page_usages,public.cms_form_audit_events from public,anon,authenticated;
grant all on public.cms_form_studio_config,public.cms_form_template_registry,public.cms_form_retention_policies,public.cms_forms,public.cms_form_versions,public.cms_form_submissions,public.cms_form_submission_events,public.cms_form_consent_records,public.cms_form_notification_outbox,public.cms_form_page_usages,public.cms_form_audit_events to service_role;
grant usage,select on sequence public.cms_form_submission_events_id_seq,public.cms_form_audit_events_id_seq to service_role;

create or replace function public.cms_admin_list_form_templates()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_rows jsonb;
begin
 v_actor:=cms_private.require_cms_super_admin();
 select coalesce(jsonb_agg(jsonb_build_object('template_key',template_key,'name',name,'summary',summary,'complexity',complexity,'starter_definition',starter_definition) order by name),'[]'::jsonb) into v_rows from public.cms_form_template_registry where is_active;
 return v_rows;
end $$;

create or replace function public.cms_admin_list_forms(p_query text default null,p_status text default null,p_template text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_enabled boolean; v_public_enabled boolean; v_rows jsonb;
begin
 v_actor:=cms_private.require_cms_super_admin();
 select studio_enabled,public_submissions_enabled into v_enabled,v_public_enabled from public.cms_form_studio_config where singleton;
 if not coalesce(v_enabled,false) then return jsonb_build_object('enabled',false,'public_submissions_enabled',false,'forms','[]'::jsonb); end if;
 with form_rows as (
  select f.id::text as id,f.handle,f.name,f.template_key,f.kind,f.lifecycle_status as status,
   (select count(*) from public.cms_form_submissions s where s.form_id=f.id and s.deleted_at is null) as response_count,
   (select count(distinct p.id) from public.cms_pages p join public.cms_page_revisions r on r.id=p.published_revision_id
    cross join lateral jsonb_array_elements(coalesce(r.document->'sections','[]'::jsonb)) as sections(section)
    where p.status='published' and sections.section->>'type'='form_embed' and sections.section->'props'->>'form_id'=f.id::text) as embedded_pages,
   f.updated_at,(select u.email from auth.users u where u.id=f.updated_by) as updated_by,
   null::text as public_path
  from public.cms_forms f
  where (coalesce(trim(p_query),'')='' or f.name ilike '%'||trim(p_query)||'%' or f.handle ilike '%'||trim(p_query)||'%')
    and (p_status is null or p_status in ('all',f.lifecycle_status))
    and (p_template is null or p_template in ('all',f.template_key))
  union all
  select 'protected-attendee','attendee-application','Attendee Application','attendee_protected','protected','protected',null::bigint,0::bigint,null::timestamptz,null::text,'/register'
  where (coalesce(trim(p_query),'')='' or 'attendee application' ilike '%'||trim(p_query)||'%' or 'attendee-application' ilike '%'||trim(p_query)||'%')
    and (p_status is null or p_status in ('all','protected')) and (p_template is null or p_template in ('all','attendee_protected'))
  union all
  select 'protected-volunteer','volunteer-application','Volunteer Application','volunteer_protected','protected','protected',null::bigint,0::bigint,null::timestamptz,null::text,'/volunteer/apply'
  where (coalesce(trim(p_query),'')='' or 'volunteer application' ilike '%'||trim(p_query)||'%' or 'volunteer-application' ilike '%'||trim(p_query)||'%')
    and (p_status is null or p_status in ('all','protected')) and (p_template is null or p_template in ('all','volunteer_protected'))
 )
 select coalesce(jsonb_agg(to_jsonb(f) order by (f.kind='protected') desc,f.updated_at desc nulls last,f.name),'[]'::jsonb) into v_rows from form_rows f;
 return jsonb_build_object('enabled',true,'public_submissions_enabled',coalesce(v_public_enabled,false),'forms',v_rows);
end $$;

revoke all on function public.cms_admin_list_form_templates() from public,anon;
revoke all on function public.cms_admin_list_forms(text,text,text) from public,anon;
grant execute on function public.cms_admin_list_form_templates() to authenticated;
grant execute on function public.cms_admin_list_forms(text,text,text) to authenticated;
