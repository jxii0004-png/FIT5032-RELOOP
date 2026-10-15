# BR D.3: Interactive tables

The admin dashboard contains Registered Users and Waste Item Directory tables.
Both use `InteractiveTable.vue` and support global search, individual column
filters, ascending/descending sorting, reset, and pagination at 10 rows per page.
Global search and column filters are combined. Searching or changing a filter
returns to page 1. Empty results display a message.

## Manual demonstration

1. Sign in with an administrator account and open `/admin`.
2. In Waste Item Directory, confirm 10 of 12 records appear on page 1.
3. Select Next: the remaining 2 records appear. Next is disabled.
4. Search for `electronic`: page resets to 1 and 5 matching records appear.
5. Filter Item by `monitor`: only Computer Monitor remains.
6. Select Reset, then select Item twice to show ascending and descending order.
7. Search for an unknown term: the empty-results message appears.
8. Repeat search, column filtering and sorting in Registered Users.
   To demonstrate its second page, register more than 10 real test accounts;
   the application does not create dummy user accounts automatically.
9. Use Tab and Enter to operate search, sorting, reset and pagination controls.
10. On the home page, search `laptop`, `bike` and `books` with each condition.

The directory contains general guidance, not verified collection locations.
Users must check local service acceptance. Authentication is now
based on Firebase Authentication. Configure the project and administrator claim
as described in `D1-firebase-setup.md` before opening the admin dashboard.
