<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
const links = [['/plans', 'My plans'], ['/impact', 'My statistics'], ['/calendar', 'My calendar'], ['/quiz', 'Recycling quiz']];
</script>
<template>
  <nav class="d-flex flex-wrap gap-2 mb-4" aria-label="Personal recycling tools">
    <RouterLink v-for="[path, label] in links" :key="path" :to="path" class="btn btn-sm" :class="route.path === path ? 'btn-success' : 'btn-outline-success'">{{ label }}</RouterLink>
  </nav>
</template>
