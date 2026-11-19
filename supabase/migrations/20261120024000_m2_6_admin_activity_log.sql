-- Shared append-only, PII-minimised activity log for current and future backoffice modules.
create table if not exists public.admin_activity_log (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 actor_type text not null check(actor_type in ('admin','public','system')),
 module text not null check(module ~ '^[a-z][a-z0-9_-]{0,39}$'),
 action text not null check(action ~ '^[a-z][a-z0-9_-]{0,79}$'),
 entity_type text not null check(entity_type ~ '^[a-z][a-z0-9_-]{0,39}$'),
 entity_id text not null default '' check(char_length(entity_id)<=160),
 outcome text not null check(outcome in ('success','failed','denied')),
 metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'),
 occurred_at timestamptz not null default now()
);
create index if not exists admin_activity_log_time_idx on public.admin_activity_log(occurred_at desc);
create index if not exists admin_activity_log_module_action_idx on public.admin_activity_log(module,action,occurred_at desc);
create index if not exists admin_activity_log_entity_idx on public.admin_activity_log(entity_type,entity_id,occurred_at desc);
alter table public.admin_activity_log enable row level security;
revoke all on public.admin_activity_log from public,anon,authenticated;
grant all on public.admin_activity_log to service_role;

create or replace function cms_private.admin_activity_safe_metadata(p jsonb)
returns jsonb language sql immutable set search_path=pg_catalog as $$
 select coalesce(jsonb_strip_nulls(jsonb_build_object(
  'template_key',case when p->>'template_key' ~ '^[a-z0-9_-]{1,80}$' then p->>'template_key' end,
  'version_no',case when coalesce(p->>'version_no','') ~ '^[0-9]{1,6}$' then (p->>'version_no')::int end,
  'revision_number',case when coalesce(p->>'revision_number','') ~ '^[0-9]{1,6}$' then (p->>'revision_number')::int end,
  'section_count',case when coalesce(p->>'section_count','') ~ '^[0-9]{1,6}$' then (p->>'section_count')::int end,
  'row_count',case when coalesce(p->>'row_count','') ~ '^[0-9]{1,9}$' then (p->>'row_count')::int end,
  'retention_days',case when coalesce(p->>'retention_days','') ~ '^[0-9]{1,5}$' then (p->>'retention_days')::int end,
  'owner_approved',case when p->>'owner_approved' in ('true','false') then (p->>'owner_approved')::boolean end,
  'accepted',case when p->>'accepted' in ('true','false') then (p->>'accepted')::boolean end,
  'policy_version_id',case when coalesce(p->>'policy_version_id','') ~ '^[A-Za-z0-9._-]{1,80}$' then p->>'policy_version_id' end,
  'document_id',case when p->>'document_id'='/privacy' then '/privacy' end,
  'reason_code',case when coalesce(p->>'reason_code','') ~ '^[a-z0-9_-]{1,40}$' then p->>'reason_code' end,
  'route',case when p->>'route' ~ '^/backoffice(/[a-z0-9_-]+)*$' then p->>'route' end
  )), '{}'::jsonb)
$$;
revoke all on function cms_private.admin_activity_safe_metadata(jsonb) from public,anon,authenticated;

