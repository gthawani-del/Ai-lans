# WeAreAILabs CMS Architecture Decisions

**Date:** 19 November 2026  
**Scope:** Phase 2 foundation, using the current Next.js, Vercel, Supabase and backoffice. This is an implementation contract, not evidence that CMS features are already live.

## Current infrastructure confirmed

- Next.js 15 App Router and React 19 are deployed through Vercel.
- Backoffice authentication uses Supabase Auth and `public.backoffice_users` (`user_id`, `email`, `role`, `is_active`). Existing role gates include `super_admin` and `operations`; server functions perform the authorization checks. CMS work must not trust UI-only role hiding.
- Production Supabase project `AILab` is active. The production database contains the existing attendee, volunteer, privacy, and social-profile tables. The social-profile migrations are recorded in Supabase and `social-profile-settings-admin` is active. `privacy-admin` is active and its tables exist, although its migration is absent from the returned migration ledger; that discrepancy must be reconciled before altering privacy schema.
- Existing Storage buckets are `ai-lab-ui` (public) and `volunteer-photos` (private, WebP-only, 1 MiB cap). The volunteer bucket is private applicant data and must never be reused for CMS media. Keep current static `public/` assets and form upload flows intact.
- There is no existing Pages CMS, CMS schema, template/component registry, or CMS-specific permission assignment model in the repository/database.

## Decisions

### Routes and reserved paths

- `/` remains the code-owned homepage. Existing static routes continue to own `/privacy`, `/register`, `/register-rhf-test`, `/volunteer`, `/volunteer/apply`, `/backoffice/**`, `/api/**`, and `/lms/**` (LMS is excluded from this work).
- CMS pages use unprefixed public paths through a non-optional catch-all route in an App Router route group. Next static routes take precedence; CMS slug validation rejects all reserved first segments, framework paths, file-like routes, and collisions with code-owned routes. Unknown slugs return 404.
- Slug changes create an explicit permanent redirect only when the new path is published; redirect creation rejects loops, self-redirects, reserved destinations, and conflicting active slugs.
- Backoffice editor and private preview routes remain under `/backoffice/**`. Preview requires the existing authenticated session plus server-side CMS permission, returns `noindex`, and is never served by public page reads.

### Data and access control

- Supabase Postgres is the source of truth for CMS page identity, immutable revision snapshots, templates, approved site settings/navigation, redirects, media metadata, and audit events. Existing attendee/volunteer data models remain code-owned and are not migrated into CMS.
- Mutations go through authenticated Supabase Edge Functions. Each request validates the Supabase JWT, reloads the active backoffice user from `backoffice_users`, checks a CMS capability server-side, validates a typed/allowlisted payload, and writes an audit event. No service-role credential reaches the browser.
- Base CMS tables have RLS enabled and no direct anonymous write access. Public page reads expose only an allowlisted published snapshot through a narrowly scoped public read RPC/view; draft/revision/permission tables are not publicly selectable. CMS admin writes use the validated Edge Function boundary.
- Initial capability mapping is conservative: only active `super_admin` accounts can access the Page Studio during the first vertical slice. Other existing roles receive no CMS permission until an explicit CMS permission is assigned and tested. Do not broaden `operations` privileges implicitly. Add Editor/Reviewer/Publisher capabilities as scoped CMS permissions rather than changing legacy application roles.
- Published revisions are immutable. Restore creates a new draft from a prior snapshot, then requires normal publish authorization. Saves use an expected revision/version to reject stale writes rather than overwrite silently.

### Templates, components and SEO/AEO

- One versioned template registry defines the eight initial templates and their allowed component types. One component registry defines validated section schemas and code-owned renderers. Content is structured JSON; arbitrary HTML, script, CSS, iframe, and executable templates are rejected.
- One shared SEO module owns static and CMS metadata defaults/validation, canonical URL safety, social-card fields and template-bound structured-data generation. Static pages adopt the same helpers incrementally; Phase 4 adds editorial checks/content fields to this engine instead of adding another SEO system.
- CMS pages store SEO values with the revision that was published. AEO is a deterministic checklist of content quality signals, not a numeric ranking or citation guarantee.

