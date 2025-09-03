import fs from 'fs';

// Read the auth file
const authContent = fs.readFileSync('server/auth.ts', 'utf8');

// Replace the hardcoded user lookup with proper session-based lookup
const fixedContent = authContent.replace(
  /const user = await storage\.getUserByUsername\("parent1"\); \/\/ Temporary fix for demo/,
  `// Get user by session ID - proper implementation
        const users = await storage.db.select()
          .from(schema.users)
          .where(eq(schema.users.id, req.session.userId));
        const user = users[0] || null;`
);

// Write the fixed content back
fs.writeFileSync('server/auth.ts', fixedContent);
console.log('Fixed /api/user endpoint to use proper session-based user lookup');
