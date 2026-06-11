# Reference Feed 生产包设计

日期：2026-06-11
项目：Cine Make
状态：待用户审阅

## 背景

当前 `cine-make` 的普通草稿和 Canvas 包偏向“导演分镜 / Keyframe / 首尾帧”生产方式。但在 Seedance 2.0 Fast VIP 的实际生产中，过多分镜图、首尾帧和“承接上一段 / 不要重置画面”这类元话术会让模型把每个图或每句说明理解成新的世界，导致人物、场景和动作漂移。

经实测，更稳定的投喂结构是：

```text
场景参考图 + 人物/异兽/道具参考图 + 简洁镜头条目
```

每条视频文本只写画面本身：场景、人物动作、景别/构图/风格、音效。不要写分镜图文件名，不要写 S01/S02，不要写首尾帧，不要写“承接上一段”这类给人看的元指令。

## 目标

新增一个 `reference-feed` 生产包，成为面向 Seedance 等外部视频工具的稳定投喂产物。

它输出两类东西：

1. Canvas 基础参考包：让用户先生成并锁定场景、人设、异兽、道具、风格图。
2. Reference Feed 文本：让用户直接复制到视频工具，每条只描述一个连续画面任务。

## 非目标

本设计不做以下事情：

- 不替换现有 `draft` / `visual` / `canvas-pack` 行为。
- 不生成最终视频。
- 不调用外部视频 API。
- 不生成 S01/S02 分镜图片。
- 不生成 segment start/end 首尾帧。
- 不输出 Keyframe 节点。
- 不在视频条目里写“承接上一段”“不要重置画面”“参考上一条”等元话术。
- 不把歌谣、配乐、后期声音强塞进视频生成文本；声音后期可手动加。

## 用户入口

新增 CLI 命令：

```bash
node src/cli.mjs reference-feed --out <output-dir> [--input <file>] [--aspect <9:16|16:9|1:1>] [--style <style>] "<story material>"
```

`reference-feed` 的默认画幅是 `16:9`。这只影响新命令，不改变旧 `draft` / `visual` / `canvas-pack` 的默认画幅。

默认输出：

```text
<output-dir>/reference-feed.md
<output-dir>/canvas-project.zip
<output-dir>/canvas-manifest.json
<output-dir>/prompt-pack.md
<output-dir>/README.md
```

## 输出结构

### 1. `reference-feed.md`

文件结构：

```text
# Reference Feed｜<title>

## 上传参考
- <场景A> = 图片1
- <场景B> = 图片2
- <人物A> = 图片3
- <异兽A> = 图片4

## 视频条目
1 <场景> <人物动作> <镜头/构图/风格> <音效>
2 <场景> <人物动作> <镜头/构图/风格> <音效>
...

## 底部备注栏可复制
<资产绑定 + 全局风格 + 禁止项>
```

条目格式固定为：

```text
编号 场景（时空） 画面动作。景别/构图/运镜 + 风格锚点 + 可见连续性。音效：环境音或对白状态。
```

禁止条目中出现：

```text
S01
S02
segment
keyframe
首帧
尾帧
承接上一段
不要重置画面
参考上一条
如图
```

### 2. Canvas 基础参考包

Canvas 包只包含基础资产节点。

推荐节点：

```text
style-bible              资料：风格设定（非生成）
style-reference          生成：整体风格参考图
scene-*-bible            资料：场景设定（非生成）
scene-ref-*              生成：场景参考图
character-*-bible        资料：人物设定（非生成）
character-ref-*          生成：人物三视图
creature-*-bible         资料：异兽设定（非生成）
creature-ref-*           生成：异兽三视图
prop-*-bible             资料：道具设定（非生成，可选）
prop-ref-*               生成：道具参考图（可选）
voice-bible              资料：音色说明（非生成，可选）
```

所有可生成图片节点默认：

```text
imageSize: 16:9
count: 3
```

原因：用户需要一次生成三张候选图挑选并锁定；不要默认只出一张，避免反复手动点生成。

不包含：

```text
Shot List
Keyframe
Motion Prompt
Video Segment
S01/S02 图片节点
```

## 数据结构

新增核心结构：

```ts
type ReferenceFeedAsset = {
  id: string
  label: string
  kind: 'style' | 'scene' | 'character' | 'creature' | 'prop' | 'voice'
  slot: string
  bible: string
  prompt?: string
  imageSize?: '9:16' | '16:9' | '1:1'
  count?: number
}

type ReferenceFeedItem = {
  index: number
  scene: string
  timeOfDay?: string
  action: string
  camera: string
  style: string
  sound: string
}

type ReferenceFeedPackage = {
  title: string
  aspectRatio: string
  style: string
  assets: ReferenceFeedAsset[]
  items: ReferenceFeedItem[]
  footer: string
}
```

