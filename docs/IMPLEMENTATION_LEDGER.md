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
| M2.2 section editor + responsive previews | DEPLOYED | `app/backoffice/CmsPageEditor.js`, `app/backoffice/CmsPageStudio.js`, `app/backoffice/cms-page-studio.css`; migration `supabase/migrations/20261119200001_cms_page_content_editor.sql`. Adds controlled hero, rich-text, image/text, CTA and FAQ editing, reorder/hide/delete, desktop/mobile preview, and revisioned draft save through a role-checked RPC. Anonymous execute denied; authenticated execute granted with server-side super-admin enforcement; page and revision RLS remains enabled. | Vercel production `dpl_9ZGeRMbB4MZdAcmGAXQv2SNZKVhE` READY at commit `3b183e25dd3d1868a4adc59b78150ab3bec3ae68`; migration applied to Supabase `AILab` (`zvmmgkspdgbfcqmnizga`). | Owner visual check of editing and save on a draft. Public pages remain unchanged. |
| M2.3 draft/publish/revisions/restore | NOT STARTED | — | — | Depends on M2.1 and M2.2. |
| M2.4 shared SEO/AEO engine + dynamic sitemap | NOT STARTED | — | — | Must extend the current Phase 1 metadata helpers; no second SEO engine. |
| M2.5 media library | NOT STARTED | — | — | Must inspect `ai-lab-ui` storage policies and use separate private draft storage. |
| M2.6 form template registry | NOT STARTED | — | — | Preserve attendee/volunteer logic and all existing tests. |
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
- **Scope:** section types available depend on each template. Draft editing, ordering, visibility, removal, FAQ rows, and responsive preview are available. Publishing, public dynamic routes, SEO/AEO and media upload are later milestones. Owner check is pending.
