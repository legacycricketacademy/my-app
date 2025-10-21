let sg: any = null;
try { sg = require('@sendgrid/mail'); } catch {}
const ENABLED = process.env.EMAIL_NOTIFICATIONS === 'true' && !!process.env.SENDGRID_API_KEY;

const mailbox: Array<{to: string|string[]; subject: string; text: string; html?: string}> = [];
export function _mailbox() { return mailbox; }
export function _mailboxClear() { mailbox.length = 0; }

export async function sendEmail(to: string|string[], subject: string, text: string, html?: string) {
  if (!ENABLED || !sg) {
    mailbox.push({ to, subject, text, html });
    console.log("[email:mailbox]", { to, subject });
    return { ok: true, noop: true };
  }
  sg.setApiKey(process.env.SENDGRID_API_KEY as string);
  const from = process.env.FROM_EMAIL || "no-reply@legacycricketacademy.com";
  const msg = { to, from, subject, text, html: html || `<p>${text}</p>` };
  await sg.send(msg as any);
  console.log("[email:sent]", { to, subject });
  return { ok: true };
}
