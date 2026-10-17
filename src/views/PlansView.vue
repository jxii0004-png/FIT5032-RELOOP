<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { wasteItems } from '../data/wasteItems';
import { usePlans, savePlan, setPlanCompleted, removePlan } from '../services/plans';
import { findItem, methods, validatePlan } from '../services/planning';
import { focusElement } from '../services/accessibility';
import RecyclingToolsNav from '../components/RecyclingToolsNav.vue';
const route = useRoute();
const { plans, loading, error, reload } = usePlans();
const blank = () => ({ itemId: '', quantity: 1, method: 'recycle', date: '', location: '' });
const form = reactive(blank());
if (findItem(route.query.item)) form.itemId = Number(route.query.item);
const editing = ref('');
const busy = ref(false);
const message = ref('');
const formError = ref('');
const deleteId = ref('');
const filter = ref('all');
const visiblePlans = computed(() => plans.value.filter((plan) => filter.value === 'all' || plan.status === filter.value));
function reset() { Object.assign(form, blank()); editing.value = ''; formError.value = ''; }
async function act(operation, success) {
  if (busy.value) return;
  busy.value = true;
  formError.value = '';
  message.value = '';
  try { await operation(); message.value = success; return true; }
  catch { formError.value = 'Unable to save this change. Check your connection and try again.'; focusElement('plan-error'); return false; }
  finally { busy.value = false; }
}
async function submit() {
  formError.value = validatePlan(form);
  if (formError.value) { focusElement('plan-error'); return; }
  const saved = await act(async () => { await savePlan(form, editing.value); reset(); }, 'Plan saved to your account.');
  if (saved) focusElement('plan-item');
}
function edit(plan) {
  Object.assign(form, plan);
  editing.value = plan.id;
  formError.value = '';
  focusElement('plan-item');
}
async function remove(plan) {
  await act(async () => { await removePlan(plan.id); if (editing.value === plan.id) reset(); deleteId.value = ''; focusElement('plan-list-heading'); }, 'Plan deleted.');
}
</script>
<template>
  <main id="main-content" tabindex="-1" class="container py-5">
    <h1>My recycling plans</h1>
    <RecyclingToolsNav />
    <p>Plan what to reuse, repair or recycle. Mark a plan complete after you finish it; this updates your personal statistics.</p>
    <p v-if="loading" role="status">Loading your saved plans…</p>
    <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-outline-danger btn-sm" @click="reload">Retry</button></div>
    <template v-else>
      <form class="card card-body mb-4" :aria-busy="busy" novalidate @submit.prevent="submit">
        <h2 class="h4">{{ editing ? 'Edit plan' : 'Add a plan' }}</h2>
        <p class="small text-secondary">Item, quantity and action are required. Date and location are optional.</p>
        <div v-if="formError" id="plan-error" tabindex="-1" class="alert alert-danger" role="alert">{{ formError }}</div>
        <fieldset :disabled="busy" class="row g-3">
          <legend class="visually-hidden">Plan details</legend>
          <div class="col-12 col-md-4"><label for="plan-item" class="form-label">Item</label>
            <select id="plan-item" v-model="form.itemId" required class="form-select"><option disabled value="">Choose an item</option><option v-for="item in wasteItems" :key="item.id" :value="item.id">{{ item.displayName }}</option></select></div>
          <div class="col-12 col-md-2"><label for="plan-quantity" class="form-label">Quantity</label><input id="plan-quantity" v-model.number="form.quantity" required type="number" min="1" max="1000" step="1" class="form-control"></div>
          <div class="col-12 col-md-3"><label for="plan-method" class="form-label">Action</label><select id="plan-method" v-model="form.method" required class="form-select"><option v-for="(label, key) in methods" :key="key" :value="key">{{ label }}</option></select></div>
          <div class="col-12 col-md-3"><label for="plan-date" class="form-label">Planned date</label><input id="plan-date" v-model="form.date" type="date" min="2000-01-01" max="2100-12-31" class="form-control"></div>
          <div class="col-12"><label for="plan-location" class="form-label">Location (optional)</label><input id="plan-location" v-model="form.location" maxlength="200" class="form-control" placeholder="For example: a donation shop or recycling centre"></div>
          <div class="col-12 d-flex gap-2"><button class="btn btn-success" type="submit">{{ busy ? 'Saving…' : 'Save plan' }}</button><button v-if="editing" class="btn btn-outline-secondary" type="button" @click="reset">Cancel edit</button></div>
        </fieldset>
      </form>
      <p role="status">{{ message }}</p>
      <div class="d-flex flex-wrap gap-3 align-items-center mb-3">
        <h2 id="plan-list-heading" tabindex="-1" class="h4 mb-0">Your plans</h2>
        <label>Show <select v-model="filter" class="form-select form-select-sm"><option value="all">All plans</option><option value="planned">Planned</option><option value="completed">Completed</option></select></label>
      </div>
      <p v-if="!visiblePlans.length">No plans to show. Add a plan above or change the filter.</p>
      <ul class="list-unstyled">
        <li v-for="plan in visiblePlans" :key="plan.id" class="card card-body mb-3">
          <h3 class="h5">{{ findItem(plan.itemId)?.displayName }} × {{ plan.quantity }}</h3>
          <p class="mb-1">{{ methods[plan.method] }} · {{ plan.status === 'completed' ? 'Completed' : 'Planned' }}</p>
          <p class="text-secondary">Date: {{ plan.date || 'Not scheduled' }} · Location: {{ plan.location || 'Not set' }}</p>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-success btn-sm" :disabled="busy" :aria-label="`${plan.status === 'completed' ? 'Reopen plan:' : 'Mark complete:'} ${findItem(plan.itemId)?.displayName} plan`" @click="act(async () => { await setPlanCompleted(plan); focusElement('plan-list-heading'); }, 'Plan status updated.')">{{ plan.status === 'completed' ? 'Reopen plan' : 'Mark complete' }}</button>
            <button class="btn btn-outline-secondary btn-sm" :disabled="busy" :aria-label="`Edit ${findItem(plan.itemId)?.displayName} plan`" @click="edit(plan)">Edit</button>
            <button class="btn btn-outline-danger btn-sm" :disabled="busy" :aria-label="`Delete ${findItem(plan.itemId)?.displayName} plan`" @click="deleteId = plan.id">Delete</button>
          </div>
          <div v-if="deleteId === plan.id" class="mt-3">
            <p>Delete this plan? A completed plan will also be removed from your statistics.</p>
            <button class="btn btn-danger btn-sm me-2" :disabled="busy" @click="remove(plan)">Confirm delete</button><button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="deleteId = ''">Keep plan</button>
          </div>
        </li>
      </ul>
    </template>
  </main>
</template>
