import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  googleSignup,
  googleSignin,
  generateAndSendOtp,
  verifyOtp,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import passport from "../middleware/googleAuth.js";
import { User } from "../models/index.js"; 

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user with email + password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email + password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Authenticated; returns JWT + profile }
 *       401: { description: Invalid credentials, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 */
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
//router.post("/promote-to-admin", authMiddleware, promoteToAdmin);
router.post("/refresh-token", refreshToken);

router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "You accessed a protected route!",
    user: req.user, // This contains user details from JWT token
  });
});

// 🔹 Google OAuth: Sign In
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.json({
      success: true,
      message: "Google authentication successful",
      token: req.user.token,  // Return JWT Token
      user: req.user.user,
    });
  }
);

// 🔹 Google OAuth: Sign Up 
router.post(
  "/google/signup",
  passport.authenticate("google-token", { session: false }),
  googleSignup
);

// 🔹 Google OAuth: Token Authentication for Frontend
router.post(
  "/google/token",
  passport.authenticate("google-token", { session: false }),
  (req, res) => {
    res.json({
      success: true,
      message: "Google token authentication successful",
      token: req.user.token,
      user: req.user.user,
    });
  }
);

// 🔹 Google Sign-In Route
router.post(
  "/google/signin",
  passport.authenticate("google-token", { session: false }),
  googleSignin
);

router.post("/generate-otp", authMiddleware, generateAndSendOtp); // ✅ Resend OTP API
router.post("/verify-otp", authMiddleware, verifyOtp); // ✅ Verify OTP API

export default router;
