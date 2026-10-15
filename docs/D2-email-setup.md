# D.2 — Email with attachments

Open `/email` as an administrator, or select Send Email in the account menu.
Compose one recipient, a subject and a plain-text message. Use recent searches
to prefill the message, and optionally attach one PDF/TXT/CSV/PNG/JPG up to 2 MB.
Review the recipient and attachment before sending. The backend validates the
signed Firebase admin claim and attachment, then calls the SendGrid Mail Send API.

## Configure SendGrid

1. Create a SendGrid account and follow its account verification steps.
2. In Settings > Sender Authentication, verify a Single Sender email address
   you control (or authenticate your own domain).
3. In Settings > API Keys, create a restricted key with Mail Send permission.
   Do not put it in frontend code, chat, or a VITE environment variable.
4. Once the RELOOP Firebase project has a user-approved Blaze billing plan, run
   `firebase functions:secrets:set SENDGRID_API_KEY --project reloop-f31e7`.
   Enter the key in the interactive terminal prompt.
5. Create the ignored file `functions/.env.reloop-f31e7` containing
   `SENDGRID_FROM_EMAIL=your-verified-sender@example.com` (use your real sender).
6. Deploy with `firebase deploy --only functions:reloop --project reloop-f31e7`.
   Do not enable billing automatically. Review any deployment prompts/costs.
7. After deployment succeeds, set `VITE_EMAIL_ENABLED=true` in `.env.local`,
   rebuild and deploy Hosting. Until then sending remains explicitly disabled.

## Verify real delivery

Send a message to an inbox you control with a small PDF or TXT attachment.
Verify the inbox/spam folder, content and readable attachment, and check the
SendGrid activity log. API acceptance means queued for delivery, not guaranteed
receipt. Mock tests do not count as a real delivery demonstration.

Each message has a request ID. A transaction reserves it before sending;
duplicate requests do not send another copy. Uncertain requests require checking
the inbox before starting a new message. At most one attempt per admin per minute
is allowed. Provider credentials stay in Secret Manager, and Firestore records
contain only status/timing, not recipient/message/attachments. Browser rules deny
access to mailRequests/mailLimits; Admin SDK uses trusted server access.

References:
- https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send
- https://firebase.google.com/docs/functions/callable
- https://firebase.google.com/docs/functions/config-env
