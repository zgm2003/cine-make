# Cine Make

**中文优先**: Simplified Chinese documentation is the primary entrypoint: [`README.zh-CN.md`](./README.zh-CN.md)

Cine Make is a local AI short-drama pre-production tool for Codex-style agents. It turns novels, rough scripts, ad briefs, and story fragments into a compact package that can be handed to AI video tools.

Cine Make does **not** render MP4 videos. It handles story decomposition, continuity, still-image/keyframe prompts, and Jimeng video feed cards. Final video synthesis belongs to Jimeng.

## Current version

```text
0.0.5
```

## What the user gets

For normal short-script and excerpt runs, the user-facing package exposes only:

```text
deliverable.md
storyboard-images/
```

`deliverable.md` is the user entrypoint. It contains:

1. Film preview
2. Story flow
3. Short-film plan
4. Compact storyboard
5. Image-output checklist
6. Video-tool feed pack
7. Visual references
8. Continuity notes

`storyboard-images/` contains or prepares:

```text
character-reference.png
scene-reference.png
segment-01-start.png
S01.png ... S04.png
segment-01-end.png
segment-02-end.png
```

Cine Make defaults to about 4 storyboard keyframes per 15-second Jimeng feed card so the clip has room for camera movement, performance, and suspense beats. Each feed card can still upload at most 9 images. Character, scene, start frame, storyboard keyframes, and end frame all count as uploaded images. The next card reuses the previous card's end frame as its start frame to preserve continuity.

For normal short-script and excerpt runs, internal debug artifacts must stay under `.cine-make-internal/`. Normal users should not see `episodes/`, `continuity-bible.json`, task trees, or handoff files from those runs. Whole-novel project mode intentionally exposes project workspace artifacts and per-episode packages.

## Modes

| Mode | Purpose | Images | Output |
| --- | --- | --- | --- |
| `draft` | Fast first pass for story, rhythm, and storyboard | No images | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | Image-output mode after draft approval | Generated or prepared stills | `deliverable.md` + `storyboard-images/` |

### Draft mode

Use this while the story is still unstable. It answers what the short is about, how the story progresses, which shots matter, and whether it is ready for image output.

### Image-output mode

Use this after the draft is approved. It prepares:

- character reference image;
- scene reference image;
- segment start/end frames;
- `S01.png` ... `Sxx.png` storyboard keyframes;
- video feed cards inside `deliverable.md`.

Image generation is Codex-only: use `$imagegen`, copy selected stills into `storyboard-images/`, and do not require external image APIs or extra image credentials.

## Install

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

Restart Codex after installation, then use:

```text
$cine-make ...
```

## Natural-language usage

### Draft

```text
$cine-make

Turn the following story fragment into a vertical AI short-drama draft.
Style: photoreal live-action cinematic, 85mm lens, 4K, cold suspense palette, restrained acting.

Story fragment:
At 3 a.m., delivery rider Chen Mo delivers his last order to an abandoned hospital. The elevator stops on a non-existent 13th floor. When the doors open, he sees his sister, who disappeared ten years ago, sitting at the nurse station and holding the red marble he lost as a child.
```

### Image-output package

```text
$cine-make

The draft works. Continue into image-output mode.
Generate the character reference, scene reference, start/end control frames, and storyboard keyframes.
```

### With a character image

```text
$cine-make

Use this character image to lock the heroine's face, hair, clothing, and mood.
Turn the following story into a vertical AI short-drama image-output package.

Character image:
C:\Users\you\Desktop\refs\hero.png

Story:
She receives a text message from herself three years in the future. The message says only one thing: do not go home.
```

Users do not need to specify a video platform. Cine Make outputs Jimeng feed cards only.

## CLI usage

Default visual style is `超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性`.

### Draft mode

```bash
cine-make --mode draft \
  --out .cine-make-runs/demo \
  --aspect 9:16 \
  --style "photoreal live-action cinematic, 85mm lens, 4K, cold suspense palette, restrained acting" \
  "At 3 a.m., a delivery rider enters an abandoned hospital..."
```

### Image-output mode

```bash
cine-make --mode visual \
  --out .cine-make-runs/demo-visual \
  --aspect 9:16 \
  --style "photoreal live-action cinematic, 85mm lens, 4K, cold suspense palette" \
  --character-image refs/hero.png \
  "Story material here..."
```

### Optional visual references

```bash
--character-image refs/hero.png
--scene-image refs/hospital.png
--style-image refs/noir-style.png
```

These inputs are optional.

### Whole-novel project mode

Use project mode for a whole novel or a large `.txt` file. It keeps the source out of one prompt, summarizes bounded chapter tasks, builds a series bible, plans visual references, and exports one episode at a time.

```bash
cine-make novel ingest --input ./novel.txt --out .cine-make-runs/my-novel
cine-make novel task --run .cine-make-runs/my-novel --id summarize-chapter-0001
cine-make novel accept-summary --run .cine-make-runs/my-novel --file ./chapter-0001.summary.json
cine-make novel build-bible --run .cine-make-runs/my-novel
cine-make novel visual-bible --run .cine-make-runs/my-novel
cine-make novel plan-episodes --run .cine-make-runs/my-novel
cine-make novel episode --run .cine-make-runs/my-novel --episode 1
cine-make novel canvas --run .cine-make-runs/my-novel --episode 1
```

Novel Studio MVP does not generate images automatically. Run explicit `$imagegen` only after the visual bible is approved.

An exported novel episode package contains:

```text
episode-input.md
deliverable.md
storyboard-images/
jimeng-feed-cards.json
```

For users who also run the Canvas system, `novel canvas` creates:

```text
canvas-manifest.json
canvas-project.zip
```

`canvas-manifest.json` is Cine Make's semantic director handoff. `canvas-project.zip` is a text-only `projects.json` package that can be imported through the Canvas `导入画布` button. It does not generate images, videos, or media files.

### Debug artifacts

```bash
cine-make --mode draft --emit-internal --out .cine-make-runs/debug "Story material"
```

This additionally creates:

```text
.cine-make-internal/
```

Do not expose `.cine-make-internal/` to normal users.

## Feeding AI video tools

Use `deliverable.md` directly:

1. Generate or confirm the character, scene, start-frame, end-frame, and `Sxx.png` images listed in the image-output checklist with `$imagegen`.
2. For each video feed card, upload the listed images and keep each card at or under 9 uploaded images.
3. Copy the feed-card prompt.
4. Generate the clip in the external video tool.
5. Stitch multiple clips externally; every later card must start from the previous card's end frame.

## Development

```bash
npm test
node src/cli.mjs validate --run .cine-make-runs/demo --stage production
npm pack --dry-run
node scripts/install-codex-skill.mjs
```

## npm publish

Preflight:

```bash
npm whoami --registry=https://registry.npmjs.org/
npm test
npm pack --dry-run
```

Publish:

```bash
npm publish --registry=https://registry.npmjs.org/ --access public
```

Verify:

```bash
npm view cine-make version --registry=https://registry.npmjs.org/
```

## Boundary

Cine Make owns pre-production:

```text
story material -> deliverable.md -> storyboard-images/ -> video-tool feed pack -> external video tool
```

External video tools own final synthesis:

```text
video feed card -> generated video segment -> final edit/export
```

Cine Make must never claim that Codex rendered the final MP4.
