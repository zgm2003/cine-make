# Cine Make Novel Studio MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new project-level Cine Make Novel Studio pipeline that turns long novels or long scripts into durable AI anime-drama production assets: chapter summaries, series bible, character/visual bible, episode plan, episode packages, and continuity logs.

**Architecture:** The CLI owns deterministic local file processing: splitting, hashing, manifests, validation, task prompt generation, and project artifact management. Codex/AI only reads bounded chunks and generated summaries, never the whole 10MB source at once. Existing `draft` and `visual` flows become the episode compiler used by the new project pipeline.

**Tech Stack:** Node.js ESM, `node:test`, JSON/JSONL/Markdown artifacts, existing `src/cli.mjs`, existing `skills/cine-make/SKILL.md`, no database and no external API in the first version.

---

## Product Decision

Long novels must be treated as projects, not as one prompt. A 10MB `.txt` is too large and too noisy for one Codex context, so the local compiler should read it from disk, split it into stable source units, and produce bounded tasks that Codex can process one at a time.

Default style remains anime / 二次元 / 非真人写实. Users should be able to provide a novel file path and get a project workspace:

```bash
cine-make novel ingest --input ./novel.txt --out .cine-make-runs/my-novel
```

The normal single-episode output rule still stands: `deliverable.md` plus `storyboard-images/`. Project mode is different: it intentionally exposes project artifacts such as chapter summaries, character bibles, episode plans, and continuity logs because those are the working materials needed for a whole novel.

## New Project Boundary

Treat this as a new product surface inside the existing npm package, not as a small tweak to `SKILL.md`.

The new surface is **Cine Make Novel Studio**:

- it accepts long-form source files instead of short inline prompts;
- it creates a durable project workspace instead of a one-off run folder;
- it separates ingest, understanding, bible, episode, visual, and continuity phases;
- it keeps renderer-specific feed cards as adapters, not as the source of truth;
- it reuses the existing short-script compiler only at the episode-export boundary.

The existing `cine-make --mode draft|visual` commands stay valid and should not change behavior for short scripts.

## Operating Model

Novel mode is a long-form IP adaptation production line. It should preserve character identity, costume continuity, open hooks, pacing, and visual locks across many episodes.

Use six layers:

1. **Source layer:** novel text, long script, setting notes, side stories, author notes.
2. **Understanding layer:** chapter summaries, beats, character appearances, locations, props, powers, hooks.
3. **Bible layer:** series bible, character bible, visual bible, timeline, unresolved hooks.
4. **Episode layer:** 1-3 minute episodes with one main conflict, one payoff, and one ending hook.
5. **Storyboard layer:** shot table, dialogue, image prompts, character references, scene references.
6. **Production layer:** still images, short video clips, voice, sound, editing, subtitles, covers.

Cine Make owns layers 1-5 and prepares production handoff data for layer 6. It must not claim ownership of final video rendering.

## Product Modes

| Mode | Input | Output | Status |
| --- | --- | --- | --- |
| Short Script Mode | one episode script, short story, ad script | existing `deliverable.md` + `storyboard-images/` | keep current `draft` / `visual` flow |
| Novel Studio MVP | whole novel, long script, large `.txt` | project workspace, bibles, episode plan, episode packages | implement in this plan |
| IP Studio Mode | multiple projects/assets over time | asset library, release calendar, A/B packages, multi-renderer versions | future product, not MVP |

Version 1 should build Novel Studio MVP without weakening Short Script Mode.

## Renderer Volatility

Video renderers should stay at the edge of the system. The project workspace should store platform-neutral story, continuity, character, and visual assets. Current Cine Make episode deliverables can still emit Jimeng feed cards because that is the existing product boundary, but project-mode artifacts should not hard-code Jimeng, Sora, or any other renderer as the long-term source of truth.

This is a practical risk control: official OpenAI help documentation says Sora web/app experiences were discontinued on April 26, 2026 and the Sora API will be discontinued on September 24, 2026. Renderer availability changes faster than story assets, so the durable asset pipeline must be renderer-agnostic.

