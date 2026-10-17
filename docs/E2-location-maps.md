# E.2 — Location search and driving routes

The simplified `/locations` page provides:
- Search by location/suburb and filter by accepted material.
- Mapbox map markers and a source-linked council address list.
- One starting-address field, a destination dropdown and Get route button.
- A real driving route on the map, matched start address, distance and duration.

There is no geolocation, travel-mode selector or separate address-result picker.
The first Melbourne address match is used and shown; enter a more specific
address if it is incorrect. Mapbox results stay in memory, not in Firestore.

Set VITE_MAPBOX_TOKEN in .env.local, restart Vite and rebuild before deploying
Hosting. Test both site filters and a real route, invalid addresses, API errors,
mobile layout and leaving the page during loading. Check the council source
links for current acceptance/fees/hours. Pins are address matches, not entrances.
