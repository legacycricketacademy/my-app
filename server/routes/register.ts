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

  // 1) Parent confirmation
  if (email) {
    await sendEmail(
      email,
      "Legacy: Registration Received",
      `Hi ${parentName || 'Parent'},\n\nWe received your registration for ${childName}. We'll contact you shortly.\n\n- Legacy Cricket Academy`
    );
  }

  // 2) Admin alert
  if (adminEmail) {
    await sendEmail(
      adminEmail,
      "Legacy: New Registration",
      `New registration received:\n\nParent: ${parentName} (${email})\nChild: ${childName} (${ageGroup})\nPhone: ${phone}\nNotes: ${notes || '-'}`
    );
  }

  // 3) Coaches broadcast
  if (coachList.length) {
    await sendEmail(
      coachList,
      "Legacy: New Registration",
      `New registration:\n\nChild: ${childName} (${ageGroup})\nParent: ${parentName}\nCheck dashboard for details.`
    );
  }

  return res.status(201).json({ ok: true });
});

export default router;
