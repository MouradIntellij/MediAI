import { Router } from "express";
import { z } from "zod";
import { query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const appointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    practitionerId: z.string().uuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).default("scheduled"),
    reason: z.string().min(3),
    location: z.string().min(2).default("Clinique principale")
  })
});

router.use(authenticate);

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.*, p.first_name, p.last_name, u.full_name AS practitioner_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN users u ON u.id = a.practitioner_id
       ORDER BY a.starts_at ASC
       LIMIT 150`
    );
    res.json({ appointments: rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin", "doctor", "nurse"),
  validate(appointmentSchema),
  audit("create", "appointment"),
  async (req, res, next) => {
    try {
      const body = req.validated.body;
      const { rows } = await query(
        `INSERT INTO appointments
         (patient_id, practitioner_id, starts_at, ends_at, status, reason, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          body.patientId,
          body.practitionerId,
          body.startsAt,
          body.endsAt,
          body.status,
          body.reason,
          body.location
        ]
      );
      res.status(201).json({ appointment: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/status",
  authorize("admin", "doctor", "nurse"),
  validate(
    z.object({
      body: z.object({
        status: z.enum(["scheduled", "confirmed", "completed", "cancelled"])
      }),
      params: z.object({ id: z.string().uuid() })
    })
  ),
  audit("update_status", "appointment", (req) => req.params.id),
  async (req, res, next) => {
    try {
      const { rows } = await query(
        `UPDATE appointments
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [req.validated.body.status, req.validated.params.id]
      );
      if (!rows[0]) throw new ApiError(404, "Appointment not found");
      res.json({ appointment: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