## Jimeng Feed Card Constraint

Jimeng feed cards should be modeled as a bounded multimodal reference budget, not as an unlimited image list. Treat each generation as having at most 12 reference material slots total. Images, videos, and audio references all consume that budget.

Each feed card should carry a structured material list:

```json
{
  "renderer": "jimeng",
  "maxReferenceMaterials": 12,
  "materials": [
    {
      "ref": "@Image1",
      "type": "image",
      "role": "character_lock",
      "path": "storyboard-images/character-reference.png"
    },
    {
      "ref": "@Video1",
      "type": "video",
      "role": "motion_reference",
      "path": "references/action-reference.mp4"
    },
    {
      "ref": "@Audio1",
      "type": "audio",
      "role": "voice_reference",
      "path": "references/voice-reference.wav"
    }
  ],
  "prompt": "@Image1 模仿 @Video1 的动作，音色参考 @Audio1。保持角色发型、服装、道具和本集连续性。"
}
```

Default Cine Make output can stay image-first, but it must budget slots explicitly:

- character reference: 0-1 slot;
- scene/style reference: 0-2 slots;
- start frame: 1 slot;
- end frame: 1 slot;
- storyboard/keyframe stills: remaining slots;
- optional motion video reference: 1 slot;
- optional voice/audio reference: 1 slot.

If audio or video references are present, reduce storyboard image count so the total stays at or under 12. For multi-segment episodes, carry continuity by reusing the prior segment's end frame as the next segment's start frame instead of adding a new extra start image.

## Non-Goals

- Do not make Codex read the full novel in one prompt.
- Do not call external LLM, image, or video APIs.
- Do not generate final MP4 video.
- Do not generate tri-view character art for every named person.
- Do not add SQLite, vector search, Redis, or a web UI in version 1.
- Do not replace the existing `draft` and `visual` commands; project mode feeds them.
- Do not promise "upload a novel and automatically generate 100 finished episodes."

## Project Artifact Layout

```text
.cine-make-runs/my-novel/
  project.json
  source/
    novel.txt
    source-manifest.json
  chapters/
    chapter-0001.txt
    chapter-0002.txt
  chunks/
    chunk-000001.json
    chunk-000002.json
  summaries/
    chapter-0001.summary.json
    chapter-0002.summary.json
  tasks/
    summarize-chapter-0001.md
    summarize-chapter-0002.md
    build-series-bible.md
    build-episode-plan.md
  bible/
    series-bible.md
    characters.json
    locations.json
    timeline.md
    visual-bible.md
  visual-bible/
    character-reference-plan.md
    character-triview-prompts.md
  episodes/
    episode-0001/
      episode-input.md
      deliverable.md
      storyboard-images/
    episode-0002/
      episode-input.md
      deliverable.md
      storyboard-images/
  continuity/
    continuity-log.md
    unresolved-hooks.json
```

## Data Contracts

### `project.json`

```json
{
  "schemaVersion": 1,
  "mode": "novel-project",
  "title": "source-derived-title",
  "defaultStyle": "动漫二次元，非真人写实，电影感漫剧，克制表演",
  "source": {
    "inputPath": "source/novel.txt",
    "sha256": "hex",
    "byteLength": 0,
    "encoding": "utf8"
  },
  "counts": {
    "chapters": 0,
    "chunks": 0,
    "summaries": 0,
    "plannedEpisodes": 0
  },
  "createdAt": "2026-06-04T00:00:00.000Z"
}
```

### Chapter Summary JSON

```json
{
  "schemaVersion": 1,
  "chapterId": "chapter-0001",
  "sourceSpan": {
    "startByte": 0,
    "endByte": 0
  },
  "title": "第一章",
  "summary": "本章剧情摘要，不复制长段原文。",
  "beats": [
    {
      "order": 1,
      "event": "发生了什么",
      "characters": ["主角"],
      "location": "地点",
      "conflict": "冲突",
      "hook": "钩子或伏笔"
    }
  ],
  "characters": [
    {
      "name": "人物名",
      "roleSignal": "主角/配角/反派/路人",
      "firstAppearance": true,
      "visualHints": ["发型", "服装", "武器"],
      "relationshipHints": ["与主角的关系"]
    }
  ],
  "locations": ["地点"],
  "propsOrPowers": ["道具/功法/能力"],
  "openQuestions": ["未解释信息"],
  "adaptationNotes": ["改编成漫剧时要保留或压缩的点"]
}
```

