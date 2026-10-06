# WeAreAiLabs LMS — UI Specification

## 1. Purpose

This document defines the visual system and interaction language for the WeAreAiLabs LMS.

It is implementation guidance for all learner, instructor, admin, and system-state screens.

The visual direction is now locked from the approved anchor screens:
- Learner Home / Dashboard
- Learn / Course Catalogue
- Lesson Player / Course Detail

All remaining screens must inherit this system rather than inventing a new visual language.

---

## 2. Core Design Direction

The LMS should feel like a premium executive learning workspace, not a generic school LMS and not a generic AI SaaS dashboard.

Design character:
- editorial
- calm
- structured
- premium
- practical
- modern
- highly legible
- professional rather than playful
- visually distinctive without decorative excess

The learner experience should feel lighter and more editorial.
Instructor and admin views may become denser where operational work requires it.

---

## 3. Reference Principles

The UI should synthesize proven product patterns rather than copy any single reference.

### ClassroomIO
Use as reference for:
- modern course structure
- cohorts
- learner dashboard
- progress
- course management clarity

### Frappe LMS
Use as reference for:
- straightforward course > chapter/module > lesson hierarchy
- batches
- live sessions
- quizzes
- assignments
- certification

### Moodle
Use only as functional-completeness reference:
- enrolment logic
- prerequisites
- grading
- permissions
- reporting
- assessment edge cases

Do not use Moodle as a visual reference.

### ThemeForest LMS ecosystem
Use as a broad reference for:
- screen completeness
- course catalogue patterns
- learning player conventions
- instructor/admin workflows
- workshop/event layouts

Avoid the repeated marketplace-template look:
- colorful metric tiles
- over-carded dashboards
- school visual language
- giant generic education heroes

### Anthropic frontend-design principles
Apply:
- strong aesthetic direction
- distinctive typography
- context-aware UI decisions
- meticulous visual detail
- avoid generic AI-generated interfaces

---

## 4. Brand Rules

### Logo
Use the exact approved WeAreAiLabs logo asset.

Do not:
- redraw it
- reinterpret the symbol
- change wordmark proportions
- replace it with an approximate AI-generated logo
- alter the gradient
- modify spacing between symbol and wordmark

The logo should appear cleanly at the top of the main navigation.

### Left navigation
The lower portion of the left rail must remain visually quiet.

Do not add:
- slogans
- stacked brand phrases
- decorative copy
- quotes
- filler text
- pseudo-editorial taglines

Only functional navigation and essential account actions belong in the rail.

---

## 5. Visual Language

### Base surfaces
- primary page background: warm white / off-white
- content surface: white
- subdued surface: very light neutral
- dark surfaces reserved for media, video, or intentional editorial contrast

### Brand accents
Use the approved WeAreAiLabs palette:
- teal
- aqua
- green
- lime/yellow-green

Accent colors must be used with restraint.

Primary uses:
- active navigation
- progress
- selected states
- status highlights
- primary calls to action
- small visual separators

Avoid full-page gradients.

### Contrast
Main text should remain deep charcoal / dark navy-black.
Secondary text should be muted blue-gray / neutral gray.

---

## 6. Typography

The system uses two complementary typography roles.

### Editorial display
Use for:
- important page titles
- major course titles
- selective hero headings
- distinctive editorial moments

Characteristics:
- refined serif
- strong contrast
- premium but readable

### Functional sans
Use for:
- navigation
- body copy
- labels
- tables
- forms
- buttons
- metadata
- analytics

Characteristics:
- high legibility
- compact
- neutral
- professional

Avoid defaulting to common AI-favorite SaaS fonts unless deliberately selected during implementation.

---

## 7. Layout System

### Desktop
Recommended target:
- 1440–1600px desktop canvas
- persistent left navigation
- top utility/search bar
- main content region
- optional contextual right rail where useful

### Left navigation
Width:
- approximately 220–260px

Behavior:
- fixed/persistent desktop navigation
- icon + label
- clear active state
- no decorative footer copy

### Main content
Use:
- strong horizontal alignment
- visible rhythm
- generous but controlled whitespace
- section dividers where appropriate

