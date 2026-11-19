# WeAreAILabs implementation ledger

Source: `weareailabs_backoffice_master_spec_18nov2026(2).md`, `WEAREAILABS_IMPLEMENTATION_STATUS.md`, and `WEAREAILABS_PHASE2_IMPLEMENTATION_BLUEPRINT(1).md`. This ledger tracks this execution; it does not replace those requirements.

| ID | Status | Implementation files / evidence | Deployment reference | Blockers / next |
|---|---|---|---|---|
| P1-01 live HTTP, redirects, robots, sitemap, metadata | DEPLOYED | `app/robots.js`, `app/sitemap.js`, `app/layout.js`, `app/page.js`, `app/volunteer/page.js`, `app/privacy/page.js`, `app/register/page.js`, `app/volunteer/apply/layout.js`; Vercel fetch: `/`, `/volunteer`, `/privacy`, `/register`, `/volunteer/apply`, `/robots.txt`, `/sitemap.xml` all returned 200; apex canonical verified; `www` and HTTP apex returned 308 to HTTPS apex; homepage JSON-LD present. | Vercel deployment `dpl_AHDk8dKynmQrtPsBRo3GNmGVki5K`, commit `1524e4e35e1648e65e49fd76a88fc5dab711ca9d`, state READY. | Search Console/Bing owner verification is external and unconnected; perform after owner grants account/property access. |
| P1-02 public contact address | DEPLOYED | Updated all `connect@eliv8lyf.com` references in `app/` and `docs/` to `connect@weareailabs.com`; changed privacy page contact-only version to 1.2 / 19 November 2026. No application validation or submission notification recipient changed. | Same P1 deployment above. | Mailbox receipt and domain authentication (MX/SPF/DKIM/DMARC) remain unverified. |
| P1-03 social profiles and crawl setup | DEPLOYED | Production `site_social_profiles` contains enabled Facebook and YouTube URLs supplied by owner; social migrations are recorded; robots/sitemap responses inspected. | Supabase project `AILab` (`zvmmgkspdgbfcqmnizga`) and P1 Vercel deployment. | Profile URLs are public links, not OAuth connections. |
| P1-04 Search Console/Bing | BLOCKED | No verification token/property proof in source or connected account evidence. | None. | Owner must provide connected Search Console/Bing property access or verification values. |
| M2.0 architecture decisions | DEPLOYED | `docs/CMS_ARCHITECTURE_DECISIONS.md` records route contract, existing role model, RLS/API boundary, storage, preview/publish/cache, sitemap, and migration/rollback decisions. | GitHub `main` commit `863fb4c`; Vercel `dpl_DGrU4B2g4Uj6iNLYZABPTnGYWa3W` READY (docs only; no product UI change). | Follow these decisions in M2.1; inspect public bucket policies before M2.5. |
| M2.1 protected Page Studio index + create-from-template | DEPLOYED | UI: `app/backoffice/CmsPageStudio.js`, `app/backoffice/cms-page-studio.css`, `app/backoffice/BackofficeSection.js`, `app/layout.js`. Database: `supabase/migrations/20261118200008_cms_page_studio_foundation.sql`, `supabase/migrations/20261118200258_cms_m2_1_audit_return_fix.sql`. Production Supabase confirms eight active templates, zero CMS pages, RLS enabled, no anonymous page reads, and unauthenticated admin RPC denial. Local `npm run build` succeeded; existing volunteer 10/10 and attendee 6/6 test runs passed. | Vercel production `dpl_Fo6tfzQsXxmACwgDwd1TG2hpn74T` READY at commit `31c2567137bbbbaaa220bdeb2ee0572fa403b873`; aliases include `https://weareailabs.com` and `https://www.weareailabs.com`. DB migrations applied to Supabase `AILab` (`zvmmgkspdgbfcqmnizga`). | The owner confirmed the initial preview was only a placeholder and editing was unavailable; M2.2 now supplies section editing. Publishing remains M2.3. |
| M2.2 section editor + responsive previews | DEPLOYED | `app/backoffice/CmsPageEditor.js`, `app/backoffice/CmsPageStudio.js`, `app/backoffice/cms-page-studio.css`; migration `supabase/migrations/20261119200001_cms_page_content_editor.sql`. Adds controlled hero, rich-text, image/text, CTA and FAQ editing, reorder/hide/delete, desktop/mobile preview, and revisioned draft save through a role-checked RPC. Anonymous execute denied; authenticated execute granted with server-side super-admin enforcement; page and revision RLS remains enabled. Owner confirmed the Edit option works and that page content can be written. | Vercel production `dpl_9ZGeRMbB4MZdAcmGAXQv2SNZKVhE` READY at commit `3b183e25dd3d1868a4adc59b78150ab3bec3ae68`; migration applied to Supabase `AILab` (`zvmmgkspdgbfcqmnizga`). | SEO/AEO, media management, and publishing history continue in later milestones. |
| M2.3 draft/publish/revisions/restore | DEPLOYED | `app/backoffice/CmsPageEditor.js`, `app/backoffice/CmsPageHistory.js`, `app/backoffice/CmsPageStudio.js`, `app/(cms)/[...slug]/page.js`, `app/backoffice/cms-page-studio.css`; migration `supabase/migrations/20261119210000_cms_publish_history_public_routes.sql`. Adds explicit publish, published-page draft updates, immutable revision history and restore-as-new-draft, archive, and public rendering from published snapshots only. Protected legal/trust templates cannot publish. Supabase privilege query confirmed admin RPCs are not executable by `anon`; public reader is read-only. Existing `about-ai-wearables` and `industry-trends` remain drafts; production `/industry-trends` returns 404. Local `npm run build` passed. | Vercel production `dpl_D6aGqbZHcoHqLKcnqf1v56ytFLa5` READY at commit `fc92628f0db52aad35ffd6f7128f2f5a3d741187`. Migration applied to Supabase `AILab` (`zvmmgkspdgbfcqmnizga`). Production `/` and `/backoffice` returned 200; unpublished draft URL returned 404. | Drafts remain unpublished until an administrator explicitly publishes. Searchable metadata and automatic sitemap inclusion are M2.4. |
| M2.4 shared SEO/AEO engine + dynamic sitemap | NOT STARTED | — | — | Must extend the current Phase 1 metadata helpers; no second SEO engine. |
| M2.5 media library | NOT STARTED | — | — | Must inspect `ai-lab-ui` storage policies and use separate private draft storage. |
| M2.6-A Form Studio foundation | DEPLOYED | `app/backoffice/CmsFormStudio.js`, `app/backoffice/BackofficeSection.js`, `app/backoffice/page.js`, `app/backoffice/cms-page-studio.css`; migration `supabase/migrations/20261119232000_cms_form_studio_foundation.sql`. Adds six registered templates, protected applicant integration rows, default-deny form/version/submission/consent/audit tables, and super-admin listing. Public submissions default off. | GitHub `main` commit `893cc44`; Vercel production deployment `dpl_4zKKCNzoNoykCA3bg4HtgC2dJfJF` READY; `https://weareailabs.com/backoffice/forms`. Migration applied to Supabase `AILab` (`zvmmgkspdgbfcqmnizga`). | M2.6-B adds Contact draft authoring. Public collection and notifications stay disabled pending owner approvals and security controls. |
| M2.6-B Contact draft editor | CODE COMPLETE · DEPLOYMENT PENDING | `app/backoffice/CmsFormStudio.js`, `app/backoffice/CmsFormEditor.js`, `app/backoffice/cms-page-studio.css`; migrations `20261119233000_cms_form_draft_editor.sql` and `20261119234000_cms_form_owner_purpose_rules.sql`. Creates Contact as real version 1 draft; edits save immutable versions with optimistic conflict protection; includes local-only desktop/mobile preview simulation and validated field settings. The signed-in super admin is recorded as owner; purpose is required. | Supabase migrations applied; local `npm run build` passed. GitHub/Vercel deployment pending. | Public publish/collection remains disabled because no approved privacy/retention category or versioned consent source exists; public submit API and notifications are not enabled. |
| M2.7 navigation/global settings + deterministic Intel | NOT STARTED | — | — | No social publishing, podcast, Media Studio, or LMS. |
| M2.8 regression and owner walkthrough | NOT STARTED | — | — | Run the blueprint's focused CMS and legacy-form matrix after a vertical slice exists. |

