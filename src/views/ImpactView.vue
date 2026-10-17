<script setup>
import { computed, ref } from 'vue';
import { usePlans } from '../services/plans';
import { methods, summarizePlans } from '../services/planning';
import RecyclingToolsNav from '../components/RecyclingToolsNav.vue';
const { plans, loading, error, reload } = usePlans();
const month = ref('');
const summary = computed(() => summarizePlans(plans.value, month.value));
const plannedQuantity = computed(() => plans.value.filter((plan) => plan.status === 'planned').reduce((sum, plan) => sum + plan.quantity, 0));
const monthlyRows = computed(() => Object.entries(summary.value.months).sort(([a], [b]) => b.localeCompare(a)));
</script>
<template>
  <main id="main-content" tabindex="-1" class="container py-5">
    <h1>My environmental statistics</h1>
    <RecyclingToolsNav />
    <p>Based on plans you marked complete. Counts are self-reported item quantities, not verified environmental savings.</p>
    <p v-if="loading" role="status">Loading your statistics…</p>
    <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-outline-danger btn-sm" @click="reload">Retry</button></div>
    <template v-else>
      <div class="d-flex flex-wrap align-items-end gap-2 mb-4"><label>Completion month (Sydney time)<input v-model="month" type="month" min="2000-01" max="2100-12" class="form-control"></label><button class="btn btn-outline-secondary" @click="month = ''">All months</button></div>
      <p role="status">{{ summary.quantity }} completed items across {{ summary.tasks }} plans{{ month ? ` in ${month}` : ' in all months' }}.</p>
      <div class="row g-3 mb-4">
        <div class="col-12 col-md-4"><div class="card card-body"><h2 class="h5">Completed items</h2><p class="h2">{{ summary.quantity }}</p></div></div>
        <div class="col-12 col-md-4"><div class="card card-body"><h2 class="h5">Completed plans</h2><p class="h2">{{ summary.tasks }}</p></div></div>
        <div class="col-12 col-md-4"><div class="card card-body"><h2 class="h5">Still planned (all dates)</h2><p class="h2">{{ plannedQuantity }}</p></div></div>
      </div>
      <p v-if="!summary.tasks">No completed plans for this period. <RouterLink to="/plans">Complete a plan</RouterLink> after you finish handling the items.</p>
      <div v-else class="row g-4">
        <section class="col-12 col-md-6"><h2 class="h4">By action</h2><table class="table"><caption>Quantity of completed items by action</caption><thead><tr><th scope="col">Action</th><th scope="col">Items</th></tr></thead><tbody><tr v-for="(label, key) in methods" :key="key"><th scope="row">{{ label }}</th><td>{{ summary.byMethod[key] }}</td></tr></tbody></table></section>
        <section class="col-12 col-md-6"><h2 class="h4">By category</h2><table class="table"><caption>Quantity of completed items by category</caption><thead><tr><th scope="col">Category</th><th scope="col">Items</th></tr></thead><tbody><tr v-for="(quantity, category) in summary.categories" :key="category"><th scope="row">{{ category }}</th><td>{{ quantity }}</td></tr></tbody></table></section>
        <section class="col-12"><h2 class="h4">Monthly history</h2><table class="table"><caption>Completion month uses Australia/Sydney time</caption><thead><tr><th scope="col">Month</th><th scope="col">Completed items</th></tr></thead><tbody><tr v-for="[key, quantity] in monthlyRows" :key="key"><th scope="row">{{ key }}</th><td>{{ quantity }}</td></tr></tbody></table></section>
      </div>
      <p class="small text-secondary">Reopening or deleting a completed plan removes it from completed counts. Editing its quantity updates these counts. Plans without a completed server timestamp appear after saving finishes.</p>
    </template>
  </main>
</template>
