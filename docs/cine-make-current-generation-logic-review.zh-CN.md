# Cine Make 当前生成逻辑评审文档

日期：2026-06-10  
用途：给专业编剧 / 分镜导演 / AI 生图工作流设计人员评审当前 Cine Make 的生成链路、提示词策略和已暴露问题。

> 本文描述的是当前代码和最近实战暴露出来的真实状态，不是理想设计稿。

---

## 1. 项目定位

Cine Make 是一个本地短剧前期制片工具，不直接生成最终视频。

当前主要目标：

- 把小说 / 剧本 / 广告 brief / 分镜稿转成可交付的 `deliverable.md`；
- 输出角色、场景、关键帧、视频工具投喂包；
- 支持 Canvas 手动生成包；
- 支持普通 `draft` / `visual` 两种模式；
- 最终视频由外部视频工具生成。

当前默认产品契约见：

- `skills/cine-make/SKILL.md`
- `skills/cine-make/references/output-contract.md`
- `product/definition.md`
- `product/principles.md`

---

## 2. CLI 入口与模式

主入口：

```text
src/cli.mjs
```

命令大致分为四类：

```bash
node src/cli.mjs --mode draft ...
node src/cli.mjs --mode visual ...
node src/cli.mjs canvas-pack ...
node src/cli.mjs canvas-storyboard-pack ...
node src/cli.mjs novel ...
```

### 2.1 `draft` 模式

只生成文本交付：

```text
deliverable.md
storyboard-images/README.md
```

不生成图片。

### 2.2 `visual` / 出图模式

当前 `visual` 模式的真实行为：

- 写入 `deliverable.md`；
- 写入 `storyboard-images/README.md`；
- 在 `deliverable.md` 里列出出图清单；
- 不会自动调用图片模型；
- 真正图片仍需 Codex `$imagegen` 或外部手动生成。

也就是说，当前代码里的 `visual` 更准确地说是：

```text
出图提示词准备模式 / image queue preparation mode
```

而不是完整的自动出图模式。

相关代码：

```text
src/cli.mjs
src/deliverable-writer.mjs
scripts/render-images.mjs
```

---

## 3. 输入解析逻辑

输入参数由：

```text
src/input-contract.mjs
```

生成标准化 contract。

### 3.1 风格默认值

当前默认风格：

```text
超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性
```

当前 `normalizeStyle()` 逻辑：

- 如果 style 包含以下标记之一，则直接使用：

```text
超写实 / 真人 / 电影质感 / live-action / photoreal / realistic
```

- 否则会追加：

```text
超写实真人电影质感
```

这会导致一个重要问题：

> 用户如果输入“国漫”“漫画风”，但没有触发上述 marker，系统会自动追加真人电影质感。

最近实战中为了避免这个行为，临时在 style 中加入了 `realistic manhua`，但这只是规避，不是良好设计。

### 3.2 内容类型判断

`inferContentType()` 会根据关键词判断：

```text
short_drama_script
rough_shotlist
ad_brief
voiceover_script
enterprise_documentary
cultivation_transmigration
novel_excerpt
story_material
```

问题：

- 当前规则偏关键词匹配；
- 对“已经是完整分镜剧本”的文本，可能仍然拆错节奏；
- 台词标签、分镜字段、角色字段可能被误识别为人物或剧情元素。

### 3.3 时长与镜头数量

当前逻辑会根据文本密度、台词数、事件提示词估算 shot count。

如果用户没有显式传：

```bash
--shots
--storyboards
--duration
```

系统可能会把一个 18 分镜短剧扩展成更多 shot，例如最近实战中自动生成了 37 个关键帧。

因此目前对“已有明确分镜号”的剧本，建议显式传：

```bash
--shots 18 --storyboards 18
```

但这应该内化为系统能力：识别 `【分镜1】...【分镜18】` 后默认尊重原分镜数量。

---

## 4. Draft 资产生成逻辑

核心函数：

```text
src/draft-writer.mjs
composeDraftAssets(contract)
```

它会生成：

```text
directorScript
characters
shotlist
storyboardBoard
storyboardPrompts
referencePack
jimengPack
continuityReview
```

### 4.1 人物解析

人物来自脚本解析和 heuristics。

最近暴露的问题：

- 剧本中反复出现 `台词` 字段；
- 自动生成的投喂包中出现了错误角色：

```text
锁定角色：台词
```

这说明当前 parser 对剧本格式字段和真实角色名的边界不够稳。

建议专业评审关注：

- 如何区分字段标签和人物名；
- 如何稳定提取“人物”列表；
- 如何让已提供角色图覆盖自动角色解析；
- 是否应该让“人物列表”成为一等输入，而不是从全文猜。

