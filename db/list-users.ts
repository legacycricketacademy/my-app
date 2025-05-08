import { db } from './index';
import { users } from '../shared/schema';

async function listUsers() {
  try {
    // Get all users
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.role), asc(users.id)]
    });

    console.log(`Found ${allUsers.length} users:`);
    
    // Group by role
    const usersByRole: Record<string, typeof allUsers> = {};
    allUsers.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });
    
    // Display users by role
    Object.entries(usersByRole).forEach(([role, users]) => {
      console.log(`\n${role.toUpperCase()} (${users.length}):`);
      users.forEach(user => {
        console.log(`- ${user.username}, ID: ${user.id}, Name: ${user.fullName}, Email: ${user.email}`);
      });
    });
    
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

// Run the function
listUsers()
  .then(() => {
    console.log('\nScript completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });