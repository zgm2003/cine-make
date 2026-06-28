# Cine Make

Cine Make 是一个给 Codex 风格 Agent 使用的本地 AI 短剧前期编译器。它把小说片段、粗剧本、广告 brief、故事素材，直接编成 **ChatGPT 可用的 Seedance 全能参考投喂包**。

Cine Make **不渲染 MP4**。它只写 GPT-image-2 参考图提示词和可直接复制的每5条视频制作块；原著守则和镜头语言规则作为内部生成约束存在。最终视频合成属于外部视频工具。

## 当前版本

```text
0.0.5
```

## 用户拿到什么

普通短片和小说片段运行只暴露这些用户交付物：

```text
seedance-all-reference-feed.md
README.md
```

请在具体剧本项目目录里运行 Cine Make。省略 `--out` 时，产物会写入该项目的 `生产资产/<timestamp>/`；工具仓库本身不应该承载项目产物。默认 CLI 和 `seedance-pack` 等价：

```bash
cd path/to/story-project
cine-make --aspect 16:9 --style "3D国漫，国风仙侠，偏水墨+古风写实结合" "故事素材..."
cine-make seedance-pack --input script.txt --style "3D国漫"
```

已删除用户入口：`--mode draft`、`--mode visual`、`--draft`、`--visual`。普通运行不得再创建 `deliverable.md` 或 `storyboard-images/`。

## Seedance 全能参考投喂包

`seedance-all-reference-feed.md` 只包含：

1. `GPT-image-2 参考图生成提示词`
2. `每5条复制制作块`

逐条视频文本必须是这种单行格式：

```text
序号 时间 内/外 具体地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效
```

除非用户明确改规则，否则每 5 条视频文本 = 15 秒。每组发声预算必须严格控制：OS、系统提示、旁白、角色对白都算中文发声字；20-32 字最舒服，33-36 字可接受，37-42 字偏挤，43 字及以上视为失败线。如果用户指定 15 秒但原文节拍和必须一字不改的 OS/对白放不下，必须先提醒容量问题，再选择拆段，或保留原文对白不改字并压缩画面动作。Feed 不写首帧、尾帧、S01、segment 续接，也不写旧图片文件夹。

## 原著守则和镜头语言规则

- 原著优先级最高的是人物动机、事件顺序、因果逻辑、关键信息、章节钩子和爆点台词。
- 短而承重的直接引号台词优先照抄；长台词允许为 15 秒视频呼吸做轻微改造，摘取原文最有冲突力的短句或轻微顺口化。
- 人名、势力、功法、境界、地点、道具和因果关系以原文为准；没出现的设定不补。
- 可以把叙述转成可见动作，但不能改变事件顺序、人物动机、信息揭示顺序和章末钩子。
- 每 5 条 / 15 秒通常只保留 2 条主发声线；特殊情况最多 3 条短句，且总发声字数仍要舒服，其余信息用动作、反应、停顿、表情和声音补回。
- 每条视频文本只做一个主要动作，主体、景别、机位、构图、光影、运镜都必须服务当前剧情信息。
- 威胁声、神识传音、旁白必须标明声源和质感，不能把角色对白误写成普通解说。
- 运镜使用小云雀支持的原始标签，例如 `固定镜头`、`镜头前推`、`跟随拍摄`、`甩摇`、`焦点转移`、`希区柯克`、`高空航拍`、`拉开离场`。

GPT-image-2 三视图是一张图：正面全身、侧面全身、背面全身，最左侧单独放上半身+头部细节，白底，专业排版。三视图为一张图。

道具参考图先过“内容价值”筛选：只有直接推动冲突、动作、身份反转、悬疑揭示或关键爆点的道具，才单独建资产。普通玉佩、茶杯、餐具、装饰牌、背景摆件这类低内容感物件，不建参考图、不当锚点、不反复写进提示词。通过筛选的道具才生成一个完整单体产品图；白色/浅灰背景；不要人物、不要手持、不要场景摆拍、不要分栏、不要多版本、不要道具组合。

只要单独 feed 文件时：

```bash
cine-make reference-feed --aspect 16:9 --style "3D国漫" "故事素材..."
```

## Canvas 输出已关闭

Cine Make 以后不再生产 `canvas-project.zip`、`canvas-manifest.json`、`projects.json` 或 `prompt-pack.md`。公开 Canvas 命令会快速失败，并提示用户改用 ChatGPT-only Seedance feed。后续流程是：把 feed 交给 ChatGPT 校对，生成/确认 GPT-image-2 参考提示词，再把逐条视频文本投喂外部视频工具。

## 分层电影管线

Cine Make 输出结构化电影管线，而不是一坨超长提示词：

