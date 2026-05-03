import { Router } from "express";
import { z } from "zod";
import { query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const patientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().date(),
    sex: z.string().min(1),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    allergies: z.array(z.string()).default([]),
    chronicConditions: z.array(z.string()).default([]),
    emergencyContact: z.record(z.any()).default({})
  })
});

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : "%";
    const { rows } = await query(
      `SELECT id, first_name, last_name, date_of_birth, sex, phone, email,
              allergies, chronic_conditions, created_at
       FROM patients
       WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [search]
    );
    res.json({ patients: rows });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT *
       FROM patients
       WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) throw new ApiError(404, "Patient not found");
    res.json({ patient: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin", "doctor", "nurse"),
  validate(patientSchema),
  audit("create", "patient"),
  async (req, res, next) => {
    try {
      const patient = req.validated.body;
      const { rows } = await query(
        `INSERT INTO patients
         (first_name, last_name, date_of_birth, sex, phone, email, address, allergies, chronic_conditions, emergency_contact)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          patient.firstName,
          patient.lastName,
          patient.dateOfBirth,
          patient.sex,
          patient.phone,
          patient.email,
          patient.address,
          patient.allergies,
          patient.chronicConditions,
          patient.emergencyContact
        ]
      );
      res.status(201).json({ patient: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  authorize("admin", "doctor", "nurse"),
  validate(patientSchema),
  audit("update", "patient", (req) => req.params.id),
  async (req, res, next) => {
    try {
      const patient = req.validated.body;
      const { rows } = await query(
        `UPDATE patients
         SET first_name = $1, last_name = $2, date_of_birth = $3, sex = $4,
             phone = $5, email = $6, address = $7, allergies = $8,
             chronic_conditions = $9, emergency_contact = $10, updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [
          patient.firstName,
          patient.lastName,
          patient.dateOfBirth,
          patient.sex,
          patient.phone,
          patient.email,
          patient.address,
          patient.allergies,
          patient.chronicConditions,
          patient.emergencyContact,
          req.params.id
        ]
      );
      if (!rows[0]) throw new ApiError(404, "Patient not found");
      res.json({ patient: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
