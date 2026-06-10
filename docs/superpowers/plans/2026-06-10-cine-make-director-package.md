# Cine Make Director Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a structured CINE-MAKE director package to the generation kernel and render `deliverable.md` with the fixed 6-section AI漫剧导演系统 output.

**Architecture:** Add compatible helpers in `src/draft-writer.mjs` that derive project understanding, global style, asset plan, director atoms, formal storyboards, and consistency reminders from the existing contract/shotlist/characters. Add rendering helpers in `src/deliverable-writer.mjs` that use these fields for the user-facing entry while preserving existing image/video feed pack behavior.

**Tech Stack:** Node.js ESM, built-in `node:test`, existing Cine Make CLI and writer modules.

---

### Task 1: Add failing tests for director package data

**Files:**
- Modify: `test/draft-writer.test.mjs`

- [ ] **Step 1: Write tests asserting `composeDraftAssets` returns structured director fields.**
- [ ] **Step 2: Run targeted test and confirm it fails because fields are missing.**

Run: `node --test test/draft-writer.test.mjs`
Expected before implementation: FAIL matching missing `projectUnderstanding`, `directorAtoms`, or `formalStoryboards`.

### Task 2: Add failing tests for 6-section deliverable output

**Files:**
- Modify: `test/deliverable-writer.test.mjs`

- [ ] **Step 1: Assert generated `deliverable.md` contains `# 1. 项目理解` through `# 6. 一致性提醒`.**
- [ ] **Step 2: Assert `【分镜1】` contains `镜头分析`、`即梦静帧提示词`、`即梦视频提示词`.**
- [ ] **Step 3: Run targeted test and confirm it fails before implementation.**

Run: `node --test test/deliverable-writer.test.mjs`
Expected before implementation: FAIL because current deliverable starts with old headings.

### Task 3: Implement director package builders

**Files:**
- Modify: `src/draft-writer.mjs`

- [ ] **Step 1: Add helper functions for topic/world/style/props/effects inference.**
- [ ] **Step 2: Add `composeDirectorPackage(contract, { shotlist, characters })`.**
- [ ] **Step 3: Attach the new fields in both normal and explicit-storyboard `composeDraftAssets` return paths.**
- [ ] **Step 4: Run `node --test test/draft-writer.test.mjs` and make it pass.**

### Task 4: Render CINE-MAKE 6-section deliverable

**Files:**
- Modify: `src/deliverable-writer.mjs`

- [ ] **Step 1: Add render helpers for project understanding, global style, asset plan, director atoms, formal storyboards, and consistency checklist.**
- [ ] **Step 2: Update normal and explicit deliverable composition so the user-facing top-level structure is the 6 fixed sections.**
- [ ] **Step 3: Preserve operational image queue/video feed pack text inside section 5 or after formal storyboard details.**
- [ ] **Step 4: Run `node --test test/deliverable-writer.test.mjs` and make it pass.**

### Task 5: Full verification

**Files:**
- All changed files

- [ ] **Step 1: Run full test suite.**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run a sample CLI draft generation and inspect `deliverable.md` headings.**

Run: `node src/cli.mjs --mode draft --out .cine-make-runs/director-package-smoke --aspect 9:16 "小说片段：雨夜里，少年在旧楼道收租，门缝里出现和同班校花一模一样的少女。"`
Expected: output contains the 6 fixed sections and `storyboard-images/README.md`.
