import { Router } from "express";
import { sendEmail } from "../utils/email.js";
const router = Router();

router.post("/", async (req, res) => {
  const { parentName, email, phone, childName, ageGroup, notes } = req.body || {};
  const record = { parentName, email, phone, childName, ageGroup, notes, createdAt: new Date().toISOString() };

  // Try DB; if schema unknown, just continue (non-blocking)
  try {
    const { db } = await import("../../db/index.js");
    const { registrations } = await import("../../shared/schema.js");
    // @ts-ignore
    if (registrations) await db.insert(registrations).values(record);
  } catch { /* swallow for now */ }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || "";
  const coachList = (process.env.COACH_EMAILS || "").split(",").map(s=>s.trim()).filter(Boolean);

  // 1) Welcome email to parent
  if (email) {
    const welcomeText = `Welcome to Legacy Cricket Academy, ${parentName || 'Parent'}!

Thank you for registering${childName ? ` ${childName}` : ''} with us${ageGroup ? ` for the ${ageGroup} age group` : ''}.

We're excited to have you join our cricket family. We'll contact you shortly with next steps.

Best regards,
Legacy Cricket Academy Team`;

    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to Legacy Cricket Academy!</h2>
        <p>Hi ${parentName || 'Parent'},</p>
        <p>Thank you for registering${childName ? ` <strong>${childName}</strong>` : ''} with us${ageGroup ? ` for the <strong>${ageGroup}</strong> age group` : ''}.</p>
        <p>We're excited to have you join our cricket family. We'll contact you shortly with next steps.</p>
        <p>Best regards,<br/>Legacy Cricket Academy Team</p>
      </div>
    `;

    await sendEmail(
      email,
      "Welcome to Legacy Cricket Academy",
      welcomeText,
      welcomeHtml,
      "registration_welcome"
    );
  }

  // 2) Admin alert
  if (adminEmail) {
    await sendEmail(
      adminEmail,
      "Legacy: New Registration",
      `New registration received:\n\nParent: ${parentName} (${email})\nChild: ${childName} (${ageGroup})\nPhone: ${phone}\nNotes: ${notes || '-'}`,
      undefined,
      "admin_notification"
    );
  }

  // 3) Coaches broadcast
  if (coachList.length) {
    await sendEmail(
      coachList,
      "Legacy: New Registration",
      `New registration:\n\nChild: ${childName} (${ageGroup})\nParent: ${parentName}\nCheck dashboard for details.`,
      undefined,
      "coach_notification"
    );
  }

  return res.status(201).json({ ok: true });
});

export default router;