### 4.2 镜头生成

系统会把 source text 转成 shotlist。

当前 shotlist 通常包含：

```text
shot_id
scene
action
shot_size
lens
camera_movement
composition
blocking
performance
lighting
duration_seconds
image_prompt
motion_prompt
```

问题：

- 当前 image prompt 容易把剧情解释、人物身份、动作、道具、镜头目标都塞进去；
- 图片模型会倾向“显性画出所有词”，导致画面混乱；
- 场景参考图可能被写成半个剧情分镜。

---

## 5. Deliverable 生成逻辑

用户入口由：

```text
src/deliverable-writer.mjs
composeDeliverable()
```

生成。

当前结构大致是：

```text
成片预览
故事全流程
短片方案
DIRECTOR_BIBLE
CHARACTER_BIBLE
SCENE_BIBLE
ART_DIRECTION
STORYBOARD：Shot Definition
KEYFRAME_PROMPTS
MOTION_PROMPTS
QUALITY_CHECK
AI_RISK_WARNINGS
精简分镜
出图清单
视频工具投喂包
```

优点：

- 信息完整；
- 有连续性意识；
- 能给视频工具投喂包；
- 能把长故事拆成多个 feed card。

问题：

- 对生图模型来说信息过多；
- 参考图 / 关键帧 / 视频运动三种 prompt 的边界仍会混；
- 部分 prompt 仍保留真人电影默认语义；
- `imagegen-plan.md` 当前只从 `出图清单` 抽文件列表，不抽详细 prompt。

---

## 6. Canvas 包逻辑

Canvas 导出相关：

```text
src/canvas-prompt-pack-exporter.mjs
```

### 6.1 `canvas-pack`

当前设计：

```text
Style Bible -> Style Reference
Character Bible -> Character Reference
Environment Bible -> Environment Reference
```

原则：

- 第一阶段只打基础；
- 不生成 Shot List；
- 不生成 Keyframe；
- 文本节点作为上下文资源；
- 图片节点由用户在 Canvas 里点击生成。

### 6.2 `canvas-storyboard-pack`

第二阶段追加：

```text
Shot List
Keyframe image nodes
```

每个 Keyframe 会声明：

```text
requiredAnchors
promptLayer
motionPrompt
linkedBeat
shotFunction
audienceTakeaway
anchorPolicy
```

### 6.3 最近修复的 Canvas 合并问题

Canvas 项目：

```text
E:/admin_go/canvas_front_next
```

合并逻辑：

```text
src/app/(user)/canvas/utils/canvas-merge-import.ts
```

最近发现：

- `requiredAnchorKeys` 原本只检查缺失，不会自动连接已有锚点；
- 因此用户看不到角色图连线；
- 已修复为：合并时自动把当前画布已有 anchor 节点连到新导入节点；
- 也兼容旧 Cine Make 字段 `metadata.cineMake.anchor`。

验证：

```text
2 test files passed
8 tests passed
```

---

## 7. 当前“生图模式”的真实问题

最近用剧本《收租偶遇同班哑巴校花》实战暴露出几个核心问题。

### 7.1 场景节点过多

原本生成了：

```text
老旧居民楼外景
楼道转角
林听晚室内
道具
里屋门缝
若干楼梯变体
```

问题：

> 很多节点其实是剧情分镜需要的场景，不是母场景资产。

正确方向应该是：

```text
少量母场景
后续 Keyframe 再做人物调度
```

例如本剧真正基础母场景只需要：

```text
1. 公共楼道 / 楼梯平台母场景
2. 一室一厅平层室内母场景
```

### 7.2 场景 prompt 带了人物 / 剧情动作

如果场景参考图 prompt 写：

```text
李大妈挡住林听晚，江渝白从楼梯转角探头
```

模型会直接生成剧情分镜，而不是空场景。

后续再用这个图做分镜，会造成：

- 人物提前入场；
- 站位被锁死；
- 场景变成一次性镜头；
- 后续关键帧无法自由调度。

### 7.3 图片模型会显性画出所有词

用户指出一个关键观察：

> 提示词塞入大量细节后，AI 会强制展示所有内容。

例如：

```text
一个男人在打游戏
```

模型可能为了证明“打游戏”，把游戏画面、屏幕、电竞元素都画出来，甚至画到不合理位置。

更合理的写法是：

```text
一个男人双手自然握着手机，低头专注看手机背面。
```

也就是说：

> 图片 prompt 应该描述可见画面，而不是解释剧情意图。

### 7.4 楼梯母场景持续跑偏

