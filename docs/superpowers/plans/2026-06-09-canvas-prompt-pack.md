# Canvas Prompt Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a text-only Canvas import package that turns Cine Make draft data into independent character, scene, prop, shot, and video prompt nodes for manual generation.

**Architecture:** Reuse `createInputContract()` and `composeDraftAssets()` to preserve existing script parsing and shot pacing. Add a focused canvas prompt-pack exporter that writes `canvas-manifest.json`, `prompt-pack.md`, `README.md`, and `canvas-project.zip` using Canvas v3 `projects.json`. Do not generate images, do not create `storyboard-images/`, and connect nodes only when a downstream node actually needs a resource.

**Tech Stack:** Node.js ESM, `node:test`, existing stored zip writer, Canvas v3 project schema from `E:/admin_go/canvas_front_next`.

---

### Task 1: Exporter behavior test

**Files:**
- Create: `test/canvas-prompt-pack.test.mjs`
- Create: `src/canvas-prompt-pack-exporter.mjs`

- [ ] **Step 1: Write the failing test**

Create `test/canvas-prompt-pack.test.mjs` that builds an input contract from the isolated mansion script, calls `exportCanvasPromptPack({ outDir, contract })`, reads `canvas-manifest.json`, and reads `projects.json` from `canvas-project.zip`. Assert:

```js
assert.equal(manifest.kind, 'cine-make-canvas-prompt-pack')
assert.equal(manifest.packageType, 'manual_canvas_generation')
assert.equal(existsSync(join(out, 'storyboard-images')), false)
assert.equal(projectsJson.app, 'infinite-canvas')
assert.equal(projectsJson.version, 3)
assert.deepEqual(projectsJson.projects[0].files, [])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/canvas-prompt-pack.test.mjs`
Expected: FAIL because `src/canvas-prompt-pack-exporter.mjs` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/canvas-prompt-pack-exporter.mjs` with `exportCanvasPromptPack()` that writes a valid zip and minimal manifest/project.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/canvas-prompt-pack.test.mjs`
Expected: PASS.

### Task 2: Node graph semantics

**Files:**
- Modify: `test/canvas-prompt-pack.test.mjs`
- Modify: `src/canvas-prompt-pack-exporter.mjs`

- [ ] **Step 1: Add failing graph assertions**

Assert separate node roles exist: `character`, `scene`, `prop`, `shot`, `video_segment`. Assert `character-linmo`, `character-anna`, `character-leidui`, `character-ajie`, `scene-island-villa-living-room-night`, and `shot-s02` exist as Canvas nodes.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/canvas-prompt-pack.test.mjs`
Expected: FAIL because the exporter only writes a minimal graph.

- [ ] **Step 3: Implement resource graph**

Build nodes from `draft.characters`, script text, and `draft.shotlist`. Keep resource cards as text nodes. Keep shot nodes as image nodes with `metadata.prompt`. Keep video segment nodes as video nodes with `metadata.prompt`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/canvas-prompt-pack.test.mjs`
Expected: PASS.

### Task 3: Dependency-only edges

**Files:**
- Modify: `test/canvas-prompt-pack.test.mjs`
- Modify: `src/canvas-prompt-pack-exporter.mjs`

- [ ] **Step 1: Add failing edge assertions**

Assert `character-linmo -> shot-s02` exists, `character-anna -> shot-s02` does not exist, `scene-island-villa-living-room-night -> shot-s02` exists, and `shot-s01..shot-s04 -> video-segment-01` exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/canvas-prompt-pack.test.mjs`
Expected: FAIL because dependency filtering is not implemented.

- [ ] **Step 3: Implement explicit dependency detection**

Use shot `characters` plus action text to connect only named characters. Connect the primary scene to every shot. Connect prop cards only when their trigger appears in shot text. Connect only shots in a segment to its video node.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/canvas-prompt-pack.test.mjs`
Expected: PASS.

### Task 4: CLI command

**Files:**
- Modify: `test/compile.test.mjs`
- Modify: `src/cli.mjs`

- [ ] **Step 1: Add failing CLI test**

Add a test that runs:

```bash
node src/cli.mjs canvas-pack --input <script> --out <tmp>
```

Assert exit 0, `canvas-project.zip` exists, `canvas-manifest.json` exists, `storyboard-images/` does not exist, stdout mentions `manual Canvas generation`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/compile.test.mjs`
Expected: FAIL because `canvas-pack` is not parsed.

- [ ] **Step 3: Implement CLI branch**

Add `canvas-pack` to top-level CLI routing before normal make mode. Parse normal make flags through `parseArgs()`, create contract, call `exportCanvasPromptPack()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/compile.test.mjs`
Expected: PASS.

### Task 5: Full verification

**Files:**
- No production changes unless tests expose a real issue.

- [ ] Run `node --test test/canvas-prompt-pack.test.mjs test/compile.test.mjs`.
- [ ] Run `npm test`.
- [ ] Run one real export using `C:/Users/20931/Desktop/AI剧本/片段1.txt` to `.cine-make-runs/gudao-suiyi-episode-01-canvas-pack`.
- [ ] Inspect `canvas-manifest.json` and `canvas-project.zip` paths.
