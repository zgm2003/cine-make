# Cine Make

**中文优先**: Simplified Chinese documentation is the primary entrypoint: [`README.zh-CN.md`](./README.zh-CN.md)

Cine Make is a local AI short-drama pre-production compiler for Codex-style agents. It turns novels, rough scripts, ad briefs, and story fragments into a Seedance all-reference feed plus a media-free Canvas import pack.

Cine Make does **not** render MP4 videos. It writes text prompts, reference-asset plans, Canvas nodes, and continuity notes. Final video synthesis belongs to the external video tool.

## Current version

```text
0.0.5
```

## What the user gets

For normal short-script and excerpt runs, the user-facing package exposes only:

```text
seedance-all-reference-feed.md
canvas-project.zip
canvas-manifest.json
prompt-pack.md
README.md
```

The default CLI and `seedance-pack` produce the same package:

```bash
node src/cli.mjs --out .cine-make-runs/demo --aspect 16:9 --style "3D guoman xianxia, ink-wash + ancient realistic" "story material..."
node src/cli.mjs seedance-pack --out .cine-make-runs/demo --input script.txt --style "3D guoman"
```

Removed user entries: `--mode draft`, `--mode visual`, `--draft`, and `--visual`. Normal runs must not create `deliverable.md` or `storyboard-images/`.

## Seedance all-reference feed

`seedance-all-reference-feed.md` contains only:

1. `GPT-image-2 reference prompts`
2. `reference asset bindings`
3. `global negative constraints`
4. copy-ready single-line video texts
5. copyable bottom notes

The mandatory video-text shape is:

```text
序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效
```

Every 5 video text lines equals 15 seconds unless the user explicitly overrides. The feed must not mention start frames, end frames, S01, segment continuation, or storyboard image folders.

The GPT-image-2 tri-view prompt is one image: front full-body, side full-body, back full-body, plus a separate upper-body + head detail panel on the far left, white background, clean professional layout. 三视图为一张图.

Prop references are different: each prop prompt must generate one isolated complete object only, like a single sword, token, or teacup product shot on a clean white/light-gray background. No people, hands, scene staging, split panels, variants, or bundled props.

If the user wants only the feed file:

```bash
node src/cli.mjs reference-feed --out .cine-make-runs/feed --aspect 16:9 --style "3D guoman" "story material..."
```

## Canvas handoff

Manual Canvas generation uses the same layer structure. All Canvas handoffs are media-free: they create importable text/node packages, not images or videos.

```bash
node src/cli.mjs canvas-pack --out .cine-make-runs/canvas --aspect 16:9 --style "3D guoman" "story material..."
node src/cli.mjs canvas-storyboard-pack --out .cine-make-runs/canvas-next --aspect 16:9 --style "3D guoman" "story material..."
node src/cli.mjs canvas-full-pack --out .cine-make-runs/canvas-full --aspect 16:9 --style "3D guoman" "story material..."
```

- `canvas-pack`: first foundation graph. World Bible / Art Direction, Character Bible, Environment Bible, plus style_reference, character_reference, and environment_reference image nodes.
- `canvas-storyboard-pack`: merge into current canvas after foundation references are locked; keyframes declare `requiredAnchors`.
- `canvas-full-pack`: one import with foundation references, Shot List, Keyframes, real reference-to-keyframe edges, and `shot-list -> keyframe-s01 -> keyframe-s02` story flow.

## Layered cinematic pipeline

Cine Make outputs a Structured Cinematic Pipeline instead of one overloaded prompt:

```text
SCRIPT_BEATS        # real narrative beat function before shot design
DIRECTOR_DECISION   # keep / merge / delete / rewrite judgment
TEXT_READABILITY_POLICY
DIALOGUE_POLICY
SHOT_DENSITY_CONTROLLER
DIRECTOR_BIBLE      # global directing rules
CHARACTER_BIBLE     # actor / costume / behavior continuity
SCENE_BIBLE         # legacy name used by older docs
ENVIRONMENT_BIBLES  # multi-location spatial continuity array
ART_DIRECTION       # color, light, camera language
ANCHOR_POLICY       # global / character / story / per-line anchor limits
Shot Definition     # static shot design with shot_function and audience_takeaway
Director Cut        # recommended reduced design, not just full coverage
Keyframe Prompt     # static image prompt for Canvas/image models when needed
Motion Prompt       # minimal state transition for the video model
QUALITY_CHECK       # pass / warning / fail self-checks
AI_RISK_WARNINGS    # image/video generation risk warnings
```

