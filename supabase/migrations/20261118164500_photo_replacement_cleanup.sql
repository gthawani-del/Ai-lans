-- Preserve the previous photo path when registering a replacement.
-- The upload route uses this to remove the old file through Supabase Storage API.
CREATE OR REPLACE FUNCTION public.register_volunteer_photo_upload(
 p_id uuid,p_token text,p_path text,p_moderation jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions'
AS $function$
DECLARE a public.volunteer_applications; previous_path text;
BEGIN
 IF p_path !~ ('^pending/'||p_id::text||'-[0-9a-f]{32}\.webp$') OR p_token IS NULL THEN RAISE EXCEPTION 'invalid photo path'; END IF;
 PERFORM public.volunteer_rate_limit('photo:'||p_id::text,10,interval '1 hour');
 SELECT photo_path INTO previous_path FROM public.volunteer_applications
 WHERE id=p_id AND resume_token_hash=encode(digest(p_token,'sha256'),'hex') AND status='draft' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'application not found'; END IF;
 UPDATE public.volunteer_applications
 SET photo_path=p_path,photo_status='review',
 photo_moderation=jsonb_build_object('client_check',coalesce(p_moderation,'{}'::jsonb),'trusted_approval',false),
 photo_admin_hidden=false,photo_admin_note=NULL,photo_reviewed_by=NULL,photo_reviewed_at=NULL,updated_at=now()
 WHERE id=p_id AND resume_token_hash=encode(digest(p_token,'sha256'),'hex') AND status='draft'
 RETURNING * INTO a;
 IF a.id IS NULL THEN RAISE EXCEPTION 'application not found'; END IF;
 RETURN jsonb_build_object('id',a.id,'photo_status',a.photo_status,'previous_photo_path',previous_path);
END $function$;
