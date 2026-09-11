const USERS_KEY = "reloopUsers";
const SESSION_KEY = "reloopCurrentUser";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const encodedPassword = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function registerUser(name, email, password) {
  const users = getUsers();
  const cleanedEmail = email.trim().toLowerCase();

  const existingUser = users.find((user) => user.email === cleanedEmail);

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const newUser = {
    id: Date.now(),
    name: name.trim(),
    email: cleanedEmail,
    passwordHash: await hashPassword(password),
    role: "user",
  };

  users.push(newUser);
  saveUsers(users);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
}

export async function loginUser(email, password) {
  const users = getUsers();
  const cleanedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const matchedUser = users.find(
    (user) => user.email === cleanedEmail && user.passwordHash === passwordHash,
  );

  if (!matchedUser) {
    throw new Error("Incorrect email or password.");
  }

  const sessionUser = {
    id: matchedUser.id,
    name: matchedUser.name,
    email: matchedUser.email,
    role: matchedUser.role,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

  return sessionUser;
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

export async function createDefaultAdmin() {
  const users = getUsers();

  const adminExists = users.some((user) => user.email === "admin@reloop.com");

  if (adminExists) {
    return;
  }

  users.push({
    id: Date.now(),
    name: "RELOOP Admin",
    email: "admin@reloop.com",
    passwordHash: await hashPassword("Admin1234"),
    role: "admin",
  });

  saveUsers(users);
}
