---
name: cine-make
description: >-
  Use when a developer wants to turn novel excerpts, whole novels, rough
  scripts, ad briefs, or story material into AI short-drama pre-production
  Seedance all-reference feeds and Canvas import packs for AI short-drama video workflows.
---

# Cine Make

Cine Make turns raw story material into a compact Seedance + Canvas handoff package. The skill is the human entrypoint; the local repo is the compiler kernel.

Cine Make does **not** generate final video. Codex can write text assets and generate still images; external video tools synthesize video.

## Product intent

- turn novel/script/ad material into `seedance-all-reference-feed.md` plus a media-free Canvas import zip;
- preserve story beats as concrete single-line video texts instead of vague storyboard concepts;
- package GPT-image-2 reference prompts, reference bindings, global negative constraints, and copy-ready Seedance video text;
- generate Seedance 全能参考投喂包 / Seedance all-reference feed through `seedance-pack` or `reference-feed`;
- export short-script/story prompt packs into `canvas-project.zip`, `canvas-manifest.json`, `prompt-pack.md`, and `README.md`;
- export whole-novel episode packages into a text-only Canvas import zip when the user runs the Canvas system;
- preserve continuity instead of relying on random video generation.

## Product boundary

- Do not claim Codex generated an MP4.
- Do not call external video APIs from the skill.
- Do not require a server or web IDE.
- Do not expose the full run tree unless the user asks.
- Normal short-script and excerpt runs output only `seedance-all-reference-feed.md`, `canvas-project.zip`, `canvas-manifest.json`, `prompt-pack.md`, and `README.md`.
- Do not expose `draft` / `visual` as user modes. Do not run `--mode draft`, `--mode visual`, `--draft`, or `--visual`.
- Do not create `deliverable.md`, `storyboard-images/`, generated images, videos, segment start/end frames, or S01/S02 keyframes on the main path.
- Use image generation only when the user explicitly asks for still images; the main path prepares prompts and Canvas nodes only.
- Cine Make is Codex-only for still images: use `$imagegen`, not external image APIs or API-key workflows.
- Whole-novel project mode intentionally exposes project workspace artifacts and per-episode packages; see `references/novel-project-mode.md`.
- Whole-novel Canvas export is a handoff adapter only: it writes `canvas-manifest.json` and `canvas-project.zip`; it does not generate images, videos, media files, or a web UI.
- Manual Canvas generation is also a first-class handoff for short scripts and excerpts. Use `node src/cli.mjs canvas-pack ...` for the first foundation graph when the user wants control in Canvas, says they do not want to draw/gamble/generate images here, or asks for a prompt pack. The first Canvas handoff is compact: text resource nodes for World Bible / Art Direction, Character Bible, and Environment Bible, plus style_reference, character_reference, and environment_reference image nodes. Do not include Shot List or Keyframes in this first foundation pack. After the user has generated and locked the character/scene/style main images in Canvas, use `node src/cli.mjs canvas-storyboard-pack ...` to create a merge-into-current-canvas append pack with Shot List and Keyframe image nodes. If the user wants one import that contains characters, environments, style, Shot List, and all Keyframes, use `node src/cli.mjs canvas-full-pack ...`; it wires reference nodes into Keyframes and chains story flow `shot-list -> S01 -> S02 -> ...`.
- Character, scene, and style images are optional; never make them required.
- The user should not have to say “只要 Seedance 投喂包和 Canvas 导入包”. This is mandatory product behavior.
- The user should not have to name a video platform. Cine Make's main handoff is Seedance feed text plus Canvas reference assets.
- Do not pass `--emit-internal` in normal user runs. It is only for compiler debugging and creates `.cine-make-internal/`.
- Cine Make uses a layered cinematic pipeline: `SCRIPT_BEATS`, `DIRECTOR_DECISION`, `TEXT_READABILITY_POLICY`, `DIALOGUE_POLICY`, `SHOT_DENSITY_CONTROLLER`, `DIRECTOR_BIBLE`, `CHARACTER_BIBLE`, `ENVIRONMENT_BIBLES`, `ART_DIRECTION`, `ANCHOR_POLICY`, `Shot Definition`, `Director Cut`, `Keyframe Prompt`, `Motion Prompt`, `QUALITY_CHECK`, and `AI_RISK_WARNINGS`. global rules are not repeated per shot; per-shot prompts stay local and minimal.
- `SCRIPT_BEATS` identifies real narrative beats before shot count is decided; it should not become one beat per shot. It records story function, audience question, required visual information, emotional pressure, can-be-merged, and must-keep before generating shots.
- `DIRECTOR_DECISION` is mandatory director judgment: each shot must prove why it should stay. Use explicit `keep / merge / delete / rewrite` outcomes. Keep a shot only when it adds new information, changes relationships, escalates emotion, reveals a key prop, misleads the audience, strengthens the countdown/loop mechanism, or pushes the final hook. Otherwise merge, delete, or rewrite it.
- `TEXT_READABILITY_POLICY` catches carved text, phone screens, labels, photo backs, and wall blood text: readable text must be the primary anchor and must use close-up / insert framing.
- `DIALOGUE_POLICY` keeps the full script but creates a concise visual-cut dialogue version when one line has long explanatory text.
- `SHOT_DENSITY_CONTROLLER` recommends a manageable shot count for the runtime; it should push Director Cut to rewrite rhythm instead of mechanically deleting shots.
- `ENVIRONMENT_BIBLES` is the multi-location Environment Bibles layer. Bind each video text to an environment id and mode such as reality, hallucination, or distorted reality when the script changes space.
- `ANCHOR_POLICY` / Anchor Policy separates global, character, story, and per-line anchors. Each line uses at most one primary anchor and at most two secondary anchors; do not force phone/countdown/weapon/blood-text props into lines that do not need them.
- Director output should expose decisive keep / merge / delete / rewrite judgment before final video text. Director Cut may rewrite a beat into a better shot design; it is not a mechanical deletion list.
- `QUALITY_CHECK` / Quality Check must report `pass / warning / fail` states with concrete issues. `AI_RISK_WARNINGS` must flag AI generation risks such as macro shot complex action mismatch, wide shot readable text mismatch, overloaded multi-character frames, forced unnecessary props, Keyframe prompts polluted by Motion Prompt language, and Motion Prompts with too many main actions.
- Keyframe prompts are static image prompts and should be localized Keyframe prompts: define only the current frame's composition, blocking, subject state, lens, lighting, continuity, and primary/secondary anchors. They must not describe video motion, breathing animation, secondary animation, transitions, or multi-action performance.
- Motion Prompt entries are video-model state transitions: one main action, one micro-performance cue, one camera movement, and strict no-cut/no-new-action/no-face-change constraints.
- `seedance-all-reference-feed.md` must be operational: GPT-image-2 reference prompts first, then reference bindings, global negative constraints, single-line video texts, and a copyable bottom note.
- The single-line video text format is mandatory: `序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`.
- Treat external AI video generation as a short Seedance feed-text workflow. Every 5 single-line video texts equal 15 seconds unless the user explicitly overrides. Each line should have room for camera movement, performance, and suspense beats.
- GPT-image-2 / manual image prompt workflow is foundation-first: before continuous video text, help the user lock character references, visual style, and scene/environment reference in Canvas.
- GPT-image-2 reference prompts must use in-frame camera language only: visible blocking, camera position, shot size, character orientation, foreground/background, body pose, expression, spatial relationship, lighting, and negative constraints. Avoid abstract or ambiguous phrases like “男主看着建筑”; write “背对镜头的男主站在画面下方中央，头微微仰起，视线朝向前方居民楼入口”.
- Prop / 道具 reference prompts must be single clean product shots: only one complete prop subject in the image, clean white or light-gray background, no character, no hand holding, no scene staging, no prop bundle, no split panels. This prevents the prop asset from contaminating character or scene references.
- Long stories must be preserved and split into multiple feed cards; do not silently compress a multi-beat story into a single 30-second teaser unless the user explicitly asks for compression.

