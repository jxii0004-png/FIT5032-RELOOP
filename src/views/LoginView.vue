<script setup>
import { ref } from "vue";
import { focusElement } from "../services/accessibility";
import { useRoute, useRouter } from "vue-router";
import { loginUser } from "../services/auth";

const router = useRouter();
const route = useRoute();
const submitting = ref(false);

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const errorField = ref("");
function showError(message, field = "") {
  errorMessage.value = message;
  errorField.value = field;
  focusElement(field || "login-error");
}

async function login() {
  if (submitting.value) return;
  errorMessage.value = "";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email.value.trim())) {
    showError("Please enter a valid email.", "loginEmail");
    return;
  }

  if (!password.value) {
    showError("Password is required.", "loginPassword");
    return;
  }

  submitting.value = true;
  try {
    await loginUser(email.value, password.value);
    await router.push(["/admin", "/email", "/plans", "/impact", "/calendar"].includes(String(route.query.redirect || "").split("?")[0]) ? route.query.redirect : "/");
  } catch (error) {
    showError(error.message);
  } finally { submitting.value = false; }
}
</script>

<template>
  <main id="main-content" tabindex="-1" class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-md-7 col-lg-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <h1 class="h3 text-center mb-4">Login</h1>

            <p class="small text-secondary">All fields are required.</p>
            <form :aria-busy="submitting" novalidate @submit.prevent="login">
              <div class="mb-3">
                <label for="loginEmail" class="form-label"> Email </label>

                <input
                  id="loginEmail"
                  required
                  :aria-invalid="errorField === 'loginEmail'"
                  :aria-describedby="errorField === 'loginEmail' ? 'login-error' : undefined"
                  @input="errorField = ''; errorMessage = ''"
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
                  required
                  :aria-invalid="errorField === 'loginPassword'"
                  :aria-describedby="errorField === 'loginPassword' ? 'login-error' : undefined"
                  @input="errorField = ''; errorMessage = ''"
                  v-model="password"
                  type="password"
                  maxlength="50"
                  class="form-control"
                  autocomplete="current-password"
                />
              </div>

              <div v-if="errorMessage" id="login-error" tabindex="-1" class="alert alert-danger" role="alert">
                {{ errorMessage }}
              </div>

              <p class="visually-hidden" role="status">{{ submitting ? "Please wait while your request is processed." : "" }}</p>
              <button type="submit" class="btn btn-success w-100" :disabled="submitting">{{ submitting ? 'Signing in…' : 'Login' }}</button>

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
