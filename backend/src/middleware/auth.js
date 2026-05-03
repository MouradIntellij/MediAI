import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { ApiError } from "./errorHandler.js";

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing bearer token");
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret);
    const { rows } = await query(
      `SELECT id, full_name, email, role, active
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    const user = rows[0];
    if (!user || !user.active) {
      throw new ApiError(401, "Invalid account");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    next();
  };
}
