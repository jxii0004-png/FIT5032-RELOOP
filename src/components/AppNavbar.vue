<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { currentUser, logoutUser } from "../services/auth";
const route = useRoute();
const router = useRouter();
const expanded = ref(false);
const accountMenu = ref(null);
const logoutError = ref("");
watch(() => route.fullPath, () => {
  expanded.value = false;
  if (accountMenu.value) accountMenu.value.open = false;
});
function closeAccount(event) {
  if (accountMenu.value?.open) {
    accountMenu.value.open = false;
    accountMenu.value.querySelector('summary').focus();
    event.stopPropagation();
  }
}
async function logout() {
  logoutError.value = "";
  try { await logoutUser(); await router.push("/login"); }
  catch (error) { logoutError.value = error.message; }
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-success" aria-label="Main navigation">
    <div class="container">
      <RouterLink class="navbar-brand fw-bold" to="/">RELOOP</RouterLink>
      <button class="navbar-toggler" type="button" :aria-expanded="expanded" aria-controls="mainNavbar" aria-label="Toggle navigation menu" @click="expanded = !expanded">
        Menu
      </button>
      <div id="mainNavbar" class="collapse navbar-collapse" :class="{ show: expanded }">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item"><RouterLink class="nav-link" to="/">Home</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/#finder">Find an Item</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/locations">Recycling Locations</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/plans">My Recycling</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/quiz">Quiz</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/about">About</RouterLink></li>
          <li class="nav-item position-relative">
            <details ref="accountMenu" @keydown.esc="closeAccount">
              <summary class="nav-link">{{ currentUser ? currentUser.name : "Account" }}</summary>
              <ul class="account-links list-unstyled bg-white border rounded p-2 mb-0">
                <template v-if="currentUser">
                  <li v-if="currentUser.role === 'admin'"><RouterLink class="dropdown-item" to="/admin">Admin Dashboard</RouterLink></li>
                  <li v-if="currentUser.role === 'admin'"><RouterLink class="dropdown-item" to="/email">Send Email</RouterLink></li>
                  <li><span class="dropdown-item-text">Role: {{ currentUser.role }}</span></li>
                  <li><button class="dropdown-item" type="button" @click="logout">Logout</button></li>
                </template>
                <template v-else>
                  <li><RouterLink class="dropdown-item" to="/login">Login</RouterLink></li>
                  <li><RouterLink class="dropdown-item" to="/register">Register</RouterLink></li>
                </template>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <p v-if="logoutError" class="alert alert-danger" role="alert">{{ logoutError }}</p>
</template>

<style scoped>
summary { cursor: pointer; }
.account-links { min-width: 190px; }
@media (min-width: 992px) { .account-links { position: absolute; right: 0; z-index: 1050; } }
</style>
