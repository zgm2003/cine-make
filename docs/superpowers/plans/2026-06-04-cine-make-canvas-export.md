# Cine Make Canvas Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `cine-make novel canvas --run <project-dir> --episode <number>` so a Novel Studio episode package can be exported as `canvas-manifest.json` plus a Canvas-importable `canvas-project.zip`.

**Architecture:** Cine Make stays the upstream director engine and owns a semantic `canvas-manifest.json`. A thin adapter converts the manifest into the current `canvas_front_next` zip contract: `projects.json` with `app: "infinite-canvas"`, `version: 3`, one project, text-only nodes, and role-free connections. The command reads only project metadata, accepted summaries, bibles, continuity files, and the existing episode package; it never reads the original whole novel source and never calls image/video APIs.

**Tech Stack:** Node.js ESM, `node:test`, local JSON/Markdown artifacts, a tiny local ZIP writer using stored entries, no database, no Canvas code import, no external API.

---

## Scope

In scope:

- `E:/cine/cine-make/src/novel/canvas-exporter.mjs`
- `E:/cine/cine-make/src/zip-writer.mjs`
- `E:/cine/cine-make/src/cli.mjs`
- `E:/cine/cine-make/test/novel-project-canvas-export.test.mjs`
- README/skill command list only if the CLI surface needs documentation.

Out of scope:

- no `admin_back_go` change;
- no `canvas_front_next` source import or runtime change;
- no `canvas_projects` DB table;
- no generated images or videos;
- no media files in MVP zip.

## File responsibilities

- `src/novel/canvas-exporter.mjs`: validates Novel Studio project/episode package, builds semantic manifest, converts it to Canvas project JSON, writes manifest and zip.
- `src/zip-writer.mjs`: small deterministic ZIP writer for one or more stored file entries; no compression dependency.
- `src/cli.mjs`: parses `novel canvas` flags, calls exporter, prints output paths.
- `test/novel-project-canvas-export.test.mjs`: TDD coverage for manifest, zip contract, CLI behavior, missing package errors, optional Jimeng warning, and no whole-source read.

## Task 1: RED tests for Canvas export contract

**Files:**
- Create: `test/novel-project-canvas-export.test.mjs`

- [ ] Write a test helper that creates a minimal Novel Studio project with `project.json`, `summaries/`, `bible/`, `continuity/`, `episodes/adaptation-plan.json`, and `episodes/episode-0001/episode-input.md` + `deliverable.md` + `jimeng-feed-cards.json`.
- [ ] Add test `exports a semantic manifest and text-only canvas zip from an episode package`.
- [ ] Assert `canvas-manifest.json` has `kind: "cine-make-canvas-manifest"`, semantic roles, material budget 12, warning array, stable node ids, and connections with roles.
- [ ] Extract `projects.json` from `canvas-project.zip` with a test-only ZIP reader and assert:
  - `app === "infinite-canvas"`;
  - `version === 3`;
  - one project exists;
  - `files` is `[]`;
  - every node has `type: "text"`;
  - every node metadata has `content`, `status: "success"`, `fontSize: 14`, `generationMode: "text"`;
  - every connection has exactly `id`, `fromNodeId`, `toNodeId` and no `role`.
- [ ] Run `node --test test/novel-project-canvas-export.test.mjs`.
- [ ] Expected RED: module import or function is missing.

## Task 2: RED tests for errors and optional feed-card warning

**Files:**
- Modify: `test/novel-project-canvas-export.test.mjs`

- [ ] Add test `CLI fails clearly when the episode package is missing`.
- [ ] Add test `missing jimeng feed cards creates warning text instead of failing`.
- [ ] Add test `canvas export does not read source/novel.txt` by creating a throwing/unreadable source sentinel and still expecting success.
- [ ] Run `node --test test/novel-project-canvas-export.test.mjs`.
- [ ] Expected RED: same missing implementation, with tests documenting desired behavior.

