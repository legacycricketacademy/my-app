const Database = require('better-sqlite3');
const db = new Database('./dev.db');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT, email TEXT, fullName TEXT,
  role TEXT, status TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
DELETE FROM users WHERE role='coach';
INSERT INTO users (username,email,fullName,role,status) VALUES
 ('coach_jane','jane@academy.test','Jane Coach','coach','pending'),
 ('coach_aryan','aryan@academy.test','Aryan Coach','coach','pending'),
 ('coach_approved','ok@academy.test','Approved Coach','coach','approved');
`);
console.log('Seeded dev.db');
