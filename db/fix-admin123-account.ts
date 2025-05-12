import { db } from "./index";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixAdmin123Account() {
  try {
    console.log("Checking admin123 account...");
    const admin = await db.query.users.findFirst({
      where: eq(users.username, "admin123")
    });
    
    if (!admin) {
      console.error("Error: admin123 account not found");
      return;
    }
    
    console.log("Found admin123 account:", {
      id: admin.id,
      role: admin.role,
      status: admin.status,
      is_active: admin.isActive
    });
    
    // Reset admin123 password
    const newPasswordHash = await hashPassword("admin123");
    
    await db.update(users)
      .set({ 
        password: newPasswordHash,
        status: "active",
        isActive: true
      })
      .where(eq(users.id, admin.id));
      
    console.log('Admin123 account has been reset with password "admin123"');
    
    // Verify the update
    const updatedAdmin = await db.query.users.findFirst({
      where: eq(users.username, "admin123")
    });
    
    console.log("Updated admin123 account:", {
      id: updatedAdmin.id,
      role: updatedAdmin.role,
      status: updatedAdmin.status,
      is_active: updatedAdmin.isActive
    });
    
  } catch (error) {
    console.error("Error fixing admin123 account:", error);
  }
}

fixAdmin123Account();