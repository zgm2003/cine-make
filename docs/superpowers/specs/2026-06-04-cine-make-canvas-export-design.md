# Cine Make Canvas Export Design

## Summary

Cine Make should stop behaving like an image-generation assistant for long-form work. For whole novels and long scripts, it should act as the upstream director engine for the user's canvas system.

The new export surface is:

```bash
cine-make novel canvas --run .cine-make-runs/my-novel --episode 1
```

It should create:

```text
.cine-make-runs/my-novel/episodes/episode-0001/
  canvas-manifest.json
  canvas-project.zip
```

`canvas-manifest.json` is Cine Make's readable, renderer-neutral handoff contract. `canvas-project.zip` is the direct import package for `canvas_front_next`.

The two outputs have different responsibilities:

- `canvas-manifest.json` is the stable contract owned by Cine Make. It can preserve semantic fields such as node role, source episode ids, material budgets, warnings, and continuity meaning.
- `canvas-project.zip` is an adapter output for the current canvas import format. It must match the canvas app's real `projects.json` shape and should not depend on unsupported or extra canvas fields.

This feature does not generate images, does not call image/video APIs, does not add a database, and does not require importing code from `canvas_front_next`.

## Product Boundary

Cine Make owns:

- long-script and novel understanding;
- chapter/summary/bible/episode continuity;
- director-grade shot planning;
- character, scene, prop, hook, and material-slot planning;
- deterministic canvas node and connection generation;
- export into a canvas-compatible package.

The canvas system owns:

- visual asset creation and editing;
- user-driven image/video generation;
- local media storage;
- canvas layout editing;
- final creative iteration.

External video tools own:

- final video synthesis;
- platform-specific generation behavior.

Cine Make must not claim it generated final MP4 video or final artwork.

## Current Canvas Import Contract

The imported `canvas_front_next` project is an independent Git repository under:

```text
/Users/larus/admin/cine-make/canvas_front_next
```

It should not be committed into the outer `cine-make` repository.

The canvas app imports a zip file. The zip must contain:

```text
projects.json
projects/<project-id>/files/...
```

For the MVP, there are no media files, so `files` can be an empty array and the zip only needs `projects.json`.

The `projects.json` contract is:

```json
{
  "app": "infinite-canvas",
  "version": 3,
  "exportedAt": "2026-06-04T00:00:00.000Z",
  "projects": [
    {
      "project": {
        "id": "cine-episode-0001",
        "title": "第1集 - 标题",
        "createdAt": "2026-06-04T00:00:00.000Z",
        "updatedAt": "2026-06-04T00:00:00.000Z",
        "nodes": [],
        "connections": [],
        "chatSessions": [],
        "activeChatId": null,
        "backgroundMode": "lines",
        "showImageInfo": false,
        "viewport": { "x": 0, "y": 0, "k": 1 }
      },
      "files": []
    }
  ]
}
```

The canvas app supports these node types:

```text
text
image
config
video
```

MVP output should use only `text` nodes. `config`, `image`, and `video` nodes are reserved for later once the user provides or generates assets inside the canvas system and the canvas node contracts are intentionally integrated.

The current canvas import flow re-generates the project id during import. The `project.id` inside the zip should still be stable for export/debugging, but consumers must not rely on the imported canvas project keeping that id. Stable references should use node ids and manifest ids.

## Canvas Manifest Contract

`canvas-manifest.json` is the stable Cine Make handoff format. It should be easier to validate than the canvas zip and should preserve source semantics before layout conversion.

Proposed schema:

```json
{
  "schemaVersion": 1,
  "kind": "cine-make-canvas-manifest",
  "project": {
    "title": "项目名",
    "runDir": ".cine-make-runs/my-novel",
    "episodeId": "episode-0001",
    "defaultStyle": "anime / 二次元 / 非真人写实"
  },
  "episode": {
    "number": 1,
    "title": "第1集 - 标题",
    "goal": "本集目标",
    "summary": "本集摘要",
    "hook": "结尾钩子"
  },
  "nodes": [
    {
      "id": "overview",
      "type": "text",
      "title": "本集总览",
      "role": "episode_overview",
      "content": "给人审的本集目标、摘要、钩子。",
      "position": { "x": 0, "y": 0 },
      "width": 420,
      "height": 260
    }
  ],
  "connections": [
    {
      "id": "overview-to-shot-001",
      "fromNodeId": "overview",
      "toNodeId": "shot-001",
      "role": "story_flow"
    }
  ],
  "materialBudget": {
    "renderer": "jimeng",
    "maxReferenceMaterials": 12,
    "rule": "Images, videos, and audio share the same material-slot budget."
  }
}
```

