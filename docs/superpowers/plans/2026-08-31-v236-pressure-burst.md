# v2.3.6 Pressure Burst Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a deliberately versioned pressure-workload revision that makes request-pressure exposure more repeatable before Android or confirmatory collection.

**Architecture:** Add `pressureBurst` as a separate scenario instead of silently changing the existing `burst` workload. Keep controller thresholds, SSE ladder, datasets, baselines, frame budget, rolling window, and statistical plan unchanged. Bump the protocol to `2.3.6` so new pilot records stay separated from v2.3.5 audit evidence.

**Tech Stack:** JavaScript modules, Node test runner, Playwright E2E, Python unittest analysis.

**Spec:** `DECISIONS.md` D-023 and the user-approved in-chat design on 2026-08-31.

## Global Constraints

- Do not start Android or confirmatory collection in this implementation turn.
- Do not delete invalid JSON runs.
- Do not change the SSE ladder `[4, 6, 8, 12, 16, 24, 32, 48, 64]`.
- Do not change `frameBudgetMs`, `windowMs`, `controlIntervalMs`, prediction horizon, PI settings, D1/D2 datasets, or Proposed controller thresholds.
- Any new physical evidence must use protocol `2.3.6` and remain pilot evidence until explicitly frozen.

---

### Task 1: Protocol and Queue Contract

**Files:**
- Modify: `learnMapmost/tests/experiment-config.test.mjs`
- Modify: `learnMapmost/experiment-config.mjs`

**Interfaces:**
- Consumes: `FROZEN_PROTOCOL`, `buildD1S2PilotQueue()`, `buildD1S2PressureProbeQueue()`, `createRunManifest()`
- Produces: protocol `2.3.6`, scenario list containing `pressureBurst`, pilot/probe queues using `pressureBurst`

- [x] **Step 1: Write failing tests** for protocol version, scenario registration, and D1/S2 pilot/probe queues.
- [x] **Step 2: Run `node --test learnMapmost/tests/experiment-config.test.mjs` and confirm red.**
- [x] **Step 3: Bump protocol and queue scenario to `pressureBurst`.**
- [x] **Step 4: Run the test and confirm green.**

### Task 2: Pressure Burst Camera Path

**Files:**
- Modify: `learnMapmost/tests/scenario-driver.test.mjs`
- Modify: `learnMapmost/scenario-driver.mjs`

**Interfaces:**
- Consumes: `buildScenarioTimeline("pressureBurst")`
- Produces: `getScenarioFrame("pressureBurst", elapsedMs, seed)` with four cycles of 4-second approach and 6-second near-view hold

- [x] **Step 1: Write failing tests** requiring `pressureBurst` to have four interaction and four recovery phases, 4,000 ms approach, 6,000 ms hold, and a closer hold than `burst`.
- [x] **Step 2: Run scenario tests and confirm red.**
- [x] **Step 3: Implement `pressureBurst` frame generation without changing `burst`.**
- [x] **Step 4: Run scenario tests and confirm green.**

### Task 3: UI and Records

**Files:**
- Modify: `learnMapmost/lod-benchmark.html`
- Modify: `learnMapmost/DECISIONS.md`
- Modify: `learnMapmost/PROJECT_STATE.md`
- Modify: `learnMapmost/TODO.md`
- Modify: `learnMapmost/CHANGELOG.md`
- Modify: `learnMapmost/RUNBOOK.md`
- Modify: `learnMapmost/HANDOFF.md`

**Interfaces:**
- Consumes: protocol/scenario implementation from Tasks 1 and 2
- Produces: visible UI scenario option and auditable records for v2.3.6

- [x] **Step 1: Add UI option `S3 Pressure burst`.**
- [x] **Step 2: Record D-024 for the v2.3.6 pressureBurst protocol.**
- [x] **Step 3: Update current status, remaining tasks, and handoff prompt.**
- [x] **Step 4: Keep Android and confirmatory collection blocked.**

### Task 4: Verification

**Files:**
- Check: all modified files and generated analysis outputs

**Interfaces:**
- Consumes: Tasks 1-3
- Produces: fresh verification evidence

- [x] **Step 1: Run `npm.cmd test`.**
- [x] **Step 2: Run `npm.cmd run test:lod:py`.**
- [x] **Step 3: Run `npm.cmd run lod:analyze`.**
- [x] **Step 4: Run `npm.cmd run lod:verify-data`.**
- [x] **Step 5: Run UI/E2E checks where the sandbox permits; if Playwright needs elevation, use the approved path.**
- [x] **Step 6: Run `git diff --check`.**
- [x] **Step 7: Run `npm.cmd run lod:backup`.**