### Character Tier Policy

Only stable, recurring characters get visual reference work.

| Tier | Who | Visual Output |
| --- | --- | --- |
| S | protagonist, heroine, long-term core antagonist | tri-view prompt, expression sheet prompt, costume/prop lock |
| A | mentor, long-term teammate, major arc antagonist | front-view prompt, expression/costume notes |
| B | recurring but arc-limited character | text visual anchor only |
| C | one-off character or crowd role | no dedicated image prompt |

### Episode Package Contract

Each exported episode should create a fixed reviewable package:

```text
# Episode 0001: <title>

## 本集目标
主角要做什么，观众为什么要看。

## 本集摘要
100-200 字，说明本集主线。

## 改编来源
- chapter-0001
- chapter-0002 selected beats

## 出场角色
- name: state, costume, emotion, purpose in this episode

## 场景列表
1. location and purpose

## 镜头表
| 镜头 | 时长 | 景别 | 画面 | 动作 | 台词 | 音效 | 备注 |
|---|---:|---|---|---|---|---|---|

## 视觉提示词
角色 prompt、场景 prompt、镜头 prompt。

## 结尾钩子
最后 5-10 秒的强悬念。

## 连续性检查
- 角色服装是否一致
- 道具是否延续
- 伏笔是否新增/解决
- 人物关系是否变化
```

The existing `deliverable.md` can remain the main user handoff, but `episode-input.md` should carry this source package so later renderers and reviewers can consume a stable episode contract.

### Continuity Hook JSON

```json
[
  {
    "hookId": "hook-0001",
    "introducedIn": "episode-0001",
    "description": "青铜戒指来源未知",
    "status": "open",
    "suggestedPayoff": "episode-0006",
    "relatedCharacters": ["主角"],
    "relatedProps": ["青铜戒指"]
  }
]
```

## Command Design

```bash
cine-make novel ingest --input ./novel.txt --out .cine-make-runs/my-novel
cine-make novel task --run .cine-make-runs/my-novel --id summarize-chapter-0001
cine-make novel accept-summary --run .cine-make-runs/my-novel --file summaries/chapter-0001.summary.json
cine-make novel build-bible --run .cine-make-runs/my-novel
cine-make novel plan-episodes --run .cine-make-runs/my-novel --episode-minutes 2
cine-make novel episode --run .cine-make-runs/my-novel --episode 1 --out .cine-make-runs/my-novel/episodes/episode-0001
```

Version 1 can keep `accept-summary` simple: it validates that a JSON file exists and matches the schema. The actual chapter summary can be created by Codex from the generated task prompt. This keeps the repo API-free and matches current Cine Make behavior.

## Processing Pipeline

1. `ingest`: copy or normalize source `.txt`, compute SHA-256, detect UTF-8, split into chapters and chunks.
2. `task`: generate one bounded prompt for one chapter or chunk. The prompt includes only that source unit plus the required JSON schema.
3. `accept-summary`: validate the summary file for one chapter and update `project.json` counts.
4. `build-bible`: merge summaries into `series-bible.md`, `characters.json`, `locations.json`, and `timeline.md`.
5. `plan-episodes`: produce an adaptation plan with season/episode arcs, each episode ending on a hook.
6. `episode`: export one episode input package and invoke the existing draft compiler path for `deliverable.md`.
7. `visual`: use the existing visual mode after an episode draft is approved; generate still images through `$imagegen`, not external APIs, and keep every Jimeng feed card at or under the 12-material reference budget.
8. `continuity`: after each episode, update character states, resolved hooks, unresolved hooks, and visual locks.

