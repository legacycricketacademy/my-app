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

async function resetParentKitePassword() {
  try {
    console.log("Checking parentkite459 account...");
    const parent = await db.query.users.findFirst({
      where: eq(users.username, "parentkite459")
    });
    
    if (!parent) {
      console.error("Error: parentkite459 account not found");
      return;
    }
    
    console.log("Found parentkite459 account:", {
      id: parent.id,
      role: parent.role,
      status: parent.status,
      is_active: parent.isActive
    });
    
    // Reset parentkite459 password
    const newPasswordHash = await hashPassword("parentkite459");
    
    await db.update(users)
      .set({ 
        password: newPasswordHash,
        status: "active",
        isActive: true
      })
      .where(eq(users.id, parent.id));
      
    console.log('ParentKite459 account has been reset with password "parentkite459"');
    
    // Verify the update
    const updatedParent = await db.query.users.findFirst({
      where: eq(users.username, "parentkite459")
    });
    
    if (updatedParent) {
      console.log("Updated parentkite459 account:", {
        id: updatedParent.id,
        role: updatedParent.role,
        status: updatedParent.status,
        is_active: updatedParent.isActive
      });
    }
    
  } catch (error) {
    console.error("Error fixing parentkite459 account:", error);
  }
}

resetParentKitePassword();