<script setup>
import { ref } from "vue";
import { focusElement } from "../services/accessibility";
import { registerUser } from "../services/auth";

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const errorField = ref("");
function showError(message, field = "") {
  errorMessage.value = message;
  errorField.value = field;
  focusElement(field || "register-error");
}
const successMessage = ref("");
const submitting = ref(false);

async function register() {
  if (submitting.value) return;
  errorMessage.value = "";
  successMessage.value = "";

  const cleanedName = name.value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!cleanedName) {
    showError("Name is required.", "name");
    return;
  }

  if (/[<>]/.test(cleanedName)) {
    showError("Name contains unsafe characters.", "name");
    return;
  }

  if (!emailPattern.test(email.value.trim())) {
    showError("Please enter a valid email.", "email");
    return;
  }

  if (password.value.length < 8) {
    showError("Password must be at least 8 characters.", "password");
    return;
  }

  if (password.value !== confirmPassword.value) {
    showError("Passwords do not match.", "confirmPassword");
    return;
  }

  submitting.value = true;
  try {
    await registerUser(cleanedName, email.value, password.value);

    successMessage.value = "Registration successful. You are now signed in.";
    focusElement("register-success");
    name.value = "";
    email.value = "";
    password.value = "";
    confirmPassword.value = "";
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
            <h1 class="h3 text-center mb-4">Register</h1>

            <p class="small text-secondary">All fields are required.</p>
            <form :aria-busy="submitting" novalidate @submit.prevent="register">
              <div class="mb-3">
                <label for="name" class="form-label">Name</label>

                <input
                  id="name"
                  required
                  :aria-invalid="errorField === 'name'"
                  :aria-describedby="errorField === 'name' ? 'register-error' : undefined"
                  @input="errorField = ''; errorMessage = ''"
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
                  required
                  :aria-invalid="errorField === 'email'"
                  :aria-describedby="errorField === 'email' ? 'register-error' : undefined"
                  @input="errorField = ''; errorMessage = ''"
                  v-model="email"
                  type="email"
                  maxlength="100"
                  class="form-control"
                  autocomplete="email"
                />
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password (at least 8 characters)</label>

                <input
                  id="password"
                  required
                  :aria-invalid="errorField === 'password'"
                  :aria-describedby="errorField === 'password' ? 'register-error' : undefined"
                  @input="errorField = ''; errorMessage = ''"
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
                  required
                  :aria-invalid="errorField === 'confirmPassword'"
                  :aria-describedby="errorField === 'confirmPassword' ? 'register-error' : undefined"
                  @input="errorField = ''; errorMessage = ''"
                  v-model="confirmPassword"
                  type="password"
                  maxlength="50"
                  class="form-control"
                  autocomplete="new-password"
                />
              </div>

              <div v-if="errorMessage" id="register-error" tabindex="-1" class="alert alert-danger" role="alert">
                {{ errorMessage }}
              </div>

              <div v-if="successMessage" id="register-success" tabindex="-1" class="alert alert-success" role="status">
                {{ successMessage }}
              </div>

              <p class="visually-hidden" role="status">{{ submitting ? "Please wait while your request is processed." : "" }}</p>
              <button type="submit" class="btn btn-success w-100" :disabled="submitting">{{ submitting ? 'Creating account…' : 'Register' }}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
