# Cine Make

**中文优先**: Simplified Chinese documentation is the primary entrypoint: [`README.zh-CN.md`](./README.zh-CN.md)

Cine Make is a local AI short-drama pre-production tool for Codex-style agents. It turns novels, rough scripts, ad briefs, and story fragments into a compact package that can be handed to AI video tools.

Cine Make does **not** render MP4 videos. It handles story decomposition, continuity, still-image/keyframe prompts, and video feed cards. Final video synthesis belongs to external tools such as Seedance, Jimeng, or another AI video generator.

## Current version

```text
0.0.4
```

## What the user gets

A normal run exposes only:

```text
deliverable.md
storyboard-images/
```

`deliverable.md` is the user entrypoint. It contains:

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

`storyboard-images/` contains or prepares:

```text
character-reference.png
scene-reference.png
segment-01-start.png
S01.png ... S07.png
segment-01-end.png
segment-02-end.png
contact-sheet.jpg
```

A 30-second piece is split into two 15-second cards by default. Each card uses up to 7 AI-storyboard shots. The next card reuses the previous card's end frame as its start frame to preserve continuity.

Internal debug artifacts must stay under `.cine-make-internal/`. Normal users should not see `episodes/`, `continuity-bible.json`, task trees, or handoff files.

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
- `contact-sheet.jpg` overview;
- video feed cards inside `deliverable.md`.

If the user explicitly asks for built-in `$imagegen`, use built-in `$imagegen` directly and copy still images into `storyboard-images/`.

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

Turn the following story fragment into a 30-second vertical AI short-drama draft.
Style: cinematic suspense, cold color palette, restrained acting.

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
Turn the following story into a 30-second vertical AI short-drama image-output package.

Character image:
C:\Users\you\Desktop\refs\hero.png

Story:
She receives a text message from herself three years in the future. The message says only one thing: do not go home.
```

Users do not need to specify a video platform. Cine Make uses a generic video-tool format unless the user explicitly asks for Seedance, Jimeng, or another platform.

## CLI usage

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

### Optional visual references

```bash
--character-image refs/hero.png
--scene-image refs/hospital.png
--style-image refs/noir-style.png
```

These inputs are optional.

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

1. Generate or confirm the character, scene, start-frame, end-frame, `Sxx.png`, and `contact-sheet.jpg` images listed in the image-output checklist.
2. For each video feed card, upload the listed images.
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
