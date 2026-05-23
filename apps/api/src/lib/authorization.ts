import { getUserRole, type AppRole } from "@polokaz/auth/roles";
import { Request, Response } from "express";

type AllowedRole = Exclude<AppRole, "member"> | "member";

function sendUnauthorized(res: Response) {
  return res.status(401).json({
    error: { code: "UNAUTHORIZED", message: "Authentication required" },
  });
}

function sendForbidden(res: Response) {
  return res.status(403).json({
    error: { code: "FORBIDDEN", message: "You do not have access to this resource" },
  });
}

export function requireSession(req: Request, res: Response) {
  if (!req.session?.user) {
    sendUnauthorized(res);
    return null;
  }

  return req.session;
}

export function requireRole(req: Request, res: Response, allowedRoles: AllowedRole[]) {
  const session = requireSession(req, res);

  if (!session) {
    return null;
  }

  const role = getUserRole(session.user);

  if (!allowedRoles.includes(role)) {
    sendForbidden(res);
    return null;
  }

  return session;
}