create or replace function cms_private.write_admin_activity(p_actor_id uuid,p_actor_type text,p_module text,p_action text,p_entity_type text,p_entity_id text,p_outcome text,p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path=pg_catalog,public,cms_private as $$
 insert into public.admin_activity_log(actor_id,actor_type,module,action,entity_type,entity_id,outcome,metadata)
 values(p_actor_id,p_actor_type,p_module,p_action,p_entity_type,left(coalesce(p_entity_id,''),160),p_outcome,cms_private.admin_activity_safe_metadata(coalesce(p_metadata,'{}'::jsonb)))
$$;
revoke all on function cms_private.write_admin_activity(uuid,text,text,text,text,text,text,jsonb) from public,anon,authenticated;

create or replace function cms_private.log_form_audit_activity()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a text; et text:='form'; ei text; md jsonb:=coalesce(new.details,'{}'::jsonb);
begin
 a:=case new.action when 'form_created' then 'form_created' when 'form_draft_saved' then 'form_edited' when 'form_published' then 'form_published' when 'form_archived' then 'form_archived' when 'submissions_listed' then 'submissions_viewed' when 'submission_viewed' then 'submission_viewed' when 'submission_status_changed' then 'submission_edited' when 'submissions_exported' then 'submission_exported' when 'privacy_policy_configured' then 'privacy_configuration_changed' when 'retention_policy_configured' then 'retention_configuration_changed' when 'retention_policy_assigned' then 'retention_assigned' when 'notification_rule_configured' then 'notification_configuration_changed' else case when new.action ~ '^[a-z][a-z0-9_-]{0,79}$' then new.action else 'form_activity' end end;
 ei:=coalesce(new.form_id::text,'');
 if md->>'submission_id' ~* '^[0-9a-f-]{36}$' then et:='submission'; ei:=md->>'submission_id'; end if;
 if md->>'policy_id' ~* '^[0-9a-f-]{36}$' then et:='retention_policy'; ei:=md->>'policy_id'; end if;
 if new.action='submissions_exported' then md:=jsonb_build_object('row_count',md->>'row_count'); end if;
 perform cms_private.write_admin_activity(new.actor_id,'admin','forms',a,et,ei,'success',md);
 return new;
end $$;
create trigger cms_form_audit_to_admin_activity after insert on public.cms_form_audit_events for each row execute function cms_private.log_form_audit_activity();

create or replace function cms_private.log_cms_audit_activity()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
begin
 perform cms_private.write_admin_activity(new.actor_id,'admin','pages',case when new.action ~ '^[a-z][a-z0-9_-]{0,79}$' then new.action else 'page_activity' end,'page',new.page_id::text,'success',new.details);
 return new;
end $$;
create trigger cms_audit_to_admin_activity after insert on public.cms_audit_events for each row execute function cms_private.log_cms_audit_activity();

create or replace function cms_private.log_submission_activity()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
begin
 if tg_op='INSERT' then perform cms_private.write_admin_activity(null,'public','forms','submission_received','submission',new.id::text,'success',jsonb_build_object('form_id',new.form_id::text)); return new; end if;
 if old.deleted_at is null and new.deleted_at is not null then perform cms_private.write_admin_activity(auth.uid(),'admin','forms','submission_deleted','submission',new.id::text,'success',jsonb_build_object('form_id',new.form_id::text)); end if;
 return new;
end $$;
create trigger cms_submission_activity after insert or update of deleted_at on public.cms_form_submissions for each row execute function cms_private.log_submission_activity();

create or replace function cms_private.log_consent_activity()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare r public.cms_form_consent_records%rowtype; ac text; a uuid; at text; md jsonb;
begin
 if tg_op='DELETE' then r:=old; ac:='consent_deleted'; a:=auth.uid(); at:='admin'; md:=jsonb_build_object('policy_version_id',r.policy_version_id);
 elsif tg_op='UPDATE' then r:=new; ac:='consent_updated'; a:=auth.uid(); at:='admin'; md:=jsonb_build_object('policy_version_id',r.policy_version_id,'accepted',r.accepted);
 else r:=new; ac:='consent_recorded'; a:=null; at:='public'; md:=jsonb_build_object('policy_version_id',r.policy_version_id,'accepted',r.accepted); end if;
 perform cms_private.write_admin_activity(a,at,'forms',ac,'submission',r.submission_id::text,'success',md);
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger cms_consent_activity after insert or update or delete on public.cms_form_consent_records for each row execute function cms_private.log_consent_activity();

create or replace function cms_private.log_media_activity()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare r public.cms_media_assets%rowtype; a uuid; ac text;
begin
 if tg_op='DELETE' then r:=old; a:=auth.uid(); ac:='media_deleted'; elsif tg_op='INSERT' then r:=new; a:=new.created_by; ac:='media_created'; else r:=new; a:=auth.uid(); ac:='media_updated'; end if;
 perform cms_private.write_admin_activity(a,'admin','media',ac,'media_asset',r.id::text,'success',jsonb_build_object('mime_type',r.mime_type,'file_size',r.file_size,'status',r.status));
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger cms_media_activity after insert or update or delete on public.cms_media_assets for each row execute function cms_private.log_media_activity();

create or replace function cms_private.log_export_permission_activity()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; u uuid; enabled boolean;
begin
 if tg_op='DELETE' then a:=coalesce(old.revoked_by,old.granted_by); u:=old.user_id; enabled:=false;
 elsif tg_op='INSERT' then a:=new.granted_by; u:=new.user_id; enabled:=new.revoked_at is null;
 else a:=coalesce(new.revoked_by,new.granted_by); u:=new.user_id; enabled:=new.revoked_at is null; end if;
 perform cms_private.write_admin_activity(a,'admin','forms',case when enabled then 'export_permission_granted' else 'export_permission_revoked' end,'admin_account',u::text,'success','{}'::jsonb);
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger cms_export_permission_activity after insert or update or delete on public.cms_form_export_grants for each row execute function cms_private.log_export_permission_activity();

create function public.cms_admin_record_activity(p_action text,p_module text,p_route text default '',p_outcome text default 'success',p_entity_type text default 'backoffice_route',p_entity_id text default '')
returns void language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid:=auth.uid();
begin
 if a is null or not exists(select 1 from public.backoffice_users where user_id=a and is_active) then raise exception using errcode='42501',message='Active backoffice account required'; end if;
 if p_module not in ('dashboard','pages','media','forms','configuration','system','attendees','volunteers','workshop') or not ((p_action in ('admin_accessed','admin_login_succeeded') and p_outcome='success') or (p_action='export_denied' and p_module='forms' and p_outcome='denied')) or p_entity_type not in ('backoffice_route','form') then raise exception using errcode='22023',message='Unsupported admin activity'; end if;
 perform cms_private.write_admin_activity(a,'admin',p_module,p_action,p_entity_type,left(regexp_replace(coalesce(p_entity_id,''),'[^a-z0-9/_-]','','gi'),160),p_outcome,jsonb_build_object('route',left(regexp_replace(coalesce(p_route,''),'[^a-z0-9/_-]','','gi'),100)));
end $$;
revoke all on function public.cms_admin_record_activity(text,text,text,text,text,text) from public,anon;
grant execute on function public.cms_admin_record_activity(text,text,text,text,text,text) to authenticated;

create or replace function public.cms_admin_list_activity_log(p_query text default '',p_module text default '',p_action text default '',p_outcome text default '',p_from timestamptz default null,p_to timestamptz default null,p_limit integer default 50,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare q text:=left(trim(coalesce(p_query,'')),120); lim int:=least(greatest(coalesce(p_limit,50),1),100); off int:=greatest(coalesce(p_offset,0),0); total bigint; rows jsonb; actions jsonb;
begin
 perform cms_private.require_cms_super_admin();
 if coalesce(p_module,'')<>'' and p_module not in ('forms','pages','media','dashboard','configuration','system','attendees','volunteers','workshop') then raise exception using errcode='22023',message='Invalid module filter'; end if;
 if coalesce(p_outcome,'')<>'' and p_outcome not in ('success','failed','denied') then raise exception using errcode='22023',message='Invalid outcome filter'; end if;
 if p_from is not null and p_to is not null and p_to<p_from then raise exception using errcode='22023',message='End date must be after start date'; end if;
 select count(*) into total from public.admin_activity_log l left join public.backoffice_users b on b.user_id=l.actor_id where (coalesce(p_module,'')='' or l.module=p_module) and (coalesce(p_action,'')='' or l.action=p_action) and (coalesce(p_outcome,'')='' or l.outcome=p_outcome) and (p_from is null or l.occurred_at>=p_from) and (p_to is null or l.occurred_at<p_to) and (q='' or concat_ws(' ',b.email,l.module,l.action,l.entity_type,l.entity_id,l.outcome) ilike '%'||replace(replace(q,'%','\%'),'_','\_')||'%');
 select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'actor_id',x.actor_id,'actor_email',x.email,'actor_type',x.actor_type,'module',x.module,'action',x.action,'entity_type',x.entity_type,'entity_id',x.entity_id,'outcome',x.outcome,'metadata',x.metadata,'occurred_at',x.occurred_at) order by x.occurred_at desc),'[]'::jsonb) into rows from (select l.*,b.email from public.admin_activity_log l left join public.backoffice_users b on b.user_id=l.actor_id where (coalesce(p_module,'')='' or l.module=p_module) and (coalesce(p_action,'')='' or l.action=p_action) and (coalesce(p_outcome,'')='' or l.outcome=p_outcome) and (p_from is null or l.occurred_at>=p_from) and (p_to is null or l.occurred_at<p_to) and (q='' or concat_ws(' ',b.email,l.module,l.action,l.entity_type,l.entity_id,l.outcome) ilike '%'||replace(replace(q,'%','\%'),'_','\_')||'%') order by l.occurred_at desc limit lim offset off) x;
 select coalesce(jsonb_agg(z.action order by z.action),'[]'::jsonb) into actions from (select distinct action from public.admin_activity_log) z;
 return jsonb_build_object('count',total,'limit',lim,'offset',off,'rows',rows,'actions',actions);
