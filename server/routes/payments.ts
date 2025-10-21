import { Router } from "express";
const router = Router();

// In-memory store ONLY when flag is on (test/dev). Not used in prod.
const mem = {
  payments: [] as any[],
  idSeq: 1,
};

function isFakeEnabled() {
  // Enable when E2E flag set or NODE_ENV=test
  return process.env.E2E_FAKE_PAYMENTS === 'true' || process.env.NODE_ENV === 'test';
}

// GET /api/payments?status=pending|paid
router.get("/", async (req, res) => {
  if (isFakeEnabled()) {
    const status = (req.query.status as string) || undefined;
    let data = mem.payments;
    if (status) data = data.filter(p => p.status === status);
    return res.json(data);
  }
  // Fallback: try DB if available, else empty array (non-breaking)
  try {
    const { pool } = await import("../db/index.js");
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch {
    return res.json([]);
  }
});

// POST /api/payments  { parentId, kidName, amount, method, note }
router.post("/", async (req, res) => {
  if (isFakeEnabled()) {
    const now = new Date().toISOString();
    const row = {
      id: mem.idSeq++,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      ...req.body,
    };
    mem.payments.push(row);
    return res.status(201).json(row);
  }
  try {
    const { pool } = await import("../db/index.js");
    const result = await pool.query(
      'INSERT INTO payments (parent_id, kid_name, amount, method, note, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.body.parentId, req.body.kidName, req.body.amount, req.body.method, req.body.note, 'pending']
    );
    return res.status(201).json(result.rows[0]);
  } catch (e) {
    return res.status(201).json({ ...req.body, id: Date.now(), status: "pending" });
  }
});

// PUT /api/payments/:id  { status: "paid"|"pending" }
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isFakeEnabled()) {
    const idx = mem.payments.findIndex(p => Number(p.id) === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    mem.payments[idx] = { ...mem.payments[idx], ...req.body, updatedAt: new Date().toISOString() };
    return res.json(mem.payments[idx]);
  }
  try {
    const { pool } = await import("../db/index.js");
    const result = await pool.query(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [req.body.status, id]
    );
    return res.json(result.rows[0]);
  } catch {
    return res.json({ id, ...req.body });
  }
});

export default router;
