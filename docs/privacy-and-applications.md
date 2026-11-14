# Privacy policy and attendee entry points

14 November 2026. Operator brand and contact supplied by owner: eliv8Lyf, https://eliv8lyf.com, connect@eliv8lyf.com. No corporate suffix, office address or unverified legal entity invented.

## Published behaviour

- `/privacy` covers both application types and links to the contact email. Homepage footer and attendee/volunteer forms link to it. Form links open a labelled new tab to protect in-progress answers.
- Homepage navigation, header and primary hero action lead to `/register`.
- Attendee submission uses the existing registration endpoint with `one_page_apply_20261114`, supported by its non-payment branch. It saves an application and displays the returned ID. No demo payment endpoint is called and no email delivery or confirmed seat is claimed. Existing paid records are reported as already on file.
- Privacy page remains noindex. Sitemap, canonical-domain migration and production search activation are deferred until the owner connects the production domain. Existing root SEO settings are not silently changed in this patch.

## Retention operations

The owner approved these business retention periods: incomplete server drafts 30 days after activity; unsuccessful/withdrawn applications 90 days after closure; selected applicants 12 months after event; separately opted-in opportunities 12 months with renewal; photos when their identification/review purpose is complete. No marketing list is introduced by this patch.

These are operational review rules, not a claim that a scheduled purge exists. The policy expressly distinguishes manual retention review, browser copies and provider backups. No existing applicant record is deleted by this change. A deletion implementation needs lifecycle dates, legal-hold handling, photo/orphan cleanup, provider backup rules and audit evidence before automation is enabled. Until then the operator must administer requests through the supplied mailbox and review retained records against the approved schedule; publishing the page alone does not fulfil that work.

Requests: verify applicant identity proportionately; identify attendee/volunteer record and storage objects; determine any applicable legal hold; perform authorised removal/correction; explain retained exceptions and browser/backup limitations; record request outcome without retaining unnecessary application content. Do not claim a fixed backup-purge time without provider evidence.

## Legal source check

Official DPDP Rules: https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
Commencement notification: https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf
The notifications use phased commencement (including eighteen months for Rules 3, 5–16, 22–23 and corresponding substantive Act provisions). The business periods above are not statutory deadlines. Review applicable legal/security retention duties before automating erasure and before production launch. No blanket compliance certification is made.

## Validation

Eleven tests pass (eight existing volunteer validation tests, three attendee submission tests). Submission tests use mocked transport, verify one application request and no payment call, reject malformed/error responses, and cover existing-record acknowledgement. Changed JSX parses successfully. Hosted build and browser checks are recorded in the PR. No real application or payment is submitted during QA.
