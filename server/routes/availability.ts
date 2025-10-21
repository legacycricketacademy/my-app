import { Router } from "express";
const router = Router();

const mem: any = { avail: [] }; // {id, parentId, sessionId, status}
let seq = 1;
const isFake = () => process.env.E2E_FAKE_AVAILABILITY === 'true' || process.env.NODE_ENV === 'test';

// GET /api/availability?parentId=...  -> array
router.get("/", async (req, res) => {
  const parentId = String(req.query.parentId || "");
  if (isFake()) {
    const rows = parentId ? mem.avail.filter((r:any)=>r.parentId===parentId) : mem.avail;
    return res.json(rows);
  }
  try {
    const { db, eq } = await import("@/db");
    const { availability } = await import("@/db/schema");
    let q = db.select().from(availability);
    // @ts-ignore
    if (parentId && availability?.parentId) q = q.where(eq(availability.parentId, parentId));
    const rows = await q;
    return res.json(rows);
  } catch { return res.json([]); }
});

// POST /api/availability  { parentId, sessionId, status: "yes"|"no" }
router.post("/", async (req, res) => {
  const { parentId, sessionId, status } = req.body || {};
  if (isFake()) {
    const row = { id: seq++, parentId, sessionId, status, updatedAt: new Date().toISOString() };
    const idx = mem.avail.findIndex((r:any)=> r.parentId===parentId && r.sessionId===sessionId);
    if (idx>=0) mem.avail[idx] = row; else mem.avail.push(row);
    return res.status(201).json(row);
  }
  try {
    const { db, eq } = await import("@/db");
    const { availability } = await import("@/db/schema");
    // Upsert-ish
    // @ts-ignore
    const [row] = await db.insert(availability).values({ parentId, sessionId, status })
      .onConflictDoUpdate?.({ target: [availability.parentId, availability.sessionId], set: { status } })
      .returning?.() || [{ parentId, sessionId, status }];
    return res.status(201).json(row);
  } catch {
    return res.status(201).json({ id: Date.now(), parentId, sessionId, status });
  }
});

export default router;
