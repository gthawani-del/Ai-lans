# WeAreAiLabs LMS

This folder is the isolated home for all WeAreAiLabs Learning Management System work.

## Boundary

All LMS code, documentation, assets, database migrations, configuration, tests, and supporting files must remain under `/lms`.

Do not modify existing repository modules or root application files for LMS work unless explicitly approved.

## Planned structure

- `app/` — LMS application routes and screens
- `components/` — LMS-only UI components
- `lib/` — LMS-only services and helpers
- `public/` — LMS-only static assets
- `docs/` — PRD, screen map, architecture and data model
- `supabase/` — LMS-only migrations, schema notes and policies
- `types/` — LMS domain types

## Product scope

Core areas:
- Learn
- Workshops
- Community
- Projects & Assessment
- Library
- Instructor Workspace
- Admin

Cross-platform services:
- Authentication
- Notifications
- Search
- Analytics
- AI assistance
- Content storage
- Video/recording management
- API/webhooks
- Audit logs
- Mobile-friendly access

## Data isolation

LMS database objects should use an `lms_` prefix unless a separate schema is explicitly adopted later.

Examples:
- `lms_courses`
- `lms_modules`
- `lms_lessons`
- `lms_enrollments`
- `lms_workshops`
- `lms_recordings`
- `lms_community_posts`
- `lms_assignments`
- `lms_submissions`
- `lms_certificates`
- `lms_skills`

Existing Volunteer, Admin, website and other application tables/modules are out of scope and must not be altered.

## Build rule

Inspect only LMS files when implementing LMS changes, make the smallest safe change, and verify only the affected LMS surface.
