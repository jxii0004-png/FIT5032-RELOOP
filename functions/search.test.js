import test from "node:test";
import assert from "node:assert/strict";
import { validateSearch, recordSearch } from "./search.js";
import catalog from "./searchCatalog.json" with { type: "json" };
import { wasteItems } from "../src/data/wasteItems.js";
const input = { itemId: 1, condition: "broken", requestId: "12345678-1234-1234-1234-123456789abc" };

function fakeDatabase() {
  const records = new Map();
  return {
    records,
    collection: (name) => ({ doc: (id) => `${name}/${id}` }),
    async runTransaction(callback) {
      const writes = [];
      const result = await callback({
        get: async (key) => ({ exists: records.has(key), data: () => records.get(key) }),
        set: (key, value) => writes.push([key, value]),
      });
      for (const [key, value] of writes) {
        const old = records.get(key) || {};
        records.set(key, Object.fromEntries(Object.entries(value).map(([field, entry]) => [field, entry?.increment ? (old[field] || 0) + entry.increment : entry])));
      }
      return result;
    },
  };
}
const fields = { increment: (n) => ({ increment: n }), serverTimestamp: () => 12345 };
test("catalog matches searchable frontend items and ignores caller-supplied names", () => {
  assert.deepEqual(catalog, wasteItems.map(({ id, displayName, category }) => ({ id, displayName, category })));
  assert.equal(validateSearch({ ...input, name: "fake" }).name, "Television");
});
test("reject invalid items, conditions and request IDs", () => {
  for (const patch of [{ itemId: 999 }, { itemId: "1" }, { condition: "unknown" }, { requestId: "../bad" }]) {
    assert.throws(() => validateSearch({ ...input, ...patch }), { code: "invalid-argument" });
  }
});
test("one search updates event, global total and item total; retry never doubles counts", async () => {
  const database = fakeDatabase();
  const search = validateSearch(input);
  await recordSearch(database, "user", search, fields, 10000);
  assert.equal(database.records.get("searchStats/total").count, 1);
  assert.equal(database.records.get("searchItems/1").count, 1);
  assert.equal(database.records.get(`searchEvents/user_${input.requestId}`).name, "Television");
  assert.equal((await recordSearch(database, "user", search, fields, 10001)).duplicate, true);
  assert.equal(database.records.get("searchStats/total").count, 1);
  const next = validateSearch({ ...input, itemId: 2, requestId: "22345678-1234-1234-1234-123456789abc" });
  await assert.rejects(recordSearch(database, "user", next, fields, 11000), { code: "resource-exhausted" });
  assert.equal(database.records.get("searchItems/2"), undefined);
  await recordSearch(database, "user", next, fields, 12000);
  assert.equal(database.records.get("searchStats/total").count, 2);
  assert.equal(database.records.get("searchItems/2").count, 1);
});
test("callable rejects anonymous and malformed authenticated requests", async () => {
  const { trackSearch } = await import("./index.js");
  await assert.rejects(trackSearch.run({ data: input }), { code: "unauthenticated" });
  await assert.rejects(trackSearch.run({ auth: { uid: "user" }, data: {} }), { code: "invalid-argument" });
});
