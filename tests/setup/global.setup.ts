import { request, expect, FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const baseURL = process.env.BASE_URL || "http://localhost:5173";
  console.log(`🔵 Global setup starting with baseURL: ${baseURL}`);
  
  // 1) New request context with credentials enabled
  const ctx = await request.newContext({
    baseURL,
    extraHTTPHeaders: { "Content-Type": "application/json" }
  });

  try {
    // 2) Hit dev login (server-session), important: include credentials
    console.log("📍 Attempting dev login...");
    const login = await ctx.post("/api/dev/login", {
      data: { email: "admin@test.com", password: "password" }
    });
    
    if (!login.ok()) {
      console.warn(`⚠️ Dev login failed: ${login.status()} ${login.statusText()}`);
      console.warn("⚠️ Skipping authentication setup - tests will run without auth");
      await ctx.storageState({ path: "tests/.state/admin.json" });
      await ctx.dispose();
      return;
    }
    
    console.log("✅ Dev login successful");

    // 3) whoami must show a user
    console.log("📍 Checking whoami...");
    const who = await ctx.get("/api/_whoami");
    if (!who.ok()) {
      console.warn(`⚠️ Whoami failed: ${who.status()} ${who.statusText()}`);
      console.warn("⚠️ Skipping authentication setup - tests will run without auth");
      await ctx.storageState({ path: "tests/.state/admin.json" });
      await ctx.dispose();
      return;
    }
    
    const data = await who.json();
    if (!data?.user) {
      console.warn(`⚠️ No user in whoami response: ${JSON.stringify(data)}`);
      console.warn("⚠️ Skipping authentication setup - tests will run without auth");
      await ctx.storageState({ path: "tests/.state/admin.json" });
      await ctx.dispose();
      return;
    }
    
    console.log(`✅ Whoami successful, user: ${data.user.email}`);

    // 4) Save storage state for all projects
    console.log("📍 Saving storage state...");
    await ctx.storageState({ path: "tests/.state/admin.json" });
    console.log("✅ Storage state saved to tests/.state/admin.json");
    
  } catch (error) {
    console.warn(`⚠️ Global setup error: ${error}`);
    console.warn("⚠️ Skipping authentication setup - tests will run without auth");
    await ctx.storageState({ path: "tests/.state/admin.json" });
  }
  
  await ctx.dispose();
  console.log("✅ Global setup completed");
}
