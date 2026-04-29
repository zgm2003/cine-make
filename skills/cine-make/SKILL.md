---
name: cine-make
description: >-
  Use when a developer wants to turn novels, rough scripts, ad briefs, or story
  material into director-grade video pre-production assets including director
  script, shotlist, storyboard/keyframe image prompts, Codex-generated still
  images, and Seedance/Jimeng/general video-model prompt packs. Use for AI video
  workflows where Codex prepares images and prompts but does not render MP4
  video.
---

# Cine Make

Cine Make turns raw story material into a video pre-production package. The skill is the human entrypoint; the local repo is the compiler kernel.

Cine Make does **not** generate final video. Codex can write text assets and generate still images; external video tools synthesize video.

## Product intent

- turn novel/script/ad material into filmable director assets;
- generate storyboard/keyframe image prompts and, when available, still images;
- package assets for Seedance, Jimeng, or generic video models;
- preserve continuity instead of relying on random video generation.

## Product boundary

- Do not claim Codex generated an MP4.
- Do not call external video APIs from the skill.
- Do not require a server or web IDE.
- Do not expose the full run tree unless the user asks.
- Use image generation only for still images: references, keyframes, storyboards.

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
2. Run the compiler:
   ```bash
   node src/cli.mjs --draft --out <run-dir> --duration <seconds> --aspect <ratio> --style <style> --platform <seedance|jimeng|generic> "<source material>"
   ```
3. Read `production-brief.md` first. Treat it as the production north star.
   - If the user asks for “导演思维”, “分镜逻辑”, or you need stronger cinematic guidance, read `references/director-prompts.md`.
4. Produce or fill the key assets in this order:
   - `director-script.md`
   - `characters.json`
   - `shotlist.json`
   - `storyboard-board.md`
   - `storyboard-prompts.md`
   - still images or `reference-pack.md`
   - `seedance-pack.md` / `jimeng-pack.md`
   - `continuity-review.md`
5. Use Codex image generation only after `storyboard-prompts.md` is stable.
6. Summarize only the next useful action, not every generated file.

## Output rules

- A good shot is concrete: subject, action, performance, shot size, camera, composition, lighting, and continuity bridge.
- A good image prompt asks for a still frame, not motion.
- A good video-model prompt references keyframes and describes motion, camera movement, and transition logic.
- If platform limits are unknown, segment the video pack instead of stuffing every storyboard into one prompt.
- If character identity is under-specified, generate or request character references before final storyboards.

## Built-in references

- `references/director-prompts.md`: director rewrite, performance, shot planning, storyboard image prompt, and continuity prompt patterns.
- `references/output-contract.md`: required production-run artifact names.
- `references/platform-limits.md`: safe behavior for unknown or changing video-model limits.

## Completion evidence

Before saying a Cine Make run is ready, report:

- compiler command run;
- generated run directory;
- ready task ids or generated assets;
- whether still images were generated or only prompts were prepared;
- video pack target platform;
- continuity review result;
- clear reminder that final video synthesis belongs to the external video tool.
