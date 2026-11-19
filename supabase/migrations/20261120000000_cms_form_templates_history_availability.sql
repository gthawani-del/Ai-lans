-- M2.6-D: additional first-class templates, duplication, immutable history/restore, and availability controls.
alter table public.cms_forms add column if not exists availability_status text not null default 'open' check(availability_status in ('open','closed'));
alter table public.cms_forms add column if not exists closed_message text not null default '' check(char_length(closed_message)<=300);

create or replace function public.cms_admin_create_form(
  p_template_key text,
  p_name text,
  p_public_title text default null,
  p_handle text default null,
  p_purpose text default ''
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_template public.cms_form_template_registry%rowtype; v_form public.cms_forms%rowtype; v_definition jsonb; v_version public.cms_form_versions%rowtype; v_handle text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if not exists(select 1 from public.cms_form_studio_config where singleton and studio_enabled) then raise exception using errcode='42501',message='Form Studio is disabled'; end if;
  if p_template_key not in ('contact_v1','waitlist_v1','feedback_v1','newsletter_v1') then raise exception using errcode='22023',message='This template is not available in the current milestone'; end if;
  select * into v_template from public.cms_form_template_registry where template_key=p_template_key and is_active;
  if not found then raise exception using errcode='22023',message='The selected form template is unavailable'; end if;
  if p_name is null or char_length(trim(p_name)) not between 2 and 160 then raise exception using errcode='22023',message='Form name must be between 2 and 160 characters'; end if;
  v_handle:=lower(trim(coalesce(p_handle,'')));
  if v_handle !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_handle)>120 then raise exception using errcode='22023',message='Form handle must use lowercase letters, numbers and hyphens'; end if;
  if exists(select 1 from public.cms_forms where handle=v_handle) then raise exception using errcode='23505',message='That form handle is already in use'; end if;
  v_definition:=v_template.starter_definition||jsonb_build_object(
    'title',coalesce(nullif(trim(p_public_title),''),v_template.starter_definition->>'title'),
    'description','',
    'fields',coalesce((select jsonb_agg(field.value||jsonb_build_object('id',gen_random_uuid()::text,'order',field.ordinality-1) order by field.ordinality) from jsonb_array_elements(v_template.starter_definition->'fields') with ordinality as field(value,ordinality)),'[]'::jsonb)
  );
  insert into public.cms_forms(handle,name,public_title,template_key,purpose,created_by,updated_by)
  values(v_handle,trim(p_name),coalesce(nullif(trim(p_public_title),''),v_template.starter_definition->>'title'),p_template_key,coalesce(trim(p_purpose),''),v_actor,v_actor) returning * into v_form;
  insert into public.cms_form_versions(form_id,version_no,schema_version,definition_json,validation_hash,created_by)
  values(v_form.id,1,1,v_definition,md5(v_definition::text),v_actor) returning * into v_version;
  update public.cms_forms set draft_version_id=v_version.id where id=v_form.id returning * into v_form;
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details) values(v_actor,v_form.id,v_version.id,'draft_created',jsonb_build_object('template_key',p_template_key));
  return jsonb_build_object('form',jsonb_build_object('id',v_form.id,'handle',v_form.handle,'name',v_form.name,'public_title',v_form.public_title,'template_key',v_form.template_key,'status',v_form.lifecycle_status,'purpose',v_form.purpose,'draft_version_id',v_version.id,'version_no',1,'definition',v_definition));
end $$;

