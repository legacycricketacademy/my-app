import { Router } from "express";
import { _mailbox, _mailboxClear } from "@/utils/email";
import { flags } from "@/utils/flags";
const r = Router();
r.use((req,res,next)=> flags.testMailbox ? next() : res.status(404).end());
r.get("/", (_req,res)=> res.json({ messages: _mailbox() }));
r.post("/clear", (_req,res)=> { _mailboxClear(); res.json({ ok:true }); });
export default r;
