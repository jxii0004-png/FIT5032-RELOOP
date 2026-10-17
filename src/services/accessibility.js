import { nextTick } from "vue";

export async function focusElement(id) {
  await nextTick();
  document.getElementById(id)?.focus();
}