Avoid:
- arbitrary floating panels
- excessive nested cards
- giant blank hero regions

### Right contextual rail
Use only when it adds task value.

Suitable for:
- course progress
- cohort context
- lesson resources
- review metadata
- learner history

Do not force a right rail onto every page.

---

## 8. Spacing

Use a consistent 4/8 based spacing system.

Suggested scale:
- 4
- 8
- 12
- 16
- 24
- 32
- 40
- 48
- 64

Prefer structural spacing over decorative containers.

---

## 9. Corners, Borders, Shadows

### Radius
Use restrained radii.

Recommended:
- small controls: 4–6px
- cards/panels: 8–10px
- large media surfaces: up to 12px

Do not make every component pill-shaped.

### Borders
- 1px subtle neutral borders
- stronger divider only where hierarchy requires it

### Shadows
Use rarely and softly.
Prefer border + whitespace to heavy elevation.

No colored shadows.

---

## 10. Navigation

Learner primary navigation:
- Home
- Learn
- Workshops
- Community
- Projects
- Library
- Skills
- Assessments
- Certificates
- Profile

Settings may sit near Profile or within account menu.

Instructor workspace should be visually distinct and role-gated.

Admin should be visually distinct and role-gated.

---

## 11. Header

Persistent desktop header should support:
- global search
- notifications
- user avatar/name
- role
- account menu

Do not overload the header with secondary actions.

Search should support:
- courses
- workshops
- people
- discussions
- resources

---

## 12. Buttons

### Primary
Use dark teal / near-black or controlled teal/green accent.

### Secondary
White surface, thin border, dark text.

### Destructive
Reserved red semantic styling.

### Text action
Used for:
- View all
- View programme
- Open
- Download
- Register

Avoid pill buttons unless the function is truly tag/status-like.

---

## 13. Status Language

Use compact status indicators:
- Live
- Due
- Completed
- In progress
- Draft
- Published
- Reviewed
- Passed
- Needs review

Semantic color should supplement text, never replace it.

---

## 14. Cards and Panels

Cards are allowed but must not become the whole interface.

Preferred patterns:
- editorial sections
- rows
- lists
- lightweight panels
- tables
- timelines
- split views

Use cards when they represent a discrete object:
- course
- workshop
- recording
- project
- certificate

Avoid card-inside-card layouts.

---

## 15. Media

Course and workshop media should feel premium and realistic.

Use:
- architectural imagery
- real workplace scenes
- instructors/speakers where relevant
- workshop/event photography
- clean editorial crops

Avoid:
- generic AI art
- glowing abstract brains
- random robots
- decorative gradient blobs
- meaningless futuristic imagery

---

## 16. Course Catalogue

Structure:
- page title + concise supporting line
- tabs/categories
- filter rail or drawer
- featured programmes
- courses
- learning paths

Course cards should show only useful metadata:
- title
- short value statement
- module/lesson count
- duration
- level
- progress if enrolled

---

## 17. Lesson Player

Core composition:
- breadcrumb/context
- lesson title
- media player
- lesson tabs
- lesson body
- takeaways
- resources
- progress/curriculum panel
- next/previous navigation

Tabs may include:
- Overview
- Notes
- Transcript
- Resources
- Discussion

Do not hide critical learning controls behind deep menus.

---

## 18. Workshops

Workshop UI should prioritize:
- date/time
- format/location
- speaker
- cohort
- registration status
- session schedule
- resources
- attendance
- recordings
- follow-up discussion

Upcoming sessions should often use agenda/list patterns rather than large course-style cards.

---

## 19. Recordings

Recording library should support:
- full-session recordings
- session clips
- chapters
- transcript
- summary
- speaker
- related resources
- related discussion

Recording detail should combine media and learning context rather than behave like a generic video website.

---

## 20. Community

Community is contextual.

Scopes:
- global
- course
- cohort
- workshop
- project showcase

Preferred patterns:
- discussion list
- thread detail
- clear author/time/context
- useful replies
- Q&A state
- pinned/announcement treatment

