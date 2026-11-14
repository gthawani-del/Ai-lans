# Volunteer application revision

The five-step application accepts broader volunteer backgrounds, with role-appropriate evidence and a single explicit agreement to all six commitments. Education, certificate status, languages and residence are descriptive answers, not automatic eligibility filters.

## Version compatibility

The published form's `application_model` selects the enhanced form. Existing applications remain attached to their original form/scoring version and use the legacy component. New answers live in the existing `answers` JSONB column. Existing reporting columns remain populated. No historical records or scoring formulas are rewritten.

Apply `supabase/migrations/20261114085410_volunteer_v3_validation.sql` before activating the new configuration. The submission function dispatches by the application's saved form version, never a client-supplied model flag. Server validation normalises contact fields, checks enum values and evidence dependencies, builds the commitment snapshot itself, and timestamps consent. Submission uses a row lock plus an email-scoped transaction lock to serialize retries.

Photo review remains the existing trusted backoffice process. The upload route now verifies the WebP signature and decodes/re-encodes server-side before storage. Removing a photo detaches it from the draft; orphan-file cleanup remains a separate retention task.

## Configuration

After the frontend is deployed, publish a new form version with `application_model: enhanced_v3`, `commitment_min_required: 6`, and the five current steps. Keep scoring versions unchanged. `workshop_details` supports `dates`, `hours` (IST) and `venue`; admin settings can publish those values. Until supplied, the UI explicitly calls attendance agreement provisional and requires the team to reconfirm availability. Do not reuse the stale September dates.

## Validation and verification

- `npm test`: browser-side validation and conditional-data normalization.
- `npm run build`: production compilation.
- `node tests/volunteer-browser.cjs`: repeatable browser journey with mocked Supabase responses, at 375/768/1440px. Requires Playwright and Chromium; set `CHROMIUM_PATH` if necessary. Browser test traffic is mocked and does not create applications.
- SQL integration checks run in a transaction ending with ROLLBACK: valid beginner/private-work payloads, invalid input rejection, wrong token rejection, submission normalization and idempotent retry.
- Regenerate SQL validator: `node scripts/build-volunteer-sql.mjs scripts/baseline/volunteer-submit.json supabase/migrations/20261114085410_volunteer_v3_validation.sql`. Baseline is the previous submission function retained for review/reproducibility.

## Deliberately unchanged

Scoring still favours technical evidence and longer motivation responses. The current release adds visibility for reviewers without silently changing score weights or logic. A role-aware scoring revision needs a separate agreed specification.

No email/phone OTP, paid verification, AI-writing detection or name-based gender inference has been added. City–PIN semantic matching needs a maintained postal dataset. No arbitrary data-retention duration or automated deletion policy has been introduced.

An existing Supabase advisory reports RLS disabled on `public.workshop_cohorts`. Its access policies need a separate review; enabling RLS blindly can break unrelated attendee flows. Other existing definer-function advisories likewise require access-policy review.
