import { Router, Request, Response } from "express";

const router = Router();

/**
 * Diagnostic endpoint for debugging auth/cookie issues
 * Only enable in development or with explicit flag
 */
router.get("/headers", (req: Request, res: Response) => {
  const isDev = process.env.NODE_ENV !== "production";
  const diagEnabled = process.env.ENABLE_DIAGNOSTICS === "true";

  if (!isDev && !diagEnabled) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    timestamp: new Date().toISOString(),
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: req.headers.cookie ? "present" : "missing",
      userAgent: req.headers["user-agent"],
      xForwardedFor: req.headers["x-forwarded-for"],
      xForwardedProto: req.headers["x-forwarded-proto"],
    },
    cookies: {
      parsed: req.cookies || {},
      raw: req.headers.cookie || "none",
    },
    session: {
      exists: !!req.session,
      sessionID: req.sessionID || "none",
      userId: (req.session as any)?.userId || null,
      role: (req.session as any)?.role || null,
      cookie: req.session?.cookie ? {
        secure: req.session.cookie.secure,
        httpOnly: req.session.cookie.httpOnly,
        sameSite: req.session.cookie.sameSite,
        domain: req.session.cookie.domain,
        path: req.session.cookie.path,
        maxAge: req.session.cookie.maxAge,
      } : null,
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "not set",
      SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || "connect.sid",
      trustProxy: "check app settings",
    },
  });
});

/**
 * Server configuration diagnostic
 */
router.get("/config", (req: Request, res: Response) => {
  const isDev = process.env.NODE_ENV !== "production";
  const diagEnabled = process.env.ENABLE_DIAGNOSTICS === "true";

  if (!isDev && !diagEnabled) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      isProd: process.env.NODE_ENV === "production",
    },
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentialsEnabled: true,
    },
    session: {
      cookieName: process.env.SESSION_COOKIE_NAME || "connect.sid",
      cookieDomain: process.env.COOKIE_DOMAIN || "not set (browser default)",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      maxAge: "7 days",
    },
    proxy: {
      trustProxy: "should be 1",
    },
  });
});

export default router;
