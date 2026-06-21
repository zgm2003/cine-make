---
name: cine-make
description: >-
  Use when a developer wants to turn novel excerpts, whole novels, rough
  scripts, ad briefs, or story material into ChatGPT-ready Seedance
  all-reference feeds for AI short-drama video workflows.
---

# Cine Make

Cine Make turns story material into a compact ChatGPT-ready `seedance-all-reference-feed.md`. The local repo is the compiler kernel; Codex prepares text prompts and plans only.

Cine Make does **not** generate final MP4, does **not** call external video APIs, and no longer produces Canvas packages. Public Canvas handoff commands are disabled: do not run `canvas-pack`, `canvas-storyboard-pack`, `canvas-full-pack`, or `novel canvas` for user delivery.

## Product intent

- turn novel/script/ad material into `seedance-all-reference-feed.md` plus a small `README.md` for ChatGPT review;
- preserve story beats as concrete single-line video texts instead of vague storyboard concepts;
- package GPT-image-2 reference prompts, reference bindings, global negative constraints, original-fidelity rules, shot-language rules, and copy-ready Seedance video text;
- generate Seedance 全能参考投喂包 / Seedance all-reference feed through the default command, `seedance-pack`, or `reference-feed`;
- preserve continuity instead of relying on random video generation.

## Product boundary

- Do not claim Codex generated an MP4.
- Do not call external video APIs from the skill.
- Do not require a server, web IDE, or Canvas system.
- Normal short-script and excerpt runs output only `seedance-all-reference-feed.md` and `README.md`.
- Do not create `canvas-project.zip`, `canvas-manifest.json`, `projects.json`, `prompt-pack.md`, `deliverable.md`, `storyboard-images/`, generated images, videos, segment start/end frames, S01/S02 keyframes, or continuation text on the main path.
- Use image generation only when the user explicitly asks for still images; the main path prepares prompts only.
- Cine Make is Codex-only for still images: use `$imagegen`, not external image APIs or API-key workflows.
- Whole-novel project mode is still valid for bounded summaries, bible planning, visual-bible planning, and episode package work; see `references/novel-project-mode.md`. It must never paste the whole source into context.
- Generate S/A character references only after bible planning and visual-bible planning; do not create identity assets from raw unsummarized source.
- Do not pass `--emit-internal` in normal user runs. It is only for compiler debugging and creates `.cine-make-internal/`.

## Original-fidelity rules / 原著守则

- Directly quoted source dialogue must be copied exactly: no rewritten words, no compression, no changed forms of address, no punctuation changes.
- Names, factions, skills, cultivation realms, locations, props, and cause-effect logic come from the source text; do not invent missing lore.
- Narrative prose may be translated into visible action, but event order, character motivation, reveal order, and chapter-ending hooks must stay intact.
- If shortening is required, remove non-critical narration first; do not remove key dialogue or alter meaning.
- When evidence conflicts, live/current source text beats generated artifacts.

## Shot-language rules / 镜头语言规则

- `seedance-all-reference-feed.md` must be operational: GPT-image-2 reference prompts first, then reference bindings, global negative constraints, original-fidelity rules, shot-language rules, single-line video texts, and a copyable bottom note.
- The single-line video text format is mandatory: `序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`.
- Treat external AI video generation as a short Seedance feed-text workflow. Every 5 single-line video texts equal 15 seconds unless the user explicitly overrides.
- Each line has one main action, one visible story target, enough room for camera movement, performance, and suspense beats.
- A good Seedance video text line is concrete and AI-facing: location, roles, action, performance, shot size, lens/camera position, composition, blocking, lighting, camera movement, dialogue, sound, and negative constraints.
- Do not use subtitles or music by default; keep environment sound, action sound, and necessary dialogue.
- Threat voices, divine transmission, and narration must name their source and vocal texture; do not turn character dialogue into generic voiceover.
- GPT-image-2 reference prompts must use in-frame camera language only: visible blocking, camera position, shot size, character orientation, foreground/background, body pose, expression, spatial relationship, lighting, and negative constraints. Avoid abstract phrases like “男主看着建筑”; write “背对镜头的男主站在画面下方中央，头微微仰起，视线朝向前方居民楼入口”.
- Prop / 道具 selection must be value-gated before prompting: only create standalone prop assets for high-content props that directly drive conflict, action, identity reveal, mystery, or the decisive beat. Low-content accessories / incidental objects such as ordinary pendants, cups, tableware, decorative tags, or background ornaments must not become reference assets, anchors, or repeated prompt details. If a prop passes the gate, its reference prompt must be a single clean product shot: only one complete prop subject, clean white or light-gray background, no character, no hand holding, no scene staging, no prop bundle, no split panels.

## Layered cinematic pipeline

Cine Make uses a layered cinematic pipeline: `SCRIPT_BEATS`, `DIRECTOR_DECISION`, `TEXT_READABILITY_POLICY`, `DIALOGUE_POLICY`, `SHOT_DENSITY_CONTROLLER`, `DIRECTOR_BIBLE`, `CHARACTER_BIBLE`, `SCENE_BIBLE`, `ENVIRONMENT_BIBLES`, `ART_DIRECTION`, `ANCHOR_POLICY`, `Shot Definition`, `Director Cut`, `Keyframe Prompt`, `Motion Prompt`, `QUALITY_CHECK`, and `AI_RISK_WARNINGS`. global rules are not repeated per shot; per-shot prompts stay local and minimal.

