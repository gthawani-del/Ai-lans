# AI Lab Volunteer Application — Functional Specification v1

Status: Approved implementation baseline  
Route: `/volunteer`  
Admin: existing `/backoffice`  
Principle: configuration-driven, versioned, rules-based scoring; no LLM required.

## 1. Applicant flow

### Entry — Why volunteer?
Show the volunteer-benefits experience before the form:
- Direct Access
- Get Seen
- Build Your Network
- Work on Real MVPs
- Prove Your Ability
- Sharpen Your Stack

Primary CTA: **Apply to Volunteer**.

### Step 1 — You
| Field | Type | Required | Validation / behaviour |
|---|---|---:|---|
| Full name | Text | Yes | 2–100 chars |
| Email | Email | Yes | Valid email |
| Phone / WhatsApp | Phone | Yes | Country code + valid number |
| City | Text | Yes | 2–80 chars |
| College / University / Company | Text | Yes | 2–150 chars |
| Current role | Choice | Yes | Student, Working Professional, Founder, Developer, Designer, AI Enthusiast, Other |
| LinkedIn URL | URL | No | Valid LinkedIn URL when supplied |
| GitHub URL | URL | Conditional | Recommended; required for technical/developer profiles if configured |

### Step 2 — Profile
| Field | Type | Required |
|---|---|---:|
| Education / work background | Short text | Yes |
| Primary area of interest | Multi-select | Yes |
| Preferred volunteer role | Multi-select | Yes |
| Why do you want to volunteer at AI Lab? | Long text | Yes |
| What would make you useful to a participant/team? | Long text | Yes |

### Step 3 — Stack
Default tools:
- Claude / Claude Code
- OpenAI Codex
- GitHub
- Vercel
- Supabase

Each uses one proficiency scale:
1. New to it
2. Used it
3. Comfortable
4. Built with it

Admin may enable/disable/reorder tools and edit labels/help text. The four proficiency levels remain system-controlled in v1 so scores stay comparable.

### Step 4 — Experience
Ask whether the applicant has personally:
- worked with a GitHub repository
- deployed an application
- created/used a database
- implemented authentication
- worked with APIs
- configured environment variables
- debugged a broken application

For each selected capability, allow optional evidence/details where useful.

Purpose: cross-check Step 3 self-rating against practical experience.

### Step 5 — Your Work
| Field | Type | Required |
|---|---|---:|
| Strongest project / work | Long text | Yes |
| What did you personally contribute? | Long text | Yes |
| Project/demo URL | URL | No |
| Repository URL | URL | No |
| Additional work URL | URL | No |

Evidence is preferred over self-description, but public repositories are not mandatory.

### Step 6 — Commitment
Required confirmations:
- Available for both workshop days
- Available for the full required workshop hours
- Will bring own laptop and charger
- Comfortable troubleshooting with participants
- Comfortable supporting a group rather than only observing
- Understands this is an active volunteer role

Any workshop-specific date/time wording must come from published configuration, not hard-coded UI text.

### Step 7 — Review & Submit
- Show all answers grouped by step.
- Allow applicant to return and edit.
- Required declaration that information is accurate.
- Required consent to use application data for volunteer selection/coordination.
- Final Submit action.
- Submitted applications become immutable to the applicant unless reopened by admin.

## 2. Validation model

Validation has three layers:

1. **Field validation** — Zod + React Hook Form.
2. **Conditional validation** — role/answer-dependent requirements.
3. **Evidence consistency flags** — deterministic signals for admin review.

Examples:
- “Built with Supabase” + no database/auth experience → review flag, not automatic rejection.
- “Built with GitHub” + no repo URL → allowed; evidence marked unavailable.
- High stack proficiency + little practical experience → review flag.

Never automatically reject an applicant because of an inconsistency flag.

## 3. Scoring model

Default total: 100 points.

