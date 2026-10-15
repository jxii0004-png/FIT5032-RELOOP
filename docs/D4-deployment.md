# D.4 — Public cloud deployment

Public URL: https://reloop-f31e7.web.app

Firebase Hosting serves the Vite production build. SPA rewrites route direct
requests such as `/login`, `/admin`, and `/email` to `index.html`. Authorization
still runs in the application; Firebase rules protect the database separately.

Build: `npm run build -- --configLoader native`

Deploy frontend: `firebase deploy --only hosting --project reloop-f31e7`

The Firebase Web config is bundled for the selected project, but `.env.local`
and service credentials are not uploaded as files. SendGrid credentials must
remain server-only. Email remains disabled until the function is deployed and
the production build has `VITE_EMAIL_ENABLED=true`.

Verify production sign-in separately from localhost: browser sessions and
localStorage data are specific to the origin. Local search history and ratings
will not automatically appear on the public website.

After publishing, verify home, direct route refresh, sign-in/sign-out, admin
authorization, both tables, and (after provider setup) real attachment delivery.