The manifest is not the final canvas app schema. It is the adapter input. The exporter converts this manifest into `projects.json`.

Manifest-only fields such as `role`, `sourceRefs`, `warnings`, and material-budget metadata must not be blindly copied into the canvas `projects.json` if the canvas type does not support them. They should be rendered into node text content or omitted from the canvas adapter output.

## Node Mapping

### Overview Nodes

Create one top-level text node for the episode:

- title: `本集总览`;
- content: episode title, goal, 100-200 word summary, ending hook, style;
- role: `episode_overview`.

### Character Nodes

Create one text node per important character in the episode:

- title: `角色：<name>`;
- content: tier, role signal, visual anchors, costume/prop locks, relationship state;
- role: `character_card`.

Only characters selected by the episode or visual bible should appear. Do not generate image nodes for characters in MVP.

### Scene Nodes

Create one text node per main scene/location:

- title: `场景：<location>`;
- content: visual description, lighting, screen direction, continuity requirements;
- role: `scene_card`.

### Shot Nodes

Create one text node per shot or beat:

- title: `镜头 S01`;
- content: shot size, camera movement, action, performance, dialogue, sound, continuity bridge, negative constraints;
- role: `shot_card`.

Shot nodes are the primary working surface for the canvas user. They should be arranged left-to-right in story order.

### Jimeng Feed Nodes

Create one text node per feed card:

- title: `即梦投喂卡 01`;
- content: material list, prompt, start/end frame intent, motion reference notes, voice/audio reference notes;
- role: `jimeng_feed_card`.

Each feed node must state:

- max 12 reference materials total;
- images, videos, and audio consume the same budget;
- no automatic final video generation by Cine Make.

### Continuity Nodes

Create one text node for unresolved hooks and continuity notes:

- title: `连续性 / 伏笔`;
- content: open hooks, resolved hooks, character state changes, prop continuity;
- role: `continuity_log`.

## Deterministic Layout

The MVP should use a predictable grid layout so repeated exports are stable:

```text
row 0: episode overview + continuity
row 1: character cards
row 2: scene cards
row 3: shot cards in chronological order
row 4: Jimeng feed cards
```

Suggested dimensions:

- text node width: 360-460;
- text node height: 220-320 depending on role;
- horizontal gap: 80;
- vertical gap: 120.

Connections:

- overview -> every character/scene/shot group;
- character -> shot where character appears;
- scene -> shot set in that location;
- shot -> next shot;
- shot group -> Jimeng feed node;
- continuity -> affected character/shot/feed nodes.

Connections must be deterministic and use stable ids.

## CLI Behavior

Command:

```bash
cine-make novel canvas --run <project-dir> --episode <number> [--out <episode-dir>]
```

Default output directory:

```text
<project-dir>/episodes/episode-0001/
```

Inputs:

- `project.json`;
- `episodes/adaptation-plan.json`;
- exported episode package if present;
- `bible/characters.json`;
- `bible/locations.json`;
- `visual-bible/character-reference-plan.md`;
- `continuity/continuity-log.md`;
- `continuity/unresolved-hooks.json`;
- `episodes/episode-0001/jimeng-feed-cards.json`.

`jimeng-feed-cards.json` is optional for this exporter. If it exists, use it. If it is missing, derive feed-card text from the exported episode deliverable's shot prompts and material notes when available. If neither source exists, create a single warning feed node explaining that Jimeng feed cards were not prepared yet.

If the episode package does not exist, the command should fail with a clear message telling the user to run:

```bash
cine-make novel episode --run <project-dir> --episode <number>
```

Outputs:

- `canvas-manifest.json`;
- `canvas-project.zip`;
- console summary with both paths.

The command should not read the original whole source file.

## ZIP Export Rules

The zip builder should create `projects.json` matching the canvas app's import contract:

