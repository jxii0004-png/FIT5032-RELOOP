<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../services/auth";

const router = useRouter();

const email = ref("");
const password = ref("");
const errorMessage = ref("");

async function login() {
  errorMessage.value = "";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email.value)) {
    errorMessage.value = "Please enter a valid email.";
    return;
  }

  if (!password.value) {
    errorMessage.value = "Password is required.";
    return;
  }

  try {
    await loginUser(email.value, password.value);
    router.push("/");
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>

<template>
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-md-7 col-lg-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <h1 class="h3 text-center mb-4">Login</h1>

            <form novalidate @submit.prevent="login">
              <div class="mb-3">
                <label for="loginEmail" class="form-label"> Email </label>

                <input
                  id="loginEmail"
                  v-model="email"
                  type="email"
                  maxlength="100"
                  class="form-control"
                  autocomplete="email"
                />
              </div>

              <div class="mb-3">
                <label for="loginPassword" class="form-label"> Password </label>

                <input
                  id="loginPassword"
                  v-model="password"
                  type="password"
                  maxlength="50"
                  class="form-control"
                  autocomplete="current-password"
                />
              </div>

              <div v-if="errorMessage" class="alert alert-danger" role="alert">
                {{ errorMessage }}
              </div>

              <button type="submit" class="btn btn-success w-100">Login</button>

              <p class="text-center mt-3 mb-0">
                Do not have an account?
                <RouterLink to="/register">Register</RouterLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