## Milestone evidence log

### P1 — public-site closure

- **Code:** `326cd3a` locally; equivalent commit on GitHub `main`: `1524e4e`.
- **Build:** `npm run build` succeeded; Next.js generated 24/24 static pages.
- **Tests:** `npm test` passed 10/10 volunteer tests; `node --test tests/attendee-application.test.mjs` passed 6/6 attendee tests.
- **Production:** Vercel deployment is READY. Robots and sitemap returned 200 with expected contents; canonical/meta/OG/Twitter tags and homepage JSON-LD were inspected from the production response. Favicon returned 200 with `image/vnd.microsoft.icon`.
- **Scope check:** No form validators, form submission schemas, or recipient-routing logic changed.

### M2.1 — protected Page Studio foundation

- **Code:** GitHub `main` commit `00a5961`; the initial build exposed a truncated source upload, which was restored exactly from the verified local source in follow-up commit `31c2567`.
- **Build:** local `npm run build` succeeded; Vercel production deployment `dpl_Fo6tfzQsXxmACwgDwd1TG2hpn74T` is READY.
- **Database:** migrations `20261118200008` and `20261118200258` are applied; eight active templates are available; page table access is protected by RLS and CMS super-admin checks.
- **Scope:** Page Studio create/list/filter/duplicate/private preview foundation. Owner screenshots confirmed writing was unavailable; M2.2 added the section editor. Publishing remains M2.3.

