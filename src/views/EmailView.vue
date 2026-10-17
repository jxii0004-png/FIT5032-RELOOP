<script setup>
import { computed, ref } from "vue";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../services/firebase";
import { focusElement } from "../services/accessibility";

import { readLocalArray, validSearchRecord } from "../services/localRecords";

const to = ref("");
const subject = ref("Your RELOOP recycling plan");
const message = ref("");
const attachment = ref(null);
const fileInput = ref(null);
const sending = ref(false);
const error = ref("");
const errorField = ref("");
function showError(message, field = "") {
  error.value = message;
  errorField.value = field;
  focusElement(field || "mail-error");
}
const success = ref("");
const requestId = ref(crypto.randomUUID());
const attempted = ref(false);
const ready = import.meta.env.VITE_EMAIL_ENABLED === "true";
const locked = computed(() => sending.value || attempted.value);
const maxBytes = 2 * 1024 * 1024;

function newMessage() {
  if (sending.value) return;
  attempted.value = false;
  requestId.value = crypto.randomUUID();
  success.value = "";
  error.value = "";
  errorField.value = "";
  attachment.value = null;
  to.value = "";
  message.value = "";
  if (fileInput.value) fileInput.value.value = "";
  focusElement("mail-to");
}
function chooseFile(event) {
  error.value = "";
  errorField.value = "";
  attachment.value = null;
  const file = event.target.files[0];
  if (!file) return;
  if (!file.size || file.size > maxBytes || file.name.length > 100 || !/\.(pdf|txt|csv|png|jpe?g)$/i.test(file.name)) {
    showError("Choose a non-empty PDF, TXT, CSV, PNG or JPG file up to 2 MB (filename up to 100 characters).", "mail-file");
    event.target.value = "";
    return;
  }
  attachment.value = file;
}
function readAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ filename: file.name, content: reader.result.split(",")[1] });
    reader.onerror = () => reject(new Error("Unable to read the attachment. Please select it again."));
    reader.readAsDataURL(file);
  });
}
function useRecentSearches() {
  error.value = "";
  errorField.value = "";
  try {
    const history = readLocalArray("reloopSearchHistory", validSearchRecord);
    if (!Array.isArray(history) || !history.length) { error.value = "Search for an item on the home page first."; return; }
    message.value = "My RELOOP plan\n\n" + history.map((item) => `${item.name} (${item.condition})\n${item.recommendation}`).join("\n\n") + "\n\nPlease check local collection requirements before visiting.";
  } catch { error.value = "Unable to read recent searches. Please enter your message manually."; }
}
async function send() {
  if (sending.value || attempted.value || !ready) return;
  error.value = "";
  errorField.value = "";
  success.value = "";
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to.value.trim()) || /[\r\n]/.test(to.value)) { showError("Enter one valid recipient email.", "mail-to"); return; }
  if (!subject.value.trim() || /[\r\n]/.test(subject.value)) { showError("Enter a subject on one line.", "mail-subject"); return; }
  if (!message.value.trim()) { showError("Enter a message.", "mail-message"); return; }
  sending.value = true;
  try {
    const payload = { to: to.value, subject: subject.value, message: message.value, requestId: requestId.value };
    if (attachment.value) payload.attachment = await readAttachment(attachment.value);
    attempted.value = true;
    const sendEmail = httpsCallable(getFunctions(auth.app, "australia-southeast1"), "sendEmail", { timeout: 45000 });
    const result = await sendEmail(payload);
    if (!result.data.accepted) throw new Error("The email was not accepted.");
    success.value = "The email service accepted your message for delivery. Check the recipient inbox and spam folder; delivery is not guaranteed.";
    focusElement("mail-success");
  } catch (cause) {
    const code = cause.code?.replace("functions/", "");
    const safeCodes = ["invalid-argument", "failed-precondition", "resource-exhausted", "already-exists", "unavailable", "permission-denied", "unauthenticated"];
    showError(safeCodes.includes(code) ? cause.message : "Unable to confirm delivery. Check the recipient inbox before starting a new message.");
  } finally { sending.value = false; }
}
</script>

<template>
  <main id="main-content" tabindex="-1" class="container py-5">
    <div class="row justify-content-center"><div class="col-12 col-lg-8">
      <h1>Email a recycling plan</h1>
      <p class="text-secondary">Send recycling guidance and an optional attachment to one recipient.</p>
      <div v-if="!ready" class="alert alert-warning" role="status">Email sending is awaiting service setup. You can prepare a message, but sending is currently unavailable.</div>
      <p>Recipient, subject and message are required.</p>
      <form class="card border-0 shadow-sm" :aria-busy="sending" novalidate @submit.prevent="send">
        <div class="card-body p-4">
          <fieldset :disabled="locked">
            <legend class="visually-hidden">Compose email</legend>
            <label for="mail-to" class="form-label">Recipient email</label>
            <input id="mail-to" :aria-invalid="errorField === 'mail-to'" :aria-describedby="errorField === 'mail-to' ? 'mail-error' : undefined" v-model="to" type="email" maxlength="254" autocomplete="email" class="form-control mb-3" required />
            <label for="mail-subject" class="form-label">Subject</label>
            <input id="mail-subject" :aria-invalid="errorField === 'mail-subject'" :aria-describedby="errorField === 'mail-subject' ? 'mail-error' : undefined" v-model="subject" maxlength="150" class="form-control mb-3" required />
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <label for="mail-message" class="form-label mb-0">Message</label>
              <button type="button" class="btn btn-outline-success btn-sm" @click="useRecentSearches">Use recent searches</button>
            </div>
            <textarea id="mail-message" :aria-invalid="errorField === 'mail-message'" :aria-describedby="errorField === 'mail-message' ? 'mail-error' : undefined" v-model="message" rows="8" maxlength="10000" class="form-control mb-3" required></textarea>
            <label for="mail-file" class="form-label">Attachment (optional)</label>
            <input id="mail-file" ref="fileInput" type="file" accept=".pdf,.txt,.csv,.png,.jpg,.jpeg" class="form-control" :aria-invalid="errorField === 'mail-file'" :aria-describedby="errorField === 'mail-file' ? 'mail-file-help mail-error' : 'mail-file-help'" @change="chooseFile" />
            <p id="mail-file-help" class="form-text">One PDF, TXT, CSV, PNG or JPG, up to 2 MB. The selected file will be emailed to the recipient above.</p>
            <p v-if="attachment" class="small">Selected: {{ attachment.name }} ({{ (attachment.size / 1024).toFixed(1) }} KB)</p>
          </fieldset>
          <p v-if="error" id="mail-error" tabindex="-1" class="alert alert-danger mt-3" role="alert">{{ error }}</p>
          <p v-if="success" id="mail-success" tabindex="-1" class="alert alert-success mt-3" role="status">{{ success }}</p>
          <p role="status" class="visually-hidden">{{ sending ? "Sending your message. Please wait." : "" }}</p>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button type="submit" class="btn btn-success" :disabled="!ready || locked">{{ sending ? 'Sending…' : 'Send email' }}</button>
            <button v-if="attempted" type="button" class="btn btn-outline-secondary" :disabled="sending" @click="newMessage">New message</button>
          </div>
          <p v-if="attempted && !sending" class="form-text">Each message can be submitted once. Check the recipient inbox before starting another. Allow one minute between messages.</p>
        </div>
      </form>
    </div></div>
  </main>
</template>