Avoid social-feed gimmicks.

---

## 21. Projects & Assessments

Projects should feel like real work.

Display:
- brief
- expected outcome
- criteria
- due date
- submission status
- files/links
- review
- score
- feedback
- evidence of skills

Assessment screens should prioritize clarity over decoration.

---

## 22. Skills

Skills should show:
- skill
- progress/status
- linked evidence
- related course/project
- verification/completion

Use restrained progress visualization.

Avoid gamified badge walls unless product requirements later justify them.

---

## 23. Certificates

Certificate area should support:
- certificate card/list
- detail
- issue date
- credential ID
- verification
- download/share
- revoked/reissued states

Public verification page must feel trustworthy and minimal.

---

## 24. Instructor UI

Instructor UI can be denser than learner UI.

Core patterns:
- dashboard
- course builder
- lesson editor
- quiz builder
- assignment builder
- cohort management
- workshop management
- attendance
- submission review
- analytics

Prefer:
- split panes
- tables
- inspector panels
- side drawers
- structured forms

Avoid decorative hero content in operational screens.

---

## 25. Admin UI

Admin is operational.

Use:
- denser tables
- filters
- batch actions
- clear status
- audit context
- role/permission clarity
- stable navigation

Admin screens should not mimic learner marketing/editorial surfaces.

---

## 26. AI Features

AI should appear as a contextual utility, not as a floating assistant everywhere.

Allowed examples:
- Generate outline
- Draft quiz
- Summarise transcript
- Suggest feedback
- Explain analytics

AI actions must:
- state what will be generated
- show editable output
- preserve instructor/admin control

No generic floating AI bubble by default.

---

## 27. Forms

Forms should:
- use clear labels
- group related fields
- show helper text only where useful
- expose validation inline
- avoid giant single-page forms when steps materially improve clarity

Instructor/admin forms may use sticky action bars.

---

## 28. Tables

Use for:
- learner rosters
- submissions
- attendance
- users
- certificates
- analytics drilldowns

Requirements:
- sortable where useful
- filterable
- clear row actions
- responsive fallback
- no horizontal overflow on mobile without intentional alternative

---

## 29. Analytics

Use charts only where data benefits from visualization.

Avoid fake KPI dashboards.

Preferred:
- completion trend
- attendance
- assessment distribution
- cohort comparison
- engagement
- skills progress

All charts require:
- clear title
- unit
- timeframe
- legend where needed
- accessible contrast

---

## 30. Mobile

Mobile is a separate adaptation, not a scaled desktop.

Use:
- compact header
- reduced simultaneous context
- drawers/sheets for filters
- stacked learning content
- mobile-safe lesson controls
- accessible tap targets
- simplified tables into lists/cards where needed

Avoid squeezing desktop three-column layouts onto mobile.

---

## 31. Accessibility

Minimum requirements:
- readable contrast
- visible focus
- keyboard navigation
- semantic labels
- no color-only state communication
- logical heading hierarchy
- usable zoom
- realistic touch targets

---

## 32. Empty, Loading, Error and Permission States

Every major module requires:
- first-use empty state
- no-results state
- loading/skeleton state
- recoverable error
- access denied/permission state where relevant

These states should use the same restrained product language.

No cartoon illustrations by default.

---

## 33. Anti-AI-Slop Rules

Do not introduce:
- random orbs
- decorative blobs
- generic purple/blue AI gradients
- arbitrary glassmorphism
- giant KPI cards
- excessive pills
- fake charts
- meaningless avatars
- decorative slogans in sidebars
- generic robot/brain/sparkle iconography
- card-inside-card layouts
- fake browser chrome
- malformed text
- filler social proof
- unnecessary floating assistant bubbles

---

## 34. Consistency Gate

Every new screen must match the anchor screens on:
- logo handling
- typography
- spacing
- left navigation
- header
- button hierarchy
- icon family
- radius scale
- borders
- progress styling
- tabs
- tables
- imagery treatment
- empty/error voice

If a new screen requires a genuinely new component, add it to the system rather than inventing a one-off visual pattern.
