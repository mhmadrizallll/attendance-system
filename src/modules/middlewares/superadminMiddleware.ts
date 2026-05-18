// src/middlewares/superAdminMiddleware.ts

import { Request, Response, NextFunction } from "express";

export function superadminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  // cek role
  if (user.role?.toLowerCase() !== "superadmin") {
    return res.status(403).json({
      message: "Access denied. Superadmin only.",
    });
  }

  next();
}
