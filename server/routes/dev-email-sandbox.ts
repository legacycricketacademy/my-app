import { Router, type Express } from "express";
import { getSandboxEmails, clearSandboxEmails } from "../email.js";

export const devEmailSandboxRouter = Router();

const isDevelopment = process.env.NODE_ENV === 'development';
const isSandboxEnabled = process.env.EMAIL_SANDBOX === 'true';

export function registerDevEmailSandbox(app: Express) {
  // GET /api/dev/test-emails - Returns captured sandbox emails
  app.get("/api/dev/test-emails", (req, res) => {
    // Only available in development mode
    if (!isDevelopment) {
      return res.status(404).json({ error: "Not found" });
    }

    // Only available when EMAIL_SANDBOX is enabled
    if (!isSandboxEnabled) {
      return res.status(403).json({ 
        error: "Email sandbox not enabled",
        message: "Set EMAIL_SANDBOX=true in your environment to use this feature"
      });
    }

    const emails = getSandboxEmails();
    return res.json({
      success: true,
      count: emails.length,
      emails: emails
    });
  });

  // DELETE /api/dev/test-emails - Clears the sandbox email store
  app.delete("/api/dev/test-emails", (req, res) => {
    // Only available in development mode
    if (!isDevelopment) {
      return res.status(404).json({ error: "Not found" });
    }

    // Only available when EMAIL_SANDBOX is enabled
    if (!isSandboxEnabled) {
      return res.status(403).json({ 
        error: "Email sandbox not enabled",
        message: "Set EMAIL_SANDBOX=true in your environment to use this feature"
      });
    }

    clearSandboxEmails();
    return res.json({
      success: true,
      message: "Email sandbox cleared"
    });
  });

  console.log('DEV EMAIL SANDBOX routes registered (enabled:', isSandboxEnabled, ')');
}
