---
name: cine-make
description: >-
  Use when a developer wants to turn novel excerpts, whole novels, rough
  scripts, ad briefs, or story material into ChatGPT-ready Seedance
  all-reference feeds for AI short-drama video workflows.
---

# Cine Make

Cine Make turns story material into a compact ChatGPT-ready `seedance-all-reference-feed.md`. The local repo is the compiler kernel; Codex prepares text prompts and plans only.

Cine Make does **not** generate final MP4, does **not** call external video APIs, and no longer produces Canvas packages. Public Canvas handoff commands are disabled: do not run `canvas-pack`, `canvas-storyboard-pack`, `canvas-full-pack`, or `novel canvas` for user delivery.

## Product intent

- turn novel/script/ad material into `seedance-all-reference-feed.md` plus a small `README.md` for ChatGPT review;
- preserve story beats as concrete single-line video texts instead of vague storyboard concepts;
- package GPT-image-2 reference prompts, reference bindings, global negative constraints, original-fidelity rules, shot-language rules, and copy-ready Seedance video text;
- generate Seedance 全能参考投喂包 / Seedance all-reference feed through the default command, `seedance-pack`, or `reference-feed`;
- preserve continuity instead of relying on random video generation.

## Product boundary

- Do not claim Codex generated an MP4.
- Do not call external video APIs from the skill.
- Do not require a server, web IDE, or Canvas system.
- Normal short-script and excerpt runs output only `seedance-all-reference-feed.md` and `README.md`.
- Do not create `canvas-project.zip`, `canvas-manifest.json`, `projects.json`, `prompt-pack.md`, `deliverable.md`, `storyboard-images/`, generated images, videos, segment start/end frames, S01/S02 keyframes, or continuation text on the main path.
- Use image generation only when the user explicitly asks for still images; the main path prepares prompts only.
- Cine Make is Codex-only for still images: use `$imagegen`, not external image APIs or API-key workflows.
- Whole-novel project mode is still valid for bounded summaries, bible planning, visual-bible planning, and episode package work; see `references/novel-project-mode.md`. It must never paste the whole source into context.
- Generate S/A character references only after bible planning and visual-bible planning; do not create identity assets from raw unsummarized source.
- Do not pass `--emit-internal` in normal user runs. It is only for compiler debugging and creates `.cine-make-internal/`.

## Original-fidelity rules / 原著守则

- The highest-fidelity items are character motivation, event order, cause-effect logic, key reveals, ending hooks, and decisive conflict lines.
- Keep direct source dialogue exact when it is short and load-bearing. For long dialogue / 长台词, use light adaptation / 轻微改造: excerpt the strongest original clause or slightly smooth wording so the 15-second video remains breathable.
- Names, factions, skills, cultivation realms, locations, props, and cause-effect logic come from the source text; do not invent missing lore.
- Narrative prose may be translated into visible action, but event order, character motivation, reveal order, and chapter-ending hooks must stay intact.
- If shortening is required, remove repeated explanation, low-value description, and internal monologue first; do not remove the key conflict or alter meaning.
- When evidence conflicts, live/current source text beats generated artifacts.

## Shot-language rules / 镜头语言规则

