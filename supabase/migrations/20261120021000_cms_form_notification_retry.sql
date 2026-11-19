-- M2.6-F: expose notification state to authorised staff and allow audited retry.
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

revoke all on function public.cms_admin_retry_form_notification(uuid) from public,anon;
grant execute on function public.cms_admin_retry_form_notification(uuid) to authenticated;