```text
SCRIPT_BEATS        # 真实叙事节拍
DIRECTOR_DECISION   # 保留 / 合并 / 删除 / 重写
TEXT_READABILITY_POLICY
DIALOGUE_POLICY
SHOT_DENSITY_CONTROLLER
DIRECTOR_BIBLE      # 全局导演规则
CHARACTER_BIBLE     # 角色、服装、表演连续性
SCENE_BIBLE         # 兼容旧文档名称
ENVIRONMENT_BIBLES  # 多场景环境圣经数组
ART_DIRECTION       # 色彩、光线、镜头语言
ANCHOR_POLICY       # 全局 / 角色 / 故事 / 单行锚点限制
Shot Definition     # 静态镜头设计
Director Cut        # 导演删减版，不是机械删减
Keyframe Prompt     # 需要时给 ChatGPT / GPT-image-2 的静态提示词
Motion Prompt       # 给视频模型的最小状态转移
QUALITY_CHECK       # 通过 / 警告 / 失败
AI_RISK_WARNINGS    # 图像/视频生成风险
```

全局规则不在每镜重复。每条视频文本只携带本地目标。Keyframe 提示词是静态图像提示词；Motion Prompt 只描述一个主动作、一个微表演和一个运镜。

## 导演判断层

Cine Make 的关键是判断，不是把提示词写长。`SCRIPT_BEATS` 先整理真实叙事节拍。`DIRECTOR_DECISION` 使用 `keep / merge / delete / rewrite`，要求每个镜头必须证明自己不可删除：新增信息、改变关系、升级压力、揭示关键道具、误导观众、强化倒计时/循环机制，或推动最终钩子。

`TEXT_READABILITY_POLICY`、`DIALOGUE_POLICY`、`SHOT_DENSITY_CONTROLLER` 是小控制策略。可读文字必须用近景/插入镜头；长台词压成视觉短句；Director Cut 重写节奏，而不是机械删镜头。`QUALITY_CHECK` 用 `pass / warning / fail` 给出具体问题。

`ENVIRONMENT_BIBLES` 取代单场景假设。`ANCHOR_POLICY` 限制每条最多 1 个 primary anchor、最多 2 个 secondary anchor。`QUALITY_CHECK` 和 `AI_RISK_WARNINGS` 标记常见失败：macro 复杂表演不匹配、wide 文字阅读失败、多人画面过载、强塞无关道具、Keyframe 被 Motion Prompt 污染、Motion Prompt 主动作太多。

局部化 Keyframe 提示词只携带当前帧需要的局部镜头设计、主/次锚点、调度、光线和连续性。

## 自然语言用法

```text
$cine-make 把这段替嫁冲突拆成 ChatGPT 可校对的 Seedance 全能参考投喂包：……
```

```text
$cine-make 给我 3D国漫，国风仙侠，偏水墨+古风写实结合，每5条=15s：……
```


用户不需要指定视频平台。Cine Make 默认交付 ChatGPT 可校对的 Seedance feed；用户面对的主文件只保留参考图提示词和每5条复制制作块。

## 安装

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

重启 Codex 后使用：

```text
$cine-make ...
```

## CLI 用法

```bash
cd path/to/story-project
cine-make --aspect 16:9 --style "3D国漫" "故事素材..."
cine-make seedance-pack --input script.txt --style "3D国漫"
cine-make reference-feed --input script.txt --style "3D国漫"
```

### 长篇小说项目模式

整本小说或很大的 `.txt` 文件走项目模式。它不会把全文塞进一个 prompt，而是拆章节任务、接收摘要、构建系列 bible、规划视觉参考，再逐集导出。

```bash
cine-make novel ingest --input ./novel.txt --out runs/my-novel
cine-make novel task --run runs/my-novel --id summarize-chapter-0001
cine-make novel accept-summary --run runs/my-novel --file ./chapter-0001.summary.json
cine-make novel build-bible --run runs/my-novel
cine-make novel visual-bible --run runs/my-novel
cine-make novel plan-episodes --run runs/my-novel
cine-make novel episode --run runs/my-novel --episode 1
```

Novel Studio MVP 不自动生成图片。视觉 bible 批准后，再显式使用 `$imagegen`。

小说项目命令只负责章节规划和单集整理。新的用户交付仍然是 ChatGPT 可校对的 `seedance-all-reference-feed.md`；不要再为新交付创建 Canvas 包或即梦素材预算包。

## 投喂视频工具

普通运行直接用 `seedance-all-reference-feed.md`：

1. 生成或确认 feed 里的 GPT-image-2 参考资产。
2. 按 `每5条复制制作块` 逐组复制；每组里的 `上传参考图：资产名 = 图片N` 就是本组绑定说明。
3. 把整组复制到外部视频工具。
4. 在外部视频工具生成片段。
5. 多段视频在外部剪辑合成。

## 开发

```bash
npm test
node src/cli.mjs validate --run ../some-story-project/runs/demo --stage production
npm pack --dry-run
node scripts/install-codex-skill.mjs
```

## npm 发布

预检：

```bash
npm whoami --registry=https://registry.npmjs.org/
npm test
npm pack --dry-run
```

发布：

```bash
npm publish --registry=https://registry.npmjs.org/ --access public
```

验证：

```bash
npm view cine-make version --registry=https://registry.npmjs.org/
```

## 边界

Cine Make 负责前期：

```text
故事素材 -> seedance-all-reference-feed.md -> ChatGPT 校对 -> 外部视频工具
```

外部视频工具负责最终合成：

```text
逐条视频文本 + 参考资产 -> 生成视频片段 -> 最终剪辑/导出
```

Cine Make 绝不能声称 Codex 已经渲染最终 MP4。
