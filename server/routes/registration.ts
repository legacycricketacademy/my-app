import { Router } from "express";
import crypto from "crypto";
import { sendEmail } from "../utils/email";
import { flags } from "../utils/flags";

type Rec = {
  id: number; parentName: string; email: string; phone?: string;
  childName?: string; ageGroup?: string; role: "parent"|"coach";
  status: "pending_email"|"pending_admin"|"active"|"rejected";
  emailToken?: string; adminToken?: string; createdAt: string;
};
const mem = { regs: [] as Rec[], seq: 1 };

function newToken(){ return crypto.randomBytes(16).toString("hex"); }

const router = Router();

/** Create registration */
router.post("/", async (req,res)=>{
  const { parentName, email, phone, childName, ageGroup, role } = req.body || {};
  if(!email || !parentName || !role) return res.status(400).json({ error:"missing fields" });
  const id = mem.seq++;
  const emailToken = newToken();
  const adminToken = newToken();
  const needAdmin = role === "coach" || flags.requireAdminForParents;
  const rec: Rec = { id, parentName, email, phone, childName, ageGroup, role,
    status: "pending_email", emailToken, adminToken, createdAt: new Date().toISOString() };
  mem.regs.push(rec);

  const base = process.env.PUBLIC_BASE_URL || "";
  const verifyLink = `${base}/api/registration/verify?token=${emailToken}`;
  const approveLink = `${base}/api/registration/${id}/approve?token=${adminToken}`;
  const denyLink = `${base}/api/registration/${id}/deny?token=${adminToken}`;

  // Parent verify email
  await sendEmail(email, "Legacy: Verify your email",
    `Hi ${parentName}, please verify your email: ${verifyLink}`,
    `<p>Hi ${parentName},</p><p>Please verify your email:</p><p><a href="${verifyLink}">Verify Email</a></p>`);

  // Admin alert
  const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || "";
  const coachList = (process.env.COACH_EMAILS || "").split(",").map(s=>s.trim()).filter(Boolean);
  const summary = `New ${role} registration\nParent: ${parentName} (${email})\nChild: ${childName||"-"} (${ageGroup||"-"})`;
  if (adminEmail) {
    await sendEmail(adminEmail, `Legacy: New ${role} registration`,
      `${summary}\nApprove: ${approveLink}\nDeny: ${denyLink}`,
      `<h3>${summary.replace(/\n/g,"<br/>")}</h3><p><a href="${approveLink}">Approve</a> | <a href="${denyLink}">Deny</a></p>`);
  }
  if (coachList.length) {
    await sendEmail(coachList, "Legacy: New registration submitted", summary);
  }

  res.status(201).json({ ok:true, id });
});

/** Email verify */
router.get("/verify", (req,res)=>{
  const { token } = req.query as any;
  const rec = mem.regs.find(r=> r.emailToken===token);
  if(!rec) return res.status(400).send("Invalid token");
  if (rec.role==="coach" || flags.requireAdminForParents) {
    rec.status = "pending_admin"; // needs admin after verify
  } else {
    rec.status = "active";
  }
  return res.send(rec.status === "active" ? "Email verified! Your account is active." : "Email verified! Waiting for admin approval.");
});

/** Admin approve/deny */
router.get("/:id/approve", (req,res)=>{
  const id = Number(req.params.id); const { token } = req.query as any;
  const rec = mem.regs.find(r=> r.id===id && r.adminToken===token);
  if(!rec) return res.status(400).send("Invalid token");
  rec.status = "active";
  res.send("Approved. User is now active.");
});
router.get("/:id/deny", (req,res)=>{
  const id = Number(req.params.id); const { token } = req.query as any;
  const rec = mem.regs.find(r=> r.id===id && r.adminToken===token);
  if(!rec) return res.status(400).send("Invalid token");
  rec.status = "rejected";
  res.send("Denied. Registration rejected.");
});

/** Health/debug (tests) */
router.get("/", (_req,res)=> res.json(mem.regs));

export default router;
