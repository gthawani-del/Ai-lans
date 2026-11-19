-- M2.6-F follow-up: rate bucket cleanup uses an expiry index, and idempotency
-- rejects key reuse for a different payload while returning the existing response
-- for an identical retry.
alter table public.cms_form_submissions add column if not exists payload_hash text not null default '';
create index if not exists cms_form_rate_limit_expiry_idx on public.cms_form_rate_limit_buckets(updated_at);
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
revoke all on function public.cms_public_submit_form(uuid,uuid,jsonb,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.cms_public_submit_form(uuid,uuid,jsonb,uuid,text,text,text,jsonb) to service_role;