### Storage and assets

- Supabase Storage remains the asset byte store; the database stores metadata and relationships. The current `ai-lab-ui` bucket may serve approved public CMS assets after its policies and object usage are inspected. It is never used for private drafts or uploads awaiting review.
- M2.5 must use a separate private draft bucket (or an equally restrictive private namespace) and a server-authorized publish step before a public asset is exposed. The private `volunteer-photos` bucket remains isolated. Use immutable/versioned object keys so replacing an image does not silently alter an already published page.
- Store MIME/size/dimensions, alt text, caption, source/license/rights note, visibility, owner, checksum, variants and page usages. Reject active SVG and unsafe/oversized uploads. Do not delete an asset while a published revision references it.

### Rendering, preview and publication

- CMS page reads use server-rendered output from the published revision only. Initial CMS routes are dynamic/no-store so a publish becomes visible without a Vercel rebuild and without risking stale public cache. This trades some read caching for a simple, correct first release. Add targeted revalidation only after measured need and an authenticated invalidation path.
- Publishing is atomic at the content layer: write/validate revision, update the published pointer, record the event, and update sitemap eligibility together. Failure must not produce a false “published” confirmation.
- The sitemap is generated from current code-owned indexable routes plus canonical, published, indexable CMS pages. Draft, archived, noindex, reserved, redirected, and private routes are excluded. Meaningful publication changes update `lastmod`; preview/background reads do not.
- Responsive preview uses the same section renderer and actual responsive CSS as public pages at desktop/mobile viewport widths; it does not scale a desktop screenshot.

### Migration, rollback and deployment

- Every DB change is a tracked Supabase migration committed with the application code. Inspect live schema first. Prefer additive migrations and forward-compatible code; destructive rollback is not automatic. Document compensating migrations and preserve published snapshots before any schema/data transformation.
- Frontend/renderer/function changes require a normal Vercel deployment. Editing page content, publishing a revision, changing metadata, or changing navigation does not require an application deployment.
- No new service/provider is introduced for Page Studio. M2.5 storage work remains contingent on the existing Supabase project/bucket policy inspection. Search Console/Bing credentials are not required to proceed with CMS implementation.

## Route and code ownership map

| Concern | Existing owner | CMS extension point |
|---|---|---|
| Global metadata and public SEO helpers | `app/layout.js`, `app/page.js`, `app/robots.js`, `app/sitemap.js` | Shared `lib/seo/` helpers, then `app/(cms)/[...slug]/page.js` |
| Backoffice shell and active user | `app/backoffice/layout.js`, `app/backoffice/AdminSessionContext.js`, `lib/backoffice-session.js` | Existing section navigation plus protected Page Studio components/routes |
| Existing applications | `app/register/`, `app/volunteer/apply/`, `lib/forms/`, Supabase application functions | Read-only/protected form landing presentation only; never replace validators or submission handlers |
| Existing social profile settings | `app/backoffice/SocialProfilesSettings.js`, `lib/site-social-profiles.js`, `supabase/functions/social-profile-settings-admin/` | Shared global settings integration; keep URL management separate from publishing |
| Existing privacy operations | `app/backoffice/PrivacyRetentionWorkspace.js`, `supabase/functions/privacy-admin/` | Reuse operations patterns; legal document publishing remains approval-gated |

## Known implementation risks

1. The production database has no CMS tables yet, so M2.1 must start with a migration that is additive and has RLS tests.
2. Supabase reports an active public `ai-lab-ui` bucket; its current object and storage-policy usage must be checked before CMS assets are added.
3. The privacy tables/function are live but the privacy migration does not appear in the reported migration ledger. Do not rewrite or reapply that migration as part of CMS work.
4. Existing production contact links now use `connect@weareailabs.com`; mailbox delivery and SPF/DKIM/DMARC have not been verified here. The CMS settings default must not claim successful delivery.

## M2.0 exit criteria

- Existing stack and production Supabase state inspected.
- Route precedence, reserved routes, permission boundary, storage separation, preview, publishing, sitemap, cache and rollback strategy recorded.
- No production database or application behavior changed by this design milestone.