- `seedance-all-reference-feed.md` must be operational: GPT-image-2 reference prompts first, then reference bindings, global negative constraints, original-fidelity rules, shot-language rules, single-line video texts, and a copyable bottom note.
- The single-line video text format is mandatory: `序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`.
- Treat external AI video generation as a short Seedance feed-text workflow. Every 5 single-line video texts equal 15 seconds unless the user explicitly overrides.
- Each line has one main action, one visible story target, enough room for camera movement, performance, and suspense beats.
- A 15-second group needs 视频呼吸 / breathable pacing: usually 2-3 short dialogue lines at most, with the rest carried by action, reaction, pause, expression, and sound.
- Do not force a whole long quote / 长台词 into one video line. Preserve the conflict point instead of the full wording when the full wording would break generation.
- A good Seedance video text line is concrete and AI-facing: location, roles, action, performance, shot size, lens/camera position, composition, blocking, lighting, camera movement, dialogue, sound, and negative constraints.
- User-facing delivery must include copy-ready 5-line production blocks: five single-line video texts first, then `上传参考图`, then `音色`, then `统一要求`. The user should be able to copy one whole block directly into the external video tool without reassembling text from the full feed.
- Avoid spatial-staging phrases that video tools misread in all video delivery text. Prefer direct screen-position language such as `画面上方`, `画面下方`, `左侧`, `右侧`, `远处`, `近处`, `居中`, and `占画面三分之一`; avoid `前景`, `后景`, `前后景关系`, and `双主体` unless the user explicitly asks for film-school shot notes rather than generation text.
- Dialogue shots must be speaker-first. When a character speaks, make the speaker the single main shot and describe mouth shape, eyes, gesture, pause, voice texture, and environment light. Do not write video-model-hostile spatial staging such as `A 前景 B 后景`, `speaker foreground listener background`, `speaker and listener reaction clear`, or `dual-subject reaction`. If the listener reaction matters, write it as the next separate line.
- Do not use subtitles or music by default; keep environment sound, action sound, and necessary dialogue.
- Threat voices, divine transmission, and narration must name their source and vocal texture; do not turn character dialogue into generic voiceover.
- The movement field must prefer Xiaoyunque-supported camera tags exactly as written below; add speed/emotion only in parentheses, e.g. `镜头前推（缓慢靠近）`.
- GPT-image-2 reference prompts must use in-frame camera language only: visible blocking, camera position, shot size, character orientation, foreground/background, body pose, expression, spatial relationship, lighting, and negative constraints. Avoid abstract phrases like “男主看着建筑”; write “背对镜头的男主站在画面下方中央，头微微仰起，视线朝向前方居民楼入口”.
- Female character prompts must default to adult, polished, platform-safe elegance: attractive through face, hair, shoulder/neck line, waist tailoring, fabric layers, silhouette, and temperament, not through exposed legs. For skirts, qipao, JK-inspired outfits, dance costumes, and xianxia dresses, explicitly include opaque coverage such as lining, underskirt, safety shorts, or non-transparent lower panels. Small slits are allowed only as garment structure; do not ask for high slits, full-leg exposure, both legs exposed, low-angle leg emphasis, leg close-ups, chest/hip/leg close-ups, see-through uncovered fabric, lingerie-like styling, swimwear-like styling, nightclub styling, infantilized styling, or vulgar nudity. Sheer fabric may be an outer decorative layer only and must not replace real coverage.
- Prop / 道具 selection must be value-gated before prompting: only create standalone prop assets for high-content props that directly drive conflict, action, identity reveal, mystery, or the decisive beat. Low-content accessories / incidental objects such as ordinary pendants, cups, tableware, decorative tags, or background ornaments must not become reference assets, anchors, or repeated prompt details. If a prop passes the gate, its reference prompt must be a single clean product shot: only one complete prop subject, clean white or light-gray background, no character, no hand holding, no scene staging, no prop bundle, no split panels.

## Xiaoyunque camera tags / 小云雀运镜标签库

Use these exact tags in the `运镜` field. Do not replace them with loose synonyms.

- 基础控制：固定镜头｜建立冷静秩序；镜头上摇｜展示高度威压；镜头下摇｜从环境落到人；镜头左摇｜横向展示空间；镜头右摇｜引出画外信息；镜头上升｜展开场景规模；镜头下降｜从全局聚焦；镜头左移｜制造空间视差；镜头右移｜制造空间视差；镜头前推｜强调情绪靠近；镜头后移｜展示人物孤独；变焦推进｜突出表情反应；变焦拉远｜从局部到全貌。
- 人物跟拍：跟随拍摄｜跟住人物行动；迎面跟拍｜保留人物表情；侧面跟拍｜强化行进节奏；手持拍摄｜增加真实紧张；第一视角｜进入角色视角。
- 提示转场：横滑揭示｜从遮挡露主体；前景擦过｜用遮挡完成切换；甩摇｜快速切换信息；焦点转移｜注意力换目标。
- 情绪强化：急速变焦｜放大狗血反应；希区柯克｜现实崩塌瞬间；环绕拍摄｜强化人物气场；盘旋抬升｜高光登场时刻；盘旋下降｜巨物压迫登场。
- 空间航拍：穿越机运镜｜高速掠过空间；稳定器行进｜平稳进入现场；穿越镜头｜穿过边界入场；高空航拍｜建立宏大世界；俯冲下降｜从高空压向目标；拉开离场｜人变小世界变大。

