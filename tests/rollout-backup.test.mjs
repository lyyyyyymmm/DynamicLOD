import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  extractNaturalLanguageMessages,
  renderMarkdown,
  exportRolloutFile,
} from "../rollout_backup.mjs";

test("extracts each user and assistant message once and ignores internal events", () => {
  const lines = [
    JSON.stringify({
      timestamp: "2026-08-23T08:38:51.824Z",
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "用户问题" }],
      },
    }),
    JSON.stringify({
      timestamp: "2026-08-23T08:38:52.000Z",
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "<recommended_plugins>运行时上下文</recommended_plugins>" }],
      },
    }),
    JSON.stringify({
      type: "event_msg",
      payload: {
        type: "item_completed",
        item: { type: "UserMessage", content: [{ type: "text", text: "用户问题" }] },
      },
    }),
    JSON.stringify({
      type: "response_item",
      payload: {
        type: "function_call",
        name: "exec_command",
        arguments: "{\"cmd\":\"secret\"}",
      },
    }),
    JSON.stringify({
      timestamp: "2026-08-23T08:39:00.000Z",
      type: "response_item",
      payload: {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "Codex 回答" }],
      },
    }),
    JSON.stringify({
      type: "event_msg",
      payload: { type: "token_count", input_tokens: 123, output_tokens: 456 },
    }),
  ];

  assert.deepEqual(extractNaturalLanguageMessages(lines), [
    { role: "user", text: "用户问题", timestamp: "2026-08-23T08:38:51.824Z" },
    { role: "assistant", text: "Codex 回答", timestamp: "2026-08-23T08:39:00.000Z" },
  ]);
});

test("renders a readable transcript without internal event fields", () => {
  const markdown = renderMarkdown([
    { role: "user", text: "请继续", timestamp: "2026-08-23T08:38:51.824Z" },
    { role: "assistant", text: "好的。", timestamp: "2026-08-23T08:39:00.000Z" },
  ], { sourceName: "example.jsonl", updatedAt: "2026-08-23T08:40:00.000Z" });

  assert.match(markdown, /^# Session Transcript/m);
  assert.match(markdown, /## User/);
  assert.match(markdown, /## Codex/);
  assert.match(markdown, /请继续/);
  assert.match(markdown, /好的。/);
  assert.doesNotMatch(markdown, /reasoning|tool call|token_count|world_state|function_call/);
});

test("exports a rollout file to Markdown", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rollout-backup-"));
  const inputPath = path.join(directory, "sample.jsonl");
  const outputPath = path.join(directory, "nested", "sample.md");
  fs.writeFileSync(inputPath, `${JSON.stringify({
    timestamp: "2026-08-23T08:38:51.824Z",
    type: "response_item",
    payload: { type: "message", role: "user", content: [{ type: "input_text", text: "问题" }] },
  })}\n`, "utf8");

  const result = exportRolloutFile(inputPath, outputPath);
  assert.equal(result.messageCount, 1);
  assert.equal(fs.existsSync(outputPath), true);
  assert.match(fs.readFileSync(outputPath, "utf8"), /问题/);
});

test("watch launcher writes to the project session_backups directory", () => {
  const script = fs.readFileSync(
    path.resolve("learnMapmost", "start-rollout-backup.ps1"),
    "utf8",
  );

  assert.match(script, /\$OutputPath/);
  assert.match(script, /session_backups/);
  assert.match(script, /--output/);
});
