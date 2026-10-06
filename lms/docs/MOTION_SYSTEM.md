# WeAreAiLabs LMS — Motion System

## Purpose
Motion supports orientation, continuity and achievement. It is not decorative filler.

## Runtime choices
- GSAP: shared learner-page entrance and future contextual transitions.
- Lottie: small branded vector moments where a lightweight loop is appropriate.
- Rive: reserved for future stateful achievements/certificates when a purpose-built WeAreAiLabs .riv asset is authored.
- Lenis: not installed; native scroll is currently sufficient.
- Locomotive Scroll: intentionally excluded from the LMS because immersive scroll hijacking is inappropriate for a task-oriented learning product.

## Current implementation
### GSAP
The learner shell animates each route transition with a short opacity/vertical reveal. Motion is disabled automatically for users who request reduced motion.

### Lottie
Home uses a custom WeAreAiLabs learning-pulse animation inside the active-learning hero. It is intentionally abstract and non-instructional; the interface remains complete if animation is disabled.

## Rules
- 150–450ms for interface transitions.
- never block input while animation plays.
- never animate essential text continuously.
- all motion must respect prefers-reduced-motion.
- do not use motion to compensate for weak hierarchy.
