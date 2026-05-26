import dotenv from "dotenv";

dotenv.config();

const parseCorsOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://mediai:mediai@localhost:5432/mediai",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret:
    process.env.JWT_SECRET ||
    "change-this-secret-in-production-use-a-long-random-value",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigins: parseCorsOrigins(
    process.env.CORS_ORIGIN ||
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8090,http://127.0.0.1:8090"
  )
};

export function assertProductionEnv() {
  if (env.nodeEnv === "production" && env.jwtSecret.includes("change-this")) {
    throw new Error("JWT_SECRET must be changed in production.");
  }
}
