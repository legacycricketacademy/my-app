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
    const newPasswordHash = await hashPassword("parentkite459");
    
    await db.update(users)
      .set({ password: newPasswordHash })
      .where(eq(users.id, 19));
      
    console.log('Password for parentkite459 has been reset to "parentkite459"');
  } catch (error) {
    console.error("Error resetting password:", error);
  }
}

resetParentKitePassword();