---
name: cine-make
description: >-
  Use when a developer wants to turn novels, rough scripts, ad briefs, or story
  material into a compact AI short-drama pre-production deliverable, with a
  fast draft mode, an optional image-output mode, optional character/scene
  reference images, and Seedance/Jimeng/general video-model prompts. Use for AI
  video workflows where Codex prepares still images and prompts but does not
  render MP4 video.
---

# Cine Make

Cine Make turns raw story material into a compact AI short-drama pre-production package. The skill is the human entrypoint; the local repo is the compiler kernel.

Cine Make does **not** generate final video. Codex can write text assets and generate still images; external video tools synthesize video.

## Product intent

- turn novel/script/ad material into one readable `deliverable.md`;
- preserve long source stories by splitting them into feed cards instead of compressing them into one teaser;
- generate storyboard/keyframe prompts and, in image-output mode (`visual` internally), still images into `storyboard-images/`;
- package concrete video-tool feed cards for generic AI video generation, with optional internal adapters when a user explicitly names a platform;
- preserve continuity instead of relying on random video generation.

## Product boundary

- Do not claim Codex generated an MP4.
- Do not call external video APIs from the skill.
- Do not require a server or web IDE.
- Do not expose the full run tree unless the user asks.
- Use image generation only for still images: references, keyframes, storyboards.
- User-facing output is only `deliverable.md` plus `storyboard-images/`.
- Character, scene, and style images are optional; never make them required.
- The user should not have to say “only deliver deliverable.md and storyboard-images/”. This is mandatory product behavior.
- The user should not have to name a video platform. Use the generic adapter unless the user explicitly asks for Seedance, Jimeng, or another target.
- Do not pass `--emit-internal` in normal user runs. It is only for compiler debugging and creates `.cine-make-internal/`.
- `deliverable.md` must first help the user understand the film: `成片预览` -> `故事全流程` -> `精简分镜`, then provide the AI-facing `AI分镜`, `出图清单`, and `视频工具投喂包`.
- `精简分镜` and `AI分镜` are mandatory and must be director-grade: shot size, lens, camera movement, composition, blocking, performance, lighting, and continuity. Start/end frames are derived from this storyboard; they do not replace it.
- `deliverable.md` must also contain a plain-language `视频工具投喂包`: tell the user exactly which images to upload and which prompt text to copy.
- Treat external AI video generation as a short feed-card workflow. Default to **15 seconds max and 7 AI-storyboard shots per generation card**; split longer stories into multiple cards for later editing/stitching.
- For multi-card outputs, the previous card's end frame is the next card's start frame. Do not generate a separate new start frame that breaks continuity.
- Long stories must be preserved and split into multiple feed cards; do not silently compress a multi-beat story into a single 30-second teaser unless the user explicitly asks for compression.

## Two product modes

Use only these two user-facing modes. In CLI/internal contracts the second mode is still `visual`, but user-facing Chinese should call it `出图模式`, not `视觉包模式` or `生产模式`.

| Mode | When | Image generation | User output |
| --- | --- | --- | --- |
| `draft` / 草稿模式 | default first pass; user is still changing story, rhythm, shots | no images | `deliverable.md` + `storyboard-images/README.md` |
| `visual` / 出图模式 | draft is approved; user wants references/keyframes for video tools | yes, still images only when image generation is available | `deliverable.md` + generated/fillable `storyboard-images/` |

Do not invent extra user modes. Keep internal/debug artifacts internal.

## Natural-language UX

Users should speak naturally. Do not make them repeat internal product rules.

Good user prompts:

```text
$cine-make 把这段小说做成30秒竖屏AI漫剧草稿：……
```

```text
$cine-make 这个草稿可以，继续进入出图模式，生成首尾控制帧。
```

```text
$cine-make 用这张人物图锁定女主，把下面剧情做成30秒竖屏AI漫剧出图包：……
```

Do not require prompts like:

```text
最终只交付 deliverable.md 和 storyboard-images/，不要甩内部文件。
```