end $$;
revoke all on function public.cms_admin_list_activity_log(text,text,text,text,timestamptz,timestamptz,integer,integer) from public,anon;
grant execute on function public.cms_admin_list_activity_log(text,text,text,text,timestamptz,timestamptz,integer,integer) to authenticated;

-- Super-admin-only reference to the already approved privacy policy v1.2.
create or replace function public.cms_admin_set_existing_privacy_v12()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
begin perform cms_private.require_cms_super_admin(); return public.cms_admin_set_form_privacy_policy('/privacy','1.2','https://weareailabs.com/privacy','264cfbf1afc969a2eb2ba3fba429399c88b298dbd1e5efa8741ce8782e8a1766',true); end $$;
revoke all on function public.cms_admin_set_existing_privacy_v12() from public,anon;
grant execute on function public.cms_admin_set_existing_privacy_v12() to authenticated;

-- Register the approved 12-month schedule without assigning it to other forms.
create or replace function public.cms_admin_register_existing_future_opportunities_retention()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid:=cms_private.require_cms_super_admin(); v uuid;
begin select id into v from public.cms_form_retention_policies where policy_key='future-opportunities-12m'; return public.cms_admin_save_form_retention_policy(v,'future-opportunities-12m','Separately opted-in future opportunities','Separately opted-in future opportunities; renew permission after 12 months from opt-in.',365,'eliv8Lyf',true); end $$;
revoke all on function public.cms_admin_register_existing_future_opportunities_retention() from public,anon;
grant execute on function public.cms_admin_register_existing_future_opportunities_retention() to authenticated;

