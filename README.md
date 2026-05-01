# Cine Make

**中文优先**：简体中文说明在这里，不应该埋在文档底部：[`README.zh-CN.md`](./README.zh-CN.md)

English version: this file.

**Cine Make** is a local AI short-drama pre-production factory for Codex-style agents.

It turns novels, rough scripts, ad briefs, and story fragments into a compact, executable package for AI video workflows.

Cine Make does **not** render MP4 videos. It decomposes the story, locks continuity, prepares start/end-frame prompts, renders high-quality control frames through `gpt-image-2` first, falls back to built-in `$imagegen` only when that path fails, and writes per-shot video-model tasks. Final video synthesis belongs to external tools such as Seedance, Jimeng, or any other AI video generator.

## What the user gets

A normal run produces these user-facing outputs:

```text
deliverable.md
continuity-bible.json
episodes/
storyboard-images/README.md
```

That is intentional. Users should not have to read internal debug artifacts, but they should receive the actual model-facing task files under `episodes/*/video-tasks/*.md`.

`deliverable.md` is the main product. It is ordered for human understanding first:

```text
1. Film preview
2. Full story flow
3. Full-story episode and video-task breakdown
4. Short film plan
5. Compact storyboard
6. Storyboard image prompt list
7. Video tool feed pack
8. Visual references
9. Continuity notes
```

The key section for video generation is the **full-story episode and video-task breakdown**. Long stories are preserved and split into episodes instead of compressed into a teaser. Each task tells the user exactly:

```text
which start_frame to use
which end_frame to use
what motion to request
what must stay locked
what must be avoided
```

The feed pack is model-facing, not just human-facing. Each task is one visible action, usually **3-6 seconds**, controlled by a start frame and an end frame. Do not ask the video model to understand a whole plot arc from natural language.

## Two modes

Cine Make deliberately has only two user-facing modes.

| Mode | Purpose | Image generation | Output |
| --- | --- | --- | --- |
| `draft` | Fast first pass to understand, split episodes, and revise tasks | No images | `deliverable.md` + `continuity-bible.json` + `episodes/*/video-tasks/*.md` |
| `visual` | Start/end-frame image-output package after the draft is approved | `gpt-image-2` with `quality=high` first; built-in `$imagegen` fallback only on failure | `deliverable.md` + `continuity-bible.json` + `episodes/*/storyboard-images/` |

### Draft mode

Use draft mode when the story is still being shaped.

It answers:

- What is the short drama about?
- What happens from start to finish?
- What does each shot show?
- Is this worth turning into images?

Draft mode should **not** spend time generating pictures.

### Image-output mode

Use image-output mode (`--mode visual`) after the draft is approved.

It prepares or generates:

- optional character reference image;
- optional scene reference image;
- start/end control frames such as `S01-start.png`, `S01-end.png`;
- per-shot task prompts for AI video tools.

The image path is fixed: try the local `gpt-image-2` CLI/API first with `quality=high` and aspect-aware high-resolution sizes such as `9:16 -> 2160x3840`. If the local API key, CPA proxy, network, or tooling fails, Cine Make writes `imagegen-fallback.md/json` and then the built-in `$imagegen` path is used for the remaining frames.

This CLI/API path is not limited to the official OpenAI base URL. If you use **CPA (CLI Proxy API)** and your CPA exposes an OpenAI-compatible `gpt-image-2` model, Cine Make uses exactly these two environment variables:

```text
OPENAI_API_KEY   Required. Use the official OpenAI key for official OpenAI, or the CPA key for CPA.
OPENAI_BASE_URL  Optional. Set it for CPA / OpenAI-compatible proxies; leave it unset for the OpenAI SDK official default https://api.openai.com/v1.
```

The contract is intentionally simple:

- `OPENAI_API_KEY` is the only image API key variable.
- `OPENAI_BASE_URL` is the only image API base URL variable.
- Do not use `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_BASE_URL` for image API auth.
- The model name remains `gpt-image-2`.
- If the request fails for any reason — bad key, quota, broken CPA, timeout, or network failure — Cine Make writes `imagegen-fallback.md/json` and then falls back to built-in `$imagegen`.