### M2.2 — section editing and responsive preview

- **Code:** GitHub `main` commit `3b183e2`; editor in `app/backoffice/CmsPageEditor.js`, integrated into the Page Studio list, with styles in `app/backoffice/cms-page-studio.css`.
- **Database:** migration `20261119200001_cms_page_content_editor` applied to production. Draft saves create a new revision and use an optimistic revision check; anonymous RPC execution is denied and the function enforces active `super_admin` access. RLS remains enabled for pages and revisions.
- **Build:** local `npm run build` passed; Vercel production deployment `dpl_9ZGeRMbB4MZdAcmGAXQv2SNZKVhE` is READY.
- **Scope:** section types available depend on each template. Draft editing, ordering, visibility, removal, FAQ rows, and responsive preview are available. Publishing/history is M2.3; SEO/AEO and media upload are later milestones. The owner confirmed that editing works.

### M2.3 — publish, history and public rendering

- **Code:** GitHub `main` commit `fc92628`; explicit publish action, draft editing for published pages, revision history, restore-to-draft, archive, and the public catch-all renderer use the existing controlled section renderer.
- **Database:** migration `20261119210000_cms_publish_history_public_routes` applied to production. Published content is read from the published revision pointer; save and restore create immutable revisions; publish is explicit and server-authorized. Admin RPC execution is denied to `anon`; the public RPC returns only published snapshots.
- **Build/deployment:** local `npm run build` passed. Vercel production `dpl_D6aGqbZHcoHqLKcnqf1v56ytFLa5` at commit `fc92628` is READY. `/` and `/backoffice` returned 200; `/industry-trends` returned 404 while that page remains a draft.
- **Scope:** Existing drafts were not published. Legal/trust templates remain publish-blocked until an approval workflow exists. Automatic sitemap inclusion and the shared SEO/AEO editor are M2.4.

### M2.6-A — protected Form Studio foundation

- **Code:** Forms is linked from the existing Pages navigation and Dashboard; six template definitions are seeded as configuration; protected applicant forms link to `/register` and `/volunteer/apply` without changing either workflow.
- **Database:** additive migration applied to Supabase `AILab`; RLS enabled, direct browser access revoked, admin list functions enforce existing CMS super-admin access. Public submissions default to disabled.
- **Build:** `npm run build` succeeded on the working tree. No attendee/volunteer validators, schemas, or submission destinations were changed.
- **Scope:** A is the protected index and template catalogue. B adds the editable Contact draft slice; public data collection remains blocked pending documented approvals.

### M2.6-B — Contact draft editor

- **Code:** `CmsFormStudio` creates the Contact form in the database, then opens the three-panel field list, interactive preview, and settings inspector. Field ordering has keyboard controls. Preview validation is local only.
- **Database:** `cms_admin_create_form`, `cms_admin_get_form_editor`, and `cms_admin_save_form_draft` require active super-admin access. Saves create immutable versions and reject stale draft pointers. A trigger records the active admin as operational owner and rejects a missing purpose. RLS and direct browser table grants remain default-deny.
- **Build:** local `git diff --check` and `npm run build` passed; migrations applied successfully to production Supabase.
- **Publication gate:** no approved retention/privacy category or versioned consent policy is recorded. Public publishing/submission and notifications stay disabled; no visitor responses are collected.
- **Production:** deployment pending Vercel build for the next GitHub `main` commit.
