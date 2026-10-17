# F — Personal recycling tools

## Features and code

1. Recycling plan checklist: src/views/PlansView.vue. Add, edit, complete, reopen and delete plans; quantity, action, optional date and location. Search results can preselect an item.
2. Personal statistics: src/views/ImpactView.vue. Self-reported completed quantities by method, item category and completion month in Australia/Sydney. No invented carbon estimates. Reopened/deleted plans no longer count.
3. Knowledge quiz: src/views/QuizView.vue and src/data/recyclingQuiz.js. Five questions, required answers, score, explanations and official Victorian sources. Answers are transient page state, not cloud records.
4. Calendar and ICS export: src/views/CalendarView.vue. Monthly calendar, selected-day details, single event or monthly export of scheduled, unfinished plans. All-day events request a reminder one day before. Calendar notification settings determine whether reminders display. Importing does not establish automatic synchronization; re-importing may create duplicates in some calendar apps.

Shared files: src/services/plans.js (Firestore), src/services/planning.js (validation, statistics and ICS), src/components/RecyclingToolsNav.vue (links).

## Personal cloud data

Documents: recyclingPlans/{uid}/items/{planId}. Each account may access only its own items; even an admin cannot read another account's plans under these rules. The document stores itemId, quantity, method, date, location, status, createdAt and completedAt. Item names/categories are derived from the existing directory.

Rules validate the document shape, allowed actions, item IDs 1–12, quantities 1–1000, location length and timestamp transitions. Adding future directory IDs requires updating this range. Completion timestamps use serverTimestamp, and creation timestamps cannot be changed. Client validation also rejects impossible dates. The rules check the date format, but do not validate calendar-specific day counts.

No existing search/email/user rules have been expanded for these features.

## Publish and verify

From the project directory:

```powershell
npm.cmd run build -- --configLoader native
firebase deploy --only "firestore:rules,hosting" --project reloop-f31e7
```

The new rules must be deployed before the personal tools can load/save with the production Firebase project, including when using the local frontend. No new Cloud Function deployment or paid API is required.

Manual cloud acceptance:

- Sign in as user A, add a plan, refresh and confirm it persists.
- Sign in on a second device with user A and confirm the plan appears.
- User B should have an empty/separate list. Attempting to access A's item path as B should fail.
- Complete a plan and check statistics; edit quantity, reopen and delete it, checking each change.
- Schedule a date, download .ics and import in an actual calendar app; inspect date, location and reminder settings.

## Validation performed

- Five automated tests: plan/date validation, quantity/month totals and reopen/delete behavior, ICS leap-year/year boundaries, Unicode folding and escaping, quiz scoring. Run: node --test --test-isolation=none tests/planning.test.js.
- ESLint and production build.
- Browser component checks with explicit sample data, not production account data: required form error focus; add/complete a four-item plan; edit a completed plan to six; month filtering; reopen; calendar download; quiz missing answer, 5/5 result and reset.
- Axe scans of personal tools and quiz, plus narrow-screen checks. Automatic checks do not establish full WCAG conformance.

Not yet verified: production Firestore round trip, security-rule emulator tests (Java not installed), second-device access, real calendar-app import/reminder and screen reader behavior. No production test records were created. Deployment and Git push have not been performed for this work.

These are four implemented feature candidates; assessment recognition and independence are subject to the instructor's approval.
