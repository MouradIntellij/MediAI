import cron from "node-cron";
import { createApp } from "./app.js";
import { assertProductionEnv, env } from "./config/env.js";
import { getRedis } from "./config/redis.js";

assertProductionEnv();

const app = createApp();

app.listen(env.port, () => {
  console.log(`MediAI API listening on http://localhost:${env.port}`);
});

// Keep Upstash Redis alive on free tier (every 15 minutes)
cron.schedule("*/15 * * * *", async () => {
  try {
    await getRedis().ping();
    console.log("[keepalive] Redis ping OK");
  } catch {
    console.warn("[keepalive] Redis indisponible");
  }
});
