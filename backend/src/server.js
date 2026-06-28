import cron from "node-cron";
import { createApp } from "./app.js";
import { assertProductionEnv, env } from "./config/env.js";

assertProductionEnv();

const app = createApp();

app.listen(env.port, () => {
  console.log(`MediAI API listening on http://localhost:${env.port}`);
});

async function pingRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const res = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) console.log("[keepalive] Redis ping OK");
      else console.warn("[keepalive] Redis ping échec:", await res.text());
    } catch (err) {
      console.warn("[keepalive] Redis indisponible:", err.message);
    }
  }
}

cron.schedule("*/15 * * * *", pingRedis);

