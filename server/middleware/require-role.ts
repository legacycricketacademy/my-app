import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/schema";
import { createErrorResponse, createForbiddenResponse } from "../utils/api-response";

/**
 * Middleware that checks if the authenticated user has one of the allowed roles
 * @param allowedRoles - Array of roles allowed to access the route
 * @returns Express middleware function
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json(
        createErrorResponse(
          "Authentication required",
          "auth_required",
          401
        )
      );
    }

    // Check if user role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json(
        createForbiddenResponse(
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        )
      );
    }

    // User has an allowed role
    next();
  };
};

/**
 * Helper functions for common role checks
 */
export const requireAdmin = requireRole(["admin", "superadmin"]);
export const requireCoach = requireRole(["coach", "admin", "superadmin"]);
export const requireParent = requireRole(["parent", "admin", "superadmin"]);