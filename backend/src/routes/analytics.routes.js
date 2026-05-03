import { Router } from "express";
import { query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { cacheGet, cacheSet } from "../config/redis.js";

const router = Router();

router.use(authenticate);

router.get("/overview", authorize("admin", "doctor", "nurse"), async (_req, res, next) => {
  try {
    const cacheKey = "analytics:overview";
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const [patients, appointments, prescriptions, risk] = await Promise.all([
      query("SELECT COUNT(*)::int AS total FROM patients"),
      query(
        `SELECT status, COUNT(*)::int AS total
         FROM appointments
         GROUP BY status`
      ),
      query(
        `SELECT status, COUNT(*)::int AS total
         FROM prescriptions
         GROUP BY status`
      ),
      query(
        `SELECT ai_risk->>'level' AS level, COUNT(*)::int AS total
         FROM consultations
         WHERE ai_risk <> '{}'::jsonb
         GROUP BY ai_risk->>'level'`
      )
    ]);

    const payload = {
      totalPatients: patients.rows[0].total,
      appointmentsByStatus: appointments.rows,
      prescriptionsByStatus: prescriptions.rows,
      risksByLevel: risk.rows
    };

    await cacheSet(cacheKey, payload, 60);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/audit", authorize("admin"), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT al.*, u.full_name AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT 100`
    );
    res.json({ auditLogs: rows });
  } catch (error) {
    next(error);
  }
});

export default router;