```json
{
  "app": "infinite-canvas",
  "version": 3,
  "exportedAt": "...",
  "projects": [
    {
      "project": {
        "id": "cine-make-episode-0001",
        "title": "Cine Make - Episode 0001",
        "createdAt": "...",
        "updatedAt": "...",
        "nodes": [],
        "connections": [],
        "chatSessions": [],
        "activeChatId": null,
        "backgroundMode": "lines",
        "showImageInfo": false,
        "viewport": { "x": 0, "y": 0, "k": 1 }
      },
      "files": []
    }
  ]
}
```

The current canvas app may replace `project.id` when importing. This does not break the export because node ids and connection ids are preserved inside the imported project.

Node ids should be stable and slug-like:

```text
overview
continuity
character-lin-xia
scene-old-cinema
shot-001
feed-card-001
```

Canvas node metadata should use existing canvas fields:

```json
{
  "content": "node markdown text",
  "status": "success",
  "fontSize": 14,
  "generationMode": "text"
}
```

Every exported canvas node should use the actual `CanvasNodeData` shape:

```json
{
  "id": "shot-001",
  "type": "text",
  "title": "镜头 S01",
  "position": { "x": 0, "y": 900 },
  "width": 420,
  "height": 280,
  "metadata": {
    "content": "markdown text shown in the node",
    "status": "success",
    "fontSize": 14,
    "generationMode": "text"
  }
}
```

Every exported canvas connection should use the actual `CanvasConnection` shape:

```json
{
  "id": "shot-001-to-shot-002",
  "fromNodeId": "shot-001",
  "toNodeId": "shot-002"
}
```

Connection roles belong in `canvas-manifest.json` only. The canvas zip must not include `role` on connections.

## Error Handling

The exporter should fail clearly when:

- `--run` is missing;
- `--episode` is missing or invalid;
- the project is not a `novel-project`;
- `episodes/adaptation-plan.json` is missing;
- the requested episode is not planned;
- the episode package is missing;
- expected JSON files are malformed.

It should not fail just because optional files are missing:

- `visual-bible/character-reference-plan.md`;
- `continuity/continuity-log.md`;
- `continuity/unresolved-hooks.json`;
- `jimeng-feed-cards.json`.

Missing optional files should become warnings in `canvas-manifest.json`.

Warnings should also be rendered into a `导出警告` text node when they would matter to a canvas user, for example missing Jimeng feed-card data or missing continuity files.

## Testing Strategy

Add focused tests for:

- manifest generation from a seeded episode package;
- zip contains `projects.json`;
- `projects.json.app === "infinite-canvas"`;
- `projects.json.version === 3`;
- generated project has valid `nodes` and `connections`;
- no media files are required in MVP;
- command fails when the episode package is missing;
- command does not read or include the full original novel source;
- material budget text says 12 reference materials across images/video/audio, not 12 images.
- canvas zip uses only `text` nodes in MVP;
- canvas zip connections contain only `id`, `fromNodeId`, and `toNodeId`;
- manifest keeps semantic roles while `projects.json` does not copy unsupported role fields;
- missing `jimeng-feed-cards.json` creates a warning/feed text node instead of failing.

Run:

```bash
node --test test/novel-project-canvas-export.test.mjs
npm test
npm pack --dry-run
```

When the user's canvas frontend/backend environment is already running, add a manual smoke check:

1. run `cine-make novel canvas --run <project-dir> --episode 1`;
2. open the canvas system;
3. click `导入画布`;
4. import `<project-dir>/episodes/episode-0001/canvas-project.zip`;
5. confirm the imported board opens and shows text nodes for overview, continuity, characters, scenes, shots, and Jimeng feed notes.

This runtime check validates the adapter against the real canvas import path. It does not replace unit tests because the canvas project is an independent repository and should not be committed into Cine Make.

## Non-Goals

- Do not generate images.
- Do not call `$imagegen`.
- Do not call external image/video APIs.
- Do not add a database.
- Do not import source code from `canvas_front_next`.
- Do not commit `canvas_front_next/` into the outer `cine-make` repository.
- Do not create a web UI in Cine Make.
- Do not promise final video generation.

## Success Criteria

The feature is successful when a user can run:

```bash
cine-make novel canvas --run .cine-make-runs/my-novel --episode 1
```

Then open the canvas system, click `导入画布`, choose `canvas-project.zip`, and see a structured director board containing:

- episode overview;
- character cards;
- scene cards;
- ordered shot cards;
- Jimeng feed-card notes;
- continuity and unresolved hooks.

The board should be useful immediately without generated images.
