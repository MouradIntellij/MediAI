import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { audit } from "../middleware/audit.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin"), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, email, role, active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (error) {
    next(error);
  }
});

router.get("/practitioners", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE active = TRUE AND role IN ('doctor', 'nurse')
       ORDER BY full_name ASC`
    );
    res.json({ practitioners: rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin"),
  validate(
    z.object({
      body: z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["admin", "doctor", "nurse", "patient"])
      })
    })
  ),
  audit("create", "user"),
  async (req, res, next) => {
    try {
      const body = req.validated.body;
      const passwordHash = await bcrypt.hash(body.password, 12);
      const { rows } = await query(
        `INSERT INTO users (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, full_name, email, role, active, created_at`,
        [body.fullName, body.email.toLowerCase(), passwordHash, body.role]
      );
      res.status(201).json({ user: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
