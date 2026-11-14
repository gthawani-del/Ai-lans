# Both attachment audit — 14 November 2026

Sources: **WeareAI Lab Site Audit — Fix Checklist(1).pdf** and **AI_Lab_Volunteer_Form_Merged_Deduplicated_v2(2).md**. The markdown is byte-identical to its earlier `(1)` copy; duplicate requirements are merged below rather than counted twice. This document is a current requirement ledger, not a claim of full completion. Historical source examples are not evidence of current production defects.

Status: **Implemented** = code/config inspected; **This change** = included in this follow-up; **Decision** = owner must resolve conflicting requirements or supply facts; **Open** = engineering/verification still outstanding. Browser verification and database execution are recorded separately below.

## Public site and registration (PDF)

| Requirement | Status and evidence |
|---|---|
| Homepage colors only; preserve font family/size; supplied new logo | Implemented in PR #10: scoped `homepage.css`, `HomePage.js`, optimized supplied WebP. No homepage style edits in this follow-up. |
| Remove unfinished founders, expert and sponsor content | Implemented: whole unfinished homepage section and its nav links removed. Real biographies/logos remain content dependencies. |
| Real video or truthful poster label | Implemented: poster label, no fake play control. Volunteer landing has no empty video block. |
| Unify dates/status across routes | This change: removed stale September dates and unverified venue from active registration, payment summary and receipt. Homepage/volunteer already say to be confirmed. Actual event configuration remains Decision. |
| Remove unverified previous-attendee endorsement | This change: removed from active registration component. |
| Accurate booking/payment claims | This change: registration clearly labelled demo before entry; completion says no real payment or confirmed place. Existing backend is a simulation, not a live payment provider. |
| Privacy, terms, contact destinations | Partial: fake `#` footer links removed and missing launch prerequisites disclosed. Decision: actual approved policy, refund rules, monitored contact and data retention; no invented legal text or mailbox. |
| Price/refund before payment | Partial: API fee/tax/total already shown in payment step. Demo notice added before entry. Open: authoritative price before submitting personal information; refund policy needs owner. |
| International registration numbers | Implemented: searchable calling codes; browser/server phone validation uses libphonenumber. Volunteer international eligibility remains separate decision. |
| Nonoverlapping experience band | This change: new applications display and store `16+`; server also accepts historical `15+` clients. Existing records are not reinterpreted. Old device drafts must reselect a valid range. |
| Keep registration dark mode / text-size tools | Implemented, retained. |
| Clear saved drafts | This change: both active forms provide confirmation and clear device drafts; explicitly says this does not delete server records/photos. Server deletion workflow requires retention policy. |
| Truthful autosave state | This change: registration storage failure no longer says saved. Volunteer already has serial saves, revision guard, status and retry. |
| Early access really saves | Homepage fake signup removed in PR #10. Open: operational notification list; current CTA only reaches announcement section and is not an enrolment form. |
| Chat leads to monitored support | Fake chat replaced by FAQ anchor. Decision: verified staffed inbox before real chat/contact CTA. |
| Volunteer roles explained / working homepage links | Partial: broad technical/creative/operational intro plus role preferences and commitments; no empty roles section. Open: owner-reviewed duty descriptions per role. Homepage links present. |
| Private volunteer photos / signed access | Implemented: live bucket private, 1 MB processed WebP limit; token-based preview route. No public photo bucket. |
| Photo optional or later | This change: photo moved from first step to final review; required on submission under existing policy. Optionality still Decision. |
| Verify ai-lab.workshop mailbox/domain | Decision: no evidence mailbox is monitored. No new link to it created. |
| Route SEO / brand | Partial: homepage metadata/new logo from PR #10; registration and application titles/descriptions this change; root title now weareailabs. Open: unique per-route OG artwork and complete brand replacement outside homepage scope. |
| Noindex placeholders and backoffice | This change: permanent backoffice noindex; application and demo registration noindex; robots disallows these and API/test route. No blanket homepage noindex applied; launch/indexing strategy remains owner decision. Robots is not authorization. |
| Sitemap at launch | Open until production canonical domain and launch routes confirmed. Current verified deployment is Vercel; do not infer canonical domain routing from domain ownership. |
| Admin credential rotation / organizational email | Owner action. Password rotation cannot be verified from source and no passwords retrieved. |
| MFA | Open: live metadata shows zero verified MFA factors. Enrolment needs account holders; enforcement requires rollout to avoid lockout. |
| Login throttling / lockout | Open: no custom lockout verified; need authentication configuration review and negative tests. |
| RLS on all public tables | This change: workshop_cohorts was only public table without RLS; migration enables RLS and revokes browser grants, retains service-role access. Other no-policy tables already default-deny. |
| Service-role key stays server-side | Inspected upload API / edge code uses server env; no key copied into this change. Full deployment-secret/history audit not claimed. |
| Least-privilege staff | Partial: active backoffice membership/role lookup present. Open: complete permission matrix and negative access tests. |

