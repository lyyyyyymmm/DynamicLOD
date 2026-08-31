import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_INPUT =
  "C:\\Users\\78630\\.codex\\sessions\\2026\\08\\23\\rollout-2026-08-23T16-38-48-01a02dc5-b9bf-72d3-bba4-02727dbe08b4.jsonl";
const INJECTED_CONTEXT_PREFIXES = [
  "<recommended_plugins>",
  "<environment_context>",
  "<app-context>",
  "<skills_instructions>",
  "<permissions instructions>",
  "<plugins_instructions>",
];

function normalizeTimestamp(value) {
  if (value === undefined || value === null || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 1e12 ? numeric * 1000 : numeric)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function messageTimestamp(record) {
  return normalizeTimestamp(
    record.timestamp ?? record.payload?.internal_chat_message_metadata_passthrough?.create_time,
  );
}

function naturalText(content) {
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part && (part.type === "input_text" || part.type === "output_text"))
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .filter((text) => text.trim().length > 0)
    .join("\n\n")
    .trim();
}

function isInjectedContext(text) {
  const trimmed = text.trimStart();
  return INJECTED_CONTEXT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function extractNaturalLanguageMessages(lines) {
  const messages = [];
  for (const line of lines) {
    if (!line || !line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    const payload = record?.type === "response_item" ? record.payload : null;
    if (payload?.type !== "message" || !["user", "assistant"].includes(payload.role)) {
      continue;
    }

    const text = naturalText(payload.content);
    if (!text || isInjectedContext(text)) continue;
    messages.push({
      role: payload.role,
      text,
      timestamp: messageTimestamp(record),
    });
  }
  return messages;
}

function displayRole(role) {
  return role === "user" ? "User" : "Codex";
}

export function renderMarkdown(messages, options = {}) {
  const sourceName = options.sourceName ?? "rollout.jsonl";
  const updatedAt = options.updatedAt ?? new Date().toISOString();
  const lines = [
    "# Session Transcript",
    "",
    `Source: ${sourceName}`,
    `Updated: ${updatedAt}`,
    `Messages: ${messages.length}`,
    "",
  ];

  messages.forEach((message, index) => {
    const timestamp = message.timestamp ? ` · ${message.timestamp}` : "";
    lines.push(`## ${displayRole(message.role)}${timestamp}`, "", message.text, "");
    if (index < messages.length - 1) lines.push("---", "");
  });
  return `${lines.join("\n").trim()}\n`;
}

export function exportRolloutFile(inputPath, outputPath) {
  const source = fs.readFileSync(inputPath, "utf8");
  const messages = extractNaturalLanguageMessages(source.split(/\r?\n/));
  const markdown = renderMarkdown(messages, {
    sourceName: path.basename(inputPath),
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf8");
  return { inputPath, outputPath, messageCount: messages.length };
}

function parseArguments(argv) {
  const options = { inputPath: DEFAULT_INPUT, outputPath: null, watch: false, intervalMs: 1000 };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--watch") options.watch = true;
    else if (argument === "--input") options.inputPath = argv[++index];
    else if (argument.startsWith("--input=")) options.inputPath = argument.slice(8);
    else if (argument === "--output") options.outputPath = argv[++index];
    else if (argument.startsWith("--output=")) options.outputPath = argument.slice(9);
    else if (argument === "--interval") options.intervalMs = Number(argv[++index]);
    else if (argument.startsWith("--interval=")) options.intervalMs = Number(argument.slice(11));
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function defaultOutputPath(inputPath) {
  return path.resolve(
    process.cwd(),
    "learnMapmost",
    "session_backups",
    `${path.basename(inputPath, path.extname(inputPath))}.md`,
  );
}

function printHelp() {
  console.log([
    "Export natural-language user/Codex messages from a Codex rollout.",
    "",
    "Usage:",
    "  node learnMapmost/rollout_backup.mjs [--input PATH] [--output PATH] [--watch]",
    "",
    "The watcher rewrites the Markdown after the rollout grows; internal events are ignored.",
  ].join("\n"));
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.inputPath) throw new Error("An input rollout path is required.");
  const outputPath = options.outputPath ?? defaultOutputPath(options.inputPath);
  const exportNow = () => {
    const result = exportRolloutFile(options.inputPath, outputPath);
    console.log(`Backed up ${result.messageCount} messages to ${result.outputPath}`);
  };

  exportNow();
  if (!options.watch) return;

  let pending = null;
  fs.watchFile(options.inputPath, { interval: Number.isFinite(options.intervalMs) ? options.intervalMs : 1000 }, () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      try {
        exportNow();
      } catch (error) {
        console.error(`Backup retry failed: ${error.message}`);
      }
    }, 100);
  });
  console.log(`Watching ${options.inputPath}`);
  const stop = () => {
    fs.unwatchFile(options.inputPath);
    clearTimeout(pending);
    process.exit(0);
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
