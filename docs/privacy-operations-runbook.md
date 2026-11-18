# weareailabs privacy operations and retention review

Owner: **eliv8Lyf** (operator); inbound privacy mailbox: **connect@eliv8lyf.com**.
Reviewed: 18 November 2026. Applies to the production **AILab** Supabase project and weareailabs.com.

## Verified processing

- **Attendee:** unfinished answers are saved in browser `localStorage` (`ai-lab-attendee-draft`). Server registration is created on submission using the `submit-attendee-registration` Edge Function. No payment is collected through this application.
- **Volunteer:** `ai-lab-volunteer-draft-v3` saves local answers. Server draft begins with an optional photo upload or at submission; after an ID/resume token exists, auto-save uses `save_volunteer_application`. Browser-stored `ai-lab-volunteer-id` and `ai-lab-volunteer-token` are **resume credentials**, not deletion credentials.
- **Photos:** bucket `volunteer-photos` is private, `ai-lab-ui` is a separate public asset bucket. Review/preview services must preserve access checks. Upload is optional for current enhanced form.
- **Applicant photo deletion (corrected 18 November):** the enhanced form calls `volunteer-photo-remove`, which verifies the resume token, removes the storage object using the Storage API, then clears the photo reference. Direct browser execution of `remove_volunteer_photo` has been revoked; that RPC is reserved for the verified service. A photo replacement or failed upload may still leave an unreferenced object; monthly orphan-object review remains necessary. The admin moderation `remove` status is not the same as physical object erasure.
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
