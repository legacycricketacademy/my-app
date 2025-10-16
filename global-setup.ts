import { loginAs } from "./tests/helpers/login";

export default async () => {
  const baseURL = process.env.PW_BASE_URL || "http://localhost:3002";
  await loginAs("admin", baseURL, "storageState.admin.json");
  await loginAs("parent", baseURL, "storageState.parent.json");
};

