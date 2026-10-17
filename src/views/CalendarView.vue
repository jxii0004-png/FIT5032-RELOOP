<script setup>
import { computed, ref, watch } from 'vue';
import { usePlans } from '../services/plans';
import { dateKey, downloadCalendar, findItem, methods } from '../services/planning';
import RecyclingToolsNav from '../components/RecyclingToolsNav.vue';
const { plans, loading, error, reload } = usePlans();
const today = dateKey();
const month = ref(today.slice(0, 7));
const selected = ref(today);
const message = ref('');
const scheduled = computed(() => plans.value.filter((plan) => plan.status === 'planned' && plan.date));
const monthPlans = computed(() => scheduled.value.filter((plan) => plan.date.startsWith(month.value)).sort((a, b) => a.date.localeCompare(b.date)));
const selectedPlans = computed(() => scheduled.value.filter((plan) => plan.date === selected.value));
const unscheduled = computed(() => plans.value.filter((plan) => plan.status === 'planned' && !plan.date).length);
const monthTitle = computed(() => /^\d{4}-\d{2}$/.test(month.value) ? new Intl.DateTimeFormat('en-AU', {month:'long', year:'numeric', timeZone:'UTC'}).format(new Date(`${month.value}-01T00:00:00Z`)) : 'Choose a month');
const weeks = computed(() => {
  if (!/^\d{4}-\d{2}$/.test(month.value)) return [];
  const [year, number] = month.value.split('-').map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const cells = Array.from({length: Math.ceil((start + days) / 7) * 7}, (_, index) => {
    const day = index - start + 1;
    if (day < 1 || day > days) return null;
    const date = `${month.value}-${String(day).padStart(2, '0')}`;
    return {day, date, count: monthPlans.value.filter((plan) => plan.date === date).length};
  });
  return Array.from({length: cells.length / 7}, (_, index) => cells.slice(index * 7, index * 7 + 7));
});
watch(month, () => { selected.value = month.value ? `${month.value}-01` : ''; message.value = ''; });
function exportEvents(entries) {
  message.value = '';
  try { downloadCalendar(entries); message.value = `${entries.length} calendar event(s) downloaded. Import the .ics file into your calendar.`; }
  catch { message.value = 'Calendar download failed. Please try again.'; }
}
</script>
<template>
  <main id="main-content" tabindex="-1" class="container py-5">
    <h1>My recycling calendar</h1>
    <RecyclingToolsNav />
    <p>View your scheduled plans and download all-day calendar events. Confirm collection arrangements and opening hours yourself.</p>
    <p v-if="loading" role="status">Loading your calendar…</p>
    <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }} <button class="btn btn-outline-danger btn-sm" @click="reload">Retry</button></div>
    <template v-else>
      <div class="d-flex flex-wrap align-items-end gap-3 mb-3">
        <label>Month<input v-model="month" type="month" min="2000-01" max="2100-12" required class="form-control"></label>
        <button class="btn btn-outline-success" :disabled="!monthPlans.length" @click="exportEvents(monthPlans)">Download this month's calendar (.ics)</button>
      </div>
      <p role="status">{{ message }}</p>
      <p class="small text-secondary">Import into Google Calendar, Apple Calendar or Outlook. Events request a reminder one day before; notifications depend on your calendar settings. Later website changes do not automatically update imported events.</p>
      <div class="calendar-wrap">
        <table class="table table-bordered calendar"><caption class="caption-top h4 text-dark">{{ monthTitle }}</caption>
          <thead><tr><th v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" scope="col">{{ day }}</th></tr></thead>
          <tbody><tr v-for="(week, index) in weeks" :key="index"><td v-for="(cell, column) in week" :key="column">
            <button v-if="cell" class="btn day" :class="selected === cell.date ? 'btn-success' : 'btn-outline-secondary'" :aria-pressed="selected === cell.date" :aria-current="cell.date === today ? 'date' : undefined" :aria-label="`${cell.day}, ${monthTitle}, ${cell.count} planned tasks`" @click="selected = cell.date">{{ cell.day }}<span v-if="cell.count" class="d-block small" aria-hidden="true">({{ cell.count }})</span></button>
          </td></tr></tbody>
        </table>
      </div>
      <section aria-labelledby="selected-day">
        <h2 id="selected-day" class="h4">Plans for {{ selected || 'selected day' }}</h2>
        <p class="visually-hidden" role="status">{{ selectedPlans.length }} plans for {{ selected || 'selected day' }}.</p>
        <p v-if="!selectedPlans.length">No plans on this day. <RouterLink to="/plans">Add or schedule a plan</RouterLink>.</p>
        <ul class="list-unstyled"><li v-for="plan in selectedPlans" :key="plan.id" class="card card-body mb-2">
          <h3 class="h5">{{ findItem(plan.itemId)?.displayName }} × {{ plan.quantity }}</h3>
          <p>{{ methods[plan.method] }} · {{ plan.location || 'Location not set' }}</p>
          <button class="btn btn-outline-success btn-sm align-self-start" :aria-label="`Download event (.ics) for ${findItem(plan.itemId)?.displayName}`" @click="exportEvents([plan])">Download event (.ics)</button>
        </li></ul>
      </section>
      <p>{{ unscheduled }} unscheduled plan(s). <RouterLink to="/plans">Manage dates and mark completed plans</RouterLink>.</p>
    </template>
  </main>
</template>
<style scoped>
.calendar-wrap { max-width: 760px; }
.calendar { table-layout: fixed; }
.calendar th { font-size: .8rem; text-align: center; }
.calendar td { padding: .2rem; vertical-align: top; }
.day { width: 100%; min-height: 48px; padding: .2rem; }
</style>
