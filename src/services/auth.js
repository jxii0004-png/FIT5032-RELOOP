import { readonly, shallowRef } from "vue";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onIdTokenChanged, getIdTokenResult } from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
const userState = shallowRef(null);
export const currentUser = readonly(userState);
export function authErrorMessage(error) {
  const messages = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Please choose a stronger password with at least 8 characters.",
    "auth/invalid-email": "Please enter a valid email.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Unable to connect. Check your connection and try again.",
    "auth/operation-not-allowed": "Email sign-in is currently unavailable. Please contact the site administrator.",
    "auth/user-disabled": "This account has been disabled.",
  };
  return messages[error?.code] || "The request could not be completed. Please try again.";
}
async function syncUser(user) {
  if (!user) { userState.value = null; return; }
  const token = await getIdTokenResult(user);
  userState.value = {
    id: user.uid, name: user.displayName || user.email, email: user.email,
    role: token.claims.admin === true ? "admin" : "user",
  };
}
export const authReady = auth ? new Promise((resolve) => {
  onIdTokenChanged(auth, async (user) => {
    try { await syncUser(user); }
    catch { userState.value = null; }
    finally { resolve(); }
  }, () => { userState.value = null; resolve(); });
}) : Promise.resolve();
function requireConfiguration() {
  if (!auth) throw new Error("Sign-in is not available yet. Please contact the site administrator.");
}
async function saveProfile(user) {
  await setDoc(doc(db, "reloopUsers", user.uid), { name: user.displayName || user.email, email: user.email });
}
export async function registerUser(name, email, password) {
  requireConfiguration();
  if (!name.trim() || name.trim().length > 50 || /[<>]/.test(name) || password.length < 8) {
    throw new Error("Enter a valid name and a password with at least 8 characters.");
  }
  let credential;
  try { credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password); }
  catch (error) { throw new Error(authErrorMessage(error), { cause: error }); }
  try {
    await updateProfile(credential.user, { displayName: name.trim() });
    await syncUser(credential.user);
    await saveProfile(credential.user);
  } catch { throw new Error("Your account was created, but profile setup failed. Please sign in to try again."); }
  return userState.value;
}
export async function loginUser(email, password) {
  requireConfiguration();
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await syncUser(credential.user);
  } catch (error) { throw new Error(authErrorMessage(error), { cause: error }); }
  try { await saveProfile(credential.user); }
  catch { /* Authentication remains valid when the profile database is unavailable. */ }
  return userState.value;
}
export function getCurrentUser() { return userState.value; }
export async function logoutUser() {
  if (auth) {
    try { await signOut(auth); }
    catch (error) { throw new Error(authErrorMessage(error), { cause: error }); }
  }
  userState.value = null;
}
export async function getAllUsers() {
  await authReady;
  if (!db || userState.value?.role !== "admin") throw new Error("Administrator access is required.");
  const snapshot = await getDocs(collection(db, "reloopUsers"));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}
