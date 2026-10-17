import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function trackSearch(itemId, condition) {
  if (!auth?.currentUser) return;
  const call = httpsCallable(getFunctions(auth.app, "australia-southeast1"), "trackSearch", { timeout: 15000 });
  return call({ itemId, condition, requestId: crypto.randomUUID() });
}
export function watchSearchStats({ total, items, events, error }) {
  if (!db) { error(); return () => {}; }
  const stops = [
    onSnapshot(doc(db, "searchStats", "total"), (snapshot) => total(snapshot.data()?.count || 0), error),
    onSnapshot(query(collection(db, "searchItems"), orderBy("count", "desc")), (snapshot) => items(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), error),
    onSnapshot(query(collection(db, "searchEvents"), orderBy("createdAt", "desc"), limit(50)), (snapshot) => events(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), error),
  ];
  return () => stops.forEach((stop) => stop());
}
