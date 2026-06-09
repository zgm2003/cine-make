# Director Judgment V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Cine Make draft mode's existing director layers produce real beat grouping, concrete keep/merge/delete/rewrite decisions, functional anchors, structured AI risks, and localized keyframe prompts.

**Architecture:** Keep the compiler deterministic. Add analysis helpers in `src/deliverable-writer.mjs` that derive narrative beats, decisions, density, text/dialogue policies, risk checks, and localized keyframe prompts from the current shotlist. Mirror the same decision/anchor/keyframe prompt helpers in `src/canvas-prompt-pack-exporter.mjs` so Canvas storyboard nodes carry consistent metadata.

**Tech Stack:** Node.js ESM, `node:test`, markdown deliverables, Canvas JSON manifest metadata.

---

### Task 1: RED tests for real narrative beats and decisions

**Files:**
- Modify: `test/deliverable-writer.test.mjs`

- [ ] Add a test using the isolated mansion script that asserts `SCRIPT_BEATS` contains `script_source`, `recommended_shots`, and `can_merge_with`.
- [ ] Assert Beat count is lower than Shot Definition count for the 16-shot first episode.
- [ ] Assert Beat headers are not formatted as `B01 -> S01`.
- [ ] Assert `DIRECTOR_DECISION` contains `decision: keep`, `decision: merge`, and `decision: rewrite`.
- [ ] Assert specific decisions mention S07 merging/rewrite for Anna hot-water beat, S08 keep for Ajie weak disguise, S13/S14 Ajie visual priority, and S04 text readability rewrite.
- [ ] Run: `node --test test/deliverable-writer.test.mjs --test-name-pattern "director judgment v2"`
- [ ] Expected: FAIL because current output is still one beat per shot and decisions are templated.

### Task 2: Implement beat grouping and concrete decisions

**Files:**
- Modify: `src/deliverable-writer.mjs`

- [ ] Add `deriveStoryBeats(shotlist)` that groups shots by story function and cue patterns instead of one beat per shot.
- [ ] Add `beatForShotId(beats, shotId)` to link shots back to grouped beats.
- [ ] Rewrite `composeScriptBeats()` to output grouped YAML-like beats with `script_source`, `required_visual_info`, `recommended_shots`, and `can_merge_with`.
- [ ] Add decision helpers: `shotRiskProfile`, `directorDecisionForShot`, `mergeTargetForShot`, `rewriteNoteForShot`.
- [ ] Rewrite `composeDirectorDecision()` to output `decision`, `problem`, `merge_into`, `reason`, and `rewrite_note`.
- [ ] Update `composeShotDefinitionLine()` linked beat from `B${index}` to grouped beat id.
- [ ] Run the focused test and confirm it passes.

### Task 3: RED tests for anchors, risk checks, text/dialogue policy, and localized prompts

**Files:**
- Modify: `test/deliverable-writer.test.mjs`

- [ ] Assert `TEXT_READABILITY_POLICY`, `DIALOGUE_POLICY`, and `SHOT_DENSITY_CONTROLLER` exist in draft output.
- [ ] Assert `ANCHOR_POLICY` contains function-specific anchors:
  - S05 primary=四人空间棋盘
  - S07 primary=热水杯
  - S13/S14 primary=阿杰嘴角/诡异眼神
  - S15 primary=手机 00:00:00
- [ ] Assert `AI_RISK_WARNINGS` contains structured risk blocks with `risk_type`, `severity`, `problem`, `fix`.
- [ ] Assert risks include `macro_action_conflict`, `text_readability_conflict`, `multi_character_spatial_conflict`, and `visual_priority_mismatch`.
- [ ] Assert `QUALITY_CHECK` contains `status: fail`, `status: warning`, or `status: pass`.
- [ ] Assert Keyframe prompt section does not repeat the full global style string and S04 prompt uses `tight insert` / `close-up`.
- [ ] Run focused test and confirm it fails before implementation.

### Task 4: Implement smarter anchors, risks, policies, quality, and keyframe localization

**Files:**
- Modify: `src/deliverable-writer.mjs`

- [ ] Add `anchorPolicyForShotSmart(shot)` using shot action + function + text readability cues instead of raw character keyword priority.
- [ ] Replace `anchorsForShot()` output with smart anchors.
- [ ] Add `composeTextReadabilityPolicy()`.
- [ ] Add `composeDialoguePolicy(shotlist)` including compressed long-line suggestions.
- [ ] Add `composeShotDensityController(contract, shotlist)`.
- [ ] Replace `composeAIRiskWarnings()` with structured risk output.
- [ ] Replace `composeQualityCheck()` with status sections and concrete issue lists.
- [ ] Rewrite `composeStaticKeyframePrompt()` to use localized lines and avoid repeating `contract.target.style`.
- [ ] Run focused tests and confirm they pass.

### Task 5: Canvas metadata and prompt parity

**Files:**
- Modify: `test/canvas-prompt-pack.test.mjs`
- Modify: `src/canvas-prompt-pack-exporter.mjs`

- [ ] Add tests asserting Canvas keyframe metadata for early S01 is not forced to countdown phone, S13/S14 are Ajie-focused, and S15 is phone countdown when present.
- [ ] Add tests asserting Canvas keyframe prompts do not contain the full global style string repeatedly.
- [ ] Implement Canvas helper parity for grouped beat ids, shot function, audience takeaway, smart anchor policy, and localized keyframe prompt.
- [ ] Run `node --test test/canvas-prompt-pack.test.mjs` and confirm it passes.

### Task 6: Docs and full verification

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `skills/cine-make/SKILL.md`
- Modify: `test/content-contract.test.mjs`

- [ ] Update docs to say the next layer is smarter judgment, not more layers.
- [ ] Mention real narrative beats, `keep / merge / delete / rewrite`, `TEXT_READABILITY_POLICY`, `DIALOGUE_POLICY`, structured `QUALITY_CHECK`, and localized Keyframe prompts.
- [ ] Add docs contract assertions for these phrases.
- [ ] Run focused tests: `node --test test/deliverable-writer.test.mjs test/canvas-prompt-pack.test.mjs test/content-contract.test.mjs`.
- [ ] Run full test suite: `npm test`.
- [ ] Generate sample from `C:\Users\20931\Desktop\AI剧本` and verify:
  - Beat count < shot count.
  - S04 gets text readability warning/rewrite.
  - S07/S13/S14/S15 anchors are function-correct.
  - Canvas manifest has no forced global phone anchor except actual phone shots.

