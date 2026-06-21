# Output contract

Normal short-script / excerpt user-facing output:

- `seedance-all-reference-feed.md`
- `README.md`

The user should not need to read internal debug artifacts. `seedance-all-reference-feed.md` is the product entrypoint: it must include GPT-image-2 reference prompts, reference asset binding, global negative constraints, original-fidelity rules, shot-language rules, copy-ready single-line video text, and a bottom note the user can paste into ChatGPT or the video tool.

Normal runs must not expose `canvas-project.zip`, `canvas-manifest.json`, `projects.json`, `prompt-pack.md`, `deliverable.md`, `storyboard-images/`, `continuity-bible.json`, `episodes/`, task trees, or agent handoff files at the run root. Legacy writer artifacts may exist only when an internal/debug workflow explicitly creates them.

Removed user modes and commands:

- `draft`
- `visual`
- `--mode draft`
- `--mode visual`
- `--draft`
- `--visual`
- `canvas-pack`
- `canvas-storyboard-pack`
- `canvas-full-pack`
- `novel canvas`

Main commands:

- default CLI and `seedance-pack`: create the ChatGPT-only Seedance feed plus README.
- `reference-feed`: create only `seedance-all-reference-feed.md`.

No artifact may claim final MP4 generation.

Original-fidelity contract:

- directly quoted source dialogue must be copied exactly;
- source names, factions, skills, cultivation realms, locations, props, and cause-effect logic must not be invented or renamed;
- narrative prose may become visible action, but event order, motivation, reveal order, and ending hooks must stay intact.

Seedance feed:

- use single-line video text: `序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`;
- every 5 video text lines equals 15 seconds unless the user explicitly overrides;
- split longer videos into multiple 15-second groups for later external editing/stitching;
- each group must state reference assets, subject lock, camera language, dialogue/sound, and negative constraints;
- final video synthesis and stitching happen outside Cine Make.

Prop reference contract:

- standalone prop assets are allowed only when the prop directly drives conflict, action, identity reveal, mystery, or the decisive beat;
- low-content accessories and incidental objects such as ordinary pendants, cups, tableware, decorative tags, or background ornaments must not become reference assets, anchors, or repeated prompt details;
- every prop reference prompt must generate one isolated complete object only;
- use a clean white or light-gray product-shot background;
- forbid characters, hands, scene staging, prop bundles, split panels, or multiple variants in the same image;
- describe material and silhouette on that single object instead of adding companion objects.

Canvas output:

- disabled for public user delivery;
- do not create Canvas zip, manifest, projects json, or prompt pack from normal runs;
- if a legacy internal exporter remains in code, do not route user requests to it.
