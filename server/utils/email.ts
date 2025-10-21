let sg: any = null;
try { sg = require('@sendgrid/mail'); } catch {}
const ENABLED = process.env.EMAIL_NOTIFICATIONS === 'true' && process.env.SENDGRID_API_KEY;

export async function sendEmail(to: string|string[], subject: string, text: string, html?: string) {
  if (!ENABLED || !sg) { 
    console.log("[email:noop]", { to, subject }); 
    return { ok: true, noop: true };
  }
  sg.setApiKey(process.env.SENDGRID_API_KEY as string);
  const from = process.env.FROM_EMAIL || "no-reply@legacycricketacademy.com";
  const msg = { to, from, subject, text, html: html || `<p>${text}</p>` };
  await sg.send(msg as any);
  return { ok: true };
}
