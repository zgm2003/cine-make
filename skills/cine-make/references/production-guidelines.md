# Production guidelines

These rules are reusable Seedance production constraints. They are not tied to one novel chapter or one current delivery range; a request for the first chapters only limits the current run, not the future project scope.

## Source and project handling

- For novel projects, read only the chapter or episode range needed for the current run. Do not paste or ingest a whole large novel into prompt context.
- If a project has a UTF-8 working copy, use that copy for `cine-make novel ingest`; avoid original text files that decode incorrectly in Node.js.
- Keep output text-only unless the user explicitly asks otherwise: only the `seedance-all-reference-feed.md` feed file. Do not claim MP4, images, videos, package README files, or Canvas packages were generated.

## Reference reuse

- Reuse locked character, core prop, and recurring location references across later episodes. Do not regenerate confirmed assets just because a new episode starts.
- When the same named character or core prop appears again in a later chapter, bind the current `图片N` slot to the existing generated image and label the prompt `沿用第 1 章生成图，不重新生成`. Do not create a fresh GPT-image-2 tri-view for the same identity unless the user explicitly asks for a redesign.
- When a later episode needs a costume, state, or scene variant, tell the user to upload and reference the previous episode / episode 1 generated image. Preserve the same face, hairstyle, identity marks, body type, and core temperament; change only the needed costume, action, or scene state.
- Keep feed reference slots bound as `图片1`, `图片2`, `图片3`, etc. Assets marked as reuse should upload the old image; only assets marked for GPT-image-2 should be newly generated.
- In every copy block, upload bindings must explain what the asset is borrowed for: `资产名 = 图片N（人物参考/场景参考/道具参考/界面参考/群像参考）`. Use specific labels such as `异兽参考` or `坐骑妖兽参考` for creature mounts.

## Image prompt rules

- GPT-image-2 prompts must end with `4K画质！`.
- Single-character references use one image: left side is a large face-to-half-body detail panel, right side is front, side, and back full-body views. New main/supporting characters and costume lock images follow this layout; do not output only a plain three-view sheet.
- 场景资产必须贴合逐条视频文本的真实空间。Exterior mountain gates, interior halls, hall exterior stairs, high-altitude flight, classrooms, livestream rooms, and shop counters are separate scene anchors. Do not use one exterior reference for an interior shot.
- Female character generation rule: treat female cultivators as 成年成熟女修. The look is 国漫仙侠, 高级好看, 性感但克制. Appeal comes from face, hairstyle, shoulder/neck/collarbone line, waistline, layered fabric, tailoring, and temperament, not exposed legs.
- For skirts, qipao, JK, and dance costumes, specify complete fabric structure: 内衬、里裙、安全短裤或不透明下摆. Small slits or slight leg contour during movement are acceptable, but 禁止高开衩、整条腿暴露、同时露出双腿、低机位扫腿、腿部特写、胸臀腿特写、透明无遮挡.
- Sheer gauze may only be an outer decoration and must not replace coverage. 禁止幼态、低俗裸露、夜店风、泳装化、内衣化. Do not write rules such as “单侧腿部线条必须清楚” or “不要厚重长裙挡死腿部线条”, because they push the generator toward overexposed legs.

## Video line rules

- Each video line starts with `时间 + 内/外 + 具体地点`, for example `日 内 鬼王宗宗门大殿`, `夜 外 鬼王宗大殿外`, or `日 内 姹女教宗门大殿`.
- For dialogue shots, 谁说话就以谁为单人主镜头. Describe the speaker's mouth shape, eyes, hand movement, pause, status pressure, and current environment light.
- Avoid dialogue staging that video tools misread: `A 前景 B 后景`, `说话者和受声者反应清楚`, `双主体同框反应`, and `前后景关系`. If a reaction matters, write the listener reaction as the next separate line.
- For throne rooms, council halls, classrooms, shops, and any clear center-axis space, define the target direction explicitly. Side-seat speakers must `转向上首王座/主位/讲台/柜台`, `略微仰视` the authority figure, and avoid bare seat coordinates such as `左侧第二席` unless the gaze target is also stated.
- In group reaction shots, align bodies and eye lines to one story target: `众人身体和视线都朝王座方向`, `面朝主位拱手`, or `看向柜台掌柜`. Do not rely on `两侧席位`, `众人虚化`, or `彼此低笑` alone when the viewer must understand who they are watching.
- For exits from center-axis spaces, state the path and destination: `背对王座沿中轴走向敞开的殿门`, `从座位前方退到中轴两侧`, or `沿柜台前通道离开`. Do not let characters wander behind seats or move toward the wrong side of the room.
- For hand and prop close-ups, use one simple natural hand pose and lock orientation. Write `掌心朝上`, `五指自然弯曲不反折`, `手腕自然不扭转`, and for phones or books specify `正面屏幕朝镜头` / `背面朝镜头` / `保持竖直不翻面`. If the screen matters, explicitly forbid the opposite side such as `不要背面摄像头`.

## Copy block rules

- Deliver copy-ready groups in this order: 5 条逐条视频文本 -> 上传参考图 -> 音色 -> 统一要求.
- Each group should be copyable into the external video tool without requiring the user to reassemble lines from the full feed.
- The `上传参考图` line must be self-contained: list only assets relevant to this group and include their usage suffix, for example `资产名 = 图片N（人物参考/场景参考/道具参考/界面参考/群像参考）`.
- The voice line should preserve only short necessary dialogue already present in the group's video lines. If a group has no dialogue, do not add narration.
- The unified requirement line should keep the no-subtitles/no-music constraint and only allow environment sound, system prompts, action sound effects, and necessary dialogue.

## Breathing and dialogue density

- 不要把每集硬压成固定 40 条. Keep each 5-line video text group at about 15 seconds, but let total line count follow story density: 40 / 45 / 50 / 55 / 60 lines are all valid when the chapter needs them.
- Non-fight passages need breathing room. Usually keep only 2-3 core short spoken lines per 5-line group; use action, gaze, pause, reaction shots, phone UI inserts, environment sound, and action sound effects for the rest.
- Fight, flight, chase, and artifact-display passages can be denser, but key actions still need complete shots. Do not pack multiple attacks and multiple spoken lines into one line.
- Long source dialogue should be adapted by keeping the short clause or conflict point that moves the plot. Remove repeated explanation, filler, and machine-translated phrasing while preserving character stance, cause-effect, reveal order, and chapter hook.
- If 4 or more lines in a 5-line group contain dialogue, narration, or system prompts, add shots or rewrite part of the information into visuals, reactions, interface inserts, or sound effects.