## Volunteer specification (markdown §§1–6)

| Requirement | Status and evidence |
|---|---|
| Five steps with stable keys and shared validation | Implemented: `lib/volunteer-v3.mjs`, `VolunteerApplyV3.js`, generated SQL validator. Existing legacy version routing preserved. |
| Full name Unicode/punctuation, length and whitespace | Implemented: 2–100, normalization, control-character checks; no gender/name inference. |
| Optional gender, remove Prefer not to say, conditional Other | This change removes that option; optional remains. Existing drafts with removed option require reselection or blank. Other detail required only while selected. |
| Email syntax/max254; Indian mobile E.164; PIN separate from city | Implemented in shared browser/server rules. Ownership/OTP not claimed. Semantic city/PIN matching needs trusted dataset. |
| International volunteer eligibility/country | Decision: current volunteer contact is India-only; broader eligibility cannot be inferred. |
| Address minimization | Implemented: optional street/building fields. PIN necessity remains owner decision. |
| Role Other; employed Yes -> company+designation; separate institution/course | Implemented with conditional rules and hidden-value normalization. |
| LinkedIn optional with strict HTTPS host/path | Implemented. |
| GitHub profile mandatory in latest feedback | **Decision / NOT implemented as mandatory**: currently optional; confirm applicability to all nontechnical roles. Do not count this as satisfied. |
| Photo preview/replace/remove, native picker, types/size/signature/private | Implemented; final-step placement this change. Client input up to5MB, server re-encodes to private WebP. Manual moderation retained. Real-device picker still untested. |
| Profile, primary interest, capabilities Other | Implemented: each conditional explanation; capabilities distinct from preferred role. |
| Preferred role with truthful preference meaning | Implemented single select. No Other role option in existing taxonomy. Taxonomy approval remains Decision. |
| Five-level tool scale | **Open / Decision**: current four-level scale clearly defined, but not the attachment's five levels. Scoring compatibility must be settled before migration. Additional tools have name+proficiency. |
| Motivation 50–1000 suggestion, hint/counter | Partial: existing field uses declared limits/counter; exact limit/taxonomy decision outstanding. No AI-writing rejection. |
| Explicit experience response; no empty Next | Implemented: some experience or explicit no experience; validation gates progression. |
| Project type Other and actual contribution | Implemented with project category, contribution area/depth, personal narrative and evidence visibility. |
| Repeating project cards with technologies/outcome | **Open**: current form captures one guided evidence set; not repeating cards. Requires payload/review/scoring evolution, not merely color changes. |
| Mandatory repository vs private/no-project route | **Decision / conflict**: current private/no-experience routes retained. Latest mandatory repository requirement is not satisfied for those routes. No silent eligibility exclusion added. |
| Distinct profile and repository URL validation | Implemented with separate keys and strict GitHub host/path checks; other HTTPS evidence optional. |
| CS graduate Yes/No | Implemented, does not auto-disqualify. |
| Exact CS graduation 2024–2026 question | This change: conditional Yes/No for CS graduates, browser/server required validation; does not change the specified years. |
| Convocation status without upload | Partial: current graduated applicants answer status. Decision: narrow to CS group or 2024–2026 subgroup; existing broader question retained. |
| Mumbai residency independent of city | Implemented Yes/No; no automatic exclusion. |
| English/Hindi/Marathi/Gujarati multi-select | Implemented plus Other explanation; one language required currently. Owner decision on no-selection/None route. |
| Current event schedule and time zone | Partial: config-driven; provisional agreement until dates/hours/venue supplied. No stale sample date inserted. |
| Each essential commitment separately, no arbitrary quota | This change: six independent checkboxes; all six validated as distinct allowlisted values in browser and SQL. No blanket select-all. Existing six essential duties retained; loaner/laptop policy needs owner. |
| Exact normalized review with edits and conditional values | Implemented from shared normalized fields; new screening/checks included. Edit buttons and submit revalidation retained. |
| Accuracy and operational consent distinct | Implemented separately unchecked. No publicity permission is requested or inferred; add separate opt-in only if publicity use approved. |
| Server consent version/timestamp and purpose | Implemented SQL consent metadata and UI operational-use explanation. Retention duration/contact remains Decision. |
| Submission idempotence | Implemented server row lock + email-scoped advisory lock; existing returned receipt reuse. Browser blocks duplicate clicks. |
| Receipt reference/time/next steps/contact | Partial: reference/time/next team contact present; monitored support address and response SLA need owner. |
| Labels, hints, inline errors, summary focus, grouped controls | Implemented in enhanced form. Full screen-reader/keyboard matrix not claimed. |
| Responsive and touch targets/reduced motion | Existing responsive CSS/accessibility fixes retained; new changes do not modify fonts. See QA limitations below. |
| Autosave/retry/back/refresh/network | Partial: local draft and serialized online save; failure/retry UI present. Device clear added. Expired token/network/browser storage recovery matrix still Open. |
| Canonical parser/server validation/enums/conditional fields | Implemented shared declaration and generated SQL. Some auxiliary nested keys accepted; complete strict unknown-key stripping still Open. |
| Request limits/no PII logs | Partial: volunteer API limits and validation exist. Registration edge error logging and rate limits require further hardening; no blanket security pass. |
| Age/DOB/payment rules excluded from volunteer form | Implemented: no DOB/age gate or payment flow added to volunteer application. |

