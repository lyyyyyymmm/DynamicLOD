import test from "node:test";
import assert from "node:assert/strict";

import { parseRunnerArgs, resolvePythonCommand } from "../python-runner.mjs";

test("python runner honors an explicit LOD_PYTHON override", () => {
  const command = resolvePythonCommand({
    env: { LOD_PYTHON: "D:\\Python\\python.exe" },
    existsSync: () => false,
    platform: "win32",
    homeDir: () => "C:\\Users\\tester",
  });

  assert.equal(command, "D:\\Python\\python.exe");
});

test("python runner prefers the bundled Codex Python on Windows", () => {
  const existing = new Set([
    "C:\\Users\\tester\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
  ]);

  const command = resolvePythonCommand({
    env: {},
    existsSync: (path) => existing.has(path),
    platform: "win32",
    homeDir: () => "C:\\Users\\tester",
  });

  assert.equal(
    command,
    "C:\\Users\\tester\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
  );
});

test("python runner falls back to system python when no bundled runtime exists", () => {
  const command = resolvePythonCommand({
    env: {},
    existsSync: () => false,
    platform: "win32",
    homeDir: () => "C:\\Users\\tester",
  });

  assert.equal(command, "python");
});

test("python runner parses an optional execution directory", () => {
  const parsed = parseRunnerArgs([
    "--python-cwd",
    "learnMapmost/analysis",
    "-m",
    "unittest",
  ]);

  assert.equal(parsed.cwd, "learnMapmost/analysis");
  assert.deepEqual(parsed.args, ["-m", "unittest"]);
});
