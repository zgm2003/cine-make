# Preproduction Graph v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `canvas-pack` from a flat prompt package into an AI film pre-production graph covering Script Breakdown, World Bible, Character Bible, Environment Bible, Art Direction, Shot List, and Keyframe tasks.

**Architecture:** Build a small `PreproductionGraph` data model from the existing draft assets, then export that graph to Canvas v3. Bible and shot nodes are text context nodes; keyframe nodes are image-generation nodes that depend only on the exact upstream bible/shot resources they need. Video generation and post-production remain out of scope.

**Tech Stack:** Node.js ESM, existing `node:test`, existing Canvas v3 import zip writer.

---

### Task 1: Red test for preproduction hierarchy

**Files:**
- Modify: `test/canvas-prompt-pack.test.mjs`

- [ ] Replace flat-role assertions with roles: `script_breakdown`, `world_bible`, `character_bible`, `environment_bible`, `prop_bible`, `art_direction`, `shot`, `keyframe`.
- [ ] Assert no `video_segment` nodes exist by default.
- [ ] Assert `shot-s02` is a text node and `keyframe-s02` is an image node.
- [ ] Run `node --test test/canvas-prompt-pack.test.mjs`; expected FAIL because exporter still emits old flat roles.

### Task 2: Implement graph model in exporter

**Files:**
- Modify: `src/canvas-prompt-pack-exporter.mjs`

- [ ] Build manifest from a preproduction graph sequence: script breakdown → world bible → character/environment/prop bible → art direction → shot text nodes → keyframe image nodes.
- [ ] Keep keyframe edges narrow: character only if shot uses that character; prop only if trigger appears; environment and art direction connect to every keyframe.
- [ ] Do not create video nodes.
- [ ] Run `node --test test/canvas-prompt-pack.test.mjs`; expected PASS.

### Task 3: CLI and docs guardrails

**Files:**
- Modify: `test/compile.test.mjs`
- Modify: `test/content-contract.test.mjs`
- Modify: `skills/cine-make/SKILL.md`
- Modify: `README.zh-CN.md`

- [ ] Assert generated pack still has no `storyboard-images/`.
- [ ] Assert docs mention `World Bible`, `Art Direction`, and `Keyframes` for `canvas-pack`.
- [ ] Update docs only after tests fail.
- [ ] Run `node --test test/compile.test.mjs test/content-contract.test.mjs`; expected PASS.

### Task 4: Verification

- [ ] Run `node --test test/canvas-prompt-pack.test.mjs test/compile.test.mjs test/content-contract.test.mjs`.
- [ ] Run `npm test`.
- [ ] Re-export `C:/Users/20931/Desktop/AI剧本/片段1.txt` to `.cine-make-runs/gudao-suiyi-episode-01-canvas-pack`.
- [ ] Inspect manifest role counts and sample keyframe dependencies.
