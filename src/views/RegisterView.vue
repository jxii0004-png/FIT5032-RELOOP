<script setup>
import { ref } from "vue";
import { registerUser } from "../services/auth";

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const successMessage = ref("");

async function register() {
  errorMessage.value = "";
  successMessage.value = "";

  const cleanedName = name.value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!cleanedName) {
    errorMessage.value = "Name is required.";
    return;
  }

  if (/[<>]/.test(cleanedName)) {
    errorMessage.value = "Name contains unsafe characters.";
    return;
  }

  if (!emailPattern.test(email.value.trim())) {
    errorMessage.value = "Please enter a valid email.";
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = "Password must be at least 8 characters.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  try {
    await registerUser(cleanedName, email.value, password.value);

    successMessage.value = "Registration successful.";
    name.value = "";
    email.value = "";
    password.value = "";
    confirmPassword.value = "";
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
            <h1 class="h3 text-center mb-4">Register</h1>

            <form novalidate @submit.prevent="register">
              <div class="mb-3">
                <label for="name" class="form-label">Name</label>

                <input
                  id="name"
                  v-model="name"
                  type="text"
                  maxlength="50"
                  class="form-control"
                  autocomplete="name"
                />
              </div>

              <div class="mb-3">
                <label for="email" class="form-label">Email</label>

                <input
                  id="email"
                  v-model="email"
                  type="email"
                  maxlength="100"
                  class="form-control"
                  autocomplete="email"
                />
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>

                <input
                  id="password"
                  v-model="password"
                  type="password"
                  maxlength="50"
                  class="form-control"
                  autocomplete="new-password"
                />
              </div>

              <div class="mb-3">
                <label for="confirmPassword" class="form-label"> Confirm password </label>

                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  maxlength="50"
                  class="form-control"
                  autocomplete="new-password"
                />
              </div>

              <div v-if="errorMessage" class="alert alert-danger" role="alert">
                {{ errorMessage }}
              </div>

              <div v-if="successMessage" class="alert alert-success" role="alert">
                {{ successMessage }}
              </div>

              <button type="submit" class="btn btn-success w-100">Register</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
