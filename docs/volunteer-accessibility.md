# Volunteer form accessibility review — 14 November 2026

Target: WCAG 2.2 AA; Google web.dev forms guidance informs usability choices. This review is not a full conformance claim.

## Findings corrected

- Text-box borders: #B9C9C6 on white was 1.72:1. Changed to #758681 (3.83:1), above the 3:1 non-text contrast threshold for identifying controls.
- Kept native controls and visible labels; added explicit photo label, required-state semantics and associations between group errors and relevant tool/proficiency controls.
- Added visible labels for additional tools and contextual Edit/Remove accessible names.
- Added a native form with custom-validation handling so Enter activates Continue/Submit. Secondary controls explicitly remain buttons.
- Submission validation now focuses the error summary, including server errors. Inline messages and summary links remain available.
- Save state has a persistent polite announcement in the header, including mobile.
- Removed the sticky action bar to avoid covering focused fields at zoom or with an on-screen keyboard.
- 1rem controls and labels; .875rem helper text; at least 44px key buttons/clickable checkbox labels, 48px text controls.
- Preserved autocomplete and appropriate keyboard types; added organization-title autocomplete.
- Wrapping layouts, scalable text and no fixed text-container heights. Replaced offscreen skip-link positioning with clipping until focused.

## Existing strengths

IBM Plex Sans controls and Newsreader display headings are acceptable choices; WCAG does not prescribe a particular typeface. Visible labels are not replaced by placeholders. Review/edit precedes submission, errors use text as well as colour, and entered answers are retained on errors. Primary white-on-teal text is 7.87:1; muted text on white is 6.32:1.

## Verification limits

Validation tests, production compilation, contrast calculations and live keyboard/DOM checks cover only part of accessibility. Full screen-reader journeys, every conditional branch, older version-pinned applications, actual iOS/Android browsers, 320px reflow and user text-spacing overrides require complete manual coverage before claiming WCAG conformance.

## Sources

- https://web.dev/learn/forms/design-basics
- https://web.dev/learn/forms/accessibility
- https://www.w3.org/WAI/tutorials/forms/labels/
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
- https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
