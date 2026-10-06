# WeAreAiLabs LMS — Semantic Color System

## 1. Purpose

Color in the WeAreAiLabs LMS is functional, not decorative.

It has four jobs:

1. establish hierarchy
2. identify interaction/state
3. reinforce learning context
4. direct attention without increasing cognitive load

The LMS must not use brand colors merely because space is available.

---

## 2. Design Principle

Use an evidence-informed learning palette:

- calm neutrals dominate reading and working surfaces
- cool hues support concentration, navigation and information
- bright/high-chroma hues are scarce and reserved for attention
- semantic states use consistent colors everywhere
- color never carries meaning on its own

This is an executive learning product, so the target is:

**grayscale/warm-neutral foundation + jewel-tone cool colors + controlled brand accent**

Not:
- rainbow edtech
- green everywhere
- generic AI gradients
- every module having an unrelated palette

---

## 3. Color Budget

Use the following as a screen-level target, not as a pixel-perfect formula:

| Layer | Approx. share | Purpose |
|---|---:|---|
| Neutral foundation | 65–70% | reading, whitespace, content, hierarchy |
| Cool functional color | 22–28% | navigation, learning context, information |
| High-attention accents | max 8–10% | next action, live/due state, current milestone |

If a screen visibly feels “green”, “blue”, or “lime”, the budget is probably being exceeded.

---

## 4. Core Tokens

| Token | Hex | Purpose |
|---|---|---|
| Canvas | #F7F8F5 | primary page background |
| Surface | #FFFFFF | content surface |
| Surface subtle | #F0F4F2 | low-emphasis panels |
| Ink | #0B1720 | primary text |
| Slate | #64748B | metadata / secondary text |
| Line | #D8E1DF | borders / dividers |
| Learning deep teal | #075B5E | learning context / primary CTA |
| Learning teal | #087F7A | active learning/navigation |
| Information blue | #315B7D | discussion / information / community |
| Brand lime | #B8E000 | next-action signal only |
| Success green | #2C6E49 | completion / achieved / passed |
| Attention amber | #A15C00 | live / due / time-sensitive |
| Error red | #B42318 | destructive / failed / overdue-critical |

---

## 5. Accessibility Contrast

WCAG 2.2 AA target:
- normal text: at least 4.5:1
- large text: at least 3:1
- meaningful UI indicators: at least 3:1 against adjacent colors

Validated working combinations:

| Combination | Approx. contrast | Rule |
|---|---:|---|
| Ink #0B1720 on white | 18.14:1 | allowed |
| Deep teal #075B5E on white | 7.87:1 | allowed |
| Teal #087F7A on white | 4.85:1 | allowed for normal text |
| Information blue #315B7D on white | 7.18:1 | allowed |
| Success #2C6E49 on white | 6.12:1 | allowed |
| Amber #A15C00 on white | 5.19:1 | allowed |
| Error #B42318 on white | 6.57:1 | allowed |
| Slate #64748B on white | 4.76:1 | allowed for normal text |
| Ink on lime #B8E000 | 11.83:1 | preferred CTA combination |
| Lime on white | 1.53:1 | **never use as text** |

The implementation must not rely on the hue alone. Status text/iconography must remain present.

---

## 6. Semantic Grammar

### Learning / focus
Color family: deep teal / teal.

Use for:
- Learn active navigation
- selected lesson
- primary learning CTA
- course navigation
- active learning context

Do not use it to color every course card.

### Information / discussion
Color family: information blue.

Use for:
- Community
- Q&A
- discussion tags
- informational callouts
- thread context

Community should not inherit green simply because the brand contains green.

### Action / next step
Color: brand lime.

Use for:
- one primary next-step signal
- current milestone
- selective highlight inside dark surfaces

Never use:
- long paragraphs
- small text
- multiple simultaneous CTAs
- large page backgrounds

### Live / time-sensitive
Color family: amber.

Use for:
- LIVE
- due soon / due today
- session time emphasis
- reminder requiring attention

Do not use red for a normal upcoming deadline.

### Progress / achieved
Color family: success green.

Use for:
- progress bars
- completed
- passed
- certificate earned
- verified skill evidence

### Error / destructive
Color family: red.

Use only for:
- validation error
- upload failed
- destructive action
- revoked credential
- overdue-critical state

Never use red as ordinary emphasis.

---

## 7. Module Rules

Modules share one product identity. They receive accents, not separate themes.

### Home
- neutral foundation
- learning teal for main course context
- lime only for primary continue/current action
- green for achieved progress

### Learn
- learning teal
- neutral/jewel editorial course artwork
- green for progress
- no rainbow course-category system

### Workshops
- neutral/teal foundation
- amber for live/time
- green only for registered/completed
- lime only for a next-action signal

### Community
- information blue for discussion/Q&A context
- neutral feed surfaces
- no Slack/Circle-style color noise

### Projects
- ink/deep neutral + learning teal
- green for completed milestones
- lime for current milestone
- amber for due soon
- red only for overdue/blocked

### Library
- neutral + teal
- media thumbnails can use low-saturation jewel tones
- playback state stays neutral/teal

### Skills
- green represents achieved progress
- teal represents learning context
- no multi-color skill rainbow

### Assessments
- teal for normal state
- amber for due/attention
- green for passed
- red for failed/blocked

### Certificates
- neutral + success green
- verification should feel trustworthy, not celebratory/gamified

---

## 8. Gradients

Default: **off**.

Allowed:
- subtle same-family tonal transitions in media/art surfaces
- brand logo gradient where part of the approved logo

Not allowed:
- purple/blue/pink AI gradients
- random lime-to-teal backgrounds
- gradient text
- gradients used as status indicators
- gradients used simply to fill empty space

---

## 9. Progress Bars

Progress is an achieved-state visualization.

Use:
- neutral track
- success green fill

Do not:
- use lime-to-teal gradients
- change progress color by module
- use amber/red unless progress itself represents risk/failure

Current milestone may use a lime rule/marker, but completed progress remains green.

---

## 10. Buttons

### Primary action
Deep teal background + white text.

### Next-step accent
Brand lime background + Ink text.

Use at most one lime CTA within a local decision area.

### Secondary
White surface + neutral border + Ink text.

### Destructive
Error red background or border, depending on severity.

---

## 11. Status Components

Every status contains text.

Examples:

- LIVE — amber surface + amber text
- DUE TODAY — amber
- COMPLETED — green
- PASSED — green
- IN PROGRESS — teal or green depending on context
- ERROR — red
- REVOKED — red
- DRAFT — slate
- OPEN — slate

Never show a colored dot without a readable label when the status matters.

---

## 12. Correct / Incorrect Examples

### Correct
- white lesson page
- dark ink typography
- teal active lesson
- green completion bar
- one lime Continue action
- amber live-session badge

### Incorrect
- teal background + lime progress + green badge + blue button + purple illustration
- every card assigned its own category color
- lime used for tiny text
- red used simply to attract attention
- gradients used as default visual interest

---

## 13. Implementation Rule

All future LMS UI must reference semantic tokens.

Do not introduce arbitrary hex values into feature code unless:
1. the color is a content/media asset rather than UI state, and
2. the UI remains accessible without it.

New semantic colors require an update to this document and the shared LMS token layer first.
