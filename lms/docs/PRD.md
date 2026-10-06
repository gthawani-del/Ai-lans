# WeAreAiLabs LMS — Product Requirements Document

## 1. Product Summary

WeAreAiLabs LMS is a learning platform for delivering structured courses, in-person and live workshops, workshop recordings, assignments, projects, assessments, community interaction, skills tracking, and certification.

The product should extend the WeAreAiLabs workshop experience into a persistent learning ecosystem.

Primary product principle:

> Every workshop should create reusable learning assets, continued engagement, measurable learning progress, and an ongoing community.

## 2. Primary Users

### Learner
- Enrol in courses and programmes
- Join workshop cohorts
- Attend live sessions
- Watch workshop recordings
- Complete lessons, quizzes and assignments
- Submit practical projects
- Participate in community discussions
- Track progress and skills
- Earn certificates

### Instructor
- Create and manage courses
- Create lessons and resources
- Manage cohorts
- Host live workshops
- Review assignments and projects
- Grade learners
- Track attendance and learner progress
- Publish announcements

### Admin
- Manage users and roles
- Manage courses, cohorts and enrolments
- Manage workshops and recordings
- Manage certificates
- Moderate community activity
- Review platform analytics
- Configure platform settings and integrations

## 3. Core Product Areas

### Learn
- Course catalogue
- Course detail pages
- Modules and lessons
- Learning player
- Progress tracking
- Skills tracking
- Quizzes
- Assignments
- Certificates
- Learner dashboard

### Workshops
- Upcoming workshops
- Cohort-based batches
- Session schedules
- Attendance
- Speaker and panel sessions
- Reminders
- Workshop resources
- Workshop recordings
- Post-session follow-up
- Session feedback

### Community
- Course discussions
- Cohort discussions
- General community feed
- Q&A
- Expert AMA
- Project showcase
- Comments and replies
- Announcements
- Moderation
- Member profiles

### Projects & Assessment
- Project briefs
- Submission URLs/files
- Screenshot/file uploads
- Instructor review
- Feedback and scoring
- Peer review
- Question bank
- Quiz attempts
- Practical assessments
- Completion rules

### Library
- Full workshop recordings
- Session-wise recordings
- Chapter markers
- Transcripts
- Summaries
- Slide decks
- Templates
- Case studies
- Prompt packs
- Downloadable resources

### Instructor Workspace
- Course builder
- Lesson authoring
- Cohort management
- Live session hosting
- Assignment review
- Grading
- Learner progress
- Attendance
- Announcements
- Instructor analytics

### Admin
- User management
- Roles and permissions
- Course management
- Cohort management
- Enrolments
- Certificate management
- Community moderation
- Reporting and analytics
- Platform settings
- Integrations

## 4. Cross-Platform Services

- Authentication
- Authorization and role control
- Notifications
- Search
- Analytics
- Content storage
- Video/recording management
- API/webhooks
- Audit logging
- Responsive/mobile access

## 5. AI Layer

AI should assist the platform, not replace the learning experience.

Initial AI capabilities:
- AI course builder
- Lesson assistant grounded in course material
- Quiz generation
- Assignment feedback draft
- Transcript summaries
- Analytics commentary

AI-generated outputs must remain reviewable by instructors/admins.

## 6. Workshop Recording Requirement

Every workshop should support:
- Full-session recording
- Session-wise clips
- Chapter/timestamp markers
- Transcript
- Summary
- Linked slide deck
- Linked downloads/resources
- Speaker information
- Follow-up discussion
- Related assignment/project

The LMS should not rely on a single long workshop video as the default learning experience.

## 7. Community Requirement

Community must be contextual rather than a generic social network.

Community scopes:
- Global WeAreAiLabs
- Course
- Cohort
- Workshop
- Project showcase

Core interactions:
- Posts
- Replies
- Questions
- Answers
- Announcements
- Reactions
- Moderation
- Pinning

## 8. Skills Model

Courses and projects may map to skills.

Learners should eventually have a skills profile showing:
- Skill name
- Status
- Evidence
- Related course/project
- Completion or verification date

## 9. MVP Scope

### Phase 1
- Authentication
- Learner dashboard
- Course catalogue
- Course pages
- Modules and lessons
- Learning player
- Progress tracking
- Quizzes
- Assignments
- Cohorts
- Workshops
- Recordings
- Community
- Instructor workspace
- Basic admin
- Certificates
- Basic analytics

### Phase 1.5
- Projects
- Skills tracking
- Attendance
- Search
- Notifications
- Transcript support
- AI course builder
- Lesson assistant

### Phase 2
- Corporate/team accounts
- Compliance training
- Certificate expiry/renewal
- Advanced analytics
- API/webhooks
- Integrations
- Advanced community features

## 10. Non-Goals for Initial Release

- Full Moodle feature parity
- Public marketplace
- Complex multi-tenant billing
- SCORM/xAPI support
- Native mobile apps
- Heavy gamification
- Complex enterprise SSO

These may be revisited later if business demand justifies them.

## 11. Product Success Metrics

Initial metrics:
- Enrolment completion rate
- Lesson completion rate
- Workshop attendance
- Recording consumption
- Assignment/project submission rate
- Course completion rate
- Community participation rate
- Certificate issuance
- Returning learner rate
- Skills completed

## 12. Delivery Constraints

- All LMS work remains inside `/lms`
- Existing repository modules must not be modified unless explicitly approved
- Existing Volunteer/Admin/website functionality is out of scope
- LMS database objects should use `lms_` prefixes unless a separate schema is approved
- Prefer simple, maintainable architecture over framework-heavy abstractions
