---
name: cine-make
description: >-
  Use when a developer wants to turn story material, rough scripts, ad briefs,
  or novel excerpts into ChatGPT-ready Seedance all-reference feeds for AI
  short-drama video workflows.
---

# Cine Make

Cine Make is a lightweight Codex skill for preparing `seedance-all-reference-feed.md`. The compiler writes text assets only; Codex must not claim it generated MP4, call video APIs, or create Canvas handoff packages.

## Hard Gates

- 15秒容量闸门：before generating, estimate whether the requested runtime can naturally contain the source beats and OS/dialogue. For each 5-line / 15-second group, count OS, 系统提示, 旁白, and character dialogue as spoken Chinese text: 20-32 chars is ideal, 33-36 is acceptable, 37-42 is crowded, and 43+ is fail. If it 不能自然容纳, 先提醒 the user and state the tradeoff: split into more segments, remove/compress dialogue, or keep OS/对白一字不改 with faster pacing and merged visuals.
- If the user says OS/对白一字不改, do not rewrite those words. Compress only visible action and shot count.
- For one 15-second segment, default to 5 single-line video texts. Do not force 8-9 storyboard panels just because “分镜” was mentioned.
- Default to at most 2 main spoken lines per 15-second group; a special case may use 3 short lines only when the total spoken budget stays comfortable. Do not hard-pack 55-75 Chinese spoken chars into one 15-second group.
- If the user already has character or scene references, bind them as references; do not regenerate them unless asked.

## Output Contract

When `--out` is omitted, normal short-script and excerpt runs write into the calling story project under `生产资产/<timestamp>/`. Use explicit `--out` only when the user asks for a named package directory.

Normal short-script and excerpt runs output:

- `seedance-all-reference-feed.md`

The user-facing `seedance-all-reference-feed.md` should expose only two operating sections: `GPT-image-2 参考图生成提示词` and `每5条复制制作块`. Keep original-fidelity rules, shot-language rules, negative constraints, and camera-tag guidance as internal constraints or documentation instead of front-loading them in the feed.

Do not create `canvas-project.zip`, `canvas-manifest.json`, `projects.json`, `prompt-pack.md`, `deliverable.md`, `storyboard-images/`, generated images, generated videos, segment start/end frames, S01/S02 keyframes, or continuation text on the main path. Do not pass `--emit-internal` in normal user runs.

The copy-ready Seedance block must use this order:

```text
序号 时间 内/外 具体地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效
上传参考图：角色或场景名 = 图片1；角色或场景名 = 图片2
音色：角色=声音说明。必要对白只保留本组逐条文本里的短句。
统一要求：【不要字幕、不要配乐，只保留环境音、系统提示音、动作音效和必要对白】风格，比例。
```

Use `上传参考图：资产名 = 图片1`, not `上传参考图：图片1｜资产名`, in copy blocks.

## Image Prompt Contract

GPT-image-2 reference prompts must start and end like this:

```text
GPT-image-2，<比例>，<风格与画面要求>。...4K画质！
```

When UE5/仿真人/写实 is requested, include UE5 / Unreal Engine 5, Lumen-style light, face light or fire fill, and eye catchlight. For character tri-views, use one image with front full body, side full body, back full body, and a far-left upper-body + head detail panel on a white or very light gray background. 三视图为一张图.

## Workflow

1. Identify source material, requested runtime, aspect ratio, visual style, existing reference images, and whether dialogue must be exact.
2. Apply the 15-second capacity gate before promising a result.
3. Run from the story project directory, not from the Cine Make repo, unless the user explicitly wants repo development.
4. Use the compiler:

```bash
node <cine-make-root>/src/cli.mjs seedance-pack --aspect 16:9 --style "<style>" [--duration 15s] [--input <file>] "<source material>"
node <cine-make-root>/src/cli.mjs reference-feed --aspect 16:9 --style "<style>" [--duration 15s] [--input <file>] "<source material>"
```

5. For whole novels or large `.txt` files, use project mode: read `references/novel-project-mode.md` first. Never paste the whole source into context.
6. For Seedance feed quality rules that should carry across episodes, read `references/production-guidelines.md`. Apply its female character prompt safeguards, reference reuse rules, scene-location matching, dialogue shot rules, copy block order, and breathing/density rules.
7. For stronger director prompting only when needed, read `references/director-prompts.md`. Keep the active skill lightweight.

## Completion Evidence

Before saying a Cine Make run is ready, report the command run, output directory, generated files, whether images/videos were only prompts or actually generated, any capacity warning, and that final video synthesis belongs to the external video tool.
