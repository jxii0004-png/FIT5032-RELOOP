import { wasteItems } from '../data/wasteItems.js';
export const methods = { reuse: 'Reuse / donate', repair: 'Repair', recycle: 'Recycle' };
export const findItem = (id) => wasteItems.find((item) => item.id === Number(id));
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= '2000-01-01' && value <= '2100-12-31';
}
export function validatePlan(plan) {
  if (!findItem(plan.itemId)) return 'Choose an item from the list.';
  if (!Number.isInteger(Number(plan.quantity)) || Number(plan.quantity) < 1 || Number(plan.quantity) > 1000) return 'Quantity must be a whole number from 1 to 1000.';
  if (!Object.hasOwn(methods, plan.method)) return 'Choose reuse, repair or recycle.';
  if (plan.date && !validDate(plan.date)) return 'Choose a valid date between 2000 and 2100.';
  if (typeof plan.location !== 'string' || plan.location.trim().length > 200) return 'Keep the location within 200 characters.';
  return '';
}
export function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function completedMonth(plan) {
  if (plan.status !== 'completed' || !plan.completedAt?.toDate) return '';
  return dateKey(plan.completedAt.toDate()).slice(0, 7);
}
export function summarizePlans(plans, month = '') {
  const completed = plans.filter((plan) => completedMonth(plan) && (!month || completedMonth(plan) === month));
  const categories = {};
  const byMethod = { reuse: 0, repair: 0, recycle: 0 };
  const months = {};
  for (const plan of completed) {
    const category = findItem(plan.itemId)?.category || 'Other';
    categories[category] = (categories[category] || 0) + plan.quantity;
    byMethod[plan.method] += plan.quantity;
    const key = completedMonth(plan);
    months[key] = (months[key] || 0) + plan.quantity;
  }
  return { tasks: completed.length, quantity: completed.reduce((sum, plan) => sum + plan.quantity, 0), categories, byMethod, months };
}
function escapeIcs(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
function foldLine(line) {
  const encoder = new TextEncoder();
  const lines = [];
  let current = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) { lines.push(current); current = ' '; bytes = 1; }
    current += character;
    bytes += size;
  }
  return [...lines, current].join('\r\n');
}
export function createCalendar(plans, now = new Date()) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RELOOP//Recycling Plans//EN', 'CALSCALE:GREGORIAN'];
  for (const plan of plans.filter((entry) => entry.status === 'planned' && validDate(entry.date))) {
    const end = new Date(`${plan.date}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    const item = findItem(plan.itemId);
    lines.push('BEGIN:VEVENT', `UID:${escapeIcs(plan.id)}@reloop`, `DTSTAMP:${now.toISOString().replace(/[-:]|\.\d{3}/g, '')}`,
      `DTSTART;VALUE=DATE:${plan.date.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replaceAll('-', '')}`,
      `SUMMARY:${escapeIcs(`${methods[plan.method]}: ${item?.displayName || 'Item'} x ${plan.quantity}`)}`,
      `LOCATION:${escapeIcs(plan.location)}`, 'DESCRIPTION:Personal RELOOP plan. Confirm opening hours and accepted items before visiting.',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-P1D', 'DESCRIPTION:RELOOP recycling plan tomorrow', 'END:VALARM', 'END:VEVENT');
  }
  return [...lines, 'END:VCALENDAR'].map(foldLine).join('\r\n') + '\r\n';
}
export function downloadCalendar(plans) {
  const url = URL.createObjectURL(new Blob([createCalendar(plans)], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reloop-plans.ics';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
