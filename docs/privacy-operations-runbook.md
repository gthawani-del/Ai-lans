# weareailabs privacy operations and retention review

Owner: **eliv8Lyf** (operator); inbound privacy mailbox: **connect@eliv8lyf.com**.
Reviewed: 18 November 2026. Applies to the production **AILab** Supabase project and weareailabs.com.

## Verified processing

- **Attendee:** unfinished answers are saved in browser `localStorage` (`ai-lab-attendee-draft`). Server registration is created on submission using the `submit-attendee-registration` Edge Function. No payment is collected through this application.
- **Volunteer:** `ai-lab-volunteer-draft-v3` saves local answers. Server draft begins with an optional photo upload or at submission; after an ID/resume token exists, auto-save uses `save_volunteer_application`. Browser-stored `ai-lab-volunteer-id` and `ai-lab-volunteer-token` are **resume credentials**, not deletion credentials.
- **Photos:** bucket `volunteer-photos` is private, `ai-lab-ui` is a separate public asset bucket. Review/preview services must preserve access checks. Upload is optional for current enhanced form.
- **Applicant photo deletion (corrected 18 November):** the enhanced form calls `volunteer-photo-remove`, which verifies the resume token, removes the storage object using the Storage API, then clears the photo reference. Direct browser execution of `remove_volunteer_photo` has been revoked; that RPC is reserved for the verified service. Successful photo replacement now attempts to delete the former object through the same token-verified Storage service. Failed uploads, interrupted cleanup, or legacy entries can still leave orphan files, so monthly orphan-object review remains necessary. The admin moderation `remove` status is not the same as physical object erasure.
- **Analytics:** repository scan found no dedicated marketing analytics or advertising pixel integration. This does not exclude necessary platform/network logs or future integrations.
- **Deletion:** no active `pg_cron` / scheduled cleanup in this project. Browser 'clear draft' is local only. Supabase backups follow provider retention and are not instantly deleted when live data is removed.

## Approved review intervals, not automated timers

| Record category | Review target |
| --- | --- |
| Unsubmitted volunteer server drafts | 30 days after last activity |
| Unsuccessful/withdrawn applications | 90 days after closure/withdrawal |
| Selected attendees and volunteers | 12 months after event |
| Separately opted-in future opportunities | 12 months after opt-in, unless renewed |
| Optional volunteer photos | Remove when internal review/identification purpose finishes, including related expired drafts |

No specific provider backup purge SLA is asserted. For applications whose status has not been closed, do not start a 90-day clock based only on original submission. For postponed events, review continued necessity.

## Back-office request register and monthly reporting (implemented 18 November)

- **Back Office → System → Privacy & Retention** is limited to active `super_admin` and `operations` roles. The `privacy-admin` Supabase Edge Function authenticates the administrator and checks their current database role before accessing records.
- **Request register:** authorized staff can record requests received at `connect@eliv8lyf.com`, specify request type, applicant email and reference, designate a responsible administrator, update verification/status/legal-hold flags, and record handling and resolution notes. New requests are owned by the admin logging them. Create/update actions generate entries in `backoffice_audit_log`. Only authorized staff can access the backend; no public request submission endpoint is introduced.
- **Status safety:** closing a case requires a written resolution; marking a deletion complete requires verified identity and an explicit confirmation that deletion was independently performed and checked. **The register does not itself delete records or stored images.** Completed and rejected cases are read-only.
- **Retention reporting:** `pg_cron` job `weareailabs-monthly-privacy-review` (schedule `15 3 1 * *`, database timezone) calls `privacy_internal.capture_retention_report()` on the first day of each month. Reports contain aggregate counts, not applicant content. The first snapshot was generated immediately at setup; admins can inspect prior reports and the current overdue-draft queue. Only reports are automated, **not deletion**.
- **Security:** `public.privacy_requests` and `public.privacy_retention_reports` have RLS enabled and no direct permissions for `anon` or `authenticated` roles. Access is mediated by the authorization-checked server function. Keep free-text notes minimal and do not paste confidential documents or tokens.
- **Operations:** the appointed owner must monitor the contact mailbox, log requests, and act on overdue flags. The scheduled report remains available for review in the back office and is not emailed automatically.