## MVP Slice

The first useful release should prove the long-text pipeline, not video generation. It should ship these six user-visible capabilities:

1. Ingest a `.txt` novel into a project workspace with chapters, chunks, manifests, hashes, and summary task prompts.
2. Generate bounded chapter-summary tasks where Codex reads only one chapter or chunk.
3. Validate accepted chapter summary JSON before it can affect the project.
4. Build `series-bible.md`, `characters.json`, and `timeline.md` from accepted summaries.
5. Export Episode 0001 into `episode-input.md`, `deliverable.md`, and `storyboard-images/README.md`.
6. Write Episode 0001 continuity updates into `continuity/continuity-log.md` and `continuity/unresolved-hooks.json`.

Batch episode generation, visual-bible image generation, renderer adapters, covers, subtitles, and scheduling are outside the MVP.

## Phase Gates

### Phase 1: Project Ingest Skeleton

Tasks 1-3 complete when:

- a `.txt` source can be ingested into a project workspace;
- chapters/chunks are stable and hash-traceable;
- the CLI supports `cine-make novel ingest`;
- existing short-script `draft` / `visual` commands still pass tests.

### Phase 2: Understanding and Bible

Tasks 4-6 complete when:

- chapter summary JSON is validated before acceptance;
- bounded chapter-summary prompts are generated without whole-novel context;
- accepted summaries merge into `series-bible.md`, `characters.json`, and `timeline.md`;
- malformed or copied-long-source summaries cannot poison the bible.

### Phase 3: Episode Production Package

Tasks 7-9 complete when:

- an adaptation plan can produce Episode 0001;
- Episode 0001 exports `episode-input.md`, `deliverable.md`, and `storyboard-images/README.md`;
- every Jimeng feed card respects the 12-reference-material budget;
- continuity files record episode state and unresolved hooks.

### Phase 4: Visual Planning and Skill Surface

Tasks 10-11 complete when:

- recurring characters are tiered into S/A/B/C visual-reference policies;
- S-tier and A-tier prompt plans exist without generating images by default;
- `SKILL.md`, README files, and share docs explain Novel Studio MVP clearly;
- the installed skill routes large novels into project mode and short scripts into existing mode.

## File Structure Changes

- Create `src/novel/chapter-splitter.mjs`: detect chapter boundaries and fallback chunks.
- Create `src/novel/project-writer.mjs`: write `project.json`, source manifests, chapter files, chunk JSON files, and initial task prompts.
- Create `src/novel/summary-schema.mjs`: validate chapter summary JSON without adding a schema dependency.
- Create `src/novel/bible-builder.mjs`: merge accepted summaries into series/character/location/timeline files.
- Create `src/novel/episode-planner.mjs`: create season/episode adaptation plans from the bible.
- Create `src/novel/episode-exporter.mjs`: build `episode-input.md` from bible + episode plan + relevant summaries.
- Create `src/novel/continuity-manager.mjs`: update continuity logs and unresolved hooks from episode exports.
- Modify `src/cli.mjs`: route `novel` subcommands before existing single-run commands.
- Modify `skills/cine-make/SKILL.md`: add a concise project-mode section and keep detailed workflow in references.
- Create `skills/cine-make/references/novel-project-mode.md`: project-mode workflow and artifact guide.
- Modify `README.md`, `README.zh-CN.md`, and `docs/share-cine-make.zh-CN.md`: document long novel usage without replacing normal usage.
- Create tests under `test/novel-project-*.test.mjs`.

## Implementation Tasks

### Task 1: Add Deterministic Novel Splitting

