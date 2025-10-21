import { flags } from "./flags";
let sg: any = null;
try { sg = require('@sendgrid/mail'); } catch {}
const mailbox: Array<{to: string|string[], subject: string, text: string, html?: string}> = [];
export const _mailbox = () => mailbox;
export const _mailboxClear = () => { mailbox.length = 0; };
export async function sendEmail(to: string|string[], subject: string, text: string, html?: string) {
  if (!flags.emailEnabled || !sg) { mailbox.push({ to, subject, text, html }); return { ok:true, noop:true }; }
  sg.setApiKey(process.env.SENDGRID_API_KEY as string);
  const from = process.env.FROM_EMAIL || "no-reply@legacycricketacademy.com";
  await sg.send({ to, from, subject, text, html: html || `<p>${text}</p>` } as any);
  return { ok:true };
}
