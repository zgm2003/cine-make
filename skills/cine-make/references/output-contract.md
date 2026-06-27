# Output contract

Normal short-script / excerpt user-facing output:

- `seedance-all-reference-feed.md`
- `README.md`

The user should not need to read internal debug artifacts. `seedance-all-reference-feed.md` is the product entrypoint: it must include GPT-image-2 reference prompts, reference asset binding, global negative constraints, original-fidelity rules, shot-language rules, the Xiaoyunque camera tag library, copy-ready single-line video text, and a bottom note the user can paste into ChatGPT or the video tool.

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

- preserve character motivation, event order, cause-effect logic, key reveals, ending hooks, and decisive conflict lines;
- directly quoted source dialogue should be copied exactly when it is short and load-bearing;
- long dialogue / 长台词 may use light adaptation / 轻微改造: excerpt the strongest original clause or slightly smooth wording for 视频呼吸 / breathable 15-second generation;
- source names, factions, skills, cultivation realms, locations, props, and cause-effect logic must not be invented or renamed;
- narrative prose may become visible action, but event order, motivation, reveal order, and ending hooks must stay intact.

Seedance feed:

- use single-line video text: `序号 时间 内/外 具体地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`;
- every 5 video text lines equals 15 seconds unless the user explicitly overrides;
- if a 15-second request cannot naturally contain the source beats and exact OS/dialogue, flag the capacity issue before generating and offer split, dialogue compression, or exact-dialogue-with-merged-visuals tradeoffs;
- each 15-second group should usually keep only 2-3 short dialogue lines and use action, reaction, pause, expression, and sound for the rest;
- do not force a whole long quote into one video line when it would break pacing or generation reliability;
- copy-ready blocks use `上传参考图：图片1｜资产名；图片2｜资产名`, not `资产名=图片1`;
- split longer videos into multiple 15-second groups for later external editing/stitching;
- include the Xiaoyunque camera tag library before video text, and use exact supported tags such as `固定镜头`, `镜头前推`, `跟随拍摄`, `甩摇`, `焦点转移`, `希区柯克`, `高空航拍`, and `拉开离场` in the movement field;
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