**Files:**
- Create: `src/novel/chapter-splitter.mjs`
- Test: `test/novel-project-splitter.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create tests for three cases:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { splitNovelText } from '../src/novel/chapter-splitter.mjs'

test('splits common Chinese chapter headings', () => {
  const text = ['第1章 初入坊市', '祁瑾站在人群中。', '第二章 筑基丹', '叮声响起。'].join('\n')
  const result = splitNovelText(text, { targetChunkChars: 2000 })

  assert.equal(result.chapters.length, 2)
  assert.equal(result.chapters[0].id, 'chapter-0001')
  assert.equal(result.chapters[0].title, '第1章 初入坊市')
  assert.match(result.chapters[1].text, /叮声响起/)
})

test('falls back to bounded chunks when chapter headings are absent', () => {
  const text = Array.from({ length: 60 }, (_, index) => `这是第${index + 1}段剧情。`).join('\n')
  const result = splitNovelText(text, { targetChunkChars: 120 })

  assert.equal(result.chapters.length > 1, true)
  assert.equal(result.chapters.every((chapter) => chapter.text.length <= 180), true)
})

test('returns stable byte spans and hashes for each source unit', () => {
  const result = splitNovelText('第一章 开始\n主角醒来。', { targetChunkChars: 2000 })

  assert.equal(typeof result.chapters[0].sha256, 'string')
  assert.equal(result.chapters[0].sha256.length, 64)
  assert.equal(Number.isInteger(result.chapters[0].startByte), true)
  assert.equal(Number.isInteger(result.chapters[0].endByte), true)
})
```

- [ ] **Step 2: Run tests and confirm failure**

```bash
node --test test/novel-project-splitter.test.mjs
```

Expected: fails because `src/novel/chapter-splitter.mjs` does not exist.

- [ ] **Step 3: Implement splitter**

Implement `splitNovelText(text, options)` with:
- heading regex for `第1章`, `第一章`, `第001章`, `卷一`, `Chapter 1`;
- fallback chunking by paragraph;
- `chapter-0001` ids;
- UTF-8 byte spans using `Buffer.byteLength`;
- SHA-256 using `node:crypto`.

- [ ] **Step 4: Verify**

```bash
node --test test/novel-project-splitter.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/novel/chapter-splitter.mjs test/novel-project-splitter.test.mjs
git commit -m "feat: split long novels into stable chapters"
```

### Task 2: Create Project Workspace Writer

**Files:**
- Create: `src/novel/project-writer.mjs`
- Test: `test/novel-project-ingest.test.mjs`

- [ ] **Step 1: Write failing ingest test**

Test that a small novel file produces `project.json`, `source/novel.txt`, `source/source-manifest.json`, `chapters/`, `chunks/`, and `tasks/`.

- [ ] **Step 2: Run failing test**

```bash
node --test test/novel-project-ingest.test.mjs
```

- [ ] **Step 3: Implement `createNovelProject({ inputPath, outDir, title, style })`**

Responsibilities:
- read source from disk;
- create the artifact layout;
- default style to anime / 二次元 / 非真人写实;
- write task prompts for each chapter summary;
- keep task prompts bounded to one chapter or chunk.

- [ ] **Step 4: Verify**

```bash
node --test test/novel-project-ingest.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/novel/project-writer.mjs test/novel-project-ingest.test.mjs
git commit -m "feat: create long novel project workspaces"
```

### Task 3: Route `cine-make novel ingest`

**Files:**
- Modify: `src/cli.mjs`
- Test: `test/novel-project-cli.test.mjs`

- [ ] **Step 1: Add CLI tests**

Cover:
- `node src/cli.mjs novel ingest --input <file> --out <dir>` exits 0;
- missing `--input` exits non-zero with a clear error;
- existing `node src/cli.mjs --mode draft ...` still works.

- [ ] **Step 2: Run failing CLI tests**

```bash
node --test test/novel-project-cli.test.mjs
```

- [ ] **Step 3: Implement routing**

In `src/cli.mjs`, detect `process.argv[2] === 'novel'` before current `parseArgs` flow and route:

```text
novel ingest
novel task
novel accept-summary
novel build-bible
novel plan-episodes
novel episode
```

Only `novel ingest` must be routed in this task. Leave later `novel` subcommands unrecognized until their implementation tasks add them.

- [ ] **Step 4: Verify**

