import { Router } from "express";
import { z } from "zod";
import { query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { validate } from "../middleware/validate.js";
import { detectMedicationInteractions } from "../services/aiService.js";

const router = Router();

const prescriptionSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    practitionerId: z.string().uuid(),
    medicationName: z.string().min(2),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    startDate: z.string().date(),
    endDate: z.string().date().optional().nullable(),
    instructions: z.string().optional().nullable()
  })
});

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const params = [];
    let where = "";
    if (req.query.patientId) {
      params.push(req.query.patientId);
      where = "WHERE pr.patient_id = $1";
    }

    const { rows } = await query(
      `SELECT pr.*, p.first_name, p.last_name, u.full_name AS practitioner_name
       FROM prescriptions pr
       JOIN patients p ON p.id = pr.patient_id
       JOIN users u ON u.id = pr.practitioner_id
       ${where}
       ORDER BY pr.created_at DESC
       LIMIT 150`,
      params
    );
    res.json({ prescriptions: rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin", "doctor"),
  validate(prescriptionSchema),
  audit("create", "prescription"),
  async (req, res, next) => {
    try {
      const body = req.validated.body;
      const existing = await query(
        `SELECT medication_name
         FROM prescriptions
         WHERE patient_id = $1 AND status = 'active'`,
        [body.patientId]
      );
      const interactions = detectMedicationInteractions([
        ...existing.rows.map((row) => row.medication_name),
        body.medicationName
      ]);

      const { rows } = await query(
        `INSERT INTO prescriptions
         (patient_id, practitioner_id, medication_name, dosage, frequency, start_date, end_date, instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          body.patientId,
          body.practitionerId,
          body.medicationName,
          body.dosage,
          body.frequency,
          body.startDate,
          body.endDate,
          body.instructions
        ]
      );

      res.status(201).json({ prescription: rows[0], interactions });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/logs",
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        patientId: z.string().uuid(),
        reaction: z.string().optional().nullable(),
        adherenceStatus: z.enum(["taken", "missed", "delayed", "reaction"]).default("taken")
      })
    })
  ),
  audit("create", "medication_log", (req) => req.params.id),
  async (req, res, next) => {
    try {
      const { rows } = await query(
        `INSERT INTO medication_logs
         (prescription_id, patient_id, reaction, adherence_status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          req.validated.params.id,
          req.validated.body.patientId,
          req.validated.body.reaction,
          req.validated.body.adherenceStatus
        ]
      );
      res.status(201).json({ medicationLog: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
