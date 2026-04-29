---
name: cine-make
description: >-
  Use when a developer wants to turn novels, rough scripts, ad briefs, or story
  material into a compact AI short-drama pre-production deliverable, with a
  fast draft mode, an optional visual package mode, optional character/scene
  reference images, and Seedance/Jimeng/general video-model prompts. Use for AI
  video workflows where Codex prepares still images and prompts but does not
  render MP4 video.
---

# Cine Make

Cine Make turns raw story material into a compact AI short-drama pre-production package. The skill is the human entrypoint; the local repo is the compiler kernel.

Cine Make does **not** generate final video. Codex can write text assets and generate still images; external video tools synthesize video.

## Product intent

- turn novel/script/ad material into one readable `deliverable.md`;
- generate storyboard/keyframe image prompts and, in visual mode, still images;
- package assets for generic AI video generation, with optional internal adapters when a user explicitly names a platform;
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

## Two product modes

Use only these two user-facing modes:

| Mode | When | Image generation | User output |
| --- | --- | --- | --- |
| `draft` | default first pass; user is still changing story, rhythm, shots | no images | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | draft is approved; user wants references/keyframes for video tools | yes, still images only when imagegen is available | `deliverable.md` + generated/fillable `storyboard-images/` |

Do not invent extra user modes. Keep internal/debug artifacts internal.

## Natural-language UX

Users should speak naturally. Do not make them repeat internal product rules.

Good user prompts:

```text
$cine-make 把这段小说做成30秒竖屏AI漫剧草稿：……
```

```text
$cine-make 这个草稿可以，继续出视觉包和故事板关键帧。
```

```text
$cine-make 用这张人物图锁定女主，把下面剧情做成30秒竖屏AI漫剧视觉包：……
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
   Normal runs must leave the run root with only `deliverable.md` and `storyboard-images/`.
   Use `--emit-internal` only when debugging the compiler itself.
   Only pass `--platform <seedance|jimeng|generic>` if the user explicitly names a target platform. Otherwise omit it and let the compiler use the generic adapter.
   Optional references:
   ```bash
   --character-image <path> --scene-image <path> --style-image <path>
   ```
3. Read `deliverable.md` first. Treat it as the user-facing north star.
   - If the user asks for “导演思维”, “分镜逻辑”, or you need stronger cinematic guidance, read `references/director-prompts.md`.
4. If the user approves the draft and wants images, run visual mode:
   ```bash
   node src/cli.mjs --mode visual --out <run-dir> --duration <seconds> --aspect <ratio> --style <style> [--character-image <path>] "<source material>"
   ```
5. In visual mode, generate still images in this order when imagegen is available:
   - `storyboard-images/character-reference.png` only if no character image was provided;
   - `storyboard-images/scene-reference.png` only if no scene image was provided;
   - `storyboard-images/S01.png`, `S02.png`, etc.
6. Summarize only the deliverable path, storyboard folder, mode, and next action.

## Output rules

- A good shot is concrete: subject, action, performance, shot size, camera, composition, lighting, and continuity bridge.
- A good image prompt asks for a still frame, not motion.
- A good video-model prompt references keyframes and describes motion, camera movement, and transition logic.
- If platform limits are unknown, segment the video pack instead of stuffing every storyboard into one prompt.
- Do not surface platform selection in normal user prompts; treat it as an internal adapter concern.
- If character identity is under-specified, generate or request character references before final storyboards.
- In draft mode, do not spend time generating images.
- In visual mode, use provided character images to lock face/hair/clothing instead of inventing a new identity.

## Built-in references

- `references/director-prompts.md`: director rewrite, performance, shot planning, storyboard image prompt, and continuity prompt patterns.
- `references/output-contract.md`: user-facing and internal artifact names.
- `references/platform-limits.md`: safe behavior for unknown or changing video-model limits.

## Completion evidence

Before saying a Cine Make run is ready, report:

- compiler command run;
- generated run directory;
- mode: `draft` or `visual`;
- `deliverable.md` path;
- `storyboard-images/` path;
- whether still images were generated or only prompts were prepared;
- video prompt pack status; mention a platform only if the user explicitly named one;
- continuity review result;
- clear reminder that final video synthesis belongs to the external video tool.
