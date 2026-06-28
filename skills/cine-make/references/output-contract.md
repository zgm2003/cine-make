# Output contract

Normal short-script / excerpt user-facing output:

- `seedance-all-reference-feed.md`
- `README.md`

The user should not need to read internal debug artifacts. `seedance-all-reference-feed.md` is the product entrypoint and should expose only the two sections users operate: GPT-image-2 reference prompts and `每5条复制制作块`. Reference binding belongs inside the GPT-image headings (`图片N = 资产名`) and each 5-line block's `上传参考图：资产名 = 图片N` line. Global negative constraints, original-fidelity rules, shot-language rules, and camera tag libraries are internal generation constraints or documentation, not front-loaded user-facing feed sections.

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
- every video line must begin with `时间 + 内/外 + 具体地点` so the external video tool receives environment and location before character action;
- every 5 video text lines equals 15 seconds unless the user explicitly overrides;
- spoken budget is strict per 5-line / 15-second group: OS, 系统提示, 旁白, and role dialogue all count; 20-32 Chinese spoken chars is ideal, 33-36 acceptable, 37-42 crowded, and 43+ fail;
- if a 15-second request cannot naturally contain the source beats and exact OS/dialogue, flag the capacity issue before generating and offer split, dialogue compression, or exact-dialogue-with-merged-visuals tradeoffs;
- each 15-second group should usually keep at most 2 main spoken lines; a special case may use 3 short spoken lines only when the total spoken budget stays comfortable; use action, reaction, pause, expression, and sound for the rest;
- do not hard-compress every episode into a fixed 40 lines; keep 5-line groups at about 15 seconds and let total line count follow story density, including 40 / 45 / 50 / 55 / 60 lines when needed;
- do not force a whole long quote into one video line when it would break pacing or generation reliability;
- dialogue shots should be speaker-only: 谁说话就以谁为单人主镜头, with mouth shape, eyes, hands, pause, status pressure, and current environment light; listener reactions belong in a separate next line;
- avoid video-model-confusing dialogue staging such as `A 前景 B 后景`, `说话者和受声者反应清楚`, `双主体同框反应`, and `前后景关系`;
- copy-ready blocks must use this exact order: `5 条逐条视频文本 -> 上传参考图 -> 音色 -> 统一要求`;
- copy-ready blocks use `上传参考图：资产名 = 图片1；资产名 = 图片2`, not `图片1｜资产名`;
- split longer videos into multiple 15-second groups for later external editing/stitching;
- use exact supported camera tags such as `固定镜头`, `镜头前推`, `跟随拍摄`, `甩摇`, `焦点转移`, `希区柯克`, `高空航拍`, and `拉开离场` in the movement field; keep the tag library in docs/internal guidance rather than the main user feed;
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

Character and scene production rules:

- GPT-image-2 reference prompts must end with `4K画质！`;
- single-character reference images use one layout: left side large face-to-half-body detail, right side front/side/back full-body views;
- scene assets must match the actual shot location; do not replace an interior hall, classroom, livestream room, or shop counter with an exterior reference;
- reuse locked references across episodes. If a later variant is needed, explicitly say `上传并参考上一集/第 1 集生成图` and preserve the same face, hairstyle, identity marks, body type, and core temperament while only changing the needed costume, action, or scene state;
- female cultivator prompts use the 成年成熟女修 rule: 国漫仙侠, 高级好看, 性感但克制, with complete fabric structure `内衬、里裙、安全短裤或不透明下摆`;
- female prompts must include the negative guardrail: `禁止高开衩、整条腿暴露、同时露出双腿、低机位扫腿、腿部特写、胸臀腿特写、透明无遮挡`, plus no 幼态, 低俗裸露, 夜店风, 泳装化, or 内衣化.
