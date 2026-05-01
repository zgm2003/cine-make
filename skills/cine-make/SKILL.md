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
- preserve long source stories by splitting them into episodes instead of compressing them into one teaser;
- generate start/end-frame prompts and, in image-output mode (`visual` internally), still images through `gpt-image-2` first, with built-in `$imagegen` only as fallback;
- package per-shot `video-tasks/` for generic AI video generation, with optional internal adapters when a user explicitly names a platform;
- preserve continuity instead of relying on random video generation.

## Product boundary

- Do not claim Codex generated an MP4.
- Do not call external video APIs from the skill.
- Do not require a server or web IDE.
- Do not expose the full run tree unless the user asks.
- Use image generation only for still images: references, keyframes, storyboards.
- User-facing output is `deliverable.md`, `continuity-bible.json`, `episodes/`, and the root `storyboard-images/` index.
- Character, scene, and style images are optional; never make them required.
- The user should not have to say “only deliver deliverable.md and storyboard-images/”. This is mandatory product behavior.
- The user should not have to name a video platform. Use the generic adapter unless the user explicitly asks for Seedance, Jimeng, or another target.
- Do not pass `--emit-internal` in normal user runs. It is only for compiler debugging and creates `.cine-make-internal/`.
- `deliverable.md` must first help the user understand the film: `成片预览` -> `故事全流程` -> `精简分镜`.
- `精简分镜` is mandatory and must be director-grade: shot size, lens, camera movement, composition, blocking, performance, lighting, and continuity. Start/end frames are derived from this storyboard; they do not replace it.
- `deliverable.md` must also contain a plain-language `完整剧情拆解与视频任务队列`: tell the user which `episodes/<episode>/video-tasks/Sxx.md` file to use.
- Treat external AI video generation as a short-task workflow. Default to **one visible action per task**, usually **3-6 seconds**, with `start_frame` and `end_frame` as hard visual anchors.
- Long stories must be preserved and split into multiple episodes; do not silently compress a multi-beat story into a single 30-second teaser unless the user explicitly asks for compression.

## Two product modes

Use only these two user-facing modes. In CLI/internal contracts the second mode is still `visual`, but user-facing Chinese should call it `出图模式`, not `视觉包模式` or `生产模式`.

| Mode | When | Image generation | User output |
| --- | --- | --- | --- |
| `draft` / 草稿模式 | default first pass; user is still changing story, rhythm, shots | no images | `deliverable.md` + `continuity-bible.json` + `episodes/*/video-tasks/*.md` + image queues |
| `visual` / 出图模式 | draft is approved; user wants references/start-end frames for video tools | yes; try `gpt-image-2` high-quality CLI/API first, fall back to built-in `$imagegen` if that fails | `deliverable.md` + `continuity-bible.json` + `episodes/*/storyboard-images/` + `episodes/*/video-tasks/` |

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
最终只交付 deliverable.md、continuity-bible.json 和 episodes/，不要甩内部调试文件。
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
   Normal runs must leave the run root with the user-facing package: `deliverable.md`, `continuity-bible.json`, `episodes/`, and root `storyboard-images/README.md`.
   Use `--emit-internal` only when debugging the compiler itself.
   Only pass `--platform <seedance|jimeng|generic>` if the user explicitly names a target platform. Otherwise omit it and let the compiler use the generic adapter.
   Optional references:
   ```bash
   --character-image <path> --scene-image <path> --style-image <path>
   ```
3. Read `deliverable.md` first. Treat it as the user-facing north star.
   - In draft mode, the first understanding sections should be `成片预览`, `故事全流程`, and `精简分镜`.
   - `完整剧情拆解与视频任务队列` should come after the user understands the story and storyboard.
   - Each `video-tasks/Sxx.md` must say: `start_frame`, `end_frame`, `motion`, `camera`, `must_keep`, and `avoid`.
   - Each episode must have `storyboard.md`; this is the director storyboard layer before image generation.
   - Each task must carry a director storyboard: shot size, lens, camera movement, composition, blocking, performance, lighting, transition, and frame purpose.
   - Each task must be model-facing, not a prose summary: it should tell the video model how to animate from one image to another.
   - No task should ask the model to understand a whole plot arc. One task equals one visible action change.
   - If the user asks for “导演思维”, “分镜逻辑”, or you need stronger cinematic guidance, read `references/director-prompts.md`.
4. If the user approves the draft and wants images, run image-output mode (`--mode visual`):
   ```bash
   node src/cli.mjs --mode visual --out <run-dir> --duration <seconds> --aspect <ratio> --style <style> [--character-image <path>] "<source material>"
   ```
5. In image-output mode, generate still images in this order:
   - First try the local `gpt-image-2` CLI/API path with best default quality:
     ```bash
     node scripts/render-images.mjs --run <run-dir> --quality high
     ```
     The script uses `gpt-image-2`, `quality=high`, and a high-resolution aspect-aware size by default (`9:16` -> `2160x3840`).
     Environment contract for the primary path:
     - `OPENAI_API_KEY` is required. Use the official OpenAI key for official OpenAI, or the CPA key for a CLI Proxy API.
     - `OPENAI_BASE_URL` is optional. Set it for CPA / OpenAI-compatible proxies; leave it unset for the OpenAI SDK official default (`https://api.openai.com/v1`).
     - Do not use `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_BASE_URL` as image API credentials.
     - Never print, persist, or echo the full key in run artifacts or final replies.
   - If the primary CLI/API path fails, read `<run-dir>/imagegen-fallback.md` or `<run-dir>/imagegen-fallback.json`, then use built-in `$imagegen` for the remaining frames and copy outputs into the listed `out` paths.
   - `episodes/<episode>/storyboard-images/character-reference.png` only if no character image was provided;
   - `episodes/<episode>/storyboard-images/scene-reference.png` only if no scene image was provided;
   - `episodes/<episode>/storyboard-images/S01-start.png`, `S01-end.png`, etc.
6. Summarize only the deliverable path, continuity bible, episodes folder, mode, and next action.

## Output rules

- A good shot is concrete: subject, action, performance, shot size, camera, composition, lighting, and continuity bridge.
- A good image prompt asks for one control frame, not motion: label `Frame role: START_FRAME` or `Frame role: END_FRAME`.
- For Cine Make specifically, do not use built-in `$imagegen` as the first path when rendering project frames. Prefer `gpt-image-2` CLI/API with `quality=high`; use `OPENAI_API_KEY` plus optional `OPENAI_BASE_URL` for official OpenAI or CPA; use `$imagegen` only as fallback when local API/key/tooling fails.
- A good video-model prompt references exactly one start frame and one end frame, then describes motion, camera movement, and transition logic.
- A good video-model task is operational: `start_frame` + `end_frame` + `motion` + `must_keep` + `avoid`.
- If the user says `视频工具投喂包`, treat it as this per-task start/end-frame feed package, not the old multi-shot prose card.
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
- `continuity-bible.json` path;
- `episodes/` path;
- whether still images were generated or only prompts were prepared;
- video task pack status; mention a platform only if the user explicitly named one;
- continuity review result;
- clear reminder that final video synthesis belongs to the external video tool.

