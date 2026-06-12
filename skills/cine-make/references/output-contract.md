# Output contract

Normal short-script / excerpt user-facing output:

- `seedance-all-reference-feed.md`
- `canvas-project.zip`
- `canvas-manifest.json`
- `prompt-pack.md`
- `README.md`

The user should not need to read internal debug artifacts. `seedance-all-reference-feed.md` is the product entrypoint: it must include GPT-image-2 reference prompts, reference asset binding, global negative constraints, copy-ready single-line video text, and a bottom note the user can paste into the video tool.

Normal runs must not expose `deliverable.md`, `storyboard-images/`, `continuity-bible.json`, `episodes/`, task trees, or agent handoff files at the run root. Legacy writer artifacts may exist only when an internal/debug workflow explicitly creates them.

Removed user modes:

- `draft`
- `visual`
- `--mode draft`
- `--mode visual`
- `--draft`
- `--visual`

Main commands:

- default CLI and `seedance-pack`: create the Seedance feed plus Canvas foundation import pack.
- `reference-feed`: create only `seedance-all-reference-feed.md`.
- `canvas-pack`: create only the first Canvas foundation import pack.
- `canvas-storyboard-pack`: create a merge-friendly Canvas append pack after foundation references are locked.
- `canvas-full-pack`: create one full Canvas import containing foundation references and keyframes.

No artifact may claim final MP4 generation.

Seedance feed:

- use single-line video text: `序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`;
- every 5 video text lines equals 15 seconds unless the user explicitly overrides;
- split longer videos into multiple 15-second groups for later external editing/stitching;
- each group must state reference assets, subject lock, camera language, dialogue/sound, and negative constraints;
- final video synthesis and stitching happen outside Cine Make.

Prop reference contract:

- every prop reference prompt must generate one isolated complete object only;
- use a clean white or light-gray product-shot background;
- forbid characters, hands, scene staging, prop bundles, split panels, or multiple variants in the same image;
- describe material and silhouette on that single object instead of adding companion objects.

Canvas pack:

- all Canvas handoff commands write `canvas-project.zip`, `canvas-manifest.json`, `prompt-pack.md`, and `README.md`;
- Canvas packs are media-free: no generated images, no video files;
- foundation packs contain style, character, environment, and prop reference generation nodes;
- append/full packs may contain keyframe nodes, but still no generated media.
