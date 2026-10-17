import { onUnmounted, ref, watch } from 'vue';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { currentUser } from './auth';
import { validatePlan } from './planning';

function plansPath() {
  if (!auth?.currentUser || !db) throw new Error('Please sign in to manage your plans.');
  return collection(db, 'recyclingPlans', auth.currentUser.uid, 'items');
}
export function usePlans() {
  const plans = ref([]);
  const loading = ref(true);
  const error = ref('');
  let stop = () => {};
  function load() {
    stop();
    plans.value = [];
    error.value = '';
    loading.value = true;
    try {
      stop = onSnapshot(query(plansPath(), orderBy('createdAt', 'desc')), (snapshot) => {
        plans.value = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
        loading.value = false;
      }, () => { error.value = 'Unable to load your plans. Check your connection and try again, or contact the site administrator.'; loading.value = false; });
    } catch (cause) { error.value = cause.message; loading.value = false; }
  }
  watch(currentUser, load, { immediate: true });
  onUnmounted(() => stop());
  return { plans, loading, error, reload: load };
}
export async function savePlan(plan, id = '') {
  const error = validatePlan(plan);
  if (error) throw new Error(error);
  const values = { itemId: Number(plan.itemId), quantity: Number(plan.quantity), method: plan.method, date: plan.date, location: plan.location.trim() };
  if (id) await updateDoc(doc(plansPath(), id), values);
  else await addDoc(plansPath(), { ...values, status: 'planned', completedAt: null, createdAt: serverTimestamp() });
}
export function setPlanCompleted(plan) {
  const completed = plan.status !== 'completed';
  return updateDoc(doc(plansPath(), plan.id), { status: completed ? 'completed' : 'planned', completedAt: completed ? serverTimestamp() : null });
}
export function removePlan(id) { return deleteDoc(doc(plansPath(), id)); }