## Main Seedance + Canvas handoffs

There is one normal user-facing path: Seedance all-reference feed plus Canvas foundation assets.

| Command | When | Image generation | User output |
| --- | --- | --- | --- |
| default / `seedance-pack` | normal short-script, excerpt, shotlist, ad brief, or rough scene text | no images | `seedance-all-reference-feed.md` + `canvas-project.zip` + `canvas-manifest.json` + `prompt-pack.md` + `README.md` |
| `reference-feed` | user only wants the copy-ready Seedance feed | no images | `seedance-all-reference-feed.md` |
| `canvas-pack` | user only wants the first foundation graph for manual Canvas generation | no images | Canvas foundation import zip |
| `canvas-storyboard-pack` | foundation images are already locked and the user wants append keyframes | no images | merge-friendly Canvas append zip |
| `canvas-full-pack` | user wants one import containing foundation and keyframes | no images | full wired Canvas import zip |

Do not invent extra modes. Keep internal/debug artifacts internal.

## Source-size routing

- Short story fragments, scripts, ad briefs, shotlists, and pasted excerpts use the default / `seedance-pack` path.
- If the user asks for only the Seedance 全能参考投喂包, use `reference-feed`.
- If the user asks for a one-shot / full / all-in Canvas import containing characters, scenes, and storyboards together, use `canvas-full-pack` directly.
- If the user says they do not want to "抽卡", "出图", "generate images", or wants to import into Canvas manually, use `canvas-pack` directly for the foundation stage.
- If the user says they have locked/set main images in Canvas and now need shots, storyboard, keyframes, or the next Canvas package, use `canvas-storyboard-pack` directly.
- A whole novel or large `.txt` file uses novel project mode. Read `references/novel-project-mode.md` before operating it.
- Never paste the whole source into context. Use the project tasks to summarize bounded chapters and build the bible from accepted summaries.
- Generate S/A character references only after bible planning and visual-bible planning; do not create identity assets from raw unsummarized source.

