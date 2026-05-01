import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";
import { listingsRouter } from "./routes/listings";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/listings", listingsRouter);

app.listen(port, () => {
  console.log(`Faralaes backend listening on port ${port}`);
});