```bash
node --test test/novel-project-cli.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/cli.mjs test/novel-project-cli.test.mjs
git commit -m "feat: add novel project ingest command"
```

### Task 4: Add Summary Schema Validation

**Files:**
- Create: `src/novel/summary-schema.mjs`
- Test: `test/novel-project-summary-schema.test.mjs`

- [ ] **Step 1: Write schema tests**

Cover valid summary, missing `chapterId`, empty `beats`, malformed `characters`, and long copied source text in `summary`.

- [ ] **Step 2: Implement validator**

Export:

```js
export function validateChapterSummary(value) {
  return { ok: boolean, errors: string[] }
}
```

Rules:
- required `schemaVersion`, `chapterId`, `sourceSpan`, `title`, `summary`, `beats`, `characters`;
- `beats` must be non-empty;
- `summary` should be concise and must not exceed 2000 characters;
- no single beat event should exceed 500 characters;
- `sourceSpan.startByte` and `sourceSpan.endByte` must be integers.

- [ ] **Step 3: Verify**

```bash
node --test test/novel-project-summary-schema.test.mjs
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/novel/summary-schema.mjs test/novel-project-summary-schema.test.mjs
git commit -m "feat: validate chapter summary artifacts"
```

### Task 5: Add `novel task` and `novel accept-summary`

**Files:**
- Create: `src/novel/task-prompts.mjs`
- Modify: `src/cli.mjs`
- Test: `test/novel-project-task-flow.test.mjs`

- [ ] **Step 1: Write task flow tests**

Cover:
- `novel task --id summarize-chapter-0001` prints or writes a bounded prompt;
- the prompt includes exactly one chapter source text;
- `accept-summary` validates and copies a summary file into `summaries/`;
- invalid summary exits non-zero.

- [ ] **Step 2: Implement prompt generator**

Prompt must instruct Codex to output only the Chapter Summary JSON contract. It must not ask Codex to summarize the whole novel. It must include the exact chapter id and source span.

- [ ] **Step 3: Implement accept command**

Read user-provided JSON, validate it with `validateChapterSummary`, then write it to `summaries/<chapterId>.summary.json`.

- [ ] **Step 4: Verify**

```bash
node --test test/novel-project-task-flow.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/cli.mjs src/novel/task-prompts.mjs test/novel-project-task-flow.test.mjs
git commit -m "feat: add chapter summary task flow"
```

### Task 6: Build Series Bible from Accepted Summaries

**Files:**
- Create: `src/novel/bible-builder.mjs`
- Modify: `src/cli.mjs`
- Test: `test/novel-project-bible-builder.test.mjs`

- [ ] **Step 1: Write bible builder tests**

Use three accepted summaries and assert:
- `bible/series-bible.md` contains main arc and volume/chapter map;
- `bible/characters.json` deduplicates names;
- character entries include first chapter, appearance count, role signals, visual hints;
- `bible/timeline.md` preserves chapter order.

- [ ] **Step 2: Implement builder**

Keep implementation deterministic:
- merge character names by exact string first;
- store ambiguous duplicate candidates as warnings;
- write conservative role tiers based on frequency and role signals;
- do not invent tri-view prompts here.

- [ ] **Step 3: Verify**

```bash
node --test test/novel-project-bible-builder.test.mjs
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/cli.mjs src/novel/bible-builder.mjs test/novel-project-bible-builder.test.mjs
git commit -m "feat: build series bible from novel summaries"
```

### Task 7: Plan Episodes from the Bible

**Files:**
- Create: `src/novel/episode-planner.mjs`
- Modify: `src/cli.mjs`
- Test: `test/novel-project-episode-planner.test.mjs`

- [ ] **Step 1: Write episode planning tests**

Assert the planner:
- creates `adaptation-plan.md`;
- groups chapters into episode candidates;
- includes episode goal, included chapters, required characters, ending hook;
- respects `--episode-minutes`.

- [ ] **Step 2: Implement planner**

Version 1 should use deterministic heuristics:
- default 2 minutes per episode;
- prefer chapter boundaries;
- create stronger episode breaks at unresolved hooks;
- write warnings when a chapter is too dense and should be split manually.

