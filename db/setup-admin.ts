import { db } from "./index";
import { users } from "@shared/schema";
import { hashPassword } from "../server/auth";
import { eq, and } from "drizzle-orm";

/**
 * Creates or updates an admin user with the specified email
 */
async function setupAdmin() {
  try {
    console.log("Setting up admin account...");
    
    // The email for the admin user
    const adminEmail = "madhukar.kcc@gmail.com";
    
    // Check if the user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, adminEmail)
    });
    
    if (existingUser) {
      console.log(`User with email ${adminEmail} already exists.`);
      
      // Check if they're already an admin
      if (existingUser.role === "admin" && existingUser.status === "active" && existingUser.isActive) {
        console.log("User is already an active admin. No changes needed.");
        return;
      }
      
      // Update the user to be an active admin
      const updatedUser = await db.update(users)
        .set({
          role: "admin",
          status: "active",
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      
      console.log(`User ${adminEmail} has been updated to admin role with active status.`);
      return;
    }
    
    // Create a new admin user
    const tempPassword = "admin123"; // This will be hashed
    const hashedPassword = await hashPassword(tempPassword);
    
    const newAdmin = await db.insert(users).values({
      username: "admin",
      email: adminEmail,
      password: hashedPassword,
      fullName: "System Administrator",
      role: "admin",
      status: "active",
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`New admin user created with email ${adminEmail}.`);
    console.log(`Temporary password: ${tempPassword}`);
    console.log("Please change this password after logging in.");
    
  } catch (error) {
    console.error("Error setting up admin account:", error);
    process.exit(1);
  }
}

// Run the function
setupAdmin()
  .then(() => {
    console.log("Admin setup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });