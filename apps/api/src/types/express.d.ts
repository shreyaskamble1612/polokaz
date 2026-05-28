/**
 * Custom properties on the req object in express
 */

import { Session } from "@polokaz/auth";

export {};

declare global {
  namespace Express {
    export interface Request {
      session: Session | null;
    }
  }
}
