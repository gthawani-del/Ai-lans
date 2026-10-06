# WeAreAiLabs LMS — Architecture

## 1. Architecture Goal

Build the LMS as an isolated application inside `/lms` while using the existing Supabase project as the backend platform.

The architecture should prioritize:
- isolation
- maintainability
- predictable deployment
- low infrastructure overhead
- simple ownership boundaries

## 2. Application Boundary

Repository:

```
Ai-lans/
├── existing application files   ← untouched
└── lms/
    ├── app/
    ├── components/
    ├── lib/
    ├── public/
    ├── docs/
    ├── supabase/
    ├── types/
    ├── tests/
    ├── package.json
    └── README.md
```

All LMS application code must remain under `/lms`.

## 3. Recommended Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui where useful

### Backend
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Realtime only where needed

### Deployment
Recommended:
- Separate Vercel project
- Root directory: `/lms`

This prevents LMS deployment changes from affecting the existing WeAreAiLabs application.

## 4. Logical Layers

### Presentation
- Learner UI
- Instructor UI
- Admin UI

### Application
- Course services
- Workshop services
- Community services
- Assessment services
- Certificate services
- Skills services
- Notification services

### Data
- Supabase Postgres
- Storage
- RLS policies
- Database functions only where necessary

### External Services
Future integrations may include:
- Zoom / Google Meet
- Video hosting/transcoding
- Email
- Calendar
- AI model providers
- Analytics

## 5. Domain Modules

### Learn
Owns:
- courses
- modules
- lessons
- resources
- enrolments
- progress

### Workshops
Owns:
- workshops
- sessions
- speakers
- attendance
- recordings

### Community
Owns:
- spaces
- posts
- comments
- reactions
- moderation

### Assessment
Owns:
- quizzes
- questions
- attempts
- assignments
- projects
- submissions
- reviews

### Library
Owns:
- recordings
- resources
- templates
- case studies
- prompt packs

### Skills
Owns:
- skill catalogue
- course-skill mapping
- learner-skill evidence

### Certificates
Owns:
- templates
- issuance
- verification
- revocation

## 6. Authentication & Authorization

Supabase Auth should remain the source of identity.

LMS role model:
- learner
- instructor
- admin

Authorization must be enforced at:
1. UI level
2. server/application level
3. database RLS level

Do not rely on hidden UI alone for access control.

## 7. Data Isolation

Use `lms_` table prefixes.

Do not modify current Volunteer or unrelated application tables.

Example:
- `lms_courses`
- `lms_lessons`
- `lms_workshops`
- `lms_community_posts`

This makes ownership clear and reduces accidental coupling.

## 8. File Storage

Recommended logical buckets/prefixes:
- LMS course assets
- LMS assignment uploads
- LMS project uploads
- LMS workshop resources
- LMS recordings
- LMS certificate assets

Storage policies should mirror LMS permissions.

## 9. Video Strategy

Do not store large workshop video files in the application repository.

Recommended pattern:
- store recordings in an external video/storage service
- save playback URL + metadata in `lms_recordings`
- store transcript, summary and chapter data separately

The final video provider can be selected later based on volume, playback needs and cost.

## 10. Community Architecture

Use scoped spaces.

Each community space belongs to one context:
- global
- course
- cohort
- workshop

This is simpler and more useful than building one unrestricted social feed.

## 11. AI Architecture

AI capabilities should sit behind a small application service layer.

Recommended pattern:

```
UI
→ LMS AI service
→ approved model provider
→ structured response
→ instructor/admin review where required
```

Do not spread provider-specific calls throughout UI components.

Initial AI services:
- course outline generation
- lesson Q&A
- quiz generation
- transcript summarisation
- assignment feedback draft
- analytics commentary

## 12. Search

Initial search should cover:
- courses
- lessons
- recordings
- library resources
- community posts

Start with Postgres search where practical.

Do not add an external search engine until scale requires it.

## 13. Analytics

Capture product events into `lms_activity_events`.

Examples:
- course_enrolled
- lesson_started
- lesson_completed
- quiz_submitted
- assignment_submitted
- workshop_attended
- recording_viewed
- community_post_created
- project_submitted
- certificate_issued

Aggregate later for dashboards.

## 14. Notifications

Notification channels:
- in-app first
- email second

Typical triggers:
- enrolment confirmed
- workshop reminder
- assignment due
- instructor feedback
- announcement
- certificate issued

## 15. Deployment Model

Recommended:

```
GitHub repo: gthawani-del/Ai-lans
        │
        ├── existing Vercel project
        │     root: repository root
        │
        └── LMS Vercel project
              root: /lms
```

This preserves the agreed isolation boundary.

## 16. Build Order

1. LMS shell
2. Authentication
3. Learner dashboard
4. Courses
5. Lesson player
6. Progress
7. Cohorts
8. Workshops
9. Recordings
10. Community
11. Assignments/quizzes
12. Projects
13. Certificates
14. Instructor workspace
15. Admin
16. Analytics
17. AI layer

## 17. Engineering Rules

- No modifications outside `/lms` without explicit approval
- No broad refactors of existing repository code
- Keep dependencies minimal
- Prefer existing platform capabilities before adding new services
- Keep database ownership obvious
- Add RLS with every private LMS table
- Verify only the changed LMS surface during normal changes
- Add Playwright coverage for critical user flows
