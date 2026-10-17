<script setup>
import { RouterView, useRoute } from "vue-router";
import { watch } from "vue";
import { focusElement } from "./services/accessibility";
import AppNavbar from "./components/AppNavbar.vue";
const route = useRoute();
watch(() => route.fullPath, () => {
  const titles = { "/": "Find an item", "/login": "Login", "/register": "Register", "/admin": "Admin dashboard", "/email": "Send email", "/locations": "Recycling locations", "/about": "About", "/plans": "My recycling plans", "/impact": "My statistics", "/calendar": "My calendar", "/quiz": "Recycling quiz" };
  document.title = `${titles[route.path] || "Page"} | RELOOP`;
  focusElement(route.hash === "#finder" ? "finder" : "main-content");
});
</script>

<template>
  <a class="skip-link" href="#main-content" @click="focusElement('main-content')">Skip to main content</a>
  <AppNavbar />
  <RouterView />
</template>