That rule belongs to this skill, not to the user.

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
2. Run the compiler in draft mode first:
   ```bash
   node src/cli.mjs --mode draft --out <run-dir> --duration <seconds> --aspect <ratio> --style <style> "<source material>"
   ```
   Normal runs must leave the run root with only the user-facing package: `deliverable.md` and `storyboard-images/`.
   Use `--emit-internal` only when debugging the compiler itself.
   Only pass `--platform <seedance|jimeng|generic>` if the user explicitly names a target platform. Otherwise omit it and let the compiler use the generic adapter.
   Optional references:
   ```bash
   --character-image <path> --scene-image <path> --style-image <path>
   ```
3. Read `deliverable.md` first. Treat it as the user-facing north star.
   - In draft mode, the first understanding sections should be `成片预览`, `故事全流程`, and `精简分镜`.
   - `视频工具投喂包` should come after the user understands the story and storyboard.
   - The feed pack must be operational: upload images, copy prompt, preserve subject, timeline, camera language, lighting/art direction, continuity, and negative constraints.
   - Do not make the user open internal task trees just to understand what to do.
   - If the user asks for “导演思维”, “分镜逻辑”, or you need stronger cinematic guidance, read `references/director-prompts.md`.
4. If the user approves the draft and wants images, run image-output mode (`--mode visual`):
   ```bash
   node src/cli.mjs --mode visual --out <run-dir> --duration <seconds> --aspect <ratio> --style <style> [--character-image <path>] "<source material>"
   ```
5. In image-output mode, generate still images in this order when image generation is available:
   - `storyboard-images/character-reference.png` only if no character image was provided;
   - `storyboard-images/scene-reference.png` only if no scene image was provided;
   - each 15-second segment start frame, e.g. `storyboard-images/segment-01-start.png`;
   - AI-storyboard keyframes, e.g. `storyboard-images/S01.png` ... `S07.png` for a 15-second card;
   - each segment end frame, e.g. `storyboard-images/segment-01-end.png`;
   - `storyboard-images/contact-sheet.jpg` as the overview of all stills.
   For segment 2 and later, reuse the previous end frame as the new start frame: `segment-01-end.png` is segment 2's start frame.
   Use built-in `$imagegen` directly when the user asks for it. The optional local `scripts/render-images.mjs` path is an advanced/debug path, not part of the default user-facing handoff.
6. Summarize only the deliverable path, storyboard folder, mode, and next action.

## Output rules

- A good shot is concrete and AI-facing: subject, action, performance, shot size, lens, camera movement, composition, blocking, lighting, continuity bridge, and negative constraints.
- A good image prompt asks for one storyboard/keyframe still, not motion.
- For Cine Make specifically, if the user explicitly asks for built-in `$imagegen`, use built-in `$imagegen` directly and copy the generated still images into `storyboard-images/`.
- A good video-tool feed card is operational: uploaded images + timeline + start frame + end frame + shot size + lens + camera language + composition + blocking + lighting/art direction + continuity + avoid list.
- If the user says `视频工具投喂包`, treat it as the concrete upload-images-and-copy-prompt section in `deliverable.md`, not as hidden internal files.
- If platform limits are unknown, make tasks smaller instead of stuffing multiple storyboard beats into one prompt.
- Do not surface platform selection in normal user prompts; treat it as an internal adapter concern.
- If character identity is under-specified, generate or request character references before final storyboards.
- In draft mode, do not spend time generating images.
- In image-output mode, use provided character images to lock face/hair/clothing instead of inventing a new identity.
- Never make users infer how to use Seedance/Jimeng/other tools from raw shotlists. Spell out the per-task feed package in user language.

## Built-in references

- `references/director-prompts.md`: director rewrite, performance, shot planning, storyboard image prompt, and continuity prompt patterns.
- `references/output-contract.md`: user-facing and internal artifact names.
- `references/platform-limits.md`: safe behavior for unknown or changing video-model limits.

## Completion evidence

Before saying a Cine Make run is ready, report:

- compiler command run;
- generated run directory;
- mode: `draft` / 草稿模式 or `visual` / 出图模式;
- `deliverable.md` path;
- whether still images were generated or only prompts were prepared;
- video prompt pack status; mention a platform only if the user explicitly named one;
- continuity review result;
- clear reminder that final video synthesis belongs to the external video tool.

