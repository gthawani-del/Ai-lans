# M2.6 Form Studio decisions

**Milestones:** M2.6-A through D deployed; M2.6-E being implemented. This records the inspected implementation and does not approve public form collection, email delivery, or retention periods.

## Existing services to extend

- Backoffice shell and session: `app/backoffice/layout.js`, `app/backoffice/AdminSessionContext.js`, `app/backoffice/BackofficeSection.js`.
- CMS authorization: `cms_private.require_cms_super_admin()` and the active `backoffice_users` record; this is the current effective editor/publisher role. No separate editor/publisher/PII-export role was found in the current Form Studio implementation.
- CMS persistence and history: `cms_pages`, `cms_page_revisions`, `cms_audit_events`; M2.6 uses separate form IDs/revisions and references CMS pages through `source_page_id`/usage rows.
- Media: approved asset IDs/paths in `cms_media_assets`; generic forms do not accept file uploads.
- Existing protected applications: attendee remains code-owned at `/register`; volunteer remains code-owned at `/volunteer/apply`. Their schemas, destinations, validation, consent and notifications are not migrated or edited by M2.6.

## M2.6-A schema and route decisions

- Backoffice route is `/backoffice/forms`, under the existing Pages navigation group (the current CMS navigation equivalent of Content).
- Form definitions and immutable version snapshots are distinct from pages. Submission, consent, status-history, notification-outbox and page-usage tables are default-deny with RLS enabled and no direct browser table grants. Admin listing uses existing super-admin checks.
- Six approved template keys are registered from the attached spec. Template catalog rows are configuration, not sample form records. Protected attendee/volunteer rows point to their actual existing routes and are read-only.
- Form Studio is enabled for authorized admin review; `public_submissions_enabled` defaults to false. Published forms/anonymous submission endpoints are not enabled in M2.6-A.
- The page renderer currently has no active `form_embed` authoring/runtime contract. M2.6-E must add the smallest adapter to the existing Page Studio; do not introduce a second page system.

## Verified blockers to public collection and notifications

- No verified transactional email provider/send path was identified in the inspected repository. Do not enable notification delivery or claim email has been sent.
- No owner-approved retention policy or approved final consent-policy version was identified in the current project files. The migration creates no retention-policy entries; future publish validation must block public collection until an approved policy record exists.
- Consequently, public submissions remain disabled in the feature flag. Draft authoring, local simulation, and non-PII review can proceed.

## Rollback

The M2.6-A migration is additive and does not alter attendee or volunteer tables/functions. Rollback means disabling `studio_enabled`; do not drop form records or submission tables if the feature is later used.

## M2.6-B draft editor

- The first editable vertical slice is `contact_v1`. Other registered templates remain visible in the catalogue but cannot create records until their scheduled M2.6-D/E milestone.
- Creating Contact makes a real form identity and initial immutable draft version in the database, then opens the editor. Draft saves create a new version with an expected-version check; they do not change any published-version pointer.
- The editor provides a field list, live preview, selected-field settings, keyboard move controls, and a local-only preview simulation. The simulation never writes submissions. Only the existing super-admin role is authorised because no separate editor/publisher/PII roles exist in the current backoffice.
- The current deployment has no owner-approved retention category or versioned final consent policy. Public form publishing and submissions therefore remain disabled. The editor exposes no active publish action. The public submission route and notifications are not enabled in this milestone.
- The Contact form defaults to minimal name, email, subject, optional `Other` detail (shown only when selected), and message fields. These are editable product defaults from the supplied spec, not legal claims or approved production collection settings.
- M2.6-C adds the private inbox, exact-version response details, status history and export checks. Current response-view permission follows the existing super-admin role. CSV export has a separate per-account grant table with no grants by default; the current repo does not provide an owner-approved grant assignment workflow.
- Public collection stays gated until the documented owner approvals and the abuse controls are present. The production inbox therefore starts empty and shows that public submissions are disabled; no sample response rows are created.

## M2.6-D template and lifecycle extension

- The available generic templates are now Contact, Waitlist, Feedback / Survey and Newsletter. Workshop Registration and Custom Blank remain visible but cannot be created until M2.6-E.
- Duplicate creates a new form ID and version 1 draft from the current draft definition, with no submissions, consent records or notification state copied.
- History is append-only. Restore creates a new draft version after an expected-draft-version check; it never mutates the selected historical version.
- Open/Closed is a separately audited form setting. It is saved server-side. Since no public renderer or submission handler is activated, this state does not create a public route in this milestone.
- Notification sending remains disabled because no verified transactional provider or approved recipient routing was found. No real outbox jobs are queued.

## M2.6-E generic workshop/custom forms and Page Studio embed adapter

- `workshop_registration_v1` and `custom_v1` can now create persisted private drafts. Workshop choices start empty until verified workshop choices exist; the blank template has no answer fields and cannot pass publish validation. Both templates remain unpublished.
- Page Studio reuses the existing `form_embed` section allowed by the `form_landing` and `workshop_event` template registry. Its authenticated picker exposes only currently published/open generic forms when the global public-submission gate is enabled; it also offers fixed navigation adapters for the protected attendee and volunteer routes.
- The public and backoffice page preview uses a safe unavailable state for generic forms while public submissions are disabled. Protected adapters point only to `/register` and `/volunteer/apply`; no applicant fields, validation, API, consent or data destination is copied into Form Studio.
- Page usage is read from actual saved draft and published revisions, not seeded rows. It distinguishes revision kind and exposes the page title/path/status in the Forms usage map.
- The migration extends only Form Studio and the existing CMS page-draft save RPC. It does not alter attendee or volunteer schemas/functions.
- M2.6-E limitation: the production database currently has zero CMS pages and zero generic forms, so a two-page live embed cannot be demonstrated. Generic forms cannot publish or collect responses until the required retention/privacy approvals and submission security controls are in place. This is not a reason to fabricate options or turn on public collection.
