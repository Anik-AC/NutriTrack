//entry point for api
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import { connectDB } from "./config/db.js";
import { nutriRoutes, authRoutes, profileRoutes, userRoutes, adminRoutes, coachRoutes} from "./routes/index.js";

dotenv.config();

console.log(process.env.MONGO_URI);
const PORT = process.env.VITE_PORT || 5000;

const __dirname = path.resolve();

const app = express();

const corsOptions = {
  origin: ['https://nutritrack.onixpace.com', 'http://localhost:5173'],
  credentials: true,
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", nutriRoutes);
app.use("/api/user", profileRoutes);

// Nutri Coach Booking Routes
app.use("/api/booking", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/coach", coachRoutes)

app.listen(PORT, () => {
  connectDB();
  console.log("✅ Server is up and running @ https://nutritrack.onixpace.com");
});

// For deployment
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/NutriTrack-Frontend/dist")));

  app.get(/.*/, (req, res) =>{
    res.sendFile(path.resolve(__dirname, "NutriTrack-Frontend", "dist", "index.html"));
  });
}  

// Setting proper security headers.
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});
