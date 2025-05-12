import { db } from "./index";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { comparePasswords } from "../server/auth";

async function testLogin() {
  try {
    // Find the user
    const username = "admin123";
    const password = "admin123";
    
    console.log(`Testing login for ${username}`);
    
    // Get the user from the database directly
    const userFound = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (!userFound) {
      console.error("User not found");
      return;
    }
    
    console.log("User found:", {
      id: userFound.id,
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
      status: userFound.status,
      isActive: userFound.isActive,
      is_active: (userFound as any).is_active
    });
    
    // Check if password is correct
    const passwordValid = await comparePasswords(password, userFound.password);
    console.log("Password valid:", passwordValid);
    
  } catch (error) {
    console.error("Error in test login:", error);
  }
}

testLogin();