create or replace function public.cms_admin_duplicate_form(p_form_id uuid,p_new_name text,p_new_handle text,p_purpose text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_source public.cms_forms%rowtype; v_source_version public.cms_form_versions%rowtype; v_new public.cms_forms%rowtype; v_new_version public.cms_form_versions%rowtype; v_handle text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_source from public.cms_forms where id=p_form_id and kind='standard' for share;
  if not found then raise exception using errcode='P0002',message='Form not found'; end if;
  select * into v_source_version from public.cms_form_versions where id=v_source.draft_version_id and form_id=v_source.id;
  if not found then raise exception using errcode='P0002',message='The source has no draft to duplicate'; end if;
  if p_new_name is null or char_length(trim(p_new_name)) not between 2 and 160 then raise exception using errcode='22023',message='Form name must be between 2 and 160 characters'; end if;
  v_handle:=lower(trim(coalesce(p_new_handle,'')));
  if v_handle !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_handle)>120 then raise exception using errcode='22023',message='Form handle must use lowercase letters, numbers and hyphens'; end if;
  if exists(select 1 from public.cms_forms where handle=v_handle) then raise exception using errcode='23505',message='That form handle is already in use'; end if;
  insert into public.cms_forms(handle,name,public_title,template_key,purpose,created_by,updated_by,availability_status,closed_message)
  values(v_handle,trim(p_new_name),v_source.public_title,v_source.template_key,coalesce(trim(p_purpose),''),v_actor,v_actor,'open','') returning * into v_new;
  insert into public.cms_form_versions(form_id,version_no,schema_version,definition_json,validation_hash,created_by)
  values(v_new.id,1,v_source_version.schema_version,v_source_version.definition_json,v_source_version.validation_hash,v_actor) returning * into v_new_version;
  update public.cms_forms set draft_version_id=v_new_version.id where id=v_new.id returning * into v_new;
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details)
  values(v_actor,v_new.id,v_new_version.id,'form_duplicated',jsonb_build_object('source_form_id',v_source.id,'source_version_id',v_source_version.id));
  return jsonb_build_object('form',jsonb_build_object('id',v_new.id,'handle',v_new.handle,'name',v_new.name,'public_title',v_new.public_title,'template_key',v_new.template_key,'status',v_new.lifecycle_status,'purpose',v_new.purpose,'draft_version_id',v_new_version.id,'version_no',1,'definition',v_new_version.definition_json));
end $$;

create or replace function public.cms_admin_list_form_versions(p_form_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_rows jsonb; v_draft uuid; v_published uuid;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select draft_version_id,published_version_id into v_draft,v_published from public.cms_forms where id=p_form_id and kind='standard';
  if not found then raise exception using errcode='P0002',message='Form not found'; end if;
  insert into public.cms_form_audit_events(actor_id,form_id,action) values(v_actor,p_form_id,'version_history_opened');
  select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'version_no',v.version_no,'created_at',v.created_at,'created_by',(select u.email from auth.users u where u.id=v.created_by),'published_at',v.published_at,'is_current_draft',v.id=v_draft,'is_current_published',v.id=v_published) order by v.version_no desc),'[]'::jsonb)
    into v_rows from public.cms_form_versions v where v.form_id=p_form_id;
  return v_rows;
end $$;

create or replace function public.cms_admin_restore_form_version(p_form_id uuid,p_version_id uuid,p_expected_draft_version_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_form public.cms_forms%rowtype; v_source public.cms_form_versions%rowtype; v_new public.cms_form_versions%rowtype; v_number integer;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select * into v_form from public.cms_forms where id=p_form_id and kind='standard' for update;
  if not found then raise exception using errcode='P0002',message='Form not found'; end if;
  if v_form.draft_version_id is distinct from p_expected_draft_version_id then raise exception using errcode='40001',message='Draft changed in another session. Reload the latest version before restoring.'; end if;
  select * into v_source from public.cms_form_versions where id=p_version_id and form_id=p_form_id;
  if not found then raise exception using errcode='P0002',message='The selected version does not belong to this form'; end if;
  select coalesce(max(version_no),0)+1 into v_number from public.cms_form_versions where form_id=p_form_id;
  insert into public.cms_form_versions(form_id,version_no,schema_version,definition_json,validation_hash,created_by)
  values(p_form_id,v_number,v_source.schema_version,v_source.definition_json,md5(v_source.definition_json::text),v_actor) returning * into v_new;
  update public.cms_forms set draft_version_id=v_new.id,updated_by=v_actor,updated_at=now() where id=p_form_id returning * into v_form;
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details)
  values(v_actor,p_form_id,v_new.id,'version_restored_to_draft',jsonb_build_object('source_version_id',p_version_id,'new_version_no',v_number));
  return jsonb_build_object('form',jsonb_build_object('id',v_form.id,'handle',v_form.handle,'name',v_form.name,'public_title',v_form.public_title,'template_key',v_form.template_key,'status',v_form.lifecycle_status,'purpose',v_form.purpose,'draft_version_id',v_new.id,'version_no',v_number,'definition',v_new.definition_json,'has_published_version',v_form.published_version_id is not null,'updated_at',v_form.updated_at));
end $$;