- [ ] **Step 3: Verify**

```bash
node --test test/novel-project-episode-planner.test.mjs
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/cli.mjs src/novel/episode-planner.mjs test/novel-project-episode-planner.test.mjs
git commit -m "feat: plan anime drama episodes from novel bible"
```

### Task 8: Export One Episode into Existing Cine Make Flow

**Files:**
- Create: `src/novel/episode-exporter.mjs`
- Modify: `src/cli.mjs`
- Test: `test/novel-project-episode-exporter.test.mjs`

- [ ] **Step 1: Write exporter tests**

Assert:
- `episode-input.md` includes only relevant summaries, selected character cards, continuity notes, and style;
- `deliverable.md` is generated by existing draft flow;
- episode output contains `storyboard-images/README.md`;
- project bible files are not copied into the episode user-facing root.
- every Jimeng feed card has a structured material list capped at 12 references.

- [ ] **Step 2: Implement exporter**

Build an episode source text from:
- episode goal;
- selected chapter summaries;
- selected characters;
- active unresolved hooks;
- default anime style;
- explicit instruction to preserve continuity.

Then call the existing contract/draft/deliverable writer path instead of duplicating episode rendering logic. Add a feed-card adapter that labels material references as `@ImageN`, `@VideoN`, or `@AudioN` and refuses to emit more than 12 materials for one Jimeng card.

- [ ] **Step 3: Verify**

```bash
node --test test/novel-project-episode-exporter.test.mjs
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/cli.mjs src/novel/episode-exporter.mjs test/novel-project-episode-exporter.test.mjs
git commit -m "feat: export novel episodes into Cine Make drafts"
```

### Task 9: Add Continuity Management

**Files:**
- Create: `src/novel/continuity-manager.mjs`
- Modify: `src/cli.mjs`
- Test: `test/novel-project-continuity.test.mjs`

- [ ] **Step 1: Write continuity tests**

Given an exported episode package with character states, props, and hooks, assert:
- `continuity/continuity-log.md` appends an Episode 0001 section;
- `continuity/unresolved-hooks.json` creates stable `hook-0001` ids;
- resolved hooks can be marked as `resolved`;
- duplicate hook descriptions are not appended twice for the same episode.

- [ ] **Step 2: Implement continuity manager**

Export:

```js
export async function updateProjectContinuity({ runDir, episodeId, episodePackage }) {
  return { logPath, hooksPath, addedHooks, resolvedHooks }
}
```

Rules:
- append episode state in chronological order;
- preserve manually edited notes outside generated episode sections;
- keep hook records as JSON objects with `hookId`, `introducedIn`, `description`, `status`, `suggestedPayoff`, `relatedCharacters`, and `relatedProps`;
- never delete a hook unless a future explicit cleanup command is added.

- [ ] **Step 3: Wire continuity update into `novel episode`**

After `episode-input.md` and `deliverable.md` are written, update continuity files from the episode package. The command should print the updated continuity paths.

- [ ] **Step 4: Verify**

```bash
node --test test/novel-project-continuity.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/cli.mjs src/novel/continuity-manager.mjs test/novel-project-continuity.test.mjs
git commit -m "feat: track novel episode continuity hooks"
```

### Task 10: Add Visual Bible Planning

**Files:**
- Create: `src/novel/visual-bible-planner.mjs`
- Modify: `src/cli.mjs`
- Test: `test/novel-project-visual-bible.test.mjs`

- [ ] **Step 1: Write visual tier tests**

Given character counts and role signals, assert:
- S-tier characters get tri-view prompts;
- A-tier characters get front-view prompts;
- B/C-tier characters do not get image prompts;
- output warns when too many S-tier characters are detected.

- [ ] **Step 2: Implement planner**

Write:
- `visual-bible/character-reference-plan.md`;
- `visual-bible/character-triview-prompts.md`;
- no generated images by default.

Image generation remains a later `$imagegen` action controlled by the skill and user approval.

