import type { NextFunction, Request, Response } from "express";

export const requireAuth = (_req: Request, res: Response, _next: NextFunction) => {
  res.status(501).json({ message: "Auth middleware not implemented yet" });
};
