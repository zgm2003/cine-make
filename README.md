# Cine Make

**中文优先**: Simplified Chinese documentation is the primary entrypoint: [`README.zh-CN.md`](./README.zh-CN.md)

Cine Make is a local AI short-drama pre-production compiler for Codex-style agents. It turns novels, rough scripts, ad briefs, and story fragments into a ChatGPT-ready Seedance all-reference feed.

Cine Make does **not** render MP4 videos. It writes text prompts, reference-asset plans, original-fidelity rules, shot-language rules, and continuity notes. Final video synthesis belongs to the external video tool.

## Current version

```text
0.0.5
```

## What the user gets

For normal short-script and excerpt runs, the user-facing package exposes only:

```text
seedance-all-reference-feed.md
README.md
```

Run Cine Make from the story project directory. When `--out` is omitted, the package is written to that project's `runs/<timestamp>/`; the tool repository should not own project outputs. The default CLI and `seedance-pack` produce the same package:

```bash
cd path/to/story-project
cine-make --aspect 16:9 --style "3D guoman xianxia, ink-wash + ancient realistic" "story material..."
cine-make seedance-pack --input script.txt --style "3D guoman"
```

Removed user entries: `--mode draft`, `--mode visual`, `--draft`, and `--visual`. Normal runs must not create `deliverable.md` or `storyboard-images/`.

## Seedance all-reference feed

`seedance-all-reference-feed.md` contains only:

1. `GPT-image-2 reference prompts`
2. `reference asset bindings`
3. `global negative constraints`
4. original-fidelity and shot-language rules
5. Xiaoyunque camera tag library
6. copy-ready single-line video texts
7. copyable bottom notes

The mandatory video-text shape is:

```text
序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效
```

Every 5 video text lines equals 15 seconds unless the user explicitly overrides. The feed must not mention start frames, end frames, S01, segment continuation, or storyboard image folders.

## Original-fidelity and shot-language rules

- The highest-fidelity items are character motivation, event order, cause-effect logic, key reveals, ending hooks, and decisive conflict lines.
- Directly quoted source dialogue should be copied exactly when it is short and load-bearing. Long dialogue may use light adaptation: excerpt the strongest original clause or slightly smooth wording so each 15-second group remains breathable.
- Names, factions, skills, cultivation realms, locations, props, and cause-effect logic come from the source text; do not invent missing lore.
- Narrative prose may be translated into visible action, but event order, character motivation, reveal order, and chapter-ending hooks must stay intact.
- Each 5-line / 15-second group usually keeps only 2-3 short dialogue lines; the rest should be carried by action, reaction, pause, expression, and sound.
- Each video-text line has one main action. Subject, shot size, camera position, composition, lighting, and camera movement must serve the current story information.
- Threat voices, divine transmission, and narration must name their source and vocal texture; do not turn character dialogue into generic voiceover.
- Movement uses Xiaoyunque-supported tags exactly, for example `固定镜头`, `镜头前推`, `跟随拍摄`, `甩摇`, `焦点转移`, `希区柯克`, `高空航拍`, `拉开离场`.

The GPT-image-2 tri-view prompt is one image: front full-body, side full-body, back full-body, plus a separate upper-body + head detail panel on the far left, white background, clean professional layout. 三视图为一张图.

Prop references are value-gated before prompting. Only story-critical props that drive conflict, action, identity reveal, mystery, or the decisive beat become standalone assets. Low-content objects such as ordinary pendants, cups, tableware, decorative tags, or background ornaments are not reference assets and should not be repeated as prompt anchors. If a prop passes the gate, generate one isolated complete object only on a clean white/light-gray background. No people, hands, scene staging, split panels, variants, or bundled props.

If the user wants only the feed file:

```bash
cine-make reference-feed --aspect 16:9 --style "3D guoman" "story material..."
```

## Canvas output disabled

Cine Make no longer produces `canvas-project.zip`, `canvas-manifest.json`, `projects.json`, or `prompt-pack.md`. Public Canvas commands now fail fast and tell the user to use the ChatGPT-only Seedance feed. Use ChatGPT to review the feed, generate/confirm GPT-image-2 reference prompts, and then paste the video lines into the external video tool.

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
Keyframe Prompt     # static image prompt for ChatGPT/GPT-image-2 when needed
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
$cine-make 把这段替嫁冲突拆成 ChatGPT 可校对的 Seedance 全能参考投喂包：……
```

```text
$cine-make 给我 3D国漫，国风仙侠，偏水墨+古风写实结合，每5条=15s：……
```


Users do not need to specify a video platform. Cine Make's normal handoff is a ChatGPT-ready Seedance feed with original-fidelity and shot-language rules.

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
cd path/to/story-project
cine-make --aspect 16:9 --style "3D guoman" "Story material here..."
cine-make seedance-pack --input script.txt --style "3D guoman"
cine-make reference-feed --input script.txt --style "3D guoman"
```

### Whole-novel project mode

Use project mode for a whole novel or a large `.txt` file. It keeps the source out of one prompt, summarizes bounded chapter tasks, builds a series bible, plans visual references, and exports one episode at a time.

```bash
cine-make novel ingest --input ./novel.txt --out runs/my-novel
cine-make novel task --run runs/my-novel --id summarize-chapter-0001
cine-make novel accept-summary --run runs/my-novel --file ./chapter-0001.summary.json
cine-make novel build-bible --run runs/my-novel
cine-make novel visual-bible --run runs/my-novel
cine-make novel plan-episodes --run runs/my-novel
cine-make novel episode --run runs/my-novel --episode 1
```

Novel Studio MVP does not generate images automatically. Run explicit `$imagegen` only after the visual bible is approved.

Novel project commands are planning and episode-preparation steps. The user-facing handoff remains the ChatGPT-ready `seedance-all-reference-feed.md`; do not create Canvas packages or platform-specific upload-budget packages for new delivery.

## Feeding AI video tools

For normal runs, use `seedance-all-reference-feed.md` directly:

1. Generate or confirm the GPT-image-2 reference assets listed in the feed.
2. Bind assets according to the reference asset table.
3. Copy the single-line video texts in 5-line / 15-second groups.
4. Generate clips in the external video tool.
5. Stitch multiple clips externally.

## Development

```bash
npm test
node src/cli.mjs validate --run ../some-story-project/runs/demo --stage production
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
story material -> seedance-all-reference-feed.md -> ChatGPT check -> external video tool
```

External video tools own final synthesis:

```text
single-line video text + references -> generated video segment -> final edit/export
```

Cine Make must never claim that Codex rendered the final MP4.