## Task 3: Implement deterministic ZIP writer

**Files:**
- Create: `src/zip-writer.mjs`

- [ ] Implement `export function createStoredZip(entries)` accepting `{ name, data }[]`.
- [ ] Reject empty names, duplicate names, names starting with `/`, and path traversal via `..`.
- [ ] Encode strings as UTF-8 buffers.
- [ ] Compute CRC32 locally.
- [ ] Write local file headers, central directory, and end-of-central-directory with store method `0`.
- [ ] Run `node --test test/novel-project-canvas-export.test.mjs`.
- [ ] Expected result: ZIP extraction assertions can now pass once exporter exists.

## Task 4: Implement Canvas manifest/exporter

**Files:**
- Create: `src/novel/canvas-exporter.mjs`

- [ ] Implement `exportNovelCanvas({ runDir, episodeNumber = 1, outDir })`.
- [ ] Validate:
  - `runDir` exists and `project.json.mode === "novel-project"`;
  - `episodeNumber` is a positive integer;
  - `episodes/adaptation-plan.json` exists and has `schemaVersion: 1` plus an episode at that number;
  - episode package dir contains `episode-input.md` and `deliverable.md`.
- [ ] Optional files become warnings, not failures: visual bible, continuity log, unresolved hooks, `jimeng-feed-cards.json`.
- [ ] Build nodes in fixed rows:
  - row 0 overview, continuity, warnings;
  - row 1 characters;
  - row 2 scenes;
  - row 3 shots;
  - row 4 Jimeng feed cards.
- [ ] Use stable ids: `overview`, `continuity`, `warnings`, `character-<slug>`, `scene-<slug>`, `shot-001`, `feed-card-001`.
- [ ] Convert manifest to Canvas project JSON using the real Canvas node/connection shapes.
- [ ] Write `canvas-manifest.json` and `canvas-project.zip` in the episode dir.
- [ ] Run `node --test test/novel-project-canvas-export.test.mjs`.
- [ ] Expected GREEN for exporter tests except CLI wiring.

## Task 5: Wire `novel canvas` CLI

**Files:**
- Modify: `src/cli.mjs`
- Modify if needed: `README.md`, `README.zh-CN.md`, `skills/cine-make/SKILL.md`

- [ ] Import `exportNovelCanvas`.
- [ ] Add usage line: `node src/cli.mjs novel canvas --run <project-dir> --episode <number> [--out <episode-dir>]`.
- [ ] Add `canvas` subcommand with allowed flags `--run`, `--episode`, `--out`; require `--run` and `--episode`.
- [ ] Print:
  - `Cine Make exported canvas project:`;
  - `- manifest: <path>`;
  - `- canvas zip: <path>`;
  - warnings count if non-zero.
- [ ] Run `node --test test/novel-project-canvas-export.test.mjs`.
- [ ] Expected GREEN.

## Task 6: Full verification

- [ ] Run `npm test` in `E:/cine/cine-make`.
- [ ] Run `npm pack --dry-run` in `E:/cine/cine-make`.
- [ ] Run `git diff --check` in `E:/cine/cine-make`.
- [ ] Inspect `git -C E:/cine/cine-make diff --stat`.
- [ ] Do not claim Canvas runtime smoke unless the zip is manually imported through the running Canvas UI.

## Self-review

Spec coverage:

- Manifest and zip outputs: Task 1, Task 4.
- Real Canvas import shape: Task 1, Task 4.
- Text-only MVP nodes: Task 1, Task 4.
- Stable ids and deterministic layout: Task 1, Task 4.
- CLI behavior: Task 5.
- No whole-source read: Task 2.
- Missing optional files as warnings: Task 2, Task 4.
- Unsupported manifest-only fields not copied to Canvas zip: Task 1, Task 4.

No DB/API/runtime coupling is included. No placeholders are left for implementation choices.
