<script setup>
import { onMounted, ref } from "vue";
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

let savedSearches;

try {
  savedSearches = JSON.parse(localStorage.getItem("reloopSearchHistory")) || [];
} catch {
  savedSearches = [];
}

const searchCount = ref(savedSearches.length);
const itemCount = ref(wasteItems.length);
</script>

<template>
  <main class="container py-5">
    <h1 class="mb-4">Admin Dashboard</h1>

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
            <p class="mb-1">Recent Searches</p>
            <h2 class="mb-0">{{ searchCount }}</h2>
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
  </main>
</template>
