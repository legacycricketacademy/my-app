import { db } from "./index.js";
import * as schema from "@shared/schema-sqlite.js";
import { hashSync, genSaltSync } from "bcrypt";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting SQLite database seeding...");
    
    // Create default academy if it doesn't exist
    let defaultAcademy;
    const academyExists = await db.query.academies.findFirst({
      where: eq(schema.academies.name, "Legacy Cricket Academy")
    });

    if (!academyExists) {
      const [academy] = await db.insert(schema.academies).values({
        name: "Legacy Cricket Academy",
        slug: "legacy-cricket-academy",
        description: "The main cricket academy for player development",
        address: "123 Cricket Lane, Sports City",
        phone: "+1234567890",
        email: "info@legacycricket.com",
        logoUrl: "/assets/logo.png",
        primaryColor: "#1e40af",
        secondaryColor: "#60a5fa",
        stripeAccountId: null,
        subscriptionTier: "pro",
        maxPlayers: 200,
        maxCoaches: 10,
        status: "active",
      }).returning();
      defaultAcademy = academy;
      console.log("Default academy created with ID:", academy.id);
    } else {
      defaultAcademy = academyExists;
      console.log("Default academy already exists with ID:", academyExists.id);
    }

    const academyId = defaultAcademy.id;

    // Create admin user
    const adminExists = await db.query.users.findFirst({
      where: eq(schema.users.username, "admin")
    });

    if (!adminExists) {
      const salt = genSaltSync(10);
      await db.insert(schema.users).values({
        username: "admin",
        password: hashSync("password", salt),
        email: "admin@test.com",
        fullName: "Admin User",
        role: "admin",
        academyId: academyId,
      });
      console.log("Admin user created");
    }

    // Create parent user
    const parentExists = await db.query.users.findFirst({
      where: eq(schema.users.username, "parent")
    });

    if (!parentExists) {
      const salt = genSaltSync(10);
      await db.insert(schema.users).values({
        username: "parent",
        password: hashSync("password", salt),
        email: "parent@test.com",
        fullName: "Parent User",
        role: "parent",
        academyId: academyId,
      });
      console.log("Parent user created");
    }

    // Create coach user
    const coachExists = await db.query.users.findFirst({
      where: eq(schema.users.username, "coach")
    });

    if (!coachExists) {
      const salt = genSaltSync(10);
      await db.insert(schema.users).values({
        username: "coach",
        password: hashSync("password", salt),
        email: "coach@test.com",
        fullName: "Coach User",
        role: "coach",
        academyId: academyId,
      });
      console.log("Coach user created");
    }

    console.log("Database seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