create or replace function public.cms_admin_get_form_availability(p_form_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_state text; v_message text;
begin
  v_actor:=cms_private.require_cms_super_admin();
  select availability_status,closed_message into v_state,v_message from public.cms_forms where id=p_form_id and kind='standard';
  if not found then raise exception using errcode='P0002',message='Form not found'; end if;
  return jsonb_build_object('availability_status',v_state,'closed_message',v_message);
end $$;

create or replace function public.cms_admin_set_form_availability(p_form_id uuid,p_status text,p_closed_message text default '')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,cms_private as $$
declare v_actor uuid; v_form public.cms_forms%rowtype;
begin
  v_actor:=cms_private.require_cms_super_admin();
  if p_status is null or p_status not in ('open','closed') then raise exception using errcode='22023',message='Availability must be Open or Closed'; end if;
  if char_length(coalesce(p_closed_message,''))>300 then raise exception using errcode='22023',message='Closed message must be 300 characters or fewer'; end if;
  update public.cms_forms set availability_status=p_status,closed_message=coalesce(trim(p_closed_message),''),updated_by=v_actor,updated_at=now()
    where id=p_form_id and kind='standard' returning * into v_form;
  if not found then raise exception using errcode='P0002',message='Form not found'; end if;
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details)
  values(v_actor,p_form_id,v_form.draft_version_id,'availability_changed',jsonb_build_object('status',p_status));
  return jsonb_build_object('availability_status',v_form.availability_status,'closed_message',v_form.closed_message);
end $$;

revoke all on function public.cms_admin_create_form(text,text,text,text,text) from public,anon;
revoke all on function public.cms_admin_duplicate_form(uuid,text,text,text) from public,anon;
revoke all on function public.cms_admin_list_form_versions(uuid) from public,anon;
revoke all on function public.cms_admin_restore_form_version(uuid,uuid,uuid) from public,anon;
revoke all on function public.cms_admin_get_form_availability(uuid) from public,anon;
revoke all on function public.cms_admin_set_form_availability(uuid,text,text) from public,anon;
grant execute on function public.cms_admin_create_form(text,text,text,text,text) to authenticated;
grant execute on function public.cms_admin_duplicate_form(uuid,text,text,text) to authenticated;
grant execute on function public.cms_admin_list_form_versions(uuid) to authenticated;
grant execute on function public.cms_admin_restore_form_version(uuid,uuid,uuid) to authenticated;
grant execute on function public.cms_admin_get_form_availability(uuid) to authenticated;
grant execute on function public.cms_admin_set_form_availability(uuid,text,text) to authenticated;

-- M2.6-D draft saves may retain empty choice lists for owner configuration. Publication-time validation remains stricter.
create or replace function public.cms_admin_save_form_draft(
  p_form_id uuid,
  p_expected_draft_version_id uuid,
  p_name text,
  p_public_title text,
  p_handle text,
  p_purpose text,
  p_definition jsonb
) returns jsonb
language plpgsql security definer
set search_path=pg_catalog,public,cms_private
as $$
declare
  v_actor uuid;
  v_form public.cms_forms%rowtype;
  v_version public.cms_form_versions%rowtype;
  v_version_no integer;
  v_field jsonb;
  v_position integer;
  v_source_position integer;
  v_key text;
  v_handle text;
  v_allowed_types text[] := array['short_text','email','phone','number','long_text','select','radio','checkbox_group','boolean_checkbox','date','rating','section_text','consent','hidden_context'];
