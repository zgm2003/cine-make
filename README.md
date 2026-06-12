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
4. Director judgment layers: `SCRIPT_BEATS`, `DIRECTOR_DECISION`, `ENVIRONMENT_BIBLES`, `ANCHOR_POLICY`
5. Layered director system: `DIRECTOR_BIBLE`, `CHARACTER_BIBLE`, `SCENE_BIBLE`, `ART_DIRECTION`
6. `STORYBOARD: Shot Definition`
7. `Storyboard Version A: Full Coverage` and `Storyboard Version B: Director Cut`
8. `KEYFRAME_PROMPTS`
9. `MOTION_PROMPTS`
10. `QUALITY_CHECK` and `AI_RISK_WARNINGS`
11. Compact storyboard, image-output checklist, and video-tool feed pack
12. Visual references and continuity notes

### Layered cinematic pipeline

Cine Make outputs a Structured Cinematic Pipeline instead of one overloaded prompt:

```text
SCRIPT_BEATS        # narrative beat function before shot design
DIRECTOR_DECISION   # shot keep / merge / delete judgment
TEXT_READABILITY_POLICY
DIALOGUE_POLICY
SHOT_DENSITY_CONTROLLER
DIRECTOR_BIBLE      # global directing rules
CHARACTER_BIBLE     # actor / costume / behavior continuity
ENVIRONMENT_BIBLES  # multi-location spatial continuity array
ART_DIRECTION       # color, light, camera language
ANCHOR_POLICY       # global / character / story / per-shot anchor limits
Shot Definition     # static shot design with shot_function and audience_takeaway
Director Cut        # recommended reduced storyboard, not just full coverage
Keyframe Prompt     # static image prompt for the image model
Motion Prompt       # minimal state transition for the video model
QUALITY_CHECK       # prompt and storyboard self-checks
AI_RISK_WARNINGS    # image/video generation risk warnings
```

global rules are not repeated per shot. Each shot carries only its local goal. Keyframe prompts are static image prompts; Motion Prompt entries describe one main action, micro-performance, and camera movement for video generation.

### Director decision layer

Cine Make's next layer is judgment, not longer prompts. `SCRIPT_BEATS` now groups real narrative beats before shots exist; it should not degrade into one beat per shot. `DIRECTOR_DECISION` uses explicit `keep / merge / delete / rewrite` outcomes and asks whether each shot adds new information, changes relationships, escalates pressure, reveals a prop, misleads the audience, strengthens the countdown/loop mechanism, or pushes the final hook. In other words, each shot must prove why it should stay.

`TEXT_READABILITY_POLICY`, `DIALOGUE_POLICY`, and `SHOT_DENSITY_CONTROLLER` are small control policies, not new production phases. They make the draft catch key failures early: readable text must be a primary anchor in close-up/insert shots, long dialogue is compressed into visual-cut short lines, and a 40-50s short should usually recommend a manageable Director Cut rather than over-splitting. `QUALITY_CHECK` reports `pass / warning / fail` states with concrete issues instead of vague comments.

`ENVIRONMENT_BIBLES` replaces the old single-scene assumption for multi-location scripts. Each shot can bind to an environment id and mode such as reality, hallucination, or distorted reality.

`ANCHOR_POLICY` separates global, character, story, and per-shot anchors. Not every anchor enters every frame: each shot should use at most one primary anchor and at most two secondary anchors. Phone/countdown/weapon/blood-text props appear only when they serve the shot function.

Draft output keeps `Storyboard Version A: Full Coverage` for review, but recommends `Storyboard Version B: Director Cut` for generation. Director Cut may rewrite a beat into a better shot design; it is not just a mechanical deletion list. `QUALITY_CHECK` and `AI_RISK_WARNINGS` flag common AI failures, including macro shot complex action mismatch, wide shot readable text mismatch, overloaded multi-character frames, forced unnecessary props, Keyframe prompts polluted by Motion Prompt language, and Motion Prompts with too many main actions.

Keyframe output uses localized Keyframe prompts: each prompt carries only the local shot design, primary/secondary anchors, blocking, lighting, and continuity needed for that frame. Global style rules stay in the bibles and are not repeated into every image prompt.


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

Manual Canvas generation uses the same layering. `canvas-pack` creates only the foundation references. After the user locks character, scene, and style main images, `canvas-storyboard-pack` appends static Keyframe image nodes. Those nodes carry `metadata.cineMake.promptLayer = keyframe_static`; Motion Prompt text is kept in metadata for the later video stage instead of being mixed into the image prompt.

For normal short-script and excerpt runs, internal debug artifacts must stay under `.cine-make-internal/`. Normal users should not see `episodes/`, `continuity-bible.json`, task trees, or handoff files from those runs. Whole-novel project mode intentionally exposes project workspace artifacts and per-episode packages.


## Seedance all-reference feed

When the user simply drops a script into Cine Make, prefer the `reference-feed` output instead of the old start/end-frame storyboard workflow. This workflow defaults to `16:9`, asks for visual style, asks whether to expand the script, and writes:

```text
seedance-all-reference-feed.md
```

The file has only: `GPT-image-2 reference prompts`, `reference asset bindings`, `global negative constraints`, `numbered video texts`, and `copyable bottom notes`. It does not create `storyboard-images/` and does not mention start frames, end frames, S01, segment, or continuation language.

The GPT-image-2 tri-view prompt is one image: front full-body, side full-body, back full-body, plus a separate upper-body + head detail panel on the far left, white background, clean professional layout. 三视图为一张图.

```bash
node src/cli.mjs reference-feed --out .cine-make-runs/demo --aspect 16:9 --style "3D ancient live-action, photoreal cinematic" "story material..."
```

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

For short scripts and excerpts, use `canvas-pack` as the first manual Canvas foundation handoff. It creates style, character, and environment reference image nodes only. After the user generates and locks those reference images in Canvas, use `canvas-storyboard-pack` to create a merge-into-current-canvas append package with Shot List and Keyframe image nodes. The storyboard package does not duplicate foundation reference nodes; each Keyframe declares stable anchors such as `character-ref-*`, `environment-ref-*`, and `style-reference`.

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

