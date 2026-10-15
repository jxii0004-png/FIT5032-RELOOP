import { Buffer } from "node:buffer";
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export class MailError extends Error {
  constructor(code, message, options) { super(message, options); this.code = code; }
}
const invalid = (message) => { throw new MailError("invalid-argument", message); };
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export function validateMail(data) {
  if (!data || typeof data !== "object") invalid("Enter the email details.");
  const { to, subject, message, attachment, requestId } = data;
  if (typeof to !== "string" || to.length > 254 || !emailPattern.test(to.trim()) || /[\r\n]/.test(to)) invalid("Enter one valid recipient email.");
  if (typeof subject !== "string" || !subject.trim() || subject.length > 150 || /[\r\n]/.test(subject)) invalid("Enter a subject of 1–150 characters.");
  if (typeof message !== "string" || !message.trim() || message.length > 10000) invalid("Enter a message of 1–10,000 characters.");
  if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/.test(requestId)) invalid("Invalid send request. Reload and try again.");
  const mail = { to: to.trim(), subject: subject.trim(), message: message.trim(), requestId };
  if (attachment != null) {
    const types = { pdf: "application/pdf", txt: "text/plain", csv: "text/csv", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
    if (typeof attachment.filename !== "string" || !/^[^\x00-\x1f\x7f/\\]{1,100}$/.test(attachment.filename)) invalid("Invalid attachment filename.");
    const ext = attachment.filename.split(".").pop().toLowerCase();
    if (!types[ext]) invalid("Use a PDF, TXT, CSV, PNG or JPG attachment.");
    if (typeof attachment.content !== "string" || attachment.content.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(attachment.content)) invalid("Invalid attachment data.");
    const bytes = Buffer.from(attachment.content, "base64");
    if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES) invalid("Attachment must be non-empty and at most 2 MB.");
    if (ext === "pdf" && bytes.subarray(0, 5).toString() !== "%PDF-") invalid("The file is not a PDF attachment.");
    if (ext === "png" && !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) invalid("The file is not a PNG attachment.");
    if (["jpg", "jpeg"].includes(ext) && !(bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)) invalid("The file is not a JPG attachment.");
    if (["txt", "csv"].includes(ext) && bytes.includes(0)) invalid("Use a text file without binary content.");
    mail.attachment = { filename: attachment.filename, type: types[ext], content: bytes.toString("base64"), disposition: "attachment" };
  }
  return mail;
}
export async function deliverMail(mail, apiKey, from, fetcher = fetch) {
  if (!apiKey || !emailPattern.test(from || "")) throw new MailError("failed-precondition", "Email sending is not configured yet. Please contact the administrator.");
  let response;
  try {
    response = await fetcher("https://api.sendgrid.com/v3/mail/send", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personalizations: [{ to: [{ email: mail.to }] }], from: { email: from, name: "RELOOP" }, subject: mail.subject, content: [{ type: "text/plain", value: mail.message }], ...(mail.attachment ? { attachments: [mail.attachment] } : {}) }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (cause) { throw new MailError("unavailable", "Delivery status is uncertain. Check your inbox before sending again.", { cause }); }
  if (response.status !== 202) throw new MailError("unavailable", "The email service did not accept this message. Please contact the administrator or try later.");
  return { accepted: true };
}
