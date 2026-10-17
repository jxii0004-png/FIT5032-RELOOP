# E.1 — Cloud search statistics

Independent function: `trackSearch`, an authenticated Firebase callable function
in australia-southeast1. This business function is separate from D.2 sendEmail.

Successful searches by signed-in users call trackSearch with an item ID,
condition, and UUID. The server checks the item against searchCatalog.json and
uses its own canonical name/category, rather than trusting browser labels.
An atomic Firestore transaction creates one event, increments the global and
per-item counters, and records a per-user two-second cooldown. Retrying the
same UUID returns without incrementing again. Anonymous and unmatched searches
are not tracked. Rapid valid searches still show results but may not be counted.

The frontend keeps local recent history independently. Cloud recording failure
does not block recommendations and shows an explicit status message. Historical
local records are not uploaded. Scores remain local and are not part of E.1.

Only administrators can read searchStats, searchItems and searchEvents using
Firestore rules. No browser can write those collections or access searchLimits.
Server-side Admin SDK writes use the service account. Event documents contain
canonical item/condition/time, not raw queries or email addresses; their IDs
include the authenticated UID for request deduplication.

The administrator dashboard uses realtime listeners: total searches, popular
items ordered by count, and latest 50 searches ordered by server timestamp.
Both tables include filtering, sorting and 10-row pagination. Event time is
displayed in Australia/Sydney. Listeners unsubscribe when leaving the page.

## Deploy

1. Run lint, build and `node --test --test-isolation=none functions/*.test.js`.
2. Set `$env:FUNCTIONS_DISCOVERY_TIMEOUT="60"` in PowerShell if discovery is slow.
3. `firebase deploy --only "functions:reloop:trackSearch,firestore:rules" --project reloop-f31e7`
4. `npm run build -- --configLoader native`
5. `firebase deploy --only hosting --project reloop-f31e7`

Keep searchCatalog.json in sync with src/data/wasteItems.js; a test checks this.
Counters are cumulative, recent events and cooldown entries persist; no automatic
retention deletion is configured in this assessment implementation.

## Live demonstration

- Log in and search phone/broken. Show confirmation under the search form.
- Open admin on a second tab/device: total rises and phone appears in Popular Items.
- After two seconds search laptop/working; confirm total, item counts and recent row.
- Retry a callable with the same request UUID: total must not increment twice.
- Log out and search: recommendations work, cloud total does not change.
- Regular users cannot read the admin collections or directly change counters.
- Invalid item/condition and unauthenticated calls must be rejected.

Automated tests cover validation, canonical values, deduplication, cooldown,
counters and authorization using a transaction fake; real Firestore atomicity,
security rules and cross-device delivery require the live checks above.
