-- No client-side cohort queries or SQL functions depend on this table.
-- Administrative Edge Functions keep service_role access. Browser roles fail closed.
ALTER TABLE public.workshop_cohorts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.workshop_cohorts FROM anon, authenticated;
