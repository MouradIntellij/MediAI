import { createApp } from "./app.js";
import { assertProductionEnv, env } from "./config/env.js";

assertProductionEnv();

const app = createApp();

app.listen(env.port, () => {
  console.log(`MediAI API listening on http://localhost:${env.port}`);
});
