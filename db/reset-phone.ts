import { pool } from "./index";

async function resetPhoneNumbers() {
  try {
    console.log('Setting all phone values to null to avoid unique constraint issues...');
    
    // Update all users to set phone to null
    const result = await pool.query('UPDATE users SET phone = NULL WHERE phone IS NOT NULL');
    
    console.log(`Reset ${result.rowCount} users' phone numbers to null`);
    console.log('Done. Now you can run npm run db:push safely.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

resetPhoneNumbers();