## Natural-language UX

Users should speak naturally. Do not make them repeat internal product rules.

Good user prompts:

```text
$cine-make 把这段替嫁冲突拆成 Seedance 全能参考投喂包和 Canvas 导入包：……
```

```text
$cine-make 给我 3D国漫，国风仙侠，偏水墨+古风写实结合，每5条=15s：……
```

```text
$cine-make 我不想在这里抽卡，直接给我 Canvas 提示词包，我导入画布手动生成：……
```

Do not require prompts like:

```text
最终只交付 Seedance feed、canvas-project.zip、canvas-manifest.json、prompt-pack.md 和 README.md，不要甩内部文件。
```

That rule belongs to this skill, not to the user.


## Default Seedance reference-feed workflow

### Seedance + Canvas 主路径

For normal short-script / shotlist operation in this project, use the combined handoff. The bare CLI and `seedance-pack` are equivalent for normal generation:

```bash
node src/cli.mjs --out <run-dir> --aspect 16:9 --style <style> [--input <file>] "<source material>"
node src/cli.mjs seedance-pack --out <run-dir> --aspect 16:9 --style <style> [--input <file>] "<source material>"
```

This writes only:

- `seedance-all-reference-feed.md`
- `canvas-project.zip`
- `canvas-manifest.json`
- `prompt-pack.md`
- `README.md`

It must not create `deliverable.md`, `storyboard-images/`, generated images, videos, segment start/end frames, S01/S02 keyframes, or continuation text. The Seedance feed uses the proven single-line shot-text format: `序号 + 地点 + 角色 + 动作画面 + 主体/景别/机位/构图/光影 + 运镜 + 台词/音效`. The Canvas package is a foundation asset pack for manually generating and locking references before video work.

