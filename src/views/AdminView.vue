<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { watchSearchStats } from "../services/searchStats";
import { getAllUsers } from "../services/auth";
import { wasteItems } from "../data/wasteItems";
import InteractiveTable from "../components/InteractiveTable.vue";

const userColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
];
const itemColumns = [
  { key: "displayName", label: "Item" },
  { key: "category", label: "Category" },
  { key: "aliases", label: "Search terms" },
  { key: "recommendation", label: "Broken item recommendation" },
];
const itemRows = wasteItems.map((item) => ({
  ...item,
  aliases: item.names.join(", "),
  recommendation: item.options.broken,
}));

const users = ref([]);
const loading = ref(true);
const loadError = ref("");
async function loadUsers() {
  loading.value = true;
  loadError.value = "";
  try { users.value = await getAllUsers(); }
  catch { loadError.value = "Unable to load users. Please try again or contact the site administrator."; }
  finally { loading.value = false; }
}
onMounted(loadUsers);

const searchCount = ref(null);
const popularItems = ref([]);
const recentSearches = ref([]);
const statisticsError = ref(false);
const statisticsReady = ref(false);
const statisticsPaused = ref(false);
let stopStatistics = () => {};
const popularColumns = [{ key: "name", label: "Item" }, { key: "category", label: "Category" }, { key: "count", label: "Searches" }];
const recentColumns = [{ key: "name", label: "Item" }, { key: "condition", label: "Condition" }, { key: "time", label: "Time (Sydney)" }];
function loadStatistics() {
  statisticsPaused.value = false;
  stopStatistics();
  statisticsError.value = false;
  statisticsReady.value = false;
  const received = new Set();
  const ready = (key) => { received.add(key); statisticsReady.value = received.size === 3; };
  stopStatistics = watchSearchStats({
    total: (count) => { searchCount.value = count; ready("total"); },
    items: (items) => { popularItems.value = items; ready("items"); },
    events: (events) => {
      recentSearches.value = events.map((event) => ({ ...event, time: event.createdAt?.toDate ? new Intl.DateTimeFormat("en-AU", { dateStyle: "short", timeStyle: "medium", timeZone: "Australia/Sydney" }).format(event.createdAt.toDate()) : "Pending" }));
      ready("events");
    },
    error: () => { statisticsError.value = true; },
  });
}
onMounted(loadStatistics);
onUnmounted(() => stopStatistics());
function toggleStatistics() {
  if (statisticsPaused.value) loadStatistics();
  else { stopStatistics(); statisticsPaused.value = true; }
}
const itemCount = ref(wasteItems.length);
</script>

<template>
  <main id="main-content" tabindex="-1" class="container py-5">
    <h1 class="mb-4">Admin Dashboard</h1>
    <RouterLink to="/email" class="btn btn-success mb-4">Send email with attachment</RouterLink>

    <div class="row g-3 mb-5">
      <div class="col-12 col-md-4">
        <div class="card border-0 bg-success text-white shadow-sm">
          <div class="card-body">
            <p class="mb-1">Users</p>
            <h2 class="mb-0">{{ loading || loadError ? '—' : users.length }}</h2>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <p class="mb-1">Waste Items</p>
            <h2 class="mb-0">{{ itemCount }}</h2>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <p class="mb-1">Total Tracked Searches</p>
            <h2 class="mb-0">{{ statisticsError || !statisticsReady ? '—' : searchCount }}</h2>
          </div>
        </div>
      </div>
    </div>

    <p v-if="loading" role="status">Loading registered users…</p>
    <div v-else-if="loadError" class="alert alert-danger" role="alert">
      {{ loadError }} <button type="button" class="btn btn-outline-danger btn-sm" @click="loadUsers">Retry</button>
    </div>
    <InteractiveTable v-else title="Registered Users" :columns="userColumns" :rows="users" />
    <InteractiveTable title="Waste Item Directory" :columns="itemColumns" :rows="itemRows" />
    <h2 class="h4 mt-5">Cloud Search Statistics</h2>
    <button type="button" class="btn btn-outline-secondary mb-3" :disabled="!statisticsReady || statisticsError" :aria-pressed="statisticsPaused" @click="toggleStatistics">{{ statisticsPaused ? 'Resume live updates' : 'Pause live updates' }}</button>
    <p class="visually-hidden" role="status">{{ statisticsPaused ? 'Live statistics paused.' : '' }}</p>
    <p class="text-secondary">Live totals across devices for successful searches by signed-in users, recorded since this feature was enabled. Earlier local history is not imported. Recent activity shows the latest 50 records.</p>
    <div v-if="statisticsError" class="alert alert-warning" role="alert">
      Search statistics could not be loaded.
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadStatistics">Retry</button>
    </div>
    <p v-else-if="!statisticsReady" role="status">Loading search statistics…</p>
    <template v-else>
      <InteractiveTable title="Popular Items" :columns="popularColumns" :rows="popularItems" />
      <InteractiveTable title="Recent Search Activity" :columns="recentColumns" :rows="recentSearches" />
    </template>
  </main>
</template>
