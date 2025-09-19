import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable compression
app.use(compression());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-local-admin');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// Import and mount existing API routes
import('./dist/index.js').then(({ default: serverModule }) => {
  // The existing server exports its routes, we'll mount them under /api
  console.log('API routes loaded from existing server');
}).catch(err => {
  console.log('Note: Could not load existing API routes:', err.message);
});

// Serve static files from the React build
const buildPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(buildPath, {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true
}));

// API routes (these should be mounted before the catch-all)
// Health check
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Import existing API routes from the built server
import Database from 'better-sqlite3';

// DEV-ONLY admin bypass
app.use((req, res, next) => {
  const devBypass = process.env.LOCAL_ADMIN_BYPASS === 'true';
  if (devBypass && req.headers['x-local-admin'] === '1') {
    req.user = { id: 0, role: 'admin' };
    req.isAuthenticated = () => true;
  }
  next();
});

// ✅ Pending coaches
app.get('/api/coaches/pending', async (req, res) => {
  try {
    const db = new Database('./production.db');
    const rows = db
      .prepare(
        "SELECT id, username, email, fullName, status, createdAt FROM users WHERE role='coach' AND status='pending' ORDER BY datetime(createdAt) DESC"
      )
      .all();
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching pending coaches:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending coaches',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ✅ Approved coaches
app.get('/api/coaches/approved', (req, res) => {
  try {
    const db = new Database('./production.db');
    const rows = db
      .prepare(
        "SELECT id, username, email, fullName, status, createdAt FROM users WHERE role='coach' AND status='approved' ORDER BY datetime(createdAt) DESC"
      )
      .all();
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching approved coaches:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch approved coaches',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ✅ Unified list endpoint
app.get('/api/coaches', (req, res) => {
  try {
    const db = new Database('./production.db');

    const status = String(req.query.status || '').toLowerCase();
    const search = String(req.query.search || '').trim();
    const limit = Math.max(0, Math.min(100, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));

    const validStatuses = new Set(['pending', 'approved', 'rejected']);
    const where = ["role='coach'"];
    const params = [];

    if (validStatuses.has(status)) {
      where.push('status=?');
      params.push(status);
    }

    if (search) {
      where.push('(username LIKE ? OR fullName LIKE ? OR email LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT id, username, email, fullName, status, createdAt
      FROM users
      ${whereSql}
      ORDER BY datetime(createdAt) DESC
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(*) as total
      FROM users
      ${whereSql}
    `;

    const rows = db.prepare(sql).all(...params, limit, offset);
    const total = db.prepare(countSql).get(...params).total;

    return res.status(200).json({
      items: rows,
      total,
      limit,
      offset,
      nextOffset: offset + rows.length < total ? offset + rows.length : null,
    });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coaches',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ✅ Approve / Reject endpoints
app.post('/api/coaches/:id/approve', (req, res) => {
  try {
    const coachId = Number(req.params.id);
    const db = new Database('./production.db');
    const result = db
      .prepare("UPDATE users SET status='approved' WHERE id=?")
      .run(coachId);
    return res.json({
      success: true,
      message: `Coach ${coachId} approved successfully`,
      updated: result.changes,
    });
  } catch (error) {
    console.error('Error approving coach:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve coach.' });
  }
});

app.post('/api/coaches/:id/reject', (req, res) => {
  try {
    const coachId = Number(req.params.id);
    const db = new Database('./production.db');
    const result = db
      .prepare("UPDATE users SET status='rejected' WHERE id=?")
      .run(coachId);
    return res.json({
      success: true,
      message: `Coach ${coachId} rejected successfully`,
      updated: result.changes,
    });
  } catch (error) {
    console.error('Error rejecting coach:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject coach.' });
  }
});

// Payment scheduling endpoint
app.post('/api/payments/schedule', (req, res) => {
  console.log('Payment scheduled:', req.body);
  res.json({ ok: true, message: 'Payment scheduled successfully' });
});

// SPA catch-all route - MUST be last
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ 
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🏏 Cricket Academy server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving React build from: ${buildPath}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
