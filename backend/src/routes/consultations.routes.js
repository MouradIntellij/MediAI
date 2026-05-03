import { Router } from "express";
import { z } from "zod";
import { query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { validate } from "../middleware/validate.js";
import { estimatePatientRisk, summarizeClinicalText } from "../services/aiService.js";

const router = Router();

const consultationSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    practitionerId: z.string().uuid(),
    appointmentId: z.string().uuid().optional().nullable(),
    notes: z.string().min(5),
    diagnosis: z.string().optional().nullable(),
    vitals: z.record(z.any()).default({})
  })
});

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const params = [];
    let where = "";
    if (req.query.patientId) {
      params.push(req.query.patientId);
      where = "WHERE c.patient_id = $1";
    }

    const { rows } = await query(
      `SELECT c.*, p.first_name, p.last_name, u.full_name AS practitioner_name
       FROM consultations c
       JOIN patients p ON p.id = c.patient_id
       JOIN users u ON u.id = c.practitioner_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT 150`,
      params
    );
    res.json({ consultations: rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin", "doctor", "nurse"),
  validate(consultationSchema),
  audit("create", "consultation"),
  async (req, res, next) => {
    try {
      const body = req.validated.body;
      const patientResult = await query("SELECT * FROM patients WHERE id = $1", [
        body.patientId
      ]);
      const patient = patientResult.rows[0];

      const nlp = summarizeClinicalText(body.notes);
      const risk = estimatePatientRisk({
        patient,
        vitals: body.vitals,
        notes: body.notes
      });

      const { rows } = await query(
        `INSERT INTO consultations
         (patient_id, practitioner_id, appointment_id, notes, diagnosis, vitals, ai_summary, ai_risk)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          body.patientId,
          body.practitionerId,
          body.appointmentId,
          body.notes,
          body.diagnosis,
          body.vitals,
          nlp.summary,
          risk
        ]
      );

      res.status(201).json({
        consultation: rows[0],
        ai: {
          summary: nlp.summary,
          detectedTerms: nlp.detectedTerms,
          risk
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
