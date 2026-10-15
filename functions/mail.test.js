import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { validateMail, deliverMail, MAX_ATTACHMENT_BYTES } from "./mail.js";
const base = { to: "reader@example.com", subject: "Recycling plan", message: "Repair before recycling.", requestId: "12345678-1234-1234-1234-123456789abc" };
const attachment = (filename, text) => ({ filename, content: Buffer.from(text).toString("base64") });

test("reject header injection, missing body and multiple recipients", () => {
  for (const change of [{ to: "a@example.com,b@example.com" }, { to: "a@example.com\r\nBcc:x@y.com" }, { subject: "test\nBcc" }, { message: " " }, { requestId: "bad" }]) {
    assert.throws(() => validateMail({ ...base, ...change }), { code: "invalid-argument" });
  }
});
test("accept text and PDF attachments, reject unsafe and oversized files", () => {
  assert.equal(validateMail({ ...base, attachment: attachment("plan.txt", "Reuse") }).attachment.type, "text/plain");
  assert.equal(validateMail({ ...base, attachment: attachment("plan.pdf", "%PDF-1.4\n") }).attachment.type, "application/pdf");
  for (const file of [attachment("fake.pdf", "not pdf"), attachment("../plan.txt", "test"), attachment("run.exe", "test"), attachment("empty.txt", ""), attachment("binary.txt", "a\0b"), { filename: "plan.txt", content: "!not-base64!" }, attachment("large.txt", "x".repeat(MAX_ATTACHMENT_BYTES + 1))]) {
    assert.throws(() => validateMail({ ...base, attachment: file }), { code: "invalid-argument" });
  }
});
test("SendGrid request includes the attachment and only 202 counts as accepted", async () => {
  const mail = validateMail({ ...base, attachment: attachment("plan.csv", "item,condition\nphone,broken") });
  const result = await deliverMail(mail, "test-key", "sender@example.com", async (url, options) => {
    assert.equal(url, "https://api.sendgrid.com/v3/mail/send");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    const payload = JSON.parse(options.body);
    assert.equal(payload.personalizations[0].to[0].email, base.to);
    assert.equal(payload.attachments[0].filename, "plan.csv");
    assert.equal(payload.attachments[0].content, mail.attachment.content);
    return { status: 202 };
  });
  assert.equal(result.accepted, true);
  for (const status of [200, 400, 401, 429, 500]) await assert.rejects(deliverMail(mail, "test-key", "sender@example.com", async () => ({ status })), { code: "unavailable" });
});
test("missing configuration and network timeout never report success", async () => {
  await assert.rejects(deliverMail(base, "", "sender@example.com"), { code: "failed-precondition" });
  await assert.rejects(deliverMail(base, "key", "sender@example.com", async () => { throw new Error("timeout"); }), /uncertain/);
});
test("callable rejects anonymous and non-admin requests before touching the database", async () => {
  const { sendEmail } = await import("./index.js");
  await assert.rejects(sendEmail.run({ data: base }), { code: "unauthenticated" });
  await assert.rejects(sendEmail.run({ data: base, auth: { uid: "ordinary-user", token: {} } }), { code: "permission-denied" });
});
