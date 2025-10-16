import Database from 'better-sqlite3';

const db = new Database('./dev.db');

// Create academies table
db.exec(`
  CREATE TABLE IF NOT EXISTS academies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1e40af',
    secondary_color TEXT DEFAULT '#60a5fa',
    stripe_account_id TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    max_players INTEGER DEFAULT 200,
    max_coaches INTEGER DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academy_id INTEGER REFERENCES academies(id),
    firebase_uid TEXT UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'parent',
    status TEXT DEFAULT 'pending_verification',
    is_active INTEGER DEFAULT 1,
    is_email_verified INTEGER DEFAULT 0,
    email_verification_token TEXT,
    email_verification_expires TEXT,
    email_status TEXT DEFAULT 'pending',
    email_failure_reason TEXT,
    last_email_attempt TEXT,
    phone TEXT UNIQUE,
    address TEXT,
    profile_image TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    last_sign_in_at TEXT,
    last_sign_in_ip TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create players table
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    parent_id INTEGER REFERENCES users(id),
    academy_id INTEGER REFERENCES academies(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create sessions table
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration TEXT NOT NULL,
    location TEXT NOT NULL,
    coach_id INTEGER REFERENCES users(id),
    academy_id INTEGER REFERENCES academies(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create payments table
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    parent_id INTEGER REFERENCES users(id),
    session_id INTEGER REFERENCES sessions(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create user_audit_logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("Database tables created successfully!");
db.close();
