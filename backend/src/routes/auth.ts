import { Router } from "express";

export const authRouter = Router();

authRouter.post("/register", (_req, res) => {
  res.status(501).json({ message: "Register endpoint not implemented yet" });
});

authRouter.post("/login", (_req, res) => {
  res.status(501).json({ message: "Login endpoint not implemented yet" });
});