## Layered cinematic pipeline

Cine Make uses a layered cinematic pipeline: `SCRIPT_BEATS`, `DIRECTOR_DECISION`, `TEXT_READABILITY_POLICY`, `DIALOGUE_POLICY`, `SHOT_DENSITY_CONTROLLER`, `DIRECTOR_BIBLE`, `CHARACTER_BIBLE`, `SCENE_BIBLE`, `ENVIRONMENT_BIBLES`, `ART_DIRECTION`, `ANCHOR_POLICY`, `Shot Definition`, `Director Cut`, `Keyframe Prompt`, `Motion Prompt`, `QUALITY_CHECK`, and `AI_RISK_WARNINGS`. global rules are not repeated per shot; per-shot prompts stay local and minimal.

- `SCRIPT_BEATS` identifies real narrative beats before shot count is decided; it should not become one beat per shot.
- `DIRECTOR_DECISION` is mandatory director judgment: each shot must prove why it should stay. Use explicit `keep / merge / delete / rewrite` outcomes.
- `TEXT_READABILITY_POLICY` catches carved text, phone screens, labels, photo backs, and wall blood text: readable text must be the primary anchor and must use close-up / insert framing.
- `DIALOGUE_POLICY` protects short load-bearing dialogue exactly, and for overlong dialogue chooses the strongest original clause or light adaptation that preserves motivation, event order, and ending hooks.
- `SHOT_DENSITY_CONTROLLER` recommends a manageable shot count for the runtime; it should push Director Cut to rewrite rhythm instead of mechanically deleting shots.
- `ENVIRONMENT_BIBLES` is the multi-location Environment Bibles layer.
- `ANCHOR_POLICY` / Anchor Policy separates global, character, story, and per-line anchors. Each line uses at most one primary anchor and at most two secondary anchors.
- Director output should expose decisive keep / merge / delete / rewrite judgment before final video text.
- `QUALITY_CHECK` / Quality Check must report `pass / warning / fail` states with concrete issues.
- `AI_RISK_WARNINGS` must flag AI generation risks such as macro shot complex action mismatch, wide shot readable text mismatch, overloaded multi-character frames, forced unnecessary props, Keyframe prompts polluted by Motion Prompt language, and Motion Prompts with too many main actions.
- Keyframe prompts are static image prompts and should be localized Keyframe prompts: define only the current frame's composition, blocking, subject state, lens, lighting, continuity, and primary/secondary anchors. They must not describe video motion, breathing animation, secondary animation, transitions, or multi-action performance.
- Motion Prompt entries are video-model state transitions: one main action, one micro-performance cue, one camera movement, and strict no-cut/no-new-action/no-face-change constraints.

## Main ChatGPT + Seedance handoffs

| Command | When | Image generation | User output |
| --- | --- | --- | --- |
| default / `seedance-pack` | normal short-script, excerpt, shotlist, ad brief, or rough scene text | no images | `seedance-all-reference-feed.md` + `README.md` |
| `reference-feed` | user only wants the copy-ready Seedance feed | no images | `seedance-all-reference-feed.md` |

Canvas commands are deprecated and disabled. Do not invent extra modes. Keep internal/debug artifacts internal.

## Source-size routing

- Short story fragments, scripts, ad briefs, shotlists, and pasted excerpts use the default / `seedance-pack` path.
- If the user asks for only the Seedance 全能参考投喂包 or 视频工具投喂包, use `reference-feed` or the default feed path.
- A whole novel or large `.txt` file uses novel project mode. Read `references/novel-project-mode.md` before operating it.
- Never paste the whole source into context. Use the project tasks to summarize bounded chapters and build the bible from accepted summaries.

