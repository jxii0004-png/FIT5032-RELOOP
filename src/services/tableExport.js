const text = (value) => String(value ?? "");
const escapeHtml = (value) => text(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function createCsv(columns, rows) {
  // Prevent spreadsheet software from treating user-entered values as formulas.
  const cell = (value) => {
    const string = text(value);
    const safe = /^[\s]*[=+@-]/.test(string) || /^[\t\r\n]/.test(string) ? `'${string}` : string;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + [columns.map((column) => cell(column.label)).join(","), ...rows.map((row) => columns.map((column) => cell(row[column.key])).join(","))].join("\r\n");
}

export function downloadCsv(title, columns, rows) {
  const url = URL.createObjectURL(new Blob([createCsv(columns, rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createPrintHtml(title, columns, rows) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)} | RELOOP</title>
  <style>body{font:14px Arial,sans-serif;color:#111;margin:24px}h1{font-size:24px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #777;padding:8px;text-align:left;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#eee}thead{display:table-header-group}tr{break-inside:avoid}@page{size:A4 landscape;margin:15mm}@media print{.instructions{display:none}body{margin:0}}</style></head><body>
  <h1>${escapeHtml(title)}</h1><p>RELOOP · ${rows.length} records · ${escapeHtml(new Date().toLocaleString("en-AU"))}</p>
  <p class="instructions">Choose “Save as PDF” in the print dialog. If the dialog is closed, use your browser's Print command. Close this tab to return to RELOOP.</p>
  <table><caption>All matching records in the selected sort order</caption><thead><tr>${columns.map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
}

export async function printPdf(title, columns, rows) {
  const preview = window.open("", "_blank");
  if (!preview) throw new Error("Allow pop-ups for this site, then try the PDF export again.");
  preview.opener = null;
  preview.document.write(createPrintHtml(title, columns, rows));
  preview.document.close();
  await preview.document.fonts.ready;
  preview.focus();
  preview.print();
}