begin
  v_actor := cms_private.require_cms_super_admin();
  if p_name is null or char_length(trim(p_name)) not between 2 and 160 then raise exception using errcode='22023',message='Form name must be between 2 and 160 characters'; end if;
  if p_public_title is null or char_length(trim(p_public_title)) not between 2 and 160 then raise exception using errcode='22023',message='Public heading must be between 2 and 160 characters'; end if;
  v_handle := lower(trim(coalesce(p_handle,'')));
  if v_handle !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_handle)>120 then raise exception using errcode='22023',message='Form handle must use lowercase letters, numbers and hyphens'; end if;
  if jsonb_typeof(p_definition)<>'object' or jsonb_typeof(p_definition->'fields') is distinct from 'array' or jsonb_array_length(p_definition->'fields')>50 then
    raise exception using errcode='22023',message='The draft must contain a supported form definition with no more than 50 fields';
  end if;
  if char_length(coalesce(p_definition->>'title','')) not between 2 and 160 or char_length(coalesce(p_definition->>'submit_label','')) not between 1 and 80 then
    raise exception using errcode='22023',message='The form title or submit label is invalid';
  end if;
  if exists(select 1 from jsonb_array_elements(p_definition->'fields') f where jsonb_typeof(f)<>'object') then
    raise exception using errcode='22023',message='Every form field must be an object';
  end if;
  if exists(select 1 from jsonb_array_elements(p_definition->'fields') f where coalesce(f->>'type','')<>all(v_allowed_types)) then
    raise exception using errcode='22023',message='The draft contains an unsupported field type';
  end if;
  if exists(select 1 from jsonb_array_elements(p_definition->'fields') f where coalesce(f->>'key','') !~ '^[a-z][a-z0-9_]{0,63}$' or char_length(coalesce(f->>'label','')) not between 1 and 160) then
    raise exception using errcode='22023',message='Each field needs a valid stable key and a label';
  end if;
  if exists(select f->>'key' from jsonb_array_elements(p_definition->'fields') f group by f->>'key' having count(*)>1) then
    raise exception using errcode='22023',message='Field keys must be unique';
  end if;
  for v_field,v_position in select item.value,(item.ordinality-1)::integer from jsonb_array_elements(p_definition->'fields') with ordinality as item(value,ordinality) loop
    if exists(select 1 from jsonb_object_keys(v_field) as field_key(key) where key not in ('id','key','type','label','help_text','placeholder','required','order','width_preset','default_value','constraints','options','visibility','aria_description','status','schema_version')) then
      raise exception using errcode='22023',message='A field contains unsupported settings';
    end if;
    if v_field ? 'options' and jsonb_typeof(v_field->'options') is distinct from 'array' then raise exception using errcode='22023',message='Field options must be a list'; end if;
    if v_field->>'type' in ('select','radio','checkbox_group') and jsonb_typeof(v_field->'options') is distinct from 'array' then
      raise exception using errcode='22023',message='Choice field options must be a list; publication validates that at least one usable option exists';
    end if;
    if v_field ? 'visibility' then
      v_key := v_field->'visibility'->>'field_key';
      select min((prev.ordinality-1)::integer) into v_source_position from jsonb_array_elements(p_definition->'fields') with ordinality as prev(value,ordinality) where prev.value->>'key'=v_key;
      if v_key is null or v_source_position is null or v_source_position>=v_position then raise exception using errcode='22023',message='Conditional fields can depend only on an earlier field'; end if;
      if coalesce(v_field->'visibility'->>'operator','') not in ('equals','not_equals','is_answered','is_not_answered','contains_option') then raise exception using errcode='22023',message='The conditional rule uses an unsupported operator'; end if;
    end if;
  end loop;

  select * into v_form from public.cms_forms where id=p_form_id and kind='standard' for update;
  if not found then raise exception using errcode='P0002',message='Form not found'; end if;
  if v_form.lifecycle_status='archived' then raise exception using errcode='55000',message='Archived forms must be restored before editing'; end if;
  if v_form.draft_version_id is distinct from p_expected_draft_version_id then raise exception using errcode='40001',message='Draft changed in another session. Reload the latest version before saving.'; end if;
  if exists(select 1 from public.cms_forms where handle=v_handle and id<>p_form_id) then raise exception using errcode='23505',message='That form handle is already in use'; end if;
  select coalesce(max(version_no),0)+1 into v_version_no from public.cms_form_versions where form_id=p_form_id;
  insert into public.cms_form_versions(form_id,version_no,schema_version,definition_json,validation_hash,created_by)
  values(p_form_id,v_version_no,1,p_definition,md5(p_definition::text),v_actor) returning * into v_version;
  update public.cms_forms set name=trim(p_name),public_title=trim(p_public_title),handle=v_handle,purpose=coalesce(trim(p_purpose),''),draft_version_id=v_version.id,updated_by=v_actor,updated_at=now()
    where id=p_form_id returning * into v_form;
  insert into public.cms_form_audit_events(actor_id,form_id,version_id,action,details)
  values(v_actor,p_form_id,v_version.id,'draft_saved',jsonb_build_object('version_no',v_version_no));
  return jsonb_build_object('form',jsonb_build_object('id',v_form.id,'handle',v_form.handle,'name',v_form.name,'public_title',v_form.public_title,'template_key',v_form.template_key,'status',v_form.lifecycle_status,'purpose',v_form.purpose,'draft_version_id',v_version.id,'version_no',v_version_no,'definition',v_version.definition_json,'has_published_version',v_form.published_version_id is not null,'updated_at',v_form.updated_at));
end $$;

revoke all on function public.cms_admin_create_form(text,text,text,text,text) from public,anon;
revoke all on function public.cms_admin_get_form_editor(uuid) from public,anon;
revoke all on function public.cms_admin_save_form_draft(uuid,uuid,text,text,text,text,jsonb) from public,anon;
grant execute on function public.cms_admin_create_form(text,text,text,text,text) to authenticated;
grant execute on function public.cms_admin_get_form_editor(uuid) to authenticated;
grant execute on function public.cms_admin_save_form_draft(uuid,uuid,text,text,text,text,jsonb) to authenticated;
