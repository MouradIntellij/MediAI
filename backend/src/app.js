import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patients.routes.js";
import appointmentRoutes from "./routes/appointments.routes.js";
import prescriptionRoutes from "./routes/prescriptions.routes.js";
import consultationRoutes from "./routes/consultations.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import userRoutes from "./routes/users.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "mediai-api",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/prescriptions", prescriptionRoutes);
  app.use("/api/consultations", consultationRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
