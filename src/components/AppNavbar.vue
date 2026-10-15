<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { currentUser, logoutUser } from "../services/auth";

const router = useRouter();

const showSearch = ref(false);
const logoutError = ref("");
async function logout() {
  logoutError.value = "";
  try {
    await logoutUser();
    router.push("/login");
  } catch (error) { logoutError.value = error.message; }
}
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
            <RouterLink class="nav-link" to="/">Home</RouterLink>
          </li>

          <li class="nav-item">
            <RouterLink class="nav-link" to="/#finder">Find an Item</RouterLink>
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
              {{ currentUser ? currentUser.name : "Account" }}
            </button>

            <ul class="dropdown-menu dropdown-menu-end">
              <template v-if="currentUser">
                <li v-if="currentUser.role === 'admin'">
                  <RouterLink class="dropdown-item" to="/admin"> Admin Dashboard </RouterLink>
                </li>
                <li>
                  <span class="dropdown-item-text"> Role: {{ currentUser.role }} </span>
                </li>

                <li><hr class="dropdown-divider" /></li>

                <li>
                  <button type="button" class="dropdown-item" @click="logout">Logout</button>
                </li>
              </template>

              <template v-else>
                <li>
                  <RouterLink class="dropdown-item" to="/login"> Login </RouterLink>
                </li>

                <li>
                  <RouterLink class="dropdown-item" to="/register"> Register </RouterLink>
                </li>
              </template>
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
  <p v-if="logoutError" class="alert alert-danger" role="alert">{{ logoutError }}</p>
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
