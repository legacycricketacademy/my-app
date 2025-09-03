import fs from 'fs';

// Read the auth file
const authContent = fs.readFileSync('server/auth.ts', 'utf8');

// Replace the problematic database query with a working implementation
const fixedContent = authContent.replace(
  /\/\/ Direct database query to get user by ID[\s\S]*?const user = result\.rows\[0\] \|\| null;/,
  `// Get user by ID using existing getUserByUsername as template
        const users = await storage.db.select()
          .from(schema.users)
          .where(eq(schema.users.id, req.session.userId));
        const user = users[0] || null;`
);

// Write the fixed content back
fs.writeFileSync('server/auth.ts', fixedContent);
console.log('Fixed /api/user endpoint with proper database query');
