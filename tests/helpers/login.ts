import { request, expect } from "@playwright/test";

export async function loginAs(role: "admin" | "parent" | "coach", baseURL: string, storageState: string) {
  const ctx = await request.newContext();
  const res = await ctx.post(`${baseURL}/api/test/login`, {
    data: { role }
  });
  expect(res.ok()).toBeTruthy();
  await ctx.storageState({ path: storageState });
  await ctx.dispose();
}

