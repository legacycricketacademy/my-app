import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const sqlite = new Database("dev.db");
const db = drizzle(sqlite);

async function ensureTestAdmin() {
  const email = "admin@test.com";
  const password = "Test1234!";
  
  console.log("Checking for test admin user...");
  
  // Check if user exists
  const existing = await db.select().from(users).where(eq(users.email, email));
  
  if (existing.length > 0) {
    console.log("✅ Test admin user already exists:", email);
    console.log("   Role:", existing[0].role);
    console.log("   ID:", existing[0].id);
    return;
  }
  
  // Create user
  console.log("Creating test admin user...");
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const [user] = await db.insert(users).values({
    email,
    password: hashedPassword,
    firstName: "Test",
    lastName: "Admin",
    role: "admin",
    isEmailVerified: true,
  }).returning();
  
  console.log("✅ Test admin user created!");
  console.log("   Email:", email);
  console.log("   Password:", password);
  console.log("   Role:", user.role);
  console.log("   ID:", user.id);
}

ensureTestAdmin().catch(console.error);