## Natural-language UX

Users should speak naturally. The user should not have to say “只要 Seedance 投喂包，不要 Canvas”. That rule belongs to this skill, not to the user.

Good user prompts:

```text
$cine-make 把这段替嫁冲突拆成 ChatGPT 可校对的 Seedance 全能参考投喂包：……
```

```text
$cine-make 给我 3D国漫，国风仙侠，偏水墨+古风写实结合，每5条=15s：……
```

## Default workflow

When triggered by a story-to-video-preproduction request:

1. Identify the source material: novel excerpt, rough script, ad brief, shotlist, or voiceover script.
2. Before generating the package, ask two short questions when the answer is not already present:
   - 询问视觉风格：例如 `3D国漫，国风仙侠，偏水墨+古风写实结合`。
   - 询问是否扩写剧本：不扩写 = 严格按原文拆；扩写 = 可扩成更完整的逐条视频文本。
3. Locate the story project directory first. Run the compiler from that directory so generated packages stay under that project's `runs/` folder, not inside the Cine Make tool repository.
4. For normal short scripts and pasted excerpts, run:
   ```bash
   cd <story-project-dir>
   node <cine-make-root>/src/cli.mjs --aspect <ratio> --style <style> [--input <file>] "<source material>"
   node <cine-make-root>/src/cli.mjs seedance-pack --aspect <ratio> --style <style> [--input <file>] "<source material>"
   ```
5. Run `reference-feed` only when the user wants just the feed file:
   ```bash
   cd <story-project-dir>
   node <cine-make-root>/src/cli.mjs reference-feed --aspect 16:9 --style <style> [--input <file>] "<source material>"
   ```
6. If the user asks for “导演思维”, “分镜逻辑”, or you need stronger cinematic guidance, read `references/director-prompts.md`.
7. Summarize only the relevant user-facing feed path and next action.

## GPT-image-2 三视图生成模板

Every character or creature reference prompt in `reference-feed` must use this one-image tri-view layout:

```text
【三视图生成模板】设计人物三视图：正面全身照、侧面全身照、背面全身照，最左侧单独的上半身+头部细节展示，背景为白色，整体构图工整专业。三视图为一张图。
```

For people: the left detail panel shows face, hair, head, upper body, costume material, and identifying accessories. The main panels show the same character's front full-body, side full-body, and back full-body. Use one face, one hairstyle, one body type, one costume, and one accessory set.

For creatures: use the same layout, but the left panel shows head/eyes/horns/fur/scales detail and the three full-body views lock the same body ratio and material.

The default aspect for this workflow is `16:9`.

## Locate the compiler

Prefer this order:

1. Read `references/compiler-location.md` if it exists in the installed skill.
2. Use `$env:CINE_MAKE_ROOT` / `CINE_MAKE_ROOT` when set.
3. If the current repo is Cine Make, use the current directory.
4. If none is known, ask for the local Cine Make repo path.

The compiler root is the directory containing `src/cli.mjs`.

## Built-in references

- `references/director-prompts.md`: director rewrite, performance, shot planning, storyboard image prompt, and continuity prompt patterns.
- `references/novel-project-mode.md`: whole-novel / large `.txt` project workflow.
- `references/output-contract.md`: user-facing and internal artifact names.
- `references/platform-limits.md`: safe behavior for unknown or changing video-model limits.

## Completion evidence

Before saying a Cine Make run is ready, report:

- compiler command run;
- generated run directory;
- handoff type: default / `seedance-pack`, `reference-feed`, or whole-novel command;
- output files: `seedance-all-reference-feed.md` and, for default / `seedance-pack`, `README.md`;
- whether still images were generated or only prompts were prepared;
- video prompt pack status; mention a platform only if the user explicitly named one;
- original-fidelity / continuity review result;
- clear reminder that final video synthesis belongs to the external video tool.
