# E.3 — Accessibility implementation and checks

Target: WCAG 2.1 A and AA. This is an implementation/testing record, not an
independent certification of full conformance.

## Implemented

| Area | Implementation |
| --- | --- |
| Page structure and navigation | One main landmark per page, named navigation, page-specific document titles, mobile H1, About content and meaningful links. |
| Bypass and focus | First skip link focuses main content. SPA route changes focus the new main area or finder. Keyboard focus has a high-contrast outline. |
| Navigation controls | Native details/summary account menu; Enter/Space activation; Escape closes and restores focus. Mobile menu reports its expanded state. |
| Forms | Required instructions, labels, autocomplete for identity fields, aria-invalid and error associations, and focus on the first invalid field. Service errors receive focus without discarding input. |
| Dynamic feedback | Search results, email progress/results, rating submission and loading messages use status/alert semantics. |
| Tables | Caption, column headers and aria-sort; named sorting/filter controls; keyboard-scrollable table region; pagination focuses the updated record summary. |
| Contrast and reflow | Darker secondary/success/link text and alert buttons; visible field borders; mobile page widths checked at 320 CSS pixels. |
| Map alternative | Source-linked location list and native destination selector; matched origin, route distance/time and expandable written driving instructions; named map markers. |
| Motion and live content | Reduced-motion CSS and route animation preference; administrator can pause/resume realtime statistics. |

## Checks completed on 16 October 2026

- ESLint and Vite production build.
- axe-core against WCAG 2.1 A/AA tags on home (including search result), login,
  register, About and location/route views. Final scans found no automatic
  violations. Some native selects and map attribution contrast require manual
  review rather than an automatic pass.
- axe-core on isolated email, shared table and administrator components with
  no automatic violations. Admin fixture exercised loading/error and directory
  states; it did not bypass production authentication or inspect real users.
- Keyboard: navigation toggle, account expansion and Escape, skip link, page
  navigation focus, empty login/registration/search/email validation, table sort
  and pagination, and expandable route instructions.
- 320px viewport: home, register and locations had no page-level horizontal
  overflow. Native select text was #212529 on white; map attribution text was
  black at 75% opacity on a white panel. These were manually inspected because
  axe reported them as incomplete.
- Real Mapbox route: Clayton to Camberwell displayed about 14.1 km and 25
  minutes, with nine written instructions and focus on the route summary.

Development-only scan: run Vite then open a public page with `?a11y=1`.
The helper is gated by import.meta.env.DEV and is excluded from production.
Temporary component fixture files are removed after testing.

## Remaining manual acceptance

- Test with NVDA/VoiceOver or another actual screen reader on the target browser,
  especially field error announcements, map controls and realtime statistics.
- Verify authenticated admin/email success states and pause/resume against live
  data; the component scan does not prove all authenticated states.
- Check browser zoom at 200%/400%, increased text spacing and map edge cases on
  the user's device. The 320px reflow check is not a replacement for every zoom
  and text-spacing check.
- Recheck the deployed version. Automatic scans alone do not establish full
  WCAG 2.1 AA conformance.

References:
- https://www.w3.org/TR/WCAG21/
- https://www.w3.org/WAI/tutorials/forms/notifications/
- https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html
