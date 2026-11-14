# Backend follow-up — 14 November 2026

Before applying: inspected workshop_cohorts columns, grants, policies and function dependencies using the connected project. The table had no RLS or policies and both browser roles held all privileges. No repository browser code or public SQL function refers to it. Preserve service-role access, enable RLS and revoke browser-role privileges; no rows are changed.

Volunteer validation: the existing shared contract gains `commitmentChecks`, an allowlisted array requiring all six distinct statements. Browser computes the legacy agreement boolean from these choices; SQL independently validates the array and boolean. Existing submitted records and scores remain unchanged. Existing unsubmitted enhanced_v3 drafts must explicitly tick each statement. Deploy frontend first, then apply the generated validator migration; old open tabs may need refresh. Do not regenerate from an unreviewed baseline.

Security advisory checks also found no verified MFA factors and leaked-password protection disabled. This change does not enrol users or rotate credentials. Named staff accounts, MFA and password rotation remain owner tasks.

Reference consulted: https://supabase.com/docs/guides/database/postgres/row-level-security — RLS with no policies denies browser roles; service-role access bypasses RLS. Revoke grants as well because TRUNCATE is not protected by RLS.

Attendee experience range: server allowlist adds `16+` while retaining `15+` for old clients. Frontend options use `16+`; no existing rows are rewritten. Inspected table constraints: no experience enum constraint. Deployment preserves the existing public endpoint verify_jwt=false setting and all other source behavior.
