import catalog from "./searchCatalog.json" with { type: "json" };
export class SearchError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function validateSearch(data) {
  const item = catalog.find((entry) => entry.id === data?.itemId);
  if (!item || !["working", "repairable", "broken"].includes(data?.condition) ||
      typeof data?.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(data.requestId)) {
    throw new SearchError("invalid-argument", "Invalid item, condition or search request.");
  }
  return { itemId: item.id, name: item.displayName, category: item.category, condition: data.condition, requestId: data.requestId };
}

// One transaction reserves a request ID and updates both counters together.
export async function recordSearch(database, uid, search, fields, now = Date.now()) {
  const event = database.collection("searchEvents").doc(`${uid}_${search.requestId}`);
  const limit = database.collection("searchLimits").doc(uid);
  return database.runTransaction(async (tx) => {
    const [existing, recent] = await Promise.all([tx.get(event), tx.get(limit)]);
    if (existing.exists) return { recorded: true, duplicate: true };
    if (now - (recent.data()?.lastAttempt || 0) < 2000) throw new SearchError("resource-exhausted", "Please wait two seconds between tracked searches.");
    tx.set(event, { itemId: search.itemId, name: search.name, category: search.category, condition: search.condition, createdAt: fields.serverTimestamp() });
    tx.set(limit, { lastAttempt: now });
    tx.set(database.collection("searchStats").doc("total"), { count: fields.increment(1), updatedAt: fields.serverTimestamp() }, { merge: true });
    tx.set(database.collection("searchItems").doc(String(search.itemId)), {
      itemId: search.itemId, name: search.name, category: search.category,
      count: fields.increment(1), updatedAt: fields.serverTimestamp(),
    }, { merge: true });
    return { recorded: true, duplicate: false };
  });
}