For CPA debugging:

```powershell
$env:OPENAI_BASE_URL="https://your-cpa-base-url/v1"
$env:OPENAI_API_KEY="your-cpa-api-key"

node scripts/render-images.mjs --run .cine-make-runs/demo-visual --quality high
```

For official OpenAI debugging, leave `OPENAI_BASE_URL` unset:

```powershell
Remove-Item Env:OPENAI_BASE_URL -ErrorAction SilentlyContinue
$env:OPENAI_API_KEY="your-openai-api-key"

node scripts/render-images.mjs --run .cine-make-runs/demo-visual --quality high
```

To persist this on Windows for the current user:

```powershell
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", "https://your-cpa-base-url/v1", "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-cpa-api-key", "User")
```

Restart Codex / PowerShell after setting them. Verify without printing the secret:

```powershell
$env:OPENAI_BASE_URL
[bool]$env:OPENAI_API_KEY
```

To switch back to the official OpenAI base URL, delete `OPENAI_BASE_URL` and keep `OPENAI_API_KEY`:

```powershell
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", $null, "User")
```

Character, scene, and style reference images are optional. If the user provides them, Cine Make uses them to lock identity, clothing, mood, and scene direction. If not, Cine Make can prepare prompts for generating references.

## Natural-language skill usage

After installing the Codex skill, users should interact naturally.

### Draft example

```text
$cine-make

Turn the following story fragment into a 30-second vertical AI short-drama draft.
Style: cinematic suspense, cold color palette, restrained acting.

Story fragment:
At 3 a.m., delivery rider Chen Mo delivers his last order to an abandoned hospital. The elevator stops on a non-existent 13th floor. When the doors open, he sees his sister, who disappeared ten years ago, sitting at the nurse station and holding the red marble he lost as a child.
```

Chinese prompts work too:

```text
$cine-make

把下面小说片段做成 30 秒竖屏 AI 漫剧草稿。
风格：电影感悬疑、冷色调、克制表演。

小说片段：
凌晨三点，外卖员陈默送最后一单到废弃医院。电梯停在不存在的13楼，门打开后，他看见十年前失踪的妹妹正坐在护士站，手里拿着他小时候丢掉的红色弹珠。
```

### Image-output example

```text
$cine-make

The draft works. Continue into image-output mode.
Generate or prepare the character reference, scene reference, and start/end control frames.
```

### Image-output package with a character image

```text
$cine-make

Use this character image to lock the heroine's face, hair, clothing, and mood.
Turn the following story into a 30-second vertical AI short-drama image-output package.

Character image:
C:\Users\you\Desktop\refs\hero.png

Story:
She receives a text message from herself three years in the future. The message says only one thing: do not go home.
```

Users do **not** need to specify a video platform. Cine Make uses a generic AI-video adapter unless the user explicitly asks for Seedance, Jimeng, or another tool.

## Project article

For a more product-oriented introduction and sharing article, see:

- [Cine Make: 把小说片段变成 AI 漫剧前期制片包](./docs/share-cine-make.zh-CN.md)

## Install from npm

Install the Codex skill from the published npm package:

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

Then restart Codex so the new skill is discovered.

After that, use:

```text
$cine-make ...
```

## CLI usage

The CLI is the compiler kernel behind the skill. Most end users should use the skill, but the CLI is useful for local testing, automation, and development.

### Draft mode

```bash
cine-make --mode draft \
  --out .cine-make-runs/demo \
  --duration 30s \
  --aspect 9:16 \
  --style "cinematic suspense, cold palette, restrained acting" \
  "At 3 a.m., a delivery rider enters an abandoned hospital..."
```

### Image-output mode

```bash
cine-make --mode visual \
  --out .cine-make-runs/demo-visual \
  --duration 30s \
  --aspect 9:16 \
  --style "cinematic suspense, cold palette" \
  --character-image refs/hero.png \
  "Story material here..."
```

Render start/end control frames:

