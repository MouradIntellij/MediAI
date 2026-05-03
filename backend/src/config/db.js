import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000
});

export async function query(text, params = []) {
  const startedAt = Date.now();
  const result = await pool.query(text, params);
  if (env.nodeEnv === "development") {
    const duration = Date.now() - startedAt;
    if (duration > 250) {
      console.warn(`Slow query (${duration}ms): ${text}`);
    }
  }
  return result;
}

export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
