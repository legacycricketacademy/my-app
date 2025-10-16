import { db } from './db/index.js';
import { users } from './shared/schema.js';

async function checkUsers() {
  try {
    const allUsers = await db.query.users.findMany();
    console.log('Users in database:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - ${user.email}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