create or replace function public.cms_admin_set_form_retention(p_form_id uuid,p_policy_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; f public.cms_forms%rowtype; p public.cms_form_retention_policies%rowtype; d jsonb;
begin
 a:=cms_private.require_cms_super_admin(); select * into p from public.cms_form_retention_policies where id=p_policy_id and owner_approved and retention_days is not null;
 if not found then raise exception using errcode='22023',message='Choose an owner-approved retention category'; end if;
 select * into f from public.cms_forms where id=p_form_id and kind='standard'; if not found then raise exception using errcode='P0002',message='Form not found'; end if;
 if p.policy_key='future-opportunities-12m' then select definition_json into d from public.cms_form_versions where id=coalesce(f.draft_version_id,f.published_version_id) and form_id=f.id;
  if not exists(select 1 from jsonb_array_elements(coalesce(d->'fields','[]'::jsonb)) as x(value) where x.value->>'key'='future_opportunities_opt_in' and x.value->>'type'='boolean_checkbox' and coalesce((x.value->>'required')::boolean,false)=false and lower(coalesce(x.value->>'label','')) like '%future opportunit%') then raise exception using errcode='22023',message='This category requires a separate optional future-opportunities consent field'; end if;
 end if;
 update public.cms_forms set retention_policy_id=p_policy_id,updated_by=a,updated_at=now() where id=p_form_id;
 insert into public.cms_form_audit_events(actor_id,form_id,action,details) values(a,p_form_id,'retention_policy_assigned',jsonb_build_object('policy_id',p_policy_id));
 return jsonb_build_object('retention_policy_id',p_policy_id);
end $$;
revoke all on function public.cms_admin_set_form_retention(uuid,uuid) from public,anon;
grant execute on function public.cms_admin_set_form_retention(uuid,uuid) to authenticated;

create or replace function cms_private.capture_future_opportunity_consent()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v public.cms_form_versions%rowtype; p public.cms_form_privacy_policy_config%rowtype; f jsonb;
begin
 if new.answers_json->>'future_opportunities_opt_in' is distinct from 'true' then return new; end if;
 select * into v from public.cms_form_versions where id=new.form_version_id and form_id=new.form_id; select * into p from public.cms_form_privacy_policy_config where singleton and owner_approved;
 for f in select value from jsonb_array_elements(coalesce(v.definition_json->'fields','[]'::jsonb)) loop
  if f->>'key'='future_opportunities_opt_in' and f->>'type'='boolean_checkbox' and coalesce((f->>'required')::boolean,false)=false and lower(coalesce(f->>'label','')) like '%future opportunit%' then
   insert into public.cms_form_consent_records(submission_id,purpose,policy_document_id,policy_version_id,policy_snapshot_hash,accepted,accepted_at) values(new.id,left(coalesce(f->>'label','Future opportunities opt-in'),500),p.document_id,p.version_id,p.snapshot_hash,true,now()); exit;
  end if;
 end loop; return new;
end $$;
revoke all on function cms_private.capture_future_opportunity_consent() from public,anon,authenticated;
create trigger cms_future_opportunity_consent after insert on public.cms_form_submissions for each row execute function cms_private.capture_future_opportunity_consent();

create or replace function public.cms_admin_delete_form_submission(p_submission_id uuid,p_reason_code text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; s public.cms_form_submissions%rowtype;
begin
 a:=cms_private.require_cms_super_admin(); if p_reason_code not in ('test_cleanup','owner_requested','retention_request','duplicate') then raise exception using errcode='22023',message='Select a supported deletion reason'; end if;
 select * into s from public.cms_form_submissions where id=p_submission_id and deleted_at is null for update; if not found then raise exception using errcode='P0002',message='Submission not found or already deleted'; end if;
 delete from public.cms_form_notification_outbox where submission_id=p_submission_id; delete from public.cms_form_submission_events where submission_id=p_submission_id; delete from public.cms_form_consent_records where submission_id=p_submission_id;
 update public.cms_form_submissions set answers_json='{}'::jsonb,context_id=null,idempotency_key_hash=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),payload_hash='',deleted_at=now() where id=p_submission_id;
 insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details) values(a,s.form_id,s.form_version_id,'submission_deleted',jsonb_build_object('submission_id',p_submission_id,'reason_code',p_reason_code)); return jsonb_build_object('id',p_submission_id,'deleted',true);