| Dimension | Default weight |
|---|---:|
| Technical readiness | 25 |
| Practical experience | 20 |
| Relevant work / evidence | 15 |
| Motivation & communication | 20 |
| Commitment / operational fit | 20 |

Rules:
- Deterministic scoring only in v1.
- Admin can configure weights; weights must total 100.
- Component scores and total score are always visible.
- No opaque AI score.
- Scoring changes apply only to the relevant published scoring/config version.
- Human reviewer decision always remains separate from calculated score.

## 4. Backoffice configuration

Add **Volunteers** inside the existing AI Lab backoffice.

Sections:
- Applications
- Shortlisted
- Selected
- Standby
- Rejected
- Form Configuration
- Scoring Criteria

### Admin can configure
- application open/close state and dates
- workshop dates/details shown to applicants
- question enabled/disabled
- required/optional where permitted
- question label and helper text
- answer options
- question order within a step
- stack tools
- scoring weights
- role/interest/volunteer-role options
- publish a new configuration version
- preview draft configuration before publishing

### System-controlled in v1
- seven-step workflow and step order
- core identity fields
- application status model
- proficiency scale semantics
- validation engine
- versioning rules
- audit history

This intentionally avoids building a generic form-builder.

## 5. Application lifecycle

`draft → submitted → review → shortlisted → selected | standby | rejected`

Additional state: `withdrawn`.

Rules:
- Draft auto-save.
- Local persistence begins immediately.
- Supabase draft persistence begins once sufficient applicant identity is available.
- Server saves are debounced.
- Reviewer status changes are logged.
- Admin may reopen a submitted application when correction is necessary.

## 6. Versioning

Every application stores:
- `form_version`
- `scoring_version`

Publishing configuration creates a new immutable version.

Existing drafts/submissions remain attached to the version they started with unless an explicit migration is later designed. Historical applications must never silently change because an admin edits the current form.

## 7. Backoffice review experience

Application list supports:
- search
- status
- role
- city
- stack level
- practical experience
- availability/commitment
- score range
- application date

Applicant detail drawer shows:
- snapshot/contact/profile
- stack proficiency
- practical experience
- work/evidence
- written responses
- commitment
- component scores
- consistency flags
- reviewer notes
- activity/status history

Primary reviewer actions:
- Shortlist
- Select
- Standby
- Reject
- Reopen
- Add note

Bulk actions are permitted for status changes with confirmation.

## 8. Component foundation

Use Radix UI Primitives for accessible interaction behaviour while preserving the AI Lab visual system.

Preferred mappings:
- Intro/confirmation: Dialog / Alert Dialog
- Stack proficiency: Radio Group
- Experience/commitment: Checkbox
- Selectable options: Select / Toggle Group where appropriate
- Admin menus: Dropdown Menu
- Helper content: Tooltip / Popover
- Written-response review: Accordion
- Admin detail regions: Scroll Area
- Save/submission feedback: Toast

Do not ship stock Radix styling. Do not introduce MUI, Ant Design, Chakra, or another competing component system.

## 9. UX requirements

Desktop:
- AI Lab context rail
- main form workspace
- seven-step progress
- Back / Continue
- visible save state

Mobile:
- compact AI Lab header
- compact step/progress indicator
- single-column form
- no decorative illustration consuming primary viewport
- persistent, reachable Back / Continue actions

Accessibility:
- keyboard operable
- visible focus states
- semantic labels and errors
- screen-reader-compatible validation
- no colour-only status communication

## 10. Implementation guardrails

- Keep volunteer data separate from attendee registration data.
- Reuse existing Supabase client and established form infrastructure.
- Do not create a separate volunteer admin application.
- Do not require applicant login in v1.
- Do not call an LLM during application or scoring.
- Do not hard-code workshop-specific content that belongs in configuration.
- Do not implement UI before schema/config/version boundaries are defined.

Next implementation step: design the Supabase schema and migrations against this specification.