global rules are not repeated per shot. Each line carries only its local goal. Keyframe prompts are static image prompts; Motion Prompt entries describe one main action, micro-performance, and camera movement for video generation.

## Director decision layer

Cine Make's key layer is judgment, not longer prompts. `SCRIPT_BEATS` groups real narrative beats before shots exist. `DIRECTOR_DECISION` uses explicit `keep / merge / delete / rewrite` outcomes and asks whether each shot must prove why it should stay: new information, changed relationship, escalated pressure, revealed prop, audience misdirection, countdown/loop pressure, or final hook.

`TEXT_READABILITY_POLICY`, `DIALOGUE_POLICY`, and `SHOT_DENSITY_CONTROLLER` are small control policies. Readable text needs close-up/insert framing; long dialogue becomes visual-cut short lines; the Director Cut rewrites rhythm instead of mechanically deleting beats. `QUALITY_CHECK` reports `pass / warning / fail` states with concrete issues.

`ENVIRONMENT_BIBLES` replaces the single-scene assumption. `ANCHOR_POLICY` lets each line use at most one primary anchor and at most two secondary anchors. `QUALITY_CHECK` and `AI_RISK_WARNINGS` flag common failures: macro shot complex action mismatch, wide shot readable text mismatch, overloaded multi-character frames, forced unnecessary props, Keyframe prompts polluted by Motion Prompt language, and Motion Prompts with too many main actions.

Keyframe output uses localized Keyframe prompts: each prompt carries only local shot design, primary/secondary anchors, blocking, lighting, and continuity needed for that frame.

## Natural-language usage

```text
$cine-make 把这段替嫁冲突拆成 Seedance 全能参考投喂包和 Canvas 导入包：……
```

```text
$cine-make 给我 3D国漫，国风仙侠，偏水墨+古风写实结合，每5条=15s：……
```

```text
$cine-make 我不想在这里抽卡，直接给我 Canvas 提示词包，我导入画布手动生成：……
```

Users do not need to specify a video platform. Cine Make's normal handoff is Seedance feed text plus Canvas reference assets.

## Install

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

Restart Codex after installation, then use:

```text
$cine-make ...
```

## CLI usage

```bash
cine-make --out .cine-make-runs/demo --aspect 16:9 --style "3D guoman" "Story material here..."
cine-make seedance-pack --out .cine-make-runs/demo --input script.txt --style "3D guoman"
cine-make reference-feed --out .cine-make-runs/feed --input script.txt --style "3D guoman"
cine-make canvas-pack --out .cine-make-runs/canvas --input script.txt --style "3D guoman"
```

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

An exported novel episode package is a legacy episode handoff and may contain:

```text
episode-input.md
deliverable.md
storyboard-images/
jimeng-feed-cards.json
```

Legacy Jimeng material budget remains 9 uploaded images per feed card. Character, scene, start frame, storyboard keyframes, and end frame all count as uploaded images.

For users who also run the Canvas system, `novel canvas` creates:

```text
canvas-manifest.json
canvas-project.zip
```

## Feeding AI video tools

For normal runs, use `seedance-all-reference-feed.md` directly:

1. Generate or confirm the GPT-image-2 reference assets listed in the feed or Canvas pack.
2. Bind assets according to the reference asset table.
3. Copy the single-line video texts in 5-line / 15-second groups.
4. Generate clips in the external video tool.
5. Stitch multiple clips externally.

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
story material -> seedance-all-reference-feed.md + canvas-project.zip -> external video tool
```

External video tools own final synthesis:

```text
single-line video text + references -> generated video segment -> final edit/export
```

Cine Make must never claim that Codex rendered the final MP4.
