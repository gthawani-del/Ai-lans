import fs from "node:fs";
import {
  rules,
  options,
  tools,
  levels,
  commitments,
  COMMITMENT_VERSION,
} from "../lib/volunteer-v3.mjs";
const q = (v) => "'" + String(v).replaceAll("'", "''") + "'";
const json = (v) => q(JSON.stringify(v)) + "::jsonb";
const source = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const output = process.argv[3];
let sql = `-- Generated from lib/volunteer-v3.mjs. Existing form/scoring versions are preserved.\nCREATE OR REPLACE FUNCTION public.validate_volunteer_v3(p jsonb, cfg jsonb default '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
declare
 spec jsonb:=${json(rules)};
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
   if jsonb_typeof(d->k)<>'string' or (r ? 'min' and char_length(v)<(r->>'min')::int) or (r ? 'max' and char_length(v)>(r->>'max')::int) or (r ? 'enum' and not (r->'enum' ? v)) or (r ? 'pattern' and v !~ (r->>'pattern')) or v ~ '[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f]' then errs:=errs||jsonb_build_object(k,'Enter a valid '||(r->>'label'));end if;
   if r ? 'url' then
    if char_length(v)>2048 or v !~ '^https://[^/@:[:space:]]+[.][^/@:[:space:]]+([/?#][^[:space:]]*)?$' then errs:=errs||jsonb_build_object(k,'Enter a valid HTTPS URL');
    elsif r->>'url'='linkedin' and v !~ '^https://(www[.]|in[.])?linkedin[.]com/in/[^/?#]+/?([?#].*)?$' then errs:=errs||jsonb_build_object(k,'Enter a LinkedIn profile URL');
    elsif r->>'url'='github' and v !~ '^https://(www[.])?github[.]com/[A-Za-z0-9_.-]+/?([?#].*)?$' then errs:=errs||jsonb_build_object(k,'Enter a GitHub profile URL');
    elsif r->>'url'='repository' and v !~ '^https://(www[.])?github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?([?#].*)?$' then errs:=errs||jsonb_build_object(k,'Enter a GitHub repository URL');end if;
   end if;
  end if;
 end loop;
 for tool_name in select jsonb_array_elements_text(coalesce(cfg->'stack_tools',${json(tools.map((x) => x[1]))})) loop
 k:=case tool_name when 'Claude / Claude Code' then 'claude' when 'OpenAI Codex' then 'codex' when 'GitHub' then 'github' when 'Vercel' then 'vercel' when 'Supabase' then 'supabase' else 'tool_'||idx end;tool_keys:=tool_keys||to_jsonb(k);idx:=idx+1;end loop;
 if jsonb_typeof(d->'stack') is distinct from 'object' then errs:=errs||'{"stack":"Rate each core tool"}';else
  if exists(select 1 from jsonb_object_keys(d->'stack') as sk(key) where not (tool_keys ? sk.key)) then errs:=errs||'{"stack":"Unknown core tool"}';end if;
  for k in select jsonb_array_elements_text(tool_keys) loop if not coalesce(${json(levels)} ? (d->'stack'->>k),false) then errs:=errs||'{"stack":"Rate each core tool"}';end if;end loop;
 end if;
 if jsonb_typeof(d->'customTools') is distinct from 'array' then errs:=errs||'{"customTools":"Invalid additional tools"}';else
 if jsonb_array_length(d->'customTools')>10 or exists(select 1 from jsonb_array_elements(d->'customTools') t where char_length(trim(coalesce(t->>'name','')))=0 or char_length(t->>'name')>80 or not coalesce(${json(levels)} ? (t->>'level'),false)) then errs:=errs||'{"customTools":"Enter tool names and levels (maximum 10)"}';end if;end if;
 if d->>'experienceStatus'='No prior experience yet' then
  d:=d||'{"experience":[],"involvement":{}}';
  if d->>'preferredRole'='Technical support' then errs:=errs||'{"experienceStatus":"Choose another role to apply as a beginner, or provide technical experience"}';end if;
 elsif d->>'experienceStatus'='Some experience' then
  if jsonb_typeof(d->'contributionAreas')='array' then
   d:=jsonb_set(d,'{involvement}',coalesce((select jsonb_object_agg(ca.key,d->'involvement'->ca.key) from jsonb_array_elements_text(d->'contributionAreas') as ca(key)),'{}'));
   for k in select jsonb_array_elements_text(d->'contributionAreas') loop if not coalesce(${json(options.involvement)} ? (d->'involvement'->>k),false) then errs:=errs||'{"involvement":"Choose your involvement for each contribution"}';end if;end loop;
  end if;
  if d->>'evidenceVisibility'='Public links' then
   if coalesce(d->'experience' ? ${q(options.experience[0])},false) and coalesce(d->>'repoUrl','')='' then errs:=errs||'{"repoUrl":"Add repository evidence or choose private work"}';end if;
   if coalesce(d->'experience' ? ${q(options.experience[1])},false) and coalesce(d->>'projectUrl','')='' then errs:=errs||'{"projectUrl":"Add a live demo or choose private work"}';end if;
   if (d->>'preferredRole'='Technical support' or (jsonb_typeof(d->'experience')='array' and d->'experience'<>'[]'::jsonb)) and coalesce(d->>'repoUrl','')='' and coalesce(d->>'projectUrl','')='' and coalesce(d->>'otherUrl','')='' then errs:=errs||'{"otherUrl":"Provide evidence or choose private work"}';end if;
  end if;
 end if;
 if d->>'csGraduate'='Yes' and d->>'graduationStatus'<>'Graduated' then errs:=errs||'{"graduationStatus":"Correct the CS graduate or graduation status answer"}';end if;
 if d->>'graduationStatus'='Graduated' and d->>'graduationYear' ~ '^[0-9]{4}$' and (d->>'graduationYear')::int>extract(year from now()) then errs:=errs||'{"graduationYear":"Graduation year cannot be in the future"}';end if;
 if errs<>'{}'::jsonb then raise exception using message='Please correct the highlighted application fields.',detail=errs::text,errcode='22023';end if;
 return d||jsonb_build_object('organisation',case when d->>'employed'='Yes' then d->>'company' else coalesce(d->>'institution','') end,'addressCityPostcode',(d->>'city')||', '||(d->>'postcode'),'countryCode','in','formModel','enhanced_v3','commitment',${json(commitments)},'commitmentVersion',${q(COMMITMENT_VERSION)},'consentVersion',${q(COMMITMENT_VERSION)},'consentRecordedAt',now());
end $fn$;
REVOKE ALL ON FUNCTION public.validate_volunteer_v3(jsonb,jsonb) FROM PUBLIC, anon, authenticated;
`;
let submit = source.find(
  (x) => x.proname === "submit_volunteer_application",
).definition;
submit = submit.replace(
  "and resume_token_hash=encode(digest(p_token,'sha256'),'hex');",
  "and resume_token_hash=encode(digest(p_token,'sha256'),'hex') FOR UPDATE;",
);
const start = submit.indexOf("  if trim(coalesce(p_payload->>'name'");
const end = submit.indexOf("  if a.photo_status");
submit =
  submit.slice(0, start) +
  `  if fcfg->>'application_model'='enhanced_v3' then
    p_payload:=public.validate_volunteer_v3(p_payload,fcfg);
    mail:=p_payload->>'email';
    s:=public.volunteer_score(p_payload,w,r);
    p_payload:=p_payload||jsonb_build_object('commitmentEvent',coalesce(fcfg->'workshop_details','{}'::jsonb));
  else
` +
  submit.slice(start, end) +
  `  end if;\n\n` +
  submit.slice(end);
submit = submit.replace(
  "  if exists(\n    select 1 from public.volunteer_applications",
  "  perform pg_advisory_xact_lock(hashtextextended(a.workshop_key||':'||mail,0));\n  if exists(\n    select 1 from public.volunteer_applications",
);
sql += "\n" + submit + ";\n";
sql += `CREATE OR REPLACE FUNCTION public.remove_volunteer_photo(p_id uuid,p_token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','extensions' AS $fn$
declare a public.volunteer_applications;
begin
 update public.volunteer_applications set photo_path=null,photo_status='missing',photo_moderation='{}',photo_admin_hidden=false,updated_at=now() where id=p_id and resume_token_hash=encode(digest(p_token,'sha256'),'hex') and status='draft' returning * into a;
 if a.id is null then raise exception 'Application not found';end if;
 return jsonb_build_object('id',a.id);
end $fn$;
REVOKE ALL ON FUNCTION public.remove_volunteer_photo(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_volunteer_photo(uuid,text) TO anon,authenticated;
`;
fs.writeFileSync(output, sql);
