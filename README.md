# Cine Make

Cine Make is a local video pre-production factory for Codex-style agents.

It does **not** generate MP4 files. It turns story material into one user-facing package:

```text
deliverable.md
storyboard-images/
```

Internal files still exist for debugging, but the user should not need to read them.

Users do not need to say this output rule. The skill enforces it.

By default the run directory contains only:

```text
deliverable.md
storyboard-images/
```

Use `--emit-internal` only when debugging the compiler itself.

`deliverable.md` starts with a `视频工具投喂包`: each segment says which images to upload and which prompt to copy.

## Two modes

- `draft`: fast default. Writes `deliverable.md` and image prompts, but does not generate images.
- `visual`: slow visual package mode. Uses optional reference images and prepares/fills `storyboard-images/`.

Reference images are optional:

```bash
--character-image refs/hero.png
--scene-image refs/alley.png
--style-image refs/noir.png
```

## Quick start

Natural skill usage:

```text
$cine-make 把这段小说做成30秒竖屏AI漫剧草稿：雨夜里，女孩在巷口停下脚步。
```

```text
$cine-make 这个草稿可以，继续出视觉包和故事板关键帧。
```

CLI equivalent:

```bash
node src/cli.mjs --mode draft --out .cine-make-runs/demo --duration 30s --aspect 9:16 --style cinematic "把这段小说片段改成竖屏电影感短片：雨夜里，女孩在巷口停下脚步。"
```

Or through the package bin:

```bash
cine-make --mode visual --out .cine-make-runs/demo-visual --character-image refs/hero.png "粗剧本或小说片段"
```

Install the Codex skill locally:

```bash
node scripts/install-codex-skill.mjs
```

Validate a generated run:

```bash
node src/cli.mjs validate --run .cine-make-runs/demo --stage skeleton
node src/cli.mjs validate --run examples/rain-alley --stage production
```

## Boundary

Cine Make owns the pre-production pipeline. External video tools own final synthesis.

```text
story material -> draft deliverable -> optional visual package -> external video model
```

Codex may generate images through its image generation tool, but Cine Make must never pretend it can render video.

## Golden example

See `examples/rain-alley/` for a complete production-run shape. Start with `deliverable.md`; treat the rest as internal/debug assets.