## Minimum operating procedure

**Run review at least monthly and when a verified privacy request arrives.** The operator should assign an internal case owner; the public contact is the mailbox above. Record case ID, category, receipt date, applicant verification status, legal-hold check, reviewer, decision, date, affected live/storage resources and response sent. Restrict this case log to authorized staff. Do not copy resumes, photographs, answers or access tokens into ordinary emails or spreadsheets.

1. **Triage:** Identify records by email/reference, confirm the requester's control of the submission address or equivalent proportional verification, and determine legal/financial/security retention exceptions.
2. **Preview:** Run the read-only inventory queries below on the correct project. Verify the workshop, linked data and photos; ensure selected, paid or active records are not mistakenly included. Check any still-open applications before applying the 30-day draft target.
3. **Approve:** A second authorized reviewer approves removals affecting submitted/selected applications or photos. Record approval before execution.
4. **Remove storage first:** Via Supabase **Storage API**, delete the specific private `volunteer-photos` object paths. Confirm each removal succeeded; do not delete from `storage.objects` directly, as this can leave underlying bytes. Orphan objects require the same review.
5. **Remove dependent data:** After storage verification, use a controlled transaction and verified foreign-key dependencies to remove the approved volunteer or attendee records, associated reviews, preferences and status history. Never use a broad date-based `DELETE` without reviewed IDs. Preserve a minimal redacted administrative audit receipt without photo or application answers.
6. **Check and respond:** Re-query the deleted IDs and storage paths, note legal holds and backup lifecycle limits, send the requester a clear outcome. If partial, state exactly what remains and why.
7. **Exception monitoring:** Review accounts with stale drafts and any photo objects without linked application rows until there are no unexplained exceptions.

## Read-only preview SQL

```sql
-- Drafts past 30-day retention-review target (no deletion).
SELECT id, workshop_key, status, updated_at, (photo_path IS NOT NULL) AS has_photo
FROM public.volunteer_applications
WHERE status='draft' AND updated_at < now()-interval '30 days'
ORDER BY updated_at;

-- Photo object references without a matching current application.
SELECT o.name, o.created_at
FROM storage.objects o
LEFT JOIN public.volunteer_applications v
  ON v.photo_path=o.name
WHERE o.bucket_id='volunteer-photos' AND v.id IS NULL
ORDER BY o.created_at;

-- Current inventory by status; no identifying data.
SELECT status,count(*) FROM public.volunteer_applications GROUP BY status ORDER BY status;
SELECT status,count(*) FROM public.attendee_registrations GROUP BY status ORDER BY status;
```

## 18 November audit snapshot (do not interpret as deletion approval)

- **7** volunteer drafts, **4** older than the 30-day review interval.
- All **4** older drafts have photo references.
- Private bucket contains **23** objects; **2** are unmatched to current `volunteer_applications.photo_path`.
- No active `pg_cron` extension or automated purge was found.
- No application data was erased as part of this audit.

These figures are historical audit evidence only; rerun queries before taking action.

## Controls and follow-ups

- Ensure review teams, not anonymous visitors, can access volunteer applications; keep RLS enabled and separately verify privileged functions and service-role key handling.
- Keep `connect@eliv8lyf.com` actively monitored. Do not promise a response timeframe that is not staffed.
- Publicity/photo marketing requires explicit separate permission, not general application consent.
- Assess legal obligations before enabling deletion automation. Review Indian DPDP phased commencement, vendor retention, possible record holds, and contractual requirements with qualified counsel.
- If automated retention is later adopted, use dry-run previews, legal holds, explicit outcome logging, Storage API cleanup, idempotent retries, and separate authorization before activation.
