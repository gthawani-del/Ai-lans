-- Volunteer screening policy, 18 Nov 2026.
-- Exact deployed functions, with role-specific fields and optional photos for enhanced_v3.

CREATE OR REPLACE FUNCTION public.validate_volunteer_v3(p jsonb, cfg jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 spec jsonb:='[{"key":"name","label":"Full name","step":0,"min":2,"max":100,"required":true},{"key":"email","label":"Email address","step":0,"max":254,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$","required":true},{"key":"phone","label":"Indian mobile number","step":0,"pattern":"^\\+91[6-9][0-9]{9}$","required":true},{"key":"city","label":"City / travel-from location","step":0,"min":2,"max":80,"required":true},{"key":"role","label":"Current status or role","step":0,"enum":["Student","Recent graduate","Working Professional","Founder","Developer","Designer","AI Enthusiast","Other"],"required":true},{"key":"roleOther","label":"Please specify your role","step":0,"min":2,"max":100,"when":{"role":"Other"},"required":true},{"key":"company","label":"Organisation (if applicable)","step":0,"max":150},{"key":"preferredRole","label":"Preferred volunteer contribution","step":1,"enum":["Technical builder / troubleshooting","AI workflow and prompting","Product and business analysis","UX and design","Research and documentation","Teaching and facilitation","Operations and coordination"],"required":true},{"key":"usefulSkills","label":"Your strongest capabilities","step":1,"array":["Debugging","Coding","AI prompting / workflows","Product thinking","Design","Research","Teaching / mentoring","Coordination / communication","Other"],"required":true},{"key":"usefulOther","label":"Other capability","step":1,"min":2,"max":100,"when":{"usefulSkills":"Other"},"required":true},{"key":"why","label":"Why do you want to volunteer?","step":1,"min":30,"max":500,"required":true},{"key":"communicationExample","label":"How would you help a non-technical participant understand a difficult idea?","step":1,"min":30,"max":500,"required":true},{"key":"background","label":"Relevant background (optional)","step":1,"enum":["Student / recent graduate","Business / operations","Engineering / technology","Product / management","Design / creative","Data / AI","Other"]},{"key":"backgroundOther","label":"Please specify your background","step":1,"min":2,"max":100,"when":{"background":"Other"},"required":true},{"key":"experienceStatus","label":"Relevant experience","step":2,"enum":["Some experience","No prior experience yet"],"required":true},{"key":"beginnerExample","label":"Tell us about a course, personal project or activity where you helped solve a problem","step":2,"min":20,"max":500,"when":{"experienceStatus":"No prior experience yet"},"required":true},{"key":"projectType","label":"Type of work","step":2,"enum":["Web app / website","Mobile app","Automation / workflow","AI assistant / agent","Data / analytics project","Prototype / proof of concept","Design / research / operations work","Other"],"when":{"experienceStatus":"Some experience"}},{"key":"projectTypeOther","label":"Other type of work","step":2,"min":2,"max":100,"when":{"experienceStatus":"Some experience","projectType":"Other"},"required":true},{"key":"contributionAreas","label":"Areas you contributed to","step":2,"array":["Product thinking","Prompting / AI workflows","Frontend","Backend / APIs","Database","Deployment / DevOps","Design / UX","Testing / debugging","Research / documentation","Coordination / operations","Teaching / facilitation"],"when":{"experienceStatus":"Some experience"},"required":true},{"key":"contributionLevel","label":"How much did you personally contribute?","step":2,"enum":["Owned end-to-end","Contributed significantly","Assisted","Observed only"],"when":{"experienceStatus":"Some experience"},"required":true},{"key":"strongest","label":"What did you build, organise or help deliver?","step":2,"min":10,"max":500,"when":{"experienceStatus":"Some experience"},"required":true},{"key":"contribution","label":"What did you personally do?","step":2,"min":10,"max":500,"when":{"experienceStatus":"Some experience"},"required":true},{"key":"evidenceVisibility","label":"Evidence availability","step":2,"enum":["Public links","Private / cannot share"],"when":{"experienceStatus":"Some experience"},"required":true},{"key":"privateEvidence","label":"Describe your private or confidential work without sharing protected information","step":2,"min":20,"max":500,"when":{"experienceStatus":"Some experience","evidenceVisibility":"Private / cannot share"},"required":true},{"key":"projectUrl","label":"Live project / demo (if applicable)","step":2,"url":"web","when":{"experienceStatus":"Some experience","evidenceVisibility":"Public links"}},{"key":"repoUrl","label":"GitHub repository (if applicable)","step":2,"url":"repository","when":{"experienceStatus":"Some experience","evidenceVisibility":"Public links"}},{"key":"otherUrl","label":"Portfolio, case study, writing sample or other evidence","step":2,"url":"web","when":{"experienceStatus":"Some experience","evidenceVisibility":"Public links"}},{"key":"languages","label":"Languages you can use with participants","step":3,"array":["English","Hindi","Marathi","Gujarati","Malayalam","Other"],"required":true},{"key":"languagesOther","label":"Other languages","step":3,"min":2,"max":100,"when":{"languages":"Other"},"required":true},{"key":"attendance","label":"Availability for two days in Mumbai","step":3,"enum":["Yes, both days","Need confirmed dates","Need travel support"],"required":true},{"key":"deviceAvailability","label":"Laptop availability","step":3,"enum":["I can bring a laptop","I need a device","Not sure yet"],"required":true},{"key":"commitmentChecks","label":"Volunteer commitments","step":3,"array":["I can support both workshop days once the dates are confirmed","I can support the agreed full-day workshop hours","I will arrange a suitable laptop or flag if I need one","I will help participants within my skills and escalate issues when needed","I will actively support participants rather than only observe","I will complete orientation or preparation requested by the team","I will keep participant information confidential and will not copy or reuse it","I understand this is an active volunteer role"],"minItems":8,"required":true},{"key":"accurate","label":"Accuracy declaration","step":4,"boolean":true,"required":true},{"key":"consent","label":"Application processing consent","step":4,"boolean":true,"required":true}]'::jsonb;
 r jsonb; c record; item jsonb; k text; v text; active boolean; required boolean; d jsonb:=p; errs jsonb:='{}'; ar jsonb; allowed jsonb; tool_keys jsonb:='[]'; tool_name text; idx int:=0; host text; path text;
begin
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>50000 then raise exception 'Invalid application payload'; end if;
 for c in select * from jsonb_each(d) loop
  if jsonb_typeof(c.value)='string' then d:=jsonb_set(d,array[c.key],to_jsonb(trim(c.value #>> '{}'))); end if;
 end loop;
 v:=regexp_replace(coalesce(d->>'phone',''),'[[:space:]()-]','','g');
 if v ~ '^[6-9][0-9]{9}$' then v:='+91'||v; elsif v ~ '^91[6-9][0-9]{9}$' then v:='+'||v; end if;
 d:=d||jsonb_build_object('phone',v,'email',lower(coalesce(d->>'email','')));
 for r in select value from jsonb_array_elements(spec) loop
  k:=r->>'key';active:=true;
  for c in select * from jsonb_each(coalesce(r->'when','{}')) loop
   if jsonb_typeof(d->c.key)='array' then active:=active and coalesce((d->c.key) ? (c.value #>> '{}'),false);
   elsif jsonb_typeof(c.value)='array' then active:=active and coalesce(c.value ? (d->>c.key),false);
   else active:=active and coalesce(d->c.key=c.value,false); end if;
  end loop;
  if not active then d:=jsonb_set(d,array[k],case when r ? 'array' then '[]'::jsonb else '""'::jsonb end);continue;end if;
  required:=coalesce((r->>'required')::boolean,false);v:=coalesce(d->>k,'');
  if r ? 'boolean' then
   if d->k is distinct from 'true'::jsonb then errs:=errs||jsonb_build_object(k,'Please confirm '||(r->>'label'));end if;
  elsif r ? 'array' then
   if jsonb_typeof(d->k) is distinct from 'array' then errs:=errs||jsonb_build_object(k,'Choose valid options');continue;end if;
   ar:=d->k;
   if (required and jsonb_array_length(ar)=0) or (r ? 'minItems' and jsonb_array_length(ar)<(r->>'minItems')::int) or exists(select 1 from jsonb_array_elements(ar) a where jsonb_typeof(a)<>'string' or not (r->'array' ? (a #>> '{}'))) or jsonb_array_length(ar)<>(select count(distinct a) from jsonb_array_elements(ar) a) then errs:=errs||jsonb_build_object(k,'Choose valid options for '||(r->>'label'));end if;
  elsif v='' then
   if required then errs:=errs||jsonb_build_object(k,'Please complete '||(r->>'label'));end if;
  else
   if jsonb_typeof(d->k)<>'string' or (r ? 'min' and char_length(v)<(r->>'min')::int) or (r ? 'max' and char_length(v)>(r->>'max')::int) or (r ? 'enum' and not (r->'enum' ? v)) or (r ? 'pattern' and v !~ (r->>'pattern')) or v ~ '[\x01-\x08\x0b\x0c\x0e-\x1f]' then errs:=errs||jsonb_build_object(k,'Enter a valid '||(r->>'label'));end if;
   if r ? 'url' then
    if char_length(v)>2048 or v !~ '^https://[^/@:[:space:]]+[.][^/@:[:space:]]+([/?#][^[:space:]]*)?$' then errs:=errs||jsonb_build_object(k,'Enter a valid HTTPS URL');
    elsif r->>'url'='linkedin' and v !~ '^https://(www[.]|in[.])?linkedin[.]com/in/[^/?#]+/?([?#].*)?$' then errs:=errs||jsonb_build_object(k,'Enter a LinkedIn profile URL');
    elsif r->>'url'='github' and v !~ '^https://(www[.])?github[.]com/[A-Za-z0-9_.-]+/?([?#].*)?$' then errs:=errs||jsonb_build_object(k,'Enter a GitHub profile URL');
    elsif r->>'url'='repository' and v !~ '^https://(www[.])?github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?([?#].*)?$' then errs:=errs||jsonb_build_object(k,'Enter a GitHub repository URL');end if;
   end if;
  end if;
 end loop;

 if jsonb_typeof(d->'stack') is distinct from 'object' then errs:=errs||'{"stack":"Invalid tool ratings"}'::jsonb;
 elsif d->>'preferredRole'='Technical builder / troubleshooting' then
   for tool_name in select jsonb_array_elements_text(coalesce(cfg->'stack_tools','["Claude / Claude Code","OpenAI Codex","GitHub","Vercel","Supabase"]'::jsonb)) loop
     k:=case tool_name when 'Claude / Claude Code' then 'claude' when 'OpenAI Codex' then 'codex' when 'GitHub' then 'github' when 'Vercel' then 'vercel' when 'Supabase' then 'supabase' else 'tool_'||idx end;
     if not coalesce('["New to it","Used it","Comfortable","Built with it"]'::jsonb ? (d->'stack'->>k),false) then errs:=errs||'{"stack":"Rate each technical tool"}'::jsonb; end if;
     idx:=idx+1;
   end loop;
 end if;
 if jsonb_typeof(d->'customTools') is distinct from 'array' then errs:=errs||'{"customTools":"Invalid additional tools"}'::jsonb;
 elsif jsonb_array_length(d->'customTools')>10 or exists(select 1 from jsonb_array_elements(d->'customTools') t where char_length(trim(coalesce(t->>'name','')))=0 or char_length(coalesce(t->>'name',''))>80 or not coalesce('["New to it","Used it","Comfortable","Built with it"]'::jsonb ? (t->>'level'),false)) then
   errs:=errs||'{"customTools":"Enter valid additional tool names and levels"}'::jsonb;
 end if;
 if d->>'experienceStatus'='No prior experience yet' and d->>'preferredRole'='Technical builder / troubleshooting' then
   errs:=errs||'{"experienceStatus":"Technical builder volunteers need relevant experience. Select another track."}'::jsonb;
 end if;
 if d->>'experienceStatus'='Some experience' then
   if jsonb_typeof(d->'contributionAreas')='array' then
      d:=jsonb_set(d,'{involvement}',coalesce((select jsonb_object_agg(ca.area,d->'contributionLevel') from jsonb_array_elements_text(d->'contributionAreas') as ca(area)),'{}'::jsonb));
   end if;
   if d->>'evidenceVisibility'='Public links' and coalesce(d->>'repoUrl','')='' and coalesce(d->>'projectUrl','')='' and coalesce(d->>'otherUrl','')='' then
     errs:=errs||'{"otherUrl":"Provide one evidence link or choose private work"}'::jsonb;
   end if;
 end if;
 if errs<>'{}'::jsonb then raise exception using message='Please correct the highlighted application fields.',detail=errs::text,errcode='22023';end if;
 return d||jsonb_build_object('organisation',coalesce(d->>'company',''),'addressCityPostcode',coalesce(d->>'city',''),'countryCode','in','formModel','enhanced_v3','commitment',coalesce(d->'commitmentChecks','[]'::jsonb),'commitmentVersion','2026-11-18-role-based','consentVersion','2026-11-18-role-based','consentRecordedAt',now());
end $function$;

CREATE OR REPLACE FUNCTION public.submit_volunteer_application(p_id uuid, p_token text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  a public.volunteer_applications;
  s jsonb;
  w jsonb;
  r jsonb;
  fcfg jsonb;
  mail text:=lower(trim(coalesce(p_payload->>'email','')));
  model text;
  profile_model text;
  identity_model text;
  commitment_min int:=6;
begin
  select * into a
  from public.volunteer_applications
  where id=p_id and resume_token_hash=encode(digest(p_token,'sha256'),'hex') FOR UPDATE;

  if a.id is null then raise exception 'Application not found'; end if;

  if a.status<>'draft' then
    return jsonb_build_object('id',a.id,'status',a.status,'submitted_at',a.submitted_at,'total_score',a.total_score,'component_scores',a.component_scores);
  end if;

  select weights,rules into w,r
  from public.volunteer_scoring_versions
  where id=a.scoring_version_id;

  select form_config into fcfg
  from public.volunteer_form_versions
  where id=a.form_version_id;

  model:=coalesce(r->>'model','legacy_v1');
  profile_model:=coalesce(r->>'profile_skills_model','legacy');
  identity_model:=coalesce(fcfg->>'identity_address_model','legacy');
  commitment_min:=greatest(1,coalesce((fcfg->>'commitment_min_required')::int,6));

  if fcfg->>'application_model'='enhanced_v3' then
    p_payload:=public.validate_volunteer_v3(p_payload,fcfg);
    mail:=p_payload->>'email';
    s:=public.volunteer_score(p_payload,w,r);
    p_payload:=p_payload||jsonb_build_object('commitmentEvent',coalesce(fcfg->'workshop_details','{}'::jsonb));
  else
  if trim(coalesce(p_payload->>'name',''))=''
     or mail !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or trim(coalesce(p_payload->>'phone',''))=''
     or trim(coalesce(p_payload->>'city',''))=''
     or trim(coalesce(p_payload->>'organisation',''))=''
     or trim(coalesce(p_payload->>'role',''))=''
     or not exists (select 1 from jsonb_object_keys(coalesce(p_payload->'stack','{}'::jsonb)))
     or jsonb_array_length(coalesce(p_payload->'commitment','[]'::jsonb)) < commitment_min
     or coalesce((p_payload->>'accurate')::boolean,false)=false
     or coalesce((p_payload->>'consent')::boolean,false)=false
  then raise exception 'Please complete all required application fields.';
  end if;

  if identity_model='geoapify_v1' then
    if trim(coalesce(p_payload->>'gender',''))=''
       or trim(coalesce(p_payload->>'addressBuilding',''))=''
       or trim(coalesce(p_payload->>'addressStreetArea',''))=''
       or trim(coalesce(p_payload->>'addressCityPostcode',''))=''
       or trim(coalesce(p_payload->>'city',''))=''
       or trim(coalesce(p_payload->>'postcode',''))=''
    then raise exception 'Please complete gender and all address fields.';
    end if;
  end if;

  if profile_model='structured_v2' then
    if trim(coalesce(p_payload->>'background',''))=''
       or trim(coalesce(p_payload->>'interest',''))=''
       or trim(coalesce(p_payload->>'preferredRole',''))=''
       or length(trim(coalesce(p_payload->>'why','')))<30
       or jsonb_array_length(coalesce(p_payload->'usefulSkills','[]'::jsonb))<1
       or (
         coalesce(p_payload->'usefulSkills','[]'::jsonb) ? 'Other'
         and length(trim(coalesce(p_payload->>'usefulOther','')))<2
       )
       or exists (
         select 1
         from jsonb_array_elements(coalesce(p_payload->'customTools','[]'::jsonb)) ct
         where trim(coalesce(ct->>'name',''))=''
            or coalesce(ct->>'level','') not in ('New to it','Used it','Comfortable','Built with it')
       )
    then raise exception 'Please complete the structured profile and skills fields.';
    end if;
  else
    if length(trim(coalesce(p_payload->>'why','')))<10
       or length(trim(coalesce(p_payload->>'useful','')))<10
    then raise exception 'Please complete all required application fields.';
    end if;
  end if;

  if model='evidence_v2' then
    if trim(coalesce(p_payload->>'projectType',''))=''
       or jsonb_array_length(coalesce(p_payload->'contributionAreas','[]'::jsonb))<1
       or exists (
         select 1
         from jsonb_array_elements_text(coalesce(p_payload->'contributionAreas','[]'::jsonb)) a1(area)
         where coalesce(p_payload->'involvement'->>a1.area,'') not in ('Owned end-to-end','Contributed significantly','Assisted','Observed only')
       )
       or (
         coalesce(p_payload->'experience','[]'::jsonb) ? 'Worked with a GitHub repository'
         and coalesce(p_payload->>'repoUrl','') !~* '^https?://'
       )
       or (
         coalesce(p_payload->'experience','[]'::jsonb) ? 'Deployed an application'
         and coalesce(p_payload->>'projectUrl','') !~* '^https?://'
       )
       or (coalesce(p_payload->>'projectUrl','')<>'' and coalesce(p_payload->>'projectUrl','') !~* '^https?://')
       or (coalesce(p_payload->>'repoUrl','')<>'' and coalesce(p_payload->>'repoUrl','') !~* '^https?://')
       or (coalesce(p_payload->>'otherUrl','')<>'' and coalesce(p_payload->>'otherUrl','') !~* '^https?://')
       or length(coalesce(p_payload->>'projectSummary',''))>300
    then raise exception 'Please complete the structured experience and required evidence fields.';
    end if;
    s:=public.volunteer_score(p_payload,w,r);
  else
    if length(trim(coalesce(p_payload->>'strongest','')))<10
       or length(trim(coalesce(p_payload->>'contribution','')))<10
    then raise exception 'Please complete all required application fields.';
    end if;
    s:=case when profile_model='structured_v2' then public.volunteer_score(p_payload,w,r) else public.volunteer_score(p_payload,w) end;
  end if;

  end if;

  if fcfg->>'application_model'<>'enhanced_v3' and a.photo_status not in ('review','approved') then raise exception 'Required photo has not been uploaded.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(a.workshop_key||':'||mail,0));
  if exists(
    select 1 from public.volunteer_applications
    where workshop_key=a.workshop_key and lower(email)=mail and status<>'draft' and id<>p_id
  ) then raise exception 'An application has already been submitted with this email address.'; end if;

  update public.volunteer_applications
  set answers=p_payload,
      full_name=trim(p_payload->>'name'),
      email=mail,
      phone=trim(p_payload->>'phone'),
      city=trim(p_payload->>'city'),
      organisation=trim(p_payload->>'organisation'),
      applicant_role=trim(p_payload->>'role'),
      linkedin_url=nullif(trim(p_payload->>'linkedin'),''),
      github_url=nullif(trim(p_payload->>'github'),''),
      gender=nullif(trim(p_payload->>'gender'),''),
      address_building=nullif(trim(p_payload->>'addressBuilding'),''),
      address_street_area=nullif(trim(p_payload->>'addressStreetArea'),''),
      address_city_postcode=nullif(trim(p_payload->>'addressCityPostcode'),''),
      postcode=nullif(trim(p_payload->>'postcode'),''),
      state=nullif(trim(p_payload->>'state'),''),
      country_code=nullif(lower(trim(p_payload->>'countryCode')),''),
      latitude=nullif(trim(p_payload->>'latitude'),'')::double precision,
      longitude=nullif(trim(p_payload->>'longitude'),'')::double precision,
      address_formatted=nullif(trim(p_payload->>'addressFormatted'),''),
      geoapify_place_id=nullif(trim(p_payload->>'geoapifyPlaceId'),''),
      consent=true,
      status='submitted',
      current_step=7,
      total_score=(s->>'total')::numeric,
      component_scores=s->'components',
      consistency_flags=coalesce(s->'flags','[]'::jsonb),
      submitted_at=now(),
      updated_at=now()
  where id=p_id
  returning * into a;

  insert into public.volunteer_status_history(application_id,from_status,to_status,reason)
  values(a.id,'draft','submitted','Applicant submitted application');

  return jsonb_build_object(
    'id',a.id,'status',a.status,'submitted_at',a.submitted_at,
    'total_score',a.total_score,'component_scores',a.component_scores,
    'photo_status',a.photo_status,'score_evidence',s->'evidence',
    'consistency_flags',a.consistency_flags
  );
end
$function$;

