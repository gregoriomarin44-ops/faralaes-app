import { Router } from "express";

export const listingsRouter = Router();

listingsRouter.get("/", (_req, res) => {
  res.status(501).json({ message: "Listings endpoint not implemented yet" });
});
