# Cine Make

Cine Make is a local video pre-production factory for Codex-style agents.

It does **not** generate MP4 files. It turns story material into one user-facing package:

```text
deliverable.md
storyboard-images/
```

Internal files still exist for debugging, but the user should not need to read them.

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

```bash
node src/cli.mjs --mode draft --out .cine-make-runs/demo --duration 30s --aspect 9:16 --style cinematic --platform seedance "把这段小说片段改成竖屏电影感短片：雨夜里，女孩在巷口停下脚步。"
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
