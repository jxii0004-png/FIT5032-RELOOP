# BR D.1 — Firebase Authentication

This application follows the eFolio modular Firebase SDK approach:
`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, and `signOut`.
`onIdTokenChanged` restores authentication and the router waits for its first
result before checking protected routes. Navbar and ratings use shared reactive
authentication state. Passwords are handled by Firebase, not saved by application
code. Legacy local accounts and ratings are not migrated automatically.

## Configure the separate RELOOP project

1. Create a separate project in Firebase Console and register a Web app.
2. In Authentication > Sign-in method, enable Email/Password.
3. Copy `.env.example` to `.env.local`, and fill its four values from the Web app's
   Firebase config. Never put a service-account private key in a VITE variable.
4. Create a Cloud Firestore database in production mode. Publish the exact
   `firestore.rules` from this repository in the Rules editor. Alternatively run
   `firebase deploy --only firestore:rules --project YOUR_RELOOP_PROJECT_ID` after
   checking that the target is the new project.
5. Check Authentication > Settings > Authorized domains for the domains used for
   the application. Restart Vite after changing environment variables.
6. Register a real account through the app. Firebase Authentication stores the
   credentials; Firestore `reloopUsers/{uid}` stores only name and email.

No project ID is preselected and no cloud rules have been deployed automatically.
The old eFolio database and its rules remain unchanged.

## Administrator access

The former `admin@reloop.com / Admin1234` local account no longer grants access.
Grant a chosen Firebase user's UID the custom claim `{ admin: true }` using the
Firebase Admin SDK in a trusted environment authenticated to the RELOOP project.
Merge this claim with any existing custom claims. Never grant it from browser
code, a user-editable profile field, or just by matching an email address.
Sign out and back in afterwards to obtain a fresh ID token.

The Firestore rules allow a user to create/update only their own name and email,
and allow only a signed-in administrator to list all user profiles. No client
delete or other collection access is allowed. The admin table contains profiles
created by this app, not a full Firebase Authentication user directory.

## Verification after configuration

- Register: account appears in Authentication, profile appears in Firestore,
  navbar updates, and no password/hash is written to an application collection.
- Duplicate email, incorrect password, short password, and network failures show
  readable errors. Submit is disabled during a request.
- Refresh after login: identity is restored before protected route checks.
- Sign out: identity clears and `/admin` redirects to login.
- A regular user cannot open `/admin` or list `reloopUsers` directly.
- Updating localStorage or writing a `role` field cannot grant administrator access.
- A user cannot read another user's profile or change another user's data.
- An administrator with a refreshed custom claim can load and filter the users
  table. Test denied writes directly using the Firestore Rules simulator.

Build/lint checks do not replace these live authentication and rules checks.

References:
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/web/start
- https://firebase.google.com/docs/auth/admin/custom-claims
- https://firebase.google.com/docs/rules/basics
