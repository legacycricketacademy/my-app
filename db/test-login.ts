import { db } from "./index";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return hashedBuf.compare(suppliedBuf) === 0;
}

async function testLogin() {
  try {
    console.log("Testing logins...");
    
    // Test admin123
    const admin = await db.query.users.findFirst({
      where: eq(users.username, "admin123")
    });
    
    if (admin) {
      console.log("Found admin123 account:", {
        id: admin.id,
        role: admin.role,
        status: admin.status,
        is_active: admin.isActive
      });
      
      const isAdminPasswordValid = await comparePasswords("admin123", admin.password);
      console.log("Admin password valid:", isAdminPasswordValid);
    } else {
      console.log("Admin123 account not found");
    }
    
    // Test parentkite459
    const parent = await db.query.users.findFirst({
      where: eq(users.username, "parentkite459")
    });
    
    if (parent) {
      console.log("Found parentkite459 account:", {
        id: parent.id,
        role: parent.role,
        status: parent.status,
        is_active: parent.isActive
      });
      
      const isParentPasswordValid = await comparePasswords("parentkite459", parent.password);
      console.log("Parent password valid:", isParentPasswordValid);
    } else {
      console.log("Parentkite459 account not found");
    }
    
  } catch (error) {
    console.error("Error testing logins:", error);
  }
}

testLogin();