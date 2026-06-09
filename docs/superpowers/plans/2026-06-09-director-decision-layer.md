# Director Decision Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add director judgment to Cine Make draft output so it does not merely exhaustively split scripts, but exposes story beats, shot purpose, anchor policy, director cut, environment bibles, quality checks, and AI risk warnings.

**Architecture:** Keep the existing compiler and layered prompt pipeline. Add derived planning layers in `src/deliverable-writer.mjs` from the existing shotlist and contract, and enrich Canvas storyboard metadata in `src/canvas-prompt-pack-exporter.mjs`. Tests assert the new sections and that static keyframe prompts avoid forcing all global anchors into every shot.

**Tech Stack:** Node.js ESM, `node:test`, markdown deliverables, Canvas JSON manifest metadata.

---

### Task 1: Add deliverable tests for director judgment sections

**Files:**
- Modify: `test/deliverable-writer.test.mjs`

- [ ] Write a failing test that runs the draft CLI on an isolated-mansion script and asserts `deliverable.md` contains `SCRIPT_BEATS`, `DIRECTOR_DECISION`, `ENVIRONMENT_BIBLES`, `ANCHOR_POLICY`, `Storyboard Version A: Full Coverage`, `Storyboard Version B: Director Cut`, `QUALITY_CHECK`, and `AI_RISK_WARNINGS`.
- [ ] The same test asserts each Shot Definition includes `shot_function`, `audience_takeaway`, and `visual_priority`.
- [ ] The same test asserts Keyframe prompts do not contain a global "must always show phone/countdown" policy and the document says per shot anchors are limited.
- [ ] Run the focused test and confirm it fails.

### Task 2: Implement derived beat, decision, environment, anchor, and quality sections

**Files:**
- Modify: `src/deliverable-writer.mjs`

- [ ] Add helper functions to derive story beats from shotlist: `beat_id`, `story_function`, `audience_question`, `required_visual_info`, `emotional_pressure`, `can_be_merged`, `must_keep`.
- [ ] Add director decision helpers that explain why each shot stays, what new information it adds, whether emotion escalates, and whether it can merge.
- [ ] Add environment bible array output with stable IDs and `environment_mode` / transition notes when hallucination, corridor, hospital, or reality terms appear.
- [ ] Add anchor policy output with global, character, story, and per-shot anchors; include the rule: each shot has at most one primary anchor and two secondary anchors.
- [ ] Add two storyboard versions: A full coverage and B director cut. Director cut should prefer must-keep shots, new information, reversals, key props, and final hooks.
- [ ] Add quality and AI risk sections checking repeated atmosphere shots, forced anchors, macro/complex action mismatch, wide/text readability mismatch, and overloaded multi-character shots.
- [ ] Run the focused test and confirm it passes.

### Task 3: Add Canvas metadata tests and implementation

**Files:**
- Modify: `test/canvas-prompt-pack.test.mjs`
- Modify: `src/canvas-prompt-pack-exporter.mjs`

- [ ] Add a failing test that storyboard keyframe nodes expose `metadata.cineMake.linkedBeat`, `shotFunction`, `audienceTakeaway`, `environmentId`, and `anchorPolicy`.
- [ ] Implement those fields in manifest and Canvas node metadata.
- [ ] Ensure keyframe prompts remain static and do not contain Motion Prompt / video motion words.
- [ ] Run focused Canvas tests and confirm they pass.

### Task 4: Update documentation and skill guidance

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `skills/cine-make/SKILL.md`
- Modify: `test/content-contract.test.mjs`

- [ ] Add tests requiring `SCRIPT_BEATS`, `DIRECTOR_DECISION`, `Anchor Policy`, `Director Cut`, and `Quality Check` in docs/skill.
- [ ] Update docs to explain that cine-make's next layer is judgment: shot deletion, merge suggestions, per-shot anchor limits, environment arrays, and risk checks.
- [ ] Run focused docs tests and confirm they pass.

### Task 5: Full verification and sample generation

**Files:**
- All touched files

- [ ] Run `node --test test/deliverable-writer.test.mjs test/canvas-prompt-pack.test.mjs test/content-contract.test.mjs`.
- [ ] Run `npm test`.
- [ ] Generate a sample full draft and Canvas storyboard pack from `C:\Users\20931\Desktop\AI剧本` and inspect that the new sections exist and no old motion pollution appears in static keyframe prompts.
