-- M2.6-B follow-up: record the signed-in owner and require a real draft purpose.
-- Approved retention/privacy categories remain empty until supplied by the owner.
create or replace function cms_private.enforce_cms_form_owner_and_purpose()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if new.owner_user_id is null then new.owner_user_id:=new.created_by; end if;
  if char_length(trim(coalesce(new.purpose,'')))<2 then
    raise exception using errcode='22023',message='Add a short submission purpose before saving a form draft';
  end if;
  return new;
end $$;
drop trigger if exists cms_form_owner_purpose_guard on public.cms_forms;
create trigger cms_form_owner_purpose_guard before insert or update of purpose,owner_user_id on public.cms_forms
for each row execute function cms_private.enforce_cms_form_owner_and_purpose();
