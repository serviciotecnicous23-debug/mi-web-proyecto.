/**
 * Shared server-side type declarations.
 *
 * This file provides proper Express augmentation so that `req.user`
 * is strongly typed everywhere, eliminating the need for `as any`.
 */

import type { User } from "@shared/schema";

// ─── Express augmentation ───────────────────────────────────────────────
// Passport stores the full User row on `req.user` after deserialization.
declare global {
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, "password"> {
      /** The password hash IS present at runtime, but we mark it optional to
       *  discourage accidental leaking; access it explicitly when needed. */
      password: string;
    }
  }
}

// ─── Authenticated request helper ───────────────────────────────────────
import type { Request } from "express";

/**
 * A request that has been authenticated by Passport.
 * `req.user` is guaranteed to be defined.
 */
export interface AuthenticatedRequest extends Request {
  user: Express.User;
  file?: Express.Multer.File;
}

/**
 * Narrow an incoming request to an authenticated one.
 * Returns `true` (type-guard) when the request has a user.
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return req.isAuthenticated?.() === true && req.user != null;
}
