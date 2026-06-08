# Script Profile Character References Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add script-aware cast extraction, multi-character cinematic character-reference prompts, spatial/story-driven shot text, and image-manifest validation.

**Architecture:** Create a focused `src/script-profile.mjs` module that parses screenplay-like input into cast, beats, scenes, props, and prompts. Keep `draft-writer.mjs` responsible for shot contracts but feed it script profile data instead of generic-only beat strings. Keep `deliverable-writer.mjs` responsible for user-facing packaging and upload budget selection.

**Tech Stack:** Node.js ESM, `node:test`, existing CLI and Markdown artifact writers.

---

### Task 1: Regression tests for script profile behavior

**Files:**
- Modify: `test/draft-writer.test.mjs`
- Modify: `test/ai-short-drama-contract.test.mjs`
- Modify: `test/validator.test.mjs`

- [ ] Add tests that create a contract from the isolated mansion script and assert four characters: 林默, 安娜, 雷队, 阿杰.
- [ ] Assert deliverable/readme include `character-linmo.png`, `character-anna.png`, `character-leidui.png`, `character-ajie.png`.
- [ ] Assert prompts include “上方预留干净信息栏”, “character turnaround”, “prop reference”, and negative prompt terms.
- [ ] Assert personal-summary lines after `以下为个人总结` never enter `shotlist.action`.
- [ ] Assert validator fails when README-listed PNG files are absent.

### Task 2: Add script profile parser

**Files:**
- Create: `src/script-profile.mjs`
- Modify: `src/draft-writer.mjs`

- [ ] Implement `extractScriptProfile(sourceText)`.
- [ ] Parse cast lines matching `姓名（标签）：描述`.
- [ ] Strip personal-summary sections beginning at `以下为个人总结` or repeated dash separators.
- [ ] Parse screenplay beats from `▲ 【画面】`, dialogue speaker blocks, and indented action lines.
- [ ] Add known-profile enrichments for 林默、安娜、雷队、阿杰.
- [ ] Export `isScriptProfileUseful(profile)`.

### Task 3: Use script profile in draft assets

**Files:**
- Modify: `src/draft-writer.mjs`

- [ ] When a script profile has cast and beats, use profile beats instead of raw split strings.
- [ ] For script profile shots, set `action` to the actual visible story event plus spatial/camera intent, not generic blueprint purpose first.
- [ ] Set `shot.characters` to names appearing in that beat, always including the protagonist when present.
- [ ] Set `draft.characters` to script-profile cast profiles with reference prompt metadata.

### Task 4: User-facing multi-character package

**Files:**
- Modify: `src/deliverable-writer.mjs`

- [ ] Replace single generated character reference line with all generated `draft.characters[].reference_image` lines when available.
- [ ] Write one prompt section per character.
- [ ] In each video feed card, upload only relevant character refs that fit the 9-image budget, then scene/style refs if slots remain.
- [ ] Keep upload count <= 9 in all tests.

### Task 5: Validator image manifest check

**Files:**
- Modify: `src/run-validator.mjs`
- Modify: `test/validator.test.mjs`

- [ ] Parse `storyboard-images/README.md` for `storyboard-images/*.png` references.
- [ ] In visual/user-facing validation, error if any listed PNG is missing.
- [ ] Keep draft runs valid when only README placeholders exist if mode cannot be determined as visual.

### Task 6: Verify and regenerate sample

**Files:**
- No production code unless tests reveal defects.

- [ ] Run targeted tests.
- [ ] Run `npm test`.
- [ ] Run a visual compile of `C:\Users\20931\Desktop\AI剧本\片段1.txt` to a temp run with `--emit-internal`.
- [ ] Inspect `deliverable.md` for four character prompt sections and no personal summary pollution.
