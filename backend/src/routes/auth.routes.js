import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../config/db.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { signAccessToken } from "../services/tokenService.js";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const { rows } = await query(
      `SELECT id, full_name, email, password_hash, role, active
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user || !user.active) {
      throw new ApiError(401, "Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = signAccessToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      fullName: req.user.full_name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
