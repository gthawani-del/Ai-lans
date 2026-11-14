# weareailabs homepage: reconciled change checklist

Sources: user-supplied September 2026 site audit PDF, November 2026 volunteer form specification, supplied weareailabs logo, current homepage inspection. The volunteer specification is not a homepage specification; shared recommendations are listed once here, and form-specific work stays in its existing backlog.

## Implemented

- Homepage-only teal/mint palette aligned with existing LMS colors, with deep teal for accessible controls. Existing font families, sizes, weights and line heights are unchanged.
- Supplied logo in header, hero and footer; locally hosted optimized WebP, responsive image sizing and descriptive alternatives. Retain ELIV8 LYF as the existing presenter credit.
- Homepage-specific title, description and social image metadata. Existing indexing policy unchanged.
- Keep the published coming-soon status. All homepage CTAs now point to the status section. Remove the redundant floating registration banner that contradicted coming-soon and covered mobile content. The registration route is unchanged.
- Remove the play indicator and video claims from the static workshop illustration.
- Hide unfinished founder, expert and sponsor blocks; remove their navigation anchors. No invented identities, biographies or sponsors.
- Replace the nonfunctional chat teaser with a working FAQ anchor.
- Remove the fake email signup: source contained no API call or persistence. Display explicit enrolment-not-open copy rather than claiming emails were registered.
- Keep current FAQ, experience content, poster and Mumbai imagery.

## Open dependencies before promotion

- Owner-confirmed workshop dates, venue, price and enrolment state, synchronized across homepage, attendee and volunteer pages. Historical 25–26 September dates are not reused.
- Verified monitored contact destination and approved privacy/terms pages. No placeholder links or invented legal assertions were added.
- Real signup persistence, consent notice, failure/retry behavior, and confirmation testing before restoring email collection.
- Approved founder biographies, expert names/photos/credentials, real sponsor assets and workshop video before restoring those blocks.
- Physical iPhone and Android checks; browser reflow is not physical-device QA.

## Out of scope

Volunteer field changes, GitHub evidence requirements, applicant eligibility/scoring, private photo storage, autosave, attendee payment validation, admin access/MFA/RLS, global route SEO, robots/sitemap and legal policy drafting. These are separate tasks, not completed by this homepage refresh.

## Verification

Production build and existing seven volunteer validation tests passed. Homepage CSS has no font, line-height or letter-spacing declarations. Teal #006d71 against white: 6.13:1. Hosted desktop and narrow-width browser checks are recorded in the PR. This does not certify the entire site or its backend workflows.