数据结构优先，不从 `composeDraftAssets()` 的悬疑模板中猜人物和场景。`reference-feed` 应该走自己的轻量提取器，直接从源文本中识别显式资产和镜头条目。

## 资产提取规则

优先级：

1. 用户显式给出的场景名、人物名、异兽名、道具名。
2. 原文括号里的镜头编号和场景标题。
3. 高频实体词。
4. 无法确认时使用通用但不误导的名称，例如“主要人物”“主要场景”，但必须避免 `main subject`、`lost figure`、`liminal location` 这类英文占位符出现在用户产物中。

对雪山道清样例，资产应提取为：

```text
雪山之巅 = 图片1
废墟大全景 = 图片2
老年道清 = 图片3
麒麟幼兽 = 图片4
```

## 视频条目生成规则

每条视频条目只写可见画面，不写解释性元话术。

好例子：

```text
16 雪山之巅（日外） 道清侧躺在雪地里，看着身旁已经倒下的麒麟幼兽，眼角慢慢落下一滴泪，泪水沿着苍老皱纹停住，被风雪冻在脸侧。道清脸部特写 + 斗笠阴影压住半张脸 + 背景麒麟幼兽倒在雪里虚化 + 冷蓝灰雪光 + 克制悲伤构图。音效：寒风、细雪摩擦蓑衣，无对白。
```

坏例子：

```text
16 【承接上一段尾帧，不要重置画面】上一段最后停在……
```

问题：这是给人看的说明，视频模型可能把“上一段”“重置画面”当成画面概念，破坏生成。

## Canvas 布局

采用左资料、右生成的简单布局：

```text
左列：资料节点
右列：对应生成节点
```

不做复杂树，不做 Keyframe 链路。

示例：

```text
资料：国服水墨风格设定      -> 生成：整体水墨风格参考图
资料：雪山之巅场景设定      -> 生成：雪山之巅场景图
资料：废墟大全景场景设定    -> 生成：废墟大全景场景图
资料：老年道清人设          -> 生成：老年道清三视图
资料：麒麟幼兽设定          -> 生成：麒麟幼兽三视图
```

## 兼容性

新增命令，不改变旧命令输出。

旧命令继续保留：

```text
--mode draft
--mode visual
canvas-pack
canvas-storyboard-pack
canvas-full-pack
```

新增命令：

```text
reference-feed
```

因此不会破坏已有用户、已有测试或已有 Canvas 导入流程。

## 错误处理

- 如果没有识别到明确场景，生成一个“主要场景”资产，并在 `reference-feed.md` 顶部提示用户最好手动改名。
- 如果没有识别到人物，生成一个“主要人物”资产，但不生成英文占位符。
- 如果出现“歌谣/配乐/旁白”等声音内容，默认放进可选 `voice-bible`，不写入视频条目，除非用户明确要求嵌入。
- 如果同一条目里出现多个动作，保留一个连续动作链，但不拆成 Keyframe。

## 验证标准

新增测试应覆盖：

1. `reference-feed` 命令生成所有文件。
2. `reference-feed.md` 不包含 `S01.png`、`segment-`、`keyframe`、`承接上一段`、`不要重置画面`。
3. 雪山样例能识别 `雪山之巅`、`老年道清`、`麒麟幼兽`。
4. Canvas manifest 只包含 style / scene / character / creature / optional voice 基础节点。
5. Canvas manifest 不包含 Keyframe / Shot List / Motion Prompt 节点。
6. 旧 `canvas-pack` 测试不变。

## 实现边界

建议新增文件：

```text
src/reference-feed-extractor.mjs
src/reference-feed-writer.mjs
src/reference-feed-canvas-exporter.mjs
```

修改文件：

```text
src/cli.mjs
src/run-validator.mjs（如需支持验证）
test/reference-feed.test.mjs
```

不建议把逻辑塞进 `canvas-prompt-pack-exporter.mjs`，它已经过长，继续堆只会让特殊情况更多。

## 设计原则

- 数据结构优先：先明确资产和视频条目，再写文本。
- 消灭特殊情况：不要把“分镜图模式”和“参考投喂模式”混在一个函数里靠 if 分支硬撑。
- 不破坏用户空间：新增命令，不改旧输出。
- 实用主义：只解决已验证的生产问题，不为未知平台做抽象层。
- 简洁：reference-feed 只做一个产物，不做视频、不做图片、不做复杂 Canvas 链。
