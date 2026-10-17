# E.4 — CSV and PDF export

The four admin tables (Registered Users, Waste Item Directory, Popular Items and Recent Search Activity) support exports through the shared InteractiveTable component.

- CSV downloads directly, with UTF-8 BOM for spreadsheet compatibility, quoted cells, escaped quotation marks and protection against spreadsheet formula injection.
- PDF opens a printable report in a new tab. Select Save as PDF in the browser print dialog. This preserves Unicode names without embedding a font or adding a PDF library.
- Both exports include every matching row in the current filtered and sorted order, across all pages. Only visible columns are included; internal IDs and other hidden fields are excluded.
- Empty results disable both buttons. An accessible status reports the number of exported records; blocked pop-ups produce a visible error.
- Reports contain a title, generation time, record count and repeating table headings. Recent activity is limited to the 50 records loaded by the existing cloud query.
- Nothing is sent to an external export service. The admin route and existing Firebase rules still control access.

## Demonstration

1. Sign in as an administrator and open Admin Dashboard.
2. Filter Waste Item Directory by a category, then sort Item.
3. Select Download CSV; open the file and compare its rows with the filtered count.
4. Select Export PDF; choose Save as PDF and inspect the report.
5. Reset filters and export a table containing more than 10 records to show that all pages are included.

## Code

- src/components/InteractiveTable.vue: buttons, filtered/sorted data and feedback.
- src/services/tableExport.js: CSV encoding/download and printable PDF report.

The PDF action requests a browser print dialog; it does not silently download a PDF. Saving is completed by the user in that dialog.

## Validation

- ESLint and production build passed.
- Browser component check downloaded a CSV containing all 12 test records while only 10 were visible.
- Filtering to Item 1 and sorting Count descending produced a four-row report ordered 12, 11, 10, 1.
- Empty results disabled both exports.
- CSV encoding/formula protection and report HTML escaping were checked with Unicode, commas, quotes, line breaks and script-like text.
- Printable report was visually inspected. Final Save as PDF through the native print dialog remains a manual browser check; the in-app browser did not expose that dialog to automation.
- Temporary component test pages were removed. No production user records were exported during testing.