- [ ] **Step 3: Verify**

```bash
node --test test/novel-project-visual-bible.test.mjs
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/cli.mjs src/novel/visual-bible-planner.mjs test/novel-project-visual-bible.test.mjs
git commit -m "feat: plan visual bible for recurring novel characters"
```

### Task 11: Update Skill and Documentation

**Files:**
- Modify: `skills/cine-make/SKILL.md`
- Create: `skills/cine-make/references/novel-project-mode.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/share-cine-make.zh-CN.md`
- Test: `test/skill-package.test.mjs`
- Test: `test/skill-frontmatter.test.mjs`

- [ ] **Step 1: Write documentation tests**

Assert:
- skill mentions project mode for whole novels;
- skill does not tell Codex to read a 10MB novel in one prompt;
- README documents `cine-make novel ingest`;
- docs state default anime / 二次元 style.
- docs explain that Jimeng feed cards have a 12-reference-material budget across images, videos, and audio.

- [ ] **Step 2: Update SKILL.md concisely**

Add only core routing behavior:
- short story/script: use existing draft/visual flow;
- whole novel or large `.txt`: use project mode;
- never paste the whole source into context;
- generate S/A character references only after bible planning.

Put detailed instructions in `references/novel-project-mode.md`.

- [ ] **Step 3: Update README docs**

Document the command sequence:

```bash
cine-make novel ingest --input ./novel.txt --out .cine-make-runs/my-novel
cine-make novel task --run .cine-make-runs/my-novel --id summarize-chapter-0001
cine-make novel build-bible --run .cine-make-runs/my-novel
cine-make novel plan-episodes --run .cine-make-runs/my-novel
cine-make novel episode --run .cine-make-runs/my-novel --episode 1
```

- [ ] **Step 4: Verify**

```bash
node --test test/skill-package.test.mjs test/skill-frontmatter.test.mjs
npm test
npm pack --dry-run
```

- [ ] **Step 5: Commit**

```bash
git add skills/cine-make/SKILL.md skills/cine-make/references/novel-project-mode.md README.md README.zh-CN.md docs/share-cine-make.zh-CN.md test/skill-package.test.mjs test/skill-frontmatter.test.mjs
git commit -m "docs: describe novel project mode workflow"
```

## Validation Gate

Before merging the whole feature:

```bash
npm test
npm pack --dry-run
node src/cli.mjs novel ingest --input test/fixtures/novel-sample.txt --out /tmp/cine-make-novel-project
node src/cli.mjs novel task --run /tmp/cine-make-novel-project --id summarize-chapter-0001
```

Expected:
- tests pass;
- package contains new `src/novel/` modules and skill reference;
- ingest creates project layout;
- task prompt is bounded to one chapter;
- no command claims Codex generated final video.

## Review Questions for Other AI

1. Is the boundary between local deterministic processing and Codex summarization clear enough?
2. Is version 1 correctly avoiding heavy dependencies such as SQLite, vector search, and external APIs?
3. Are the artifact names stable enough for later automation?
4. Does the character tier policy prevent wasting image generation on low-value characters?
5. Does this design preserve the existing `draft` and `visual` behavior for short scripts?
6. Are there missing validation gates that would allow malformed summaries to poison the series bible?
7. Is the project-mode exposure of `bible/`, `summaries/`, and `episodes/` compatible with the existing user-facing output boundary?
8. Does the continuity hook contract give enough information to keep Episode 30 and later from drifting?

## Recommended Execution Order

Execute Tasks 1-3 first to create a usable ingest skeleton. Then execute Tasks 4-6 to make summaries and bible artifacts trustworthy. Execute Tasks 7-9 after the bible contract stabilizes so episode exports immediately update continuity. Execute Task 10 after recurring-character tiers are proven. Finish with Task 11 so the skill documentation reflects the behavior that actually exists.

Do not implement image generation inside the novel project pipeline in version 1. The project should plan visual references; `$imagegen` should still be invoked explicitly when the user approves character or episode visuals.
