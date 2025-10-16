import "express-serve-static-core";
import "express-session";

declare global {
  namespace Express {
    interface User {
      id: string | number;
      email?: string;
      name?: string;
      roles?: string[];
      role?: string; // keep for our legacy code
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string | number;
    userRole?: string;
    academyId?: number;
  }
}

export {};
