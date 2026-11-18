-- weareailabs privacy request register and scheduled non-destructive retention review.
-- Deletions are deliberately NOT implemented in this migration.
CREATE TABLE IF NOT EXISTS public.privacy_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_type text NOT NULL CHECK(request_type IN ('access','correction','deletion','withdrawal','other')),
 applicant_email text NOT NULL CHECK(length(applicant_email) BETWEEN 5 AND 254),
 application_type text NOT NULL DEFAULT 'unknown' CHECK(application_type IN ('attendee','volunteer','unknown')),
 application_reference text,
 status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','verifying','in_review','completed','rejected')),
 verification_status text NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','not_verified')),
 legal_hold boolean NOT NULL DEFAULT false,
 handling_note text NOT NULL DEFAULT '' CHECK(length(handling_note)<=1500),
 resolution_note text NOT NULL DEFAULT '' CHECK(length(resolution_note)<=1500),
 assigned_to uuid,
 created_by uuid NOT NULL,
 updated_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.privacy_requests FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS privacy_requests_status_idx ON public.privacy_requests(status,created_at DESC);

CREATE TABLE IF NOT EXISTS public.privacy_retention_reports (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 report_month date NOT NULL UNIQUE,
 generated_at timestamptz NOT NULL DEFAULT now(),
 draft_overdue_30d integer NOT NULL DEFAULT 0,
 draft_total integer NOT NULL DEFAULT 0,
 orphan_photo_objects integer NOT NULL DEFAULT 0,
 photos_linked_to_overdue_drafts integer NOT NULL DEFAULT 0,
 open_privacy_requests integer NOT NULL DEFAULT 0,
 details jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.privacy_retention_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.privacy_retention_reports FROM anon,authenticated;

CREATE SCHEMA IF NOT EXISTS privacy_internal;
REVOKE ALL ON SCHEMA privacy_internal FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION privacy_internal.capture_retention_report()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,storage,privacy_internal AS $$
DECLARE d date := date_trunc('month',now())::date;
BEGIN
 INSERT INTO public.privacy_retention_reports(report_month,draft_overdue_30d,draft_total,
 orphan_photo_objects,photos_linked_to_overdue_drafts,open_privacy_requests,details)
 SELECT d,
 (SELECT count(*) FROM public.volunteer_applications v WHERE v.status='draft' AND v.updated_at<now()-interval '30 days'),
 (SELECT count(*) FROM public.volunteer_applications v WHERE v.status='draft'),
 (SELECT count(*) FROM storage.objects o WHERE o.bucket_id='volunteer-photos'
  AND NOT EXISTS (SELECT 1 FROM public.volunteer_applications v WHERE v.photo_path=o.name)),
 (SELECT count(*) FROM public.volunteer_applications v WHERE v.status='draft'
  AND v.updated_at<now()-interval '30 days' AND v.photo_path IS NOT NULL),
 (SELECT count(*) FROM public.privacy_requests r WHERE r.status NOT IN ('completed','rejected')),
 jsonb_build_object('mode','report_only','policy','30-day draft review, no automatic deletion')
 ON CONFLICT(report_month) DO UPDATE SET
 generated_at=now(),draft_overdue_30d=EXCLUDED.draft_overdue_30d,
 draft_total=EXCLUDED.draft_total,orphan_photo_objects=EXCLUDED.orphan_photo_objects,
 photos_linked_to_overdue_drafts=EXCLUDED.photos_linked_to_overdue_drafts,
 open_privacy_requests=EXCLUDED.open_privacy_requests,details=EXCLUDED.details;
END $$;
REVOKE ALL ON FUNCTION privacy_internal.capture_retention_report() FROM PUBLIC,anon,authenticated;
SELECT privacy_internal.capture_retention_report();

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.schedule('weareailabs-monthly-privacy-review','15 3 1 * *',
  $$select privacy_internal.capture_retention_report();$$);
