<script setup>
import { ref } from "vue";

const showSearch = ref(false);
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-success">
    <div class="container">
      <button
        class="navbar-brand btn p-0 border-0 fw-bold text-white"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        RELOOP
      </button>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="mainNavbar" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item">
            <a class="nav-link active" href="#">Home</a>
          </li>

          <li class="nav-item">
            <a class="nav-link" href="#finder">Find an Item</a>
          </li>

          <li class="nav-item">
            <button class="btn btn-link nav-link" type="button" @click="showSearch = !showSearch">
              Search
            </button>
          </li>

          <li class="nav-item dropdown">
            <button
              class="btn btn-link nav-link dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              Account
            </button>

            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <a class="dropdown-item" href="#">My Account</a>
              </li>
              <li>
                <a class="dropdown-item" href="#">Saved Items</a>
              </li>
              <li>
                <a class="dropdown-item" href="#">Login</a>
              </li>
            </ul>
          </li>
        </ul>

        <form v-if="showSearch" class="d-flex ms-lg-3 mt-3 mt-lg-0" @submit.prevent>
          <input
            class="form-control"
            type="search"
            placeholder="Search an item"
            aria-label="Search"
          />
        </form>
      </div>
    </div>
  </nav>
</template>

<style scoped>
@media (max-width: 991.98px) {
  .dropdown {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    left: auto;
    min-width: 180px;
    z-index: 1050;
  }
}
</style>
