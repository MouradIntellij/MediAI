import { spawn } from "node:child_process";
import process from "node:process";

const root = process.cwd();
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const children = new Set();

function log(name, message) {
  process.stdout.write(`[${name}] ${message}`);
}

function startApp(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });

  children.add(child);
  child.stdout.on("data", (chunk) => log(name, chunk.toString()));
  child.stderr.on("data", (chunk) => log(name, chunk.toString()));
  child.on("exit", () => children.delete(child));
  child.on("error", (error) => {
    process.stderr.write(`[${name}] ${error.message}\n`);
  });

  return child;
}

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill(isWindows ? undefined : "SIGTERM");
    }
  }
}

process.on("SIGINT", () => {
  stopChildren();
  process.exit(130);
});

process.on("SIGTERM", () => {
  stopChildren();
  process.exit(143);
});

try {
  startApp("backend", npmCommand, ["run", "dev:backend"]);
  startApp("frontend", npmCommand, ["run", "dev:frontend"]);

  process.stdout.write("\nMediAI dev is running:\n");
  process.stdout.write("- Frontend: http://localhost:5173\n");
  process.stdout.write("- API: http://localhost:4000/health\n");
  process.stdout.write("Press Ctrl+C to stop the frontend and backend.\n\n");
} catch (error) {
  stopChildren();
  process.stderr.write(`\n${error.message}\n`);
  process.exit(1);
}
