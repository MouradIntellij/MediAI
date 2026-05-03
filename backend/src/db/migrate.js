import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const files = (await fs.readdir(__dirname))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(__dirname, file), "utf8");
    await pool.query(sql);
    console.log(`Applied migration ${file}`);
  }

  await pool.end();
}

migrate().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
