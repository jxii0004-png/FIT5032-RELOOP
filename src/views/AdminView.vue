<script setup>
import { ref } from "vue";
import { getAllUsers } from "../services/auth";
import { wasteItems } from "../data/wasteItems";

const users = ref(getAllUsers());

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
            <h2 class="mb-0">{{ users.length }}</h2>
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

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <h2 class="h4 mb-3">Registered Users</h2>

        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span
                    class="badge"
                    :class="user.role === 'admin' ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ user.role }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>