## QA and launch gates (both documents)

- Automated validation: eight tests pass after changes, including missing/duplicate/partial commitment rejection. Build and hosted results recorded in PR.
- Existing deployed homepage was reviewed desktop and narrow responsive reflow in PR #10; font faces/sizes retained.
- New follow-up requires hosted smoke checks for registration notices, empty volunteer validation, clear draft and responsive layouts; results appended after execution.
- No genuine applicant records or payments are used for testing. Full volunteer photo upload → submission → admin review, registration test payment → email delivery, role access, slow/offline/expired-token and assisted-technology flows are **not signed off** by this ledger.
- Real Android/iPhone picker, keyboard, VoiceOver/TalkBack and physical-device testing remain **Open**. Browser zoom is responsive reflow, not physical-device testing.

## Decisions required to finish

1. GitHub profile/repository mandatory for everyone, or explicit exceptions for nontechnical/private/no-project applicants?
2. Confirm event dates, daily hours, venue, laptop/loaner expectations and any geographic eligibility restriction.
3. Provide approved privacy/refund terms, retention/deletion policy and monitored contact; decide photo necessity and gender/language requirements.
4. Confirm five-level scoring migration, repeated-project evidence model, certificate subgroup and taxonomy limits.
5. Named admin accounts must rotate shared credentials and enrol MFA before enforcement. Confirm canonical launch domain/indexing plan.

None of these is silently marked completed. This ledger supersedes any implication that the homepage refresh covered both full documents.
