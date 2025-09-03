import fs from 'fs';

// Read the auth file
const authContent = fs.readFileSync('server/auth.ts', 'utf8');

// Replace the problematic getUserById call with a direct database query
const fixedContent = authContent.replace(
  /const users = await storage\.db\.select\(\)\.from\(schema\.users\)\.where\(eq\(schema\.users\.id, req\.session\.userId\)\); const user = users\[0\] \|\| null;/,
  `// Direct database query to get user by ID
        const result = await storage.db.query(\`
          SELECT * FROM users WHERE id = $1 AND academy_id = $2
        \`, [req.session.userId, 1]);
        const user = result.rows[0] || null;`
);

// Write the fixed content back
fs.writeFileSync('server/auth.ts', fixedContent);
console.log('Fixed /api/user endpoint with direct database query');
