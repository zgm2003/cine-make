# Cine Make

**中文优先**：简体中文说明在这里，不应该埋在文档底部：[`README.zh-CN.md`](./README.zh-CN.md)

English version: this file.

**Cine Make** is a local AI short-drama pre-production factory for Codex-style agents.

It turns novels, rough scripts, ad briefs, and story fragments into a compact, executable package for AI video workflows.

Cine Make does **not** render MP4 videos. It decomposes the story, locks continuity, prepares storyboard/keyframe image prompts, and writes the video-tool feed pack. Final video synthesis belongs to external tools such as Seedance, Jimeng, or any other AI video generator.

## What the user gets

A normal run exposes only these two user-facing items:

```text
deliverable.md
storyboard-images/
```

This is intentional. `deliverable.md` is the product entrypoint: film preview, story flow, compact storyboard, AI storyboard, image-output checklist, storyboard image list, and video-tool feed pack. `storyboard-images/` holds character references, scene references, segment start/end frames, storyboard/keyframe images such as `S01.png`, `S02.png`, and the `contact-sheet.jpg` overview.

`continuity-bible.json`, `episodes/`, task trees, and agent handoff files are internal/debug artifacts. They are emitted only under `.cine-make-internal/` when `--emit-internal` is explicitly used.

The default `deliverable.md` order:

```text
1. Film preview
2. Story flow
3. Short-film plan
4. Compact storyboard
5. AI storyboard
6. Image-output checklist
7. Storyboard image list
8. Video-tool feed pack
9. Visual references
10. Continuity notes
```

The video-tool feed pack is the core handoff: it tells the user which images to upload and which prompt to copy. One feed card is capped at 15 seconds / 7 AI-storyboard shots by default; longer stories are split into cards, with the next card's start frame reusing the previous card's end frame.

## Two modes

Cine Make has only two user modes.

| Mode | Purpose | Images | Output |
| --- | --- | --- | --- |
| `draft` | Fast first pass to understand story, rhythm, and storyboard | No images | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | Image-output mode after the draft is approved | Generate or prepare still images | `deliverable.md` + generated/fillable `storyboard-images/` |

### Draft mode

Draft mode is for an unstable story. It answers what the short film is, what happens from beginning to end, which shots matter, and whether it is worth generating images.

Draft mode should not spend time generating images.

### Image-output mode

Image-output mode is for an approved draft.

It prepares or generates:

- character reference image;
- scene reference image;
- segment start/end frames such as `segment-01-start.png`, `segment-01-end.png`;
- AI-storyboard keyframes such as `S01.png`, `S02.png`;
- the `contact-sheet.jpg` overview;
- the video-tool feed pack inside `deliverable.md`.

If the user explicitly asks for built-in `$imagegen`, use built-in `$imagegen` directly and copy still images into `storyboard-images/`. The local `scripts/render-images.mjs` path is an advanced/debug path, not the default user handoff.

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

Render storyboard/keyframe stills with built-in `$imagegen` using the prompts in `deliverable.md` and `storyboard-images/README.md`, then save them as `storyboard-images/character-reference.png` when no character image is provided, `storyboard-images/scene-reference.png`, `storyboard-images/segment-01-start.png`, `storyboard-images/S01.png` ... `S07.png`, `storyboard-images/segment-01-end.png`, and `storyboard-images/contact-sheet.jpg`, etc.

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
storyboard-images/
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

The main user document. It explains the film first, then gives the concrete video-tool feed pack.

### `storyboard-images/`

The only user-facing asset folder. It contains `README.md`, optional reference images, and generated stills such as:

```text
character-reference.png
scene-reference.png
segment-01-start.png
S01.png
S02.png
...
segment-01-end.png
contact-sheet.jpg
```

Internal debug artifacts may exist under `.cine-make-internal/` only when `--emit-internal` is used.

## What to feed into AI video tools

Users should not feed the whole project folder into Seedance, Jimeng, or any other video tool.

Use `deliverable.md` directly:

```text
1. Generate or confirm the character, scene, start-frame, end-frame, `Sxx.png`, and `contact-sheet.jpg` images listed in the image-output checklist.
2. For each feed card, upload the listed images.
3. Copy the feed-card prompt.
4. Generate the clip in the external video tool.
5. Stitch multiple clips externally; each later card must start from the previous card's end frame.
```

Cine Make prepares the feed package and still images. The external video tool renders the final video.

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
story material -> deliverable.md -> storyboard-images/ -> video-tool feed pack -> external video tool
```

External video tools own final synthesis:

```text
video task pack -> generated video segments -> final edit/export
```

Cine Make must never claim that Codex rendered the final MP4.


