# Layered Cinematic Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace novel-like monolithic video/keyframe prompts with a layered cinematic pipeline: persistent bibles, static shot definitions, image-only keyframe prompts, and concise motion prompts.

**Architecture:** Keep the existing Cine Make compiler flow, but change output composition in `src/draft-writer.mjs`, `src/deliverable-writer.mjs`, and `src/canvas-prompt-pack-exporter.mjs`. The bibles carry global/character/scene/style rules once; individual shots carry only local static or motion information. Canvas storyboard append packages should add static Keyframe nodes only, with optional motion prompt data in metadata, not as direct image prompt pollution.

**Tech Stack:** Node.js ESM, built-in `node:test`, markdown deliverables, JSON canvas manifests.

---

### Task 1: Add regression tests for layered deliverable output

**Files:**
- Modify: `test/deliverable-writer.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests that run the draft CLI on a dense psychological thriller source and assert:

```js
assert.match(deliverable, /## DIRECTOR_BIBLE/)
assert.match(deliverable, /## CHARACTER_BIBLE/)
assert.match(deliverable, /## SCENE_BIBLE/)
assert.match(deliverable, /## ART_DIRECTION/)
assert.match(deliverable, /## STORYBOARD：Shot Definition/)
assert.match(deliverable, /## KEYFRAME_PROMPTS/)
assert.match(deliverable, /## MOTION_PROMPTS/)
assert.ok(deliverable.indexOf('## KEYFRAME_PROMPTS') < deliverable.indexOf('## MOTION_PROMPTS'))
assert.doesNotMatch(deliverable, /按精简分镜顺序生成 .*；.*；.*；/u)
assert.doesNotMatch(deliverable, /表情克制，眉眼和手部先于身体动作泄露情绪/u)
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test test/deliverable-writer.test.mjs --test-name-pattern layered`
Expected: FAIL because current deliverable lacks the layered section headings.

- [ ] **Step 3: Implement minimal deliverable changes**

Update `composeDeliverable` so draft/visual output includes the seven layered sections and video feed cards reference concise per-shot motion prompts.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test test/deliverable-writer.test.mjs --test-name-pattern layered`
Expected: PASS.

---

### Task 2: Add regression tests for static Canvas keyframe prompts

**Files:**
- Modify: `test/canvas-prompt-pack.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests for `canvas-storyboard-pack` manifest nodes:

```js
assert.equal(keyframe.metadata?.cineMake?.promptLayer, 'keyframe_static')
assert.doesNotMatch(keyframe.prompt, /breathing becomes|二级动画|slow push-in.*breathing|视频|motion/iu)
assert.match(keyframe.prompt, /Static Shot Definition|single cinematic keyframe/iu)
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test test/canvas-prompt-pack.test.mjs --test-name-pattern static`
Expected: FAIL because current keyframe nodes do not expose `promptLayer` and may mix motion language.

- [ ] **Step 3: Implement Canvas prompt changes**

Change `composeKeyframePrompt` to static image-only language. Add metadata `cineMake.promptLayer = 'keyframe_static'`; if motion is needed, place concise motion text in `cineMake.motionPrompt` metadata instead of the image prompt.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test test/canvas-prompt-pack.test.mjs --test-name-pattern static`
Expected: PASS.

---

### Task 3: Update docs and skill guidance

**Files:**
- Modify: `README.zh-CN.md`
- Modify: `README.md`
- Modify: `skills/cine-make/SKILL.md`

- [ ] **Step 1: Add tests for docs contract**

Update `test/content-contract.test.mjs` assertions to require layered pipeline wording: `DIRECTOR_BIBLE`, `Shot Definition`, `Motion Prompt`, and “global rules are not repeated per shot”.

- [ ] **Step 2: Run docs tests RED**

Run: `node --test test/content-contract.test.mjs --test-name-pattern layered`
Expected: FAIL until docs are changed.

- [ ] **Step 3: Update docs**

Document that bibles are persistent and shot prompts are local/minimal. Clarify that Keyframe prompts are static image prompts; Motion prompts are video-model state transitions.

- [ ] **Step 4: Run docs tests GREEN**

Run: `node --test test/content-contract.test.mjs --test-name-pattern layered`
Expected: PASS.

---

### Task 4: Full verification

**Files:**
- All touched files

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test test/deliverable-writer.test.mjs test/canvas-prompt-pack.test.mjs test/content-contract.test.mjs
```

Expected: all pass.

- [ ] **Step 2: Run complete test suite**

Run: `npm test`
Expected: 112+ tests pass, 0 fail.

- [ ] **Step 3: Manual output smoke test**

Run draft and canvas-storyboard-pack on `C:\Users\20931\Desktop\AI剧本\片段1.txt`; inspect generated `deliverable.md` and `canvas-manifest.json` for layered headings and static keyframe metadata.
