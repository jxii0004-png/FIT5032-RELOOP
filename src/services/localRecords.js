// Treat browser storage as optional: malformed or blocked storage must not break a search.
export function readLocalArray(key, valid, storage) {
  try {
    const records = JSON.parse((storage ?? localStorage).getItem(key) || '[]');
    return Array.isArray(records) ? records.filter(valid) : [];
  } catch { return []; }
}
export function writeLocalArray(key, records, storage) {
  try { (storage ?? localStorage).setItem(key, JSON.stringify(records)); return true; }
  catch { return false; }
}
export function clearLocalArray(key, storage) {
  try { (storage ?? localStorage).removeItem(key); return true; }
  catch { return false; }
}
export const validSearchRecord = (record) => record != null && typeof record.name === 'string' &&
  ['working', 'repairable', 'broken'].includes(record.condition) && typeof record.recommendation === 'string';
export const validRatingRecord = (record) => record != null && Number.isInteger(record.itemId) &&
  typeof record.userId === 'string' && Number.isInteger(record.score) && record.score >= 1 && record.score <= 5;