For this project, when the user drops a script or story fragment and asks Cine Make to operate normally, do not route to the removed modes. Use the Seedance + Canvas pack.

Before generating the package, ask two short questions when the answer is not already present:

1. 询问视觉风格：例如 `3D国漫，国风仙侠，偏水墨+古风写实结合`。
2. 询问是否扩写剧本：不扩写 = 严格按原文拆；扩写 = 可扩成更完整的逐条视频文本。

Run `reference-feed` only when the user wants just the feed file:

```bash
node src/cli.mjs reference-feed --out <run-dir> --aspect 16:9 --style <style> [--input <file>] "<source material>"
```

The output is `seedance-all-reference-feed.md`. It must be a Seedance 全能参考投喂包 / Seedance all-reference feed with only:

- `GPT-image-2 参考图生成提示词`
- `参考资产绑定`
- `全局负面约束`
- `逐条视频文本`
- `底部备注栏可复制`

Do not create `deliverable.md`, `storyboard-images/`, segment start/end frames, S01/S02 keyframes, or continuation text in this workflow. The feed must not contain words like `续接`, `承接`, `下一段`, `后续`, `首帧`, `尾帧`, `segment`, `storyboard-images`, `S01`, or `keyframe`.

### GPT-image-2 三视图生成模板

Every character or creature reference prompt in `reference-feed` must use this one-image tri-view layout:

```text
【三视图生成模板】设计人物三视图：正面全身照、侧面全身照、背面全身照，最左侧单独的上半身+头部细节展示，背景为白色，整体构图工整专业。三视图为一张图。
```

For people: the left detail panel shows face, hair, head, upper body, costume material, and identifying accessories. The main panels show the same character's front full-body, side full-body, and back full-body. Use one face, one hairstyle, one body type, one costume, and one accessory set.

For creatures: use the same layout, but the left panel shows head/eyes/horns/fur/scales detail and the three full-body views lock the same body ratio and material.

The default aspect for this workflow is `16:9`.

## Locate the compiler

Prefer this order:

1. Read `references/compiler-location.md` if it exists in the installed skill.
2. Use `$env:CINE_MAKE_ROOT` / `CINE_MAKE_ROOT` when set.
3. If the current repo is Cine Make, use the current directory.
4. If none is known, ask for the local Cine Make repo path.

The compiler root is the directory containing `src/cli.mjs`.

## Default workflow

When triggered by a story-to-video-preproduction request:

1. Identify the source material: novel excerpt, rough script, ad brief, shotlist, or voiceover script.
2. For normal short scripts and pasted excerpts, run:
   ```bash
   node src/cli.mjs --out <run-dir> --aspect <ratio> --style <style> [--input <file>] "<source material>"
   ```
   This is the same output as `seedance-pack`: Seedance all-reference feed plus Canvas foundation import. It creates no images, no video, no `deliverable.md`, and no `storyboard-images/`.
3. If the user wants manual Canvas generation, prompt packs, or says they do not want local image generation, run:
   ```bash
   node src/cli.mjs canvas-pack --out <run-dir> --aspect <ratio> --style <style> [--input <file>] "<source material>"
   ```
   This creates a compact foundation pack: style bible -> style reference image, character bible -> character reference image, and environment bible -> environment reference image. Text nodes are upstream resources/chips, not generation targets. Character reference image nodes must connect only to their own Character Bible, not to environment or style nodes, so they stay white/light-gray studio turnaround sheets. The layout should read left-to-right rather than a tall top-down dependency tree. Do not create Shot List, Keyframes, text-to-text chain connections, or video segment nodes.