end $$;
revoke all on function public.cms_admin_delete_form_submission(uuid,text) from public,anon;
grant execute on function public.cms_admin_delete_form_submission(uuid,text) to authenticated;

create or replace function public.cms_admin_set_form_export_access(p_email text,p_enabled boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid; u uuid;
begin
 a:=cms_private.require_cms_super_admin(); select user_id into u from public.backoffice_users where lower(email)=lower(trim(coalesce(p_email,''))) and is_active; if not found then raise exception using errcode='P0002',message='No active backoffice account matches that email'; end if;
 if coalesce(p_enabled,false) then insert into public.cms_form_export_grants(user_id,granted_by,granted_at,revoked_at,revoked_by) values(u,a,now(),null,null) on conflict(user_id) do update set granted_by=a,granted_at=now(),revoked_at=null,revoked_by=null;
 else update public.cms_form_export_grants set revoked_at=now(),revoked_by=a where user_id=u and revoked_at is null; end if;
 return jsonb_build_object('user_id',u,'enabled',coalesce(p_enabled,false));
end $$;
revoke all on function public.cms_admin_set_form_export_access(text,boolean) from public,anon;
grant execute on function public.cms_admin_set_form_export_access(text,boolean) to authenticated;

-- Notifications are deferred: existing routes are cleared and direct RPC enabling is rejected.
-- Production currently has no configured notification rules; the RPC below prevents enabling new ones.
create or replace function public.cms_admin_save_form_notification_rule(p_form_id uuid,p_enabled boolean,p_recipient_email text,p_owner_approved boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare a uuid;
begin
 a:=cms_private.require_cms_super_admin(); if not exists(select 1 from public.cms_forms where id=p_form_id and kind='standard') then raise exception using errcode='P0002',message='Form not found'; end if;
 if coalesce(p_enabled,false) then raise exception using errcode='55000',message='Email notifications are deferred and disabled'; end if;
 insert into public.cms_form_notification_rules(form_id,enabled,recipient_email,owner_approved,approved_by,approved_at,updated_at) values(p_form_id,false,'',false,null,null,now()) on conflict(form_id) do update set enabled=false,recipient_email='',owner_approved=false,approved_by=null,approved_at=null,updated_at=now();
 insert into public.cms_form_audit_events(actor_id,form_id,action,details) values(a,p_form_id,'notification_rule_configured',jsonb_build_object('enabled',false,'deferred',true)); return jsonb_build_object('enabled',false,'configured',false,'deferred',true);
end $$;
revoke all on function public.cms_admin_save_form_notification_rule(uuid,boolean,text,boolean) from public,anon;
grant execute on function public.cms_admin_save_form_notification_rule(uuid,boolean,text,boolean) to authenticated;
