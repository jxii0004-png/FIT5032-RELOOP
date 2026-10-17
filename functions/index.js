import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { deliverMail, validateMail, MailError } from "./mail.js";
import { validateSearch, recordSearch, SearchError } from "./search.js";
initializeApp();
const database = getFirestore();
const sendgridKey = defineSecret("SENDGRID_API_KEY");
const sender = defineString("SENDGRID_FROM_EMAIL");
export const trackSearch = onCall({
  region: "australia-southeast1", maxInstances: 2, timeoutSeconds: 30,
  cors: ["https://reloop-f31e7.web.app", "https://reloop-f31e7.firebaseapp.com", "http://localhost:5173", "http://127.0.0.1:5173"],
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in to record search activity.");
  try {
    const search = validateSearch(request.data);
    return await recordSearch(database, request.auth.uid, search, FieldValue);
  } catch (error) {
    if (error instanceof SearchError) throw new HttpsError(error.code, error.message);
    throw new HttpsError("internal", "Search statistics could not be updated.");
  }
});
export const sendEmail = onCall({
  region: "australia-southeast1", secrets: [sendgridKey], maxInstances: 2, timeoutSeconds: 45,
  cors: ["https://reloop-f31e7.web.app", "https://reloop-f31e7.firebaseapp.com", "http://localhost:5173", "http://127.0.0.1:5173"],
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please sign in before sending email.");
  if (request.auth.token.admin !== true) throw new HttpsError("permission-denied", "Only administrators can send email.");
  try {
    const mail = validateMail(request.data);
    const key = sendgridKey.value();
    const from = sender.value();
    if (!key || !from) throw new HttpsError("failed-precondition", "Email sending is not configured yet.");
    const record = database.collection("mailRequests").doc(`${request.auth.uid}_${mail.requestId}`);
    const limit = database.collection("mailLimits").doc(request.auth.uid);
    const duplicate = await database.runTransaction(async (tx) => {
      const [existing, recent] = await Promise.all([tx.get(record), tx.get(limit)]);
      if (existing.exists) {
        if (existing.data().status === "accepted") return true;
        throw new HttpsError("already-exists", "This send was already attempted. Check your inbox before starting a new message.");
      }
      const now = Date.now();
      if (now - (recent.data()?.lastAttempt || 0) < 60000) throw new HttpsError("resource-exhausted", "Please wait one minute between emails.");
      tx.set(limit, { lastAttempt: now });
      tx.set(record, { status: "pending", createdAt: now });
      return false;
    });
    if (duplicate) return { accepted: true };
    try {
      const result = await deliverMail(mail, key, from);
      await record.update({ status: "accepted" });
      return result;
    } catch (error) { await record.update({ status: "failed" }); throw error; }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (error instanceof MailError) throw new HttpsError(error.code, error.message);
    throw new HttpsError("internal", "The request could not be completed. Check your inbox before trying again.");
  }
});
