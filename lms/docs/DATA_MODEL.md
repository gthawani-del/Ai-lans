# WeAreAiLabs LMS — Data Model

## 1. Naming Rule

Use `lms_` prefixes for LMS tables so the existing Supabase project remains isolated from current application modules.

## 2. Identity

### lms_profiles
- id
- user_id
- display_name
- avatar_url
- bio
- job_title
- company
- location
- created_at
- updated_at

### lms_user_roles
- id
- user_id
- role
- created_at

Roles:
- learner
- instructor
- admin

## 3. Courses

### lms_courses
- id
- title
- slug
- summary
- description
- thumbnail_url
- status
- visibility
- instructor_id
- estimated_minutes
- created_at
- updated_at
- published_at

### lms_modules
- id
- course_id
- title
- description
- position
- created_at
- updated_at

### lms_lessons
- id
- module_id
- title
- lesson_type
- content
- video_url
- duration_minutes
- position
- is_preview
- created_at
- updated_at

### lms_lesson_resources
- id
- lesson_id
- title
- resource_type
- url
- file_path
- position
- created_at

## 4. Enrolment & Progress

### lms_enrollments
- id
- user_id
- course_id
- cohort_id
- status
- enrolled_at
- completed_at

### lms_lesson_progress
- id
- user_id
- lesson_id
- status
- progress_percent
- started_at
- completed_at
- last_viewed_at

### lms_course_progress
- id
- user_id
- course_id
- progress_percent
- completed_lessons
- total_lessons
- completed_at
- updated_at

## 5. Cohorts

### lms_cohorts
- id
- name
- course_id
- status
- start_date
- end_date
- capacity
- created_at
- updated_at

### lms_cohort_members
- id
- cohort_id
- user_id
- role
- joined_at

## 6. Workshops

### lms_workshops
- id
- title
- description
- cohort_id
- venue
- mode
- start_at
- end_at
- status
- created_at
- updated_at

### lms_workshop_sessions
- id
- workshop_id
- title
- description
- speaker_name
- session_type
- start_at
- end_at
- live_url
- position
- created_at

### lms_attendance
- id
- session_id
- user_id
- status
- checked_in_at
- checked_out_at

## 7. Recordings & Library

### lms_recordings
- id
- workshop_id
- session_id
- title
- video_url
- duration_seconds
- transcript
- summary
- published_at
- created_at

### lms_recording_chapters
- id
- recording_id
- title
- start_seconds
- end_seconds
- position

### lms_library_items
- id
- title
- item_type
- description
- url
- file_path
- thumbnail_url
- course_id
- workshop_id
- visibility
- created_at
- updated_at

## 8. Quizzes

### lms_quizzes
- id
- course_id
- lesson_id
- title
- description
- passing_score
- max_attempts
- created_at
- updated_at

### lms_quiz_questions
- id
- quiz_id
- question_type
- prompt
- options_json
- correct_answer_json
- points
- position

### lms_quiz_attempts
- id
- quiz_id
- user_id
- score
- passed
- started_at
- submitted_at

### lms_quiz_answers
- id
- attempt_id
- question_id
- answer_json
- is_correct
- points_awarded

## 9. Assignments & Projects

### lms_assignments
- id
- course_id
- lesson_id
- title
- description
- due_at
- max_score
- created_at
- updated_at

### lms_assignment_submissions
- id
- assignment_id
- user_id
- text_response
- submission_url
- file_path
- status
- submitted_at
- updated_at

### lms_assignment_reviews
- id
- submission_id
- reviewer_id
- score
- feedback
- reviewed_at

### lms_projects
- id
- course_id
- title
- brief
- due_at
- max_score
- created_at
- updated_at

### lms_project_submissions
- id
- project_id
- user_id
- submission_url
- file_path
- notes
- status
- submitted_at
- updated_at

### lms_project_reviews
- id
- submission_id
- reviewer_id
- score
- feedback
- reviewed_at

## 10. Community

### lms_community_spaces
- id
- name
- space_type
- course_id
- cohort_id
- workshop_id
- created_at

### lms_community_posts
- id
- space_id
- user_id
- post_type
- title
- body
- is_pinned
- status
- created_at
- updated_at

### lms_community_comments
- id
- post_id
- user_id
- parent_comment_id
- body
- status
- created_at
- updated_at

### lms_community_reactions
- id
- post_id
- comment_id
- user_id
- reaction_type
- created_at

## 11. Skills

### lms_skills
- id
- name
- description
- category
- created_at

### lms_course_skills
- id
- course_id
- skill_id
- target_level

### lms_user_skills
- id
- user_id
- skill_id
- status
- evidence_type
- evidence_id
- verified_at
- updated_at

## 12. Certificates

### lms_certificate_templates
- id
- name
- template_json
- created_at
- updated_at

### lms_certificates
- id
- user_id
- course_id
- cohort_id
- certificate_template_id
- certificate_number
- verification_code
- issued_at
- revoked_at

## 13. Notifications

### lms_notifications
- id
- user_id
- type
- title
- body
- action_url
- read_at
- created_at

## 14. Analytics & Audit

### lms_activity_events
- id
- user_id
- event_type
- entity_type
- entity_id
- metadata_json
- created_at

### lms_audit_logs
- id
- user_id
- action
- entity_type
- entity_id
- metadata_json
- created_at

## 15. Initial Relationships

- course → modules → lessons
- course → cohorts → learners
- cohort → workshops → sessions → recordings
- course/lesson → quizzes
- course/lesson → assignments
- course → projects
- course/cohort/workshop → community spaces
- course → skills
- learner → progress / submissions / skills / certificates

## 16. RLS Direction

All LMS tables should use Supabase RLS.

General policy intent:
- Learners can read published learning content they are entitled to access
- Learners can read/write only their own progress, attempts and submissions
- Learners can participate only in community spaces they can access
- Instructors can manage assigned courses/cohorts/workshops
- Admins can manage all LMS records
- Public users may only read intentionally public catalogue/certificate verification data

Exact policies should be implemented with migrations after the schema is approved.
