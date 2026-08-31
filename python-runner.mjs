import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function resolvePythonCommand(options = {}) {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const homeDir = options.homeDir ?? homedir;
  const exists = options.existsSync ?? existsSync;
  const explicit = String(env.LOD_PYTHON ?? "").trim();
  if (explicit) return explicit;

  if (platform === "win32") {
    const bundled = path.win32.join(
      homeDir(),
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "python",
      "python.exe",
    );
    if (exists(bundled)) return bundled;
  }

  return "python";
}

export function parseRunnerArgs(argv) {
  const args = [...argv];
  let cwd = process.cwd();
  if (args[0] === "--python-cwd") {
    if (!args[1]) throw new Error("--python-cwd requires a directory");
    cwd = args[1];
    args.splice(0, 2);
  }
  return { cwd, args };
}

function main() {
  const python = resolvePythonCommand();
  const { cwd, args } = parseRunnerArgs(process.argv.slice(2));
  const result = spawnSync(python, args, { stdio: "inherit", cwd });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  if (result.signal) {
    console.error(`Python process terminated by ${result.signal}`);
    return 1;
  }
  return result.status ?? 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
