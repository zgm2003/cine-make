# Cine Make

**Cine Make** is a local AI short-drama pre-production factory for Codex-style agents.

It turns novels, rough scripts, ad briefs, and story fragments into a compact, user-facing package for AI video workflows.

Cine Make does **not** render MP4 videos. It prepares the story, storyboard plan, still-image prompts, and video-tool feed prompts. Final video synthesis belongs to external tools such as Seedance, Jimeng, or any other AI video generator.

## What the user gets

A normal run produces only two user-facing outputs:

```text
deliverable.md
storyboard-images/
```

That is intentional. Users should not have to read internal planning files, JSON contracts, task prompts, or debug artifacts.

`deliverable.md` is the main product. It is ordered for human understanding first:

```text
1. Film preview
2. Full story flow
3. Short film plan
4. Compact storyboard
5. Storyboard image prompt list
6. Video tool feed pack
7. Visual references
8. Continuity notes
```

The key section for video generation is the **Video Tool Feed Pack**. Each segment tells the user exactly:

```text
Upload these images
Copy this prompt
```

## Two modes

Cine Make deliberately has only two user-facing modes.

| Mode | Purpose | Image generation | Output |
| --- | --- | --- | --- |
| `draft` | Fast first pass to understand and revise the story | No images | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | Slow visual package after the draft is approved | Still images when available | `deliverable.md` + generated/fillable `storyboard-images/` |

### Draft mode

Use draft mode when the story is still being shaped.

It answers:

- What is the short drama about?
- What happens from start to finish?
- What does each shot show?
- Is this worth turning into images?

Draft mode should **not** spend time generating pictures.

### Visual mode

Use visual mode after the draft is approved.

It prepares or generates:

- optional character reference image;
- optional scene reference image;
- storyboard/keyframe images such as `S01.png`, `S02.png`, `S03.png`;
- feed prompts for AI video tools.

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

### Visual package example

```text
$cine-make

The draft works. Continue into visual package mode.
Generate or prepare the character reference, scene reference, and storyboard keyframes.
```

### Visual package with a character image

```text
$cine-make

Use this character image to lock the heroine's face, hair, clothing, and mood.
Turn the following story into a 30-second vertical AI short-drama visual package.

Character image:
C:\Users\you\Desktop\refs\hero.png

Story:
She receives a text message from herself three years in the future. The message says only one thing: do not go home.
```

Users do **not** need to specify a video platform. Cine Make uses a generic AI-video adapter unless the user explicitly asks for Seedance, Jimeng, or another tool.

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

### Visual mode

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

The primary user-facing document. It should let the user understand the whole film before generating images.

Expected order:

1. **Film preview** — one short explanation of what is being made.
2. **Full story flow** — 3 to 5 beats from opening to ending.
3. **Short film plan** — duration, aspect ratio, style, and identity anchors.
4. **Compact storyboard** — shot-by-shot visible action.
5. **Storyboard image prompt list** — still-image prompts for keyframes.
6. **Video tool feed pack** — exactly which images to upload and which prompt to copy.
7. **Visual references** — optional reference image guidance.
8. **Continuity notes** — identity, costume, props, lighting, and motion constraints.

### `storyboard-images/`

In draft mode, this folder usually contains only `README.md`.

In visual mode, it can contain:

```text
character-reference.png
scene-reference.png
S01.png
S02.png
S03.png
...
```

These are still images, not videos. They are used as keyframe/reference images for external AI video tools.

## What to feed into AI video tools

Users should not feed the whole project folder into Seedance, Jimeng, or any other video tool.

For each segment in `deliverable.md`:

```text
1. Upload the listed storyboard images.
2. Copy the listed prompt.
3. Generate that segment in the external video tool.
4. Repeat for the next segment.
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
story material -> draft deliverable -> optional visual package -> video-tool feed pack
```

External video tools own final synthesis:

```text
video-tool feed pack -> generated video segments -> final edit/export
```

Cine Make must never claim that Codex rendered the final MP4.

## Translations

- [简体中文](./README.zh-CN.md)