```bash
node scripts/render-images.mjs --run .cine-make-runs/demo-visual --quality high
```

This uses `gpt-image-2` by default. It only reads `OPENAI_API_KEY` and optional `OPENAI_BASE_URL`: if `OPENAI_BASE_URL` is set, it uses that CPA / OpenAI-compatible proxy; if not, it uses the official OpenAI SDK default base URL. If it fails, the run directory gets `imagegen-fallback.md` / `imagegen-fallback.json`; use those manifests with built-in `$imagegen`.

### Optional visual references

```bash
--character-image refs/hero.png
--scene-image refs/hospital.png
--style-image refs/noir-style.png
```

These inputs are optional. Never make reference images required for the main flow.

### Debug artifacts

By default, the run directory stays clean:

```text
deliverable.md
continuity-bible.json
episodes/
storyboard-images/README.md
```

Use debug artifacts only when developing the compiler itself:

```bash
cine-make --mode draft --emit-internal --out .cine-make-runs/debug "Story material"
```

This creates:

```text
.cine-make-internal/
```

Do not expose `.cine-make-internal/` to normal users.

## Output contract

### `deliverable.md`

The primary user-facing document. It should let the user understand the whole film before generating images.

Expected order:

1. **Film preview** — one short explanation of what is being made.
2. **Full story flow** — 3 to 5 beats from opening to ending.
3. **Full-story episode and video-task breakdown** — every source beat is preserved and mapped into per-shot tasks.
4. **Short film plan** — duration, aspect ratio, style, and identity anchors.
5. **Compact storyboard** — shot-by-shot visible action.
6. **Storyboard image prompt list** — still-image prompts for control frames.
7. **Video tool feed pack** — exactly which start/end frames and task prompt to use.
8. **Visual references** — optional reference image guidance.
9. **Continuity notes** — identity, costume, props, lighting, and motion constraints.

### `continuity-bible.json`

The global continuity state. It locks character identity, key props, scene layout, source beats, and episode boundaries.

### `episodes/`

Each episode contains:

```text
episode.md
storyboard-images/
video-tasks/
```

Each `video-tasks/Sxx.md` is the real feed unit for the video model. It contains `start_frame`, `end_frame`, `motion`, `camera`, `must_keep`, `avoid`, still-frame prompts for both frames, and the video-model prompt.

### Root `storyboard-images/`

The root folder usually contains only `README.md` as a compatibility/index file. Per-episode control frames live under `episodes/<episode>/storyboard-images/`.

In image-output mode (`--mode visual`), it can contain:

```text
character-reference.png
scene-reference.png
S01-start.png
S01-end.png
S02-start.png
S02-end.png
...
```

These are still images, not videos. They are used as start/end control frames for external AI video tools.

## What to feed into AI video tools

Users should not feed the whole project folder into Seedance, Jimeng, or any other video tool.

Treat external video generation as a short-task workflow. Cine Make defaults to one visible action per task, usually **3-6 seconds**. Long stories are split into multiple episodes and tasks, then stitched afterwards.

For each `episodes/<episode>/video-tasks/Sxx.md`:

```text
1. Generate start_frame and end_frame with gpt-image-2 + quality=high first; use $imagegen only as fallback.
2. Upload the listed control frames and references.
3. Copy the task's Video model prompt.
4. Generate that short clip in the external video tool.
5. Let the next task inherit the previous end_frame.
```

Cine Make prepares the feed package. The external video tool renders the final video.

## Development

Install dependencies if needed:

```bash
npm install
```

Run tests:

```bash
npm test
```

Validate a run:

```bash
node src/cli.mjs validate --run .cine-make-runs/demo --stage production
```

Dry-run package contents:

```bash
npm pack --dry-run
```

Install the local skill during development:

```bash
node scripts/install-codex-skill.mjs
```

## Boundary

Cine Make owns pre-production:

```text
story material -> full-story breakdown -> episodes/tasks -> start/end image-output package -> video task pack
```

External video tools own final synthesis:

```text
video task pack -> generated video segments -> final edit/export
```

Cine Make must never claim that Codex rendered the final MP4.