- `SCRIPT_BEATS` identifies real narrative beats before shot count is decided; it should not become one beat per shot.
- `DIRECTOR_DECISION` is mandatory director judgment: each shot must prove why it should stay. Use explicit `keep / merge / delete / rewrite` outcomes.
- `TEXT_READABILITY_POLICY` catches carved text, phone screens, labels, photo backs, and wall blood text: readable text must be the primary anchor and must use close-up / insert framing.
- `DIALOGUE_POLICY` keeps source dialogue exact, then creates concise visual-cut support only around it.
- `SHOT_DENSITY_CONTROLLER` recommends a manageable shot count for the runtime; it should push Director Cut to rewrite rhythm instead of mechanically deleting shots.
- `ENVIRONMENT_BIBLES` is the multi-location Environment Bibles layer.
- `ANCHOR_POLICY` / Anchor Policy separates global, character, story, and per-line anchors. Each line uses at most one primary anchor and at most two secondary anchors.
- Director output should expose decisive keep / merge / delete / rewrite judgment before final video text.
- `QUALITY_CHECK` / Quality Check must report `pass / warning / fail` states with concrete issues.
- `AI_RISK_WARNINGS` must flag AI generation risks such as macro shot complex action mismatch, wide shot readable text mismatch, overloaded multi-character frames, forced unnecessary props, Keyframe prompts polluted by Motion Prompt language, and Motion Prompts with too many main actions.
- Keyframe prompts are static image prompts and should be localized Keyframe prompts: define only the current frame's composition, blocking, subject state, lens, lighting, continuity, and primary/secondary anchors. They must not describe video motion, breathing animation, secondary animation, transitions, or multi-action performance.
- Motion Prompt entries are video-model state transitions: one main action, one micro-performance cue, one camera movement, and strict no-cut/no-new-action/no-face-change constraints.

## Main ChatGPT + Seedance handoffs

| Command | When | Image generation | User output |
| --- | --- | --- | --- |
| default / `seedance-pack` | normal short-script, excerpt, shotlist, ad brief, or rough scene text | no images | `seedance-all-reference-feed.md` + `README.md` |
| `reference-feed` | user only wants the copy-ready Seedance feed | no images | `seedance-all-reference-feed.md` |

Canvas commands are deprecated and disabled. Do not invent extra modes. Keep internal/debug artifacts internal.

## Source-size routing

- Short story fragments, scripts, ad briefs, shotlists, and pasted excerpts use the default / `seedance-pack` path.
- If the user asks for only the Seedance 全能参考投喂包 or 视频工具投喂包, use `reference-feed` or the default feed path.
- A whole novel or large `.txt` file uses novel project mode. Read `references/novel-project-mode.md` before operating it.
- Never paste the whole source into context. Use the project tasks to summarize bounded chapters and build the bible from accepted summaries.

## Natural-language UX

Users should speak naturally. The user should not have to say “只要 Seedance 投喂包，不要 Canvas”. That rule belongs to this skill, not to the user.

Good user prompts:

```text
$cine-make 把这段替嫁冲突拆成 ChatGPT 可校对的 Seedance 全能参考投喂包：……
```

```text
$cine-make 给我 3D国漫，国风仙侠，偏水墨+古风写实结合，每5条=15s：……
```

## Default workflow

When triggered by a story-to-video-preproduction request:

1. Identify the source material: novel excerpt, rough script, ad brief, shotlist, or voiceover script.
2. Before generating the package, ask two short questions when the answer is not already present:
   - 询问视觉风格：例如 `3D国漫，国风仙侠，偏水墨+古风写实结合`。
   - 询问是否扩写剧本：不扩写 = 严格按原文拆；扩写 = 可扩成更完整的逐条视频文本。
3. For normal short scripts and pasted excerpts, run:
   ```bash
   node src/cli.mjs --out <run-dir> --aspect <ratio> --style <style> [--input <file>] "<source material>"
   node src/cli.mjs seedance-pack --out <run-dir> --aspect <ratio> --style <style> [--input <file>] "<source material>"
   ```
4. Run `reference-feed` only when the user wants just the feed file:
   ```bash
   node src/cli.mjs reference-feed --out <run-dir> --aspect 16:9 --style <style> [--input <file>] "<source material>"
   ```
5. If the user asks for “导演思维”, “分镜逻辑”, or you need stronger cinematic guidance, read `references/director-prompts.md`.
6. Summarize only the relevant user-facing feed path and next action.

## GPT-image-2 三视图生成模板

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

## Built-in references

- `references/director-prompts.md`: director rewrite, performance, shot planning, storyboard image prompt, and continuity prompt patterns.
- `references/novel-project-mode.md`: whole-novel / large `.txt` project workflow.
- `references/output-contract.md`: user-facing and internal artifact names.
- `references/platform-limits.md`: safe behavior for unknown or changing video-model limits.

## Completion evidence

Before saying a Cine Make run is ready, report:

- compiler command run;
- generated run directory;
- handoff type: default / `seedance-pack`, `reference-feed`, or whole-novel command;
- output files: `seedance-all-reference-feed.md` and, for default / `seedance-pack`, `README.md`;
- whether still images were generated or only prompts were prepared;
- video prompt pack status; mention a platform only if the user explicitly named one;
- original-fidelity / continuity review result;
- clear reminder that final video synthesis belongs to the external video tool.
