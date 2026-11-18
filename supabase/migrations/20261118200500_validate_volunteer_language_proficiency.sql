-- Validate enhanced_v3 volunteer language ratings on final submission.
-- Each selected language needs a rating; no change to draft auto-save or legacy form paths.
CREATE OR REPLACE FUNCTION public.validate_volunteer_language_proficiency(p jsonb)
RETURNS void LANGUAGE plpgsql SET search_path TO 'pg_catalog'
AS $function$
DECLARE selected text;
BEGIN
  IF jsonb_typeof(p->'languages') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p->'languages')=0
     OR jsonb_typeof(p->'languageProficiency') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION USING message='Choose a proficiency for each selected language.',errcode='22023';
  END IF;
  FOR selected IN SELECT jsonb_array_elements_text(p->'languages') LOOP
    IF selected NOT IN ('English','Hindi','Marathi','Gujarati','Malayalam','Other')
      OR COALESCE((p->'languageProficiency'->>selected) IN ('Fluent','Comfortable','Basic'),FALSE)=FALSE THEN
      RAISE EXCEPTION USING message='Choose a valid proficiency for every selected language.',errcode='22023';
    END IF;
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p->'languageProficiency') AS keys(k)
    WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(p->'languages') AS sel(v) WHERE sel.v=keys.k)
  ) THEN
    RAISE EXCEPTION USING message='Invalid proficiency for an unselected language.',errcode='22023';
  END IF;
END $function$;
REVOKE ALL ON FUNCTION public.validate_volunteer_language_proficiency(jsonb) FROM PUBLIC,anon,authenticated;

-- Enhance only enhanced_v3 submissions. Legacy application validation stays untouched.
DO $patch$
DECLARE existing_definition text; needle text:='p_payload:=public.validate_volunteer_v3(p_payload,fcfg);';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO existing_definition
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='submit_volunteer_application'
    AND pg_get_function_identity_arguments(p.oid)='p_id uuid, p_token text, p_payload jsonb';
  IF existing_definition IS NULL THEN RAISE EXCEPTION 'Expected volunteer submit function missing'; END IF;
  IF position('public.validate_volunteer_language_proficiency(p_payload)' in existing_definition)>0 THEN RETURN; END IF;
  IF position(needle in existing_definition)=0 THEN RAISE EXCEPTION 'Unexpected volunteer submit function body'; END IF;
  EXECUTE replace(existing_definition,needle,needle||E'\n    PERFORM public.validate_volunteer_language_proficiency(p_payload);');
END $patch$;
