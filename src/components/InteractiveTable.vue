<script setup>
import { computed, reactive, ref, useId, watch } from "vue";
import { focusElement } from "../services/accessibility";
import { downloadCsv, printPdf } from "../services/tableExport";
const statusId = `table-status-${useId()}`;
function changePage(direction) {
  page.value += direction;
  focusElement(statusId);
}

const props = defineProps({
  title: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
});
const exportMessage = ref("");
const exportError = ref("");
const exporting = ref(false);
async function exportRows(format) {
  exportMessage.value = "";
  exportError.value = "";
  exporting.value = true;
  try {
    const rows = [...filteredRows.value];
    if (format === "CSV") downloadCsv(props.title, props.columns, rows);
    else await printPdf(props.title, props.columns, rows);
    exportMessage.value = format === "CSV"
      ? `CSV download started: ${rows.length} matching records.`
      : `PDF report opened: ${rows.length} matching records. Choose Save as PDF in the print dialog.`;
  } catch (error) {
    exportError.value = error.message || "Export failed. Please try again.";
  } finally { exporting.value = false; }
}
const search = ref("");
const filters = reactive({});
const sortKey = ref("");
const ascending = ref(true);
const page = ref(1);
const pageSize = 10;
const normalize = (value) => String(value ?? "").toLowerCase();
const filteredRows = computed(() => {
  const query = normalize(search.value.trim());
  const rows = props.rows.filter((row) =>
    (!query || props.columns.some((column) => normalize(row[column.key]).includes(query))) &&
    props.columns.every((column) =>
      normalize(row[column.key]).includes(normalize((filters[column.key] || "").trim())),
    ),
  );
  if (!sortKey.value) return rows;
  return rows.sort((a, b) => {
    const left = a[sortKey.value];
    const right = b[sortKey.value];
    const comparison = typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true, sensitivity: "base" });
    return ascending.value ? comparison : -comparison;
  });
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)));
const visibleRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const firstRow = computed(() => filteredRows.value.length ? (page.value - 1) * pageSize + 1 : 0);
const lastRow = computed(() => Math.min(page.value * pageSize, filteredRows.value.length));
watch([search, filters, () => props.rows], () => { page.value = 1; }, { deep: true });
function sortBy(key) {
  ascending.value = sortKey.value === key ? !ascending.value : true;
  sortKey.value = key;
  page.value = 1;
}
function reset() {
  search.value = "";
  Object.keys(filters).forEach((key) => { filters[key] = ""; });
  sortKey.value = "";
  ascending.value = true;
  page.value = 1;
}
</script>

<template>
  <section class="card border-0 shadow-sm mb-4" :aria-label="title">
    <div class="card-body">
      <h2 class="h4 mb-3">{{ title }}</h2>
      <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
        <label class="flex-grow-1">
          <span class="form-label d-block">Search all columns</span>
          <input v-model="search" type="search" class="form-control" :placeholder="`Search ${title.toLowerCase()}`" />
        </label>
        <button type="button" class="btn btn-outline-secondary" @click="reset">Reset</button>
      </div>
      <div class="d-flex flex-wrap gap-2 mb-2">
        <button type="button" class="btn btn-outline-success btn-sm" :disabled="!filteredRows.length || exporting" @click="exportRows('CSV')">Download CSV</button>
        <button type="button" class="btn btn-outline-success btn-sm" :disabled="!filteredRows.length || exporting" @click="exportRows('PDF')">Export PDF</button>
      </div>
      <p class="small text-secondary">Exports include all matching records across all pages. For PDF, select Save as PDF in the print dialog.</p>
      <p class="small" role="status">{{ exportMessage }}</p>
      <p v-if="exportError" class="alert alert-danger" role="alert">{{ exportError }}</p>
      <div class="table-responsive" role="region" :aria-label="`${title} table, scroll horizontally if needed`" tabindex="0">
        <table class="table align-middle">
          <caption class="visually-hidden">{{ title }}. Search, filter by column, or select a column heading to sort. Ten rows per page.</caption>
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key" scope="col"
                :aria-sort="sortKey === column.key ? (ascending ? 'ascending' : 'descending') : 'none'">
                <button type="button" class="btn btn-link p-0 text-start text-dark fw-semibold" :aria-label="`Sort ${column.label} ${sortKey === column.key && ascending ? 'descending' : 'ascending'}`" @click="sortBy(column.key)">
                  {{ column.label }} <span aria-hidden="true">{{ sortKey === column.key ? (ascending ? '↑' : '↓') : '↕' }}</span>
                </button>
              </th>
            </tr>
            <tr>
              <td v-for="column in columns" :key="column.key">
                <input v-model="filters[column.key]" type="search" class="form-control form-control-sm"
                  :aria-label="`Filter ${column.label}`" :placeholder="`Filter ${column.label}`" />
              </td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.id">
              <td v-for="column in columns" :key="column.key">{{ row[column.key] }}</td>
            </tr>
            <tr v-if="!visibleRows.length"><td :colspan="columns.length" class="text-center text-secondary py-4">No matching records. Try changing your search or resetting filters.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <p :id="statusId" tabindex="-1" class="mb-0 text-secondary" role="status">Showing {{ firstRow }}–{{ lastRow }} of {{ filteredRows.length }} records (10 per page)</p>
        <nav :aria-label="`${title} pagination`" class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-outline-success btn-sm" :disabled="page === 1" @click="changePage(-1)">Previous</button>
          <span>Page {{ page }} of {{ pageCount }}</span>
          <button type="button" class="btn btn-outline-success btn-sm" :disabled="page >= pageCount" @click="changePage(1)">Next</button>
        </nav>
      </div>
    </div>
  </section>
</template>