最近生成中，“公共楼梯间”多次跑成：

```text
室外外挂楼梯
开放连廊
楼外平台
带树木和天空的外部空间
```

这说明：

- “公共楼梯间”这个词对模型不稳定；
- “明亮自然光”可能诱导模型打开空间；
- “居民楼公共区域”可能被理解成楼外公共区域；
- 如果目标是室内楼道，需要明确：

```text
封闭式室内单元楼楼道
不露天
不见天空
不见树木
楼梯在楼内
```

但也不能过度堆词，否则又会产生提示词污染。

---

## 8. 当前临时人工校准版

为了适配用户当前工作流，已在：

```text
C:/Users/20931/Desktop/剧本
```

写入一版人工校准的 Cine Make 出图包：

```text
deliverable.md
imagegen-plan.md
storyboard-images/README.md
```

特征：

- 固定 18 个关键帧，对应原剧本 18 个分镜；
- 复用已有 4 张人物图；
- 复用已有国漫风格图；
- 只保留 2 张母场景；
- 场景图不写角色名、不放人物；
- Keyframe 只写当前画面，不解释完整剧情；
- 不再使用自动生成的 `锁定角色：台词` 等错误内容。

这是一版临时人工修正，不是代码层面的最终解决方案。

---

## 9. 专业评审建议关注的问题

### 9.1 Prompt 分层是否正确

建议明确区分：

```text
Character Reference Prompt
Scene Mother Reference Prompt
Prop Reference Prompt
Keyframe Prompt
Motion Prompt
Video Feed Prompt
```

每一层应该有不同信息密度。

### 9.2 场景母图是否应该强制无人物

当前实战倾向：

```text
母场景 = 无人物、无剧情、只锁空间
Keyframe = 只画当前瞬间
Motion = 只写当前动作
```

需要专业判断是否所有短剧都应如此，还是按类型可变。

### 9.3 图片 prompt 是否应该极简

当前观察：

```text
提示词越像剧本说明书，画面越容易乱。
```

建议研究：

- 每条图片 prompt 的最佳长度；
- 哪些信息必须放；
- 哪些信息应放到上游参考图；
- 哪些信息只应存在于导演内部分析，不进生图 prompt。

### 9.4 国漫 / 真人风格切换

当前代码默认偏真人电影。

需要决定：

- Cine Make 是否支持国漫作为一等风格；
- 是否建立 style profile；
- `normalizeStyle()` 是否应停止自动追加真人电影质感；
- 国漫 prompt 是否需要完全不同模板。

### 9.5 已有分镜剧本的处理

如果输入已经是：

```text
【分镜1】...【分镜18】
```

系统是否应：

- 直接尊重原分镜数量；
- 不再重新估算 shot count；
- 不再重写成更多镜头；
- 只做提示词转译和连续性校准。

### 9.6 角色识别边界

当前误识别“台词”为角色，说明 parser 需要：

- 明确字段标签黑名单；
- 优先读取“人物”小节；
- 支持用户提供角色图后锁定角色列表；
- 不从所有文本里盲猜人物。

### 9.7 图片生成执行问题

当前 `visual` 模式并不真正生成本地图片。

需要明确：

- 是否保持“只准备出图清单”；
- 是否由 Codex `$imagegen` 手动逐张生成；
- 如何把生成图保存到 `storyboard-images/`；
- 如何校验哪些图已生成、哪些还缺。

---

## 10. 关键代码文件索引

```text
src/cli.mjs
src/input-contract.mjs
src/draft-writer.mjs
src/deliverable-writer.mjs
src/canvas-prompt-pack-exporter.mjs
src/run-validator.mjs
scripts/render-images.mjs
skills/cine-make/SKILL.md
skills/cine-make/references/output-contract.md
```

Canvas 合并相关：

```text
E:/admin_go/canvas_front_next/src/app/(user)/canvas/utils/canvas-merge-import.ts
E:/admin_go/canvas_front_next/src/app/(user)/canvas/utils/canvas-resource-references.ts
E:/admin_go/canvas_front_next/src/app/(user)/canvas/components/canvas-node-generation.ts
```

---

## 11. 一句话总结

当前 Cine Make 的核心优势是：

```text
能把故事拆成完整前期包，并有连续性意识。
```

当前最大问题是：

```text
它经常把导演分析、剧情解释、角色信息、场景设定、关键帧画面和视频运动混进同一层 prompt，导致图片模型被迫画出过多信息。
```

专业评审最需要判断的是：

```text
哪些信息应该留在导演内部，哪些应该进入生图 prompt，哪些只应该作为纠偏约束。
```

