import { spawn } from "node:child_process";
import process from "node:process";

const isWindows = process.platform === "win32";
const dockerArgs = ["compose", "up", "--build"];

process.stdout.write("\nMediAI Docker dev is starting:\n");
process.stdout.write("- Frontend: http://localhost:8090\n");
process.stdout.write("- API: http://localhost:4001/health\n");
process.stdout.write("- Docker logs will continue below. Press Ctrl+C to stop.\n\n");

const child = spawn("docker", dockerArgs, {
  cwd: process.cwd(),
  stdio: "inherit"
});

function stopDocker() {
  if (!child.killed) {
    child.kill(isWindows ? undefined : "SIGTERM");
  }
}

process.on("SIGINT", () => {
  stopDocker();
});

process.on("SIGTERM", () => {
  stopDocker();
});

child.on("error", (error) => {
  process.stderr.write(`\nUnable to start Docker Compose: ${error.message}\n`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(signal === "SIGINT" ? 130 : 143);
  }

  process.exit(code ?? 0);
});
