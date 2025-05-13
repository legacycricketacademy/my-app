import { pool } from "./index";
import { users } from "../shared/schema";
import { db } from "./index";

/**
 * Script to clear users by email domain
 * Usage: npm tsx db/clear-by-email.ts gmail.com
 * Or: npm tsx db/clear-by-email.ts yahoo
 */
async function clearUsersByEmail(emailPattern: string) {
  if (!emailPattern) {
    console.error("Please provide an email pattern to match");
    console.log("Usage example: npx tsx db/clear-by-email.ts gmail.com");
    console.log("This will delete all users with emails ending in gmail.com");
    return;
  }

  console.log(`Starting to clear users with email containing '${emailPattern}'`);
  
  try {
    // First let's find the users that will be affected to confirm
    const usersToDelete = await db.query.users.findMany({
      where: (users, { like }) => like(users.email, `%${emailPattern}%`)
    });
    
    console.log(`Found ${usersToDelete.length} users with email containing '${emailPattern}':`);
    
    // Show the users that will be deleted
    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, ID: ${user.id}`);
    });
    
    if (usersToDelete.length === 0) {
      console.log(`No users found with email containing '${emailPattern}'. Nothing to delete.`);
      return;
    }
    
    // Confirmation message before deletion
    console.log("\n⚠️ ABOUT TO DELETE THE ABOVE USERS ⚠️");
    console.log("This action cannot be undone.");
    
    // Use sanitized input for the query to prevent SQL injection
    const sanitizedPattern = emailPattern.replace(/'/g, "''");
    
    // First get the IDs of players associated with these users
    const playerIdsQuery = `
      SELECT id FROM players
      WHERE parent_id IN (
        SELECT id FROM users WHERE email LIKE '%${sanitizedPattern}%'
      );
    `;
    
    const playerIdsResult = await pool.query(playerIdsQuery);
    const playerIds = playerIdsResult.rows || [];
    
    if (playerIds.length > 0) {
      console.log(`Found ${playerIds.length} related player records that need to be cleaned up.`);
      
      // First delete records from the payments table that reference these players
      console.log("Deleting related payment records...");
      const paymentQuery = `
        DELETE FROM payments
        WHERE player_id IN (
          SELECT id FROM players
          WHERE parent_id IN (
            SELECT id FROM users WHERE email LIKE '%${sanitizedPattern}%'
          )
        )
        RETURNING id;
      `;
      
      const paymentResult = await pool.query(paymentQuery);
      const deletedPayments = paymentResult.rows || [];
      
      if (deletedPayments.length > 0) {
        console.log(`Deleted ${deletedPayments.length} related payment records.`);
      } else {
        console.log("No related payment records found.");
      }
      
      // Now we can delete the player records
      console.log("Deleting player records...");
      const playerQuery = `
        DELETE FROM players
        WHERE parent_id IN (
          SELECT id FROM users WHERE email LIKE '%${sanitizedPattern}%'
        )
        RETURNING id, parent_id;
      `;
      
      const playerResult = await pool.query(playerQuery);
      const deletedPlayers = playerResult.rows || [];
      
      if (deletedPlayers.length > 0) {
        console.log(`Deleted ${deletedPlayers.length} related player records.`);
      } else {
        console.log("No related player records were deleted.");
      }
    } else {
      console.log("No related player records found.");
    }
    
    // Now delete the users (except admin users to protect against accidental deletion)
    console.log("Proceeding to delete user accounts (excluding admins)...");
    const query = `
      DELETE FROM users 
      WHERE email LIKE '%${sanitizedPattern}%'
      AND role != 'admin'  -- Protect admin accounts
      RETURNING id, username, email, role
    `;
    
    const result = await pool.query(query);
    
    // PostgreSQL client returns rows in result.rows
    const deletedUsers = result.rows || [];
    
    console.log(`Successfully deleted ${deletedUsers.length} users with email containing '${emailPattern}':`);
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

// Get the email pattern from command line arguments
const emailPattern = process.argv[2];

// Run the function
clearUsersByEmail(emailPattern).catch(console.error);