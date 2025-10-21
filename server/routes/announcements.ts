import { Router } from "express";
import { sendEmail } from "../utils/email";
const router = Router();
const isEnabled = () => process.env.EMAIL_NOTIFICATIONS === 'true';

router.post("/", async (req, res) => {
  const { title, body, recipients } = req.body || {};
  if (isEnabled() && Array.isArray(recipients) && recipients.length) {
    await sendEmail(recipients, `[Legacy] ${title}`, body, `<h2>${title}</h2><p>${body}</p>`);
  } else {
    console.log("[announcement:noop]", { title });
  }
  return res.status(201).json({ ok: true });
});

export default router;
