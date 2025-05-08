import { db } from './index';
import { users } from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminAccount() {
  try {
    // Define admin details
    const username = 'admin123';
    const password = 'admin123';
    const email = 'admin123@example.com';
    const fullName = 'Test Admin';
    
    // Check if username already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username)
    });
    
    if (existingUser) {
      console.log(`User ${username} already exists with ID: ${existingUser.id}`);
      console.log(`To log in, use: username: ${username}, password: ${password}`);
      return;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the admin account
    const [newAdmin] = await db.insert(users).values({
      username,
      password: hashedPassword,
      email,
      fullName,
      role: 'admin',
      status: 'active',
      isActive: true,
      isEmailVerified: true
    }).returning();
    
    console.log(`Admin account created successfully with ID: ${newAdmin.id}`);
    console.log(`To log in, use: username: ${username}, password: ${password}`);
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
}

// Run the function
createAdminAccount()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });