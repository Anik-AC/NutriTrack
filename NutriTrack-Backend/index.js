import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { nutriRoutes, authRoutes, profileRoutes, userRoutes, adminRoutes, coachRoutes } from "./routes/index.js";

dotenv.config();

const PORT = process.env.PORT || process.env.VITE_PORT || 5000;

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://nutritrack.onixpace.com', 'http://localhost:5173'];

app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api", nutriRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/booking", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coach", coachRoutes);

connectDB();

// Local dev only — Vercel invokes the exported app directly
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

export default app;
