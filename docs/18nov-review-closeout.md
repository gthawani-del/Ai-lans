# 18 November review: implementation closeout

Source: `18nov changes.md`. Date: 18 November 2026.
Operator: eliv8Lyf. Public brand: weareailabs. Website: https://weareailabs.com.

## Implemented

- **Attendee landing page:** two-day in-person format, business/MVP expectations, review/selection guidance, logistics, unconfirmed details, ten-question FAQ, mobile-responsive detail section. The page does not invent workshop hours, pricing, venue, tool subscription or reimbursement commitments.
- **Volunteer landing page:** actual types of contributions, two-day availability, orientation/pre-work subject to confirmation, confidentiality, beginners/track guidance, staffing ratio not announced, benefits and payment terms explicitly unconfirmed. No employment or publicity promise.
- **Attendee application:** contact preference (Email/Phone call/WhatsApp), separate mobile number label, representative/anonymised versus synthetic data readiness, optional participation support, optional discovery channel. Existing phone validation, draft storage and application submission retained; Supabase function and registration columns updated. New fields are displayed in the back office.
- **Volunteer languages:** English/Hindi/Marathi/Gujarati/Malayalam/Other options, conditional Other-language text, a selectable proficiency (Fluent/Comfortable/Basic) for each chosen participant-support language; saved in the existing answer JSON and shown in application review. English is not made compulsory without confirmation of the workshop teaching language.
- **Data governance:** privacy policy now describes additional data. Earlier privacy-request register and monthly non-destructive retention snapshots remain available in back office.

## Unconfirmed operating arrangements, not to be published as facts

Workshop dates, venue, daily hours, fee/refund terms, participant grouping, expected support ratio, equipment or paid-subscription requirements, travel/parking/meals, volunteer paid/unpaid status, allowances/reimbursements, certificates, references and precise volunteer orientation requirements.

Until confirmed, public copy must say these remain pending. Staff must reconfirm applicants' availability once dates are published.

## QA and remaining external checks

- Existing attendee + volunteer automated test suites and Vercel production compilation are run on each relevant update.
- Browser/device interaction testing and a real end-to-end application submission (with back-office inspection) remain necessary for release sign-off. No fabricated test applications were submitted.
- A legal professional should review jurisdiction-specific policy/consent requirements. The 18 November document is a UX/content review, not a legal opinion.
- The 30-day volunteer draft retention backlog, legacy unattached photo objects and manual deletion approvals are separate privacy operations, not resolved by these content changes.
