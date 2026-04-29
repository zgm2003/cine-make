# Cine Make

Cine Make is a local video pre-production factory for Codex-style agents.

It does **not** generate MP4 files. It turns story material into production assets:

- director-grade script rewrite;
- character and scene anchors;
- shotlist and storyboard contract;
- storyboard/keyframe image prompts for Codex image generation;
- Seedance/Jimeng/general video-model prompt packs;
- continuity review gates.

## Quick start

```bash
node src/cli.mjs --out .cine-make-runs/demo --duration 30s --aspect 9:16 --style cinematic --platform seedance "把这段小说片段改成竖屏电影感短片：雨夜里，女孩在巷口停下脚步。"
```

Or through the package bin:

```bash
cine-make --out .cine-make-runs/demo "粗剧本或小说片段"
```

Install the Codex skill locally:

```bash
node scripts/install-codex-skill.mjs
```

## Boundary

Cine Make owns the pre-production pipeline. External video tools own final synthesis.

```text
story material -> director script -> shotlist -> storyboard/keyframe images -> video-model prompt pack -> external video model
```

Codex may generate images through its image generation tool, but Cine Make must never pretend it can render video.

