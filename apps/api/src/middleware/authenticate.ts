import { auth, fromNodeHeaders } from "@polokaz/auth";
import { NextFunction, Request, Response } from "express";

export default async function handler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  req.session = session;

  next();
}
