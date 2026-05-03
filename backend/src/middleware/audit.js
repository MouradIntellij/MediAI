import { query } from "../config/db.js";

export function audit(action, entityType, getEntityId = () => null) {
  return async (req, _res, next) => {
    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user?.id || null,
          action,
          entityType,
          getEntityId(req),
          req.ip
        ]
      );
    } catch (error) {
      console.warn("Audit log failed:", error.message);
    }
    next();
  };
}
