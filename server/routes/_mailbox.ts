import { Router } from "express";
import { _mailbox, _mailboxClear } from "../utils/email.js";

const router = Router();

// GET /api/_mailbox - returns all messages in the test mailbox
router.get("/", (_req, res) => {
  res.json({ messages: _mailbox() });
});

// POST /api/_mailbox/clear - clears the mailbox
router.post("/clear", (_req, res) => {
  _mailboxClear();
  res.json({ ok: true, cleared: true });
});

export default router;