4. If the user has already generated and locked the foundation images in Canvas, run:
   ```bash
   node src/cli.mjs canvas-storyboard-pack --out <run-dir> --aspect <ratio> --style <style> [--input <file>] "<source material>"
   ```
   This creates a merge-friendly append pack for the current Canvas: a Shot List text node plus Keyframe image nodes. It does not duplicate character, scene, or style reference nodes. Each Keyframe declares `requiredAnchors` such as `character-ref-linmo`, `environment-ref-*`, and `style-reference` so Canvas can connect it to the already locked main images. The user should import this with Canvas's "merge into current canvas / 合并到当前画布" flow, not as a new project.
5. If the user wants a full one-shot Canvas import instead of a two-stage workflow, run:
   ```bash
   node src/cli.mjs canvas-full-pack --out <run-dir> --aspect <ratio> --style <style> [--input <file>] "<source material>"
   ```
   This creates the foundation reference nodes and Keyframe nodes in one Canvas project. It must include real connections from locked style/character/environment references to each Keyframe and a story-flow chain from `shot-list` through every Keyframe in order.
6. If the user asks for “导演思维”, “分镜逻辑”, or you need stronger cinematic guidance, read `references/director-prompts.md`.
7. Summarize only the relevant user-facing package path(s), handoff type, and next action.

## Output rules

- A good Seedance video text line is concrete and AI-facing: location, roles, action, performance, shot size, lens/camera position, composition, blocking, lighting, camera movement, dialogue, sound, and negative constraints.
- A good reference image prompt asks for one stable asset sheet, not motion.
- A good prop reference image prompt asks for one isolated object, like a single sword / token / teacup product reference. Do not ask for surrounding people, hands, tables, rooms, multiple variants, or bundled props.
- For Cine Make specifically, if the user explicitly asks for image generation, use `$imagegen` directly and save still images only where the user requested them; do not revive the removed main-path image folder.
- A good video-tool feed card, when a legacy novel export needs one, is operational: uploaded images + timeline + start frame + end frame + shot size + lens + camera language + composition + blocking + lighting/art direction + continuity + avoid list.
- Each legacy video-tool feed card must keep uploaded images at or under 9 total. Character, scene, start frame, storyboard keyframes, and end frame all count as uploaded images.
- If the user says `视频工具投喂包`, treat it as the copy-ready Seedance all-reference feed, not as hidden internal files.
- If the user says `Canvas 提示词包`, `导入画布`, `手动生成`, or `不想抽卡`, treat it as the `canvas-pack` foundation handoff.
- If the user has already locked foundation images and asks what is next, asks for storyboard/keyframe nodes, or says Canvas can merge into the current canvas, treat it as the `canvas-storyboard-pack` append handoff.
- If platform limits are unknown, make tasks smaller instead of stuffing multiple storyboard beats into one prompt.
- Do not surface platform selection in normal user prompts; treat it as an internal adapter concern.
- If character identity is under-specified, generate or request character references before final video text.
- Never make users infer how to use the video tool from raw shotlists. Spell out the per-line feed package in user language.

## Built-in references

- `references/director-prompts.md`: director rewrite, performance, shot planning, storyboard image prompt, and continuity prompt patterns.
- `references/novel-project-mode.md`: whole-novel / large `.txt` project workflow.
- `references/output-contract.md`: user-facing and internal artifact names.
- `references/platform-limits.md`: safe behavior for unknown or changing video-model limits.

## Completion evidence

Before saying a Cine Make run is ready, report:

- compiler command run;
- generated run directory;
- handoff type: default / `seedance-pack`, `reference-feed`, `canvas-pack`, `canvas-storyboard-pack`, `canvas-full-pack`, or whole-novel command;
- for default / `seedance-pack`: `seedance-all-reference-feed.md`, `canvas-project.zip`, `canvas-manifest.json`, `prompt-pack.md`, and `README.md`;
- whether still images were generated or only prompts were prepared;
- video prompt pack status; mention a platform only if the user explicitly named one;
- continuity review result;
- clear reminder that final video synthesis belongs to the external video tool.

