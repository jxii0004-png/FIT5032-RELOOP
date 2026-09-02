<script setup>
import AppNavbar from "./components/AppNavbar.vue";
import WasteFinder from "./components/WasteFinder.vue";
</script>

<template>
  <AppNavbar />

  <main>
    <section class="bg-light py-5">
      <div class="container py-5 text-center">
        <p class="text-success fw-semibold mb-2">REUSE · REPAIR · RECYCLE</p>

        <h1 class="display-4 fw-bold">Find the next life for your unwanted items</h1>

        <p class="lead text-secondary mx-auto mt-3">
          Search for an item and discover responsible options to reuse, donate, repair or recycle it
          in Melbourne.
        </p>

        <a class="btn btn-success btn-lg mt-3" href="#finder"> Find an Item </a>
      </div>
    </section>

    <WasteFinder />
  </main>
</template>
