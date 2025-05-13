import { pool } from "./index";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { db } from "./index";

/**
 * Script to clear users with usernames starting with "coachcoach"
 */
async function clearCoachCoachUsers() {
  console.log("Starting to clear users with username prefix 'coachcoach'");
  
  try {
    // First let's find the users that will be affected to confirm
    const usersToDelete = await db.query.users.findMany({
      where: (users, { like }) => like(users.username, 'coachcoach%')
    });
    
    console.log(`Found ${usersToDelete.length} users with username starting with 'coachcoach':`);
    
    // Show the users that will be deleted
    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, ID: ${user.id}`);
    });
    
    if (usersToDelete.length === 0) {
      console.log("No users found with username prefix 'coachcoach'. Nothing to delete.");
      return;
    }
    
    // Confirmation message before deletion
    console.log("\n⚠️ ABOUT TO DELETE THE ABOVE USERS ⚠️");
    console.log("This action cannot be undone.");
    
    // Delete the users using a SQL query for users with username LIKE 'coachcoach%'
    // We need to use a raw SQL query here since Drizzle doesn't directly support LIKE in delete
    const query = `
      DELETE FROM users 
      WHERE username LIKE 'coachcoach%'
      RETURNING id, username, email
    `;
    
    const result = await pool.query(query);
    
    // PostgreSQL client returns rows in result.rows
    const deletedUsers = result.rows || [];
    
    console.log(`Successfully deleted ${deletedUsers.length} users with username prefix 'coachcoach':`);
    deletedUsers.forEach((user, index) => {
      console.log(`${index + 1}. Deleted user: ${user.username} (${user.email}), ID: ${user.id}`);
    });
  } catch (error) {
    console.error("Error clearing users:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
clearCoachCoachUsers().catch(console.error);