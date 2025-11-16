import { flags } from "./flags";
import { sendEmail as sendEmailMain, type SandboxEmail } from "../email.js";

let sg: any = null;
try { sg = require('@sendgrid/mail'); } catch {}
const mailbox: Array<{to: string|string[], subject: string, text: string, html?: string}> = [];
export const _mailbox = () => mailbox;
export const _mailboxClear = () => { mailbox.length = 0; };

const EMAIL_SANDBOX_ENABLED = process.env.EMAIL_SANDBOX === 'true';

export async function sendEmail(to: string|string[], subject: string, text: string, html?: string, type?: string) {
  // If EMAIL_SANDBOX is enabled, use the main email service which handles sandbox
  if (EMAIL_SANDBOX_ENABLED) {
    const toStr = Array.isArray(to) ? to[0] : to; // Use first email if array
    return sendEmailMain({
      to: toStr,
      subject,
      text,
      html: html || `<p>${text}</p>`,
      type: type || 'unknown'
    });
  }
  
  // Original behavior for non-sandbox mode
  if (!flags.emailEnabled || !sg) { mailbox.push({ to, subject, text, html }); return { ok:true, noop:true }; }
  sg.setApiKey(process.env.SENDGRID_API_KEY as string);
  const from = process.env.FROM_EMAIL || "no-reply@legacycricketacademy.com";
  await sg.send({ to, from, subject, text, html: html || `<p>${text}</p>` } as any);
  return { ok:true };
}
