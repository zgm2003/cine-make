# Cine Make 中文说明

**中文主文档**：这是给中文用户直接阅读的说明。

English: [`README.md`](./README.md)

**Cine Make** 是一个给 Codex 风格 agent 使用的本地 AI 漫剧前期制片工厂。

它把小说片段、粗剧本、广告 brief、故事梗概转换成一个紧凑、可执行的 AI 视频前期交付包。

Cine Make **不生成 MP4**。它负责拆解故事、锁定连续性、准备故事板图片提示词和视频工具投喂包；最终视频由 Seedance、即梦或其他 AI 视频工具生成。

## 用户最终拿到什么

正常运行只给用户看这两项：

```text
deliverable.md
storyboard-images/
```

这是故意的。`deliverable.md` 是用户入口，里面已经包含成片预览、故事全流程、精简分镜、AI分镜、出图清单、故事板图片清单和视频工具投喂包。`storyboard-images/` 是图片目录，放主角/人物参考、场景参考、每段首帧/尾帧、`S01.png`、`S02.png` 这类 AI 分镜关键帧，以及 `contact-sheet.jpg` 全图缩略图。

`continuity-bible.json`、`episodes/`、逐镜 task tree、agent handoff 这些都是内部/调试产物；只有显式 `--emit-internal` 时才放进 `.cine-make-internal/`，不要甩给普通用户。

`deliverable.md` 的默认顺序：

```text
1. 成片预览
2. 故事全流程
3. 短片方案
4. 精简分镜
5. AI分镜
6. 出图清单
7. 故事板图片清单
8. 视频工具投喂包
9. 视觉参考
10. 连续性注意事项
```

视频工具投喂包是核心：它告诉用户上传哪些图片、复制哪段提示词。默认每段不超过 15 秒 / 7 个 AI 分镜镜头；更长故事拆成多段，后一段首帧复用前一段尾帧，最后在外部工具里剪辑拼接。

## 两种模式

Cine Make 只有两个用户模式，不再发散。

| 模式 | 用途 | 是否生成图片 | 输出 |
| --- | --- | --- | --- |
| `draft` | 快速看故事、改节奏、确认分镜 | 不生成图片 | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | 草稿确认后，进入出图模式，补齐故事板/关键帧 | 生成或准备静态图 | `deliverable.md` + generated/fillable `storyboard-images/` |

### 草稿模式

草稿模式用于故事还没定的时候。

它回答：

- 这个短片讲什么？
- 从开头到结尾发生什么？
- 每个镜头大概是什么画面？
- 值不值得继续生成图片？

草稿模式不应该浪费时间生成图片。

### 出图模式

出图模式用于草稿确认之后。

它准备或生成：

- 人物参考图；
- 场景参考图；
- 每个 15 秒片段的首帧与尾帧，例如 `segment-01-start.png`、`segment-01-end.png`；
- `S01.png`、`S02.png` 这类 AI 分镜关键帧；
- `contact-sheet.jpg` 全图缩略图；
- `deliverable.md` 里的视频工具投喂包。

如果用户明确说用 `$imagegen`，就直接用内置 `$imagegen` 生成静态图并复制到 `storyboard-images/`。本地 `scripts/render-images.mjs` 属于高级/调试路径，不是默认用户交付链路。

## 自然语言使用方式

安装 skill 后，用户直接自然语言使用：

```text
$cine-make

把下面小说片段做成 30 秒竖屏 AI 漫剧草稿。
风格：电影感悬疑、冷色调、克制表演。

小说片段：
凌晨三点，外卖员陈默送最后一单到废弃医院。电梯停在不存在的13楼，门打开后，他看见十年前失踪的妹妹正坐在护士站，手里拿着他小时候丢掉的红色弹珠。
```

进入出图模式：

```text
$cine-make

这个草稿可以，继续进入出图模式。
帮我生成人物参考图、场景参考图、首尾控制帧。
```

带人物图：

```text
$cine-make

用这张人物图锁定女主的脸、发型、服装和气质。
把下面剧情做成 30 秒竖屏 AI 漫剧出图包。

人物图：
C:\Users\you\Desktop\refs\hero.png

剧情：
她在雨夜收到一条来自三年前自己的短信。短信里只有一句话：不要回家。
```

用户不需要说平台。默认走通用 AI 视频工具适配。只有用户明确说 Seedance、即梦或其他平台时，才做对应适配。

## 分享文章

如果想看更偏产品介绍和对外分享的版本，可以看：

- [Cine Make：把小说片段变成 AI 漫剧前期制片包](./docs/share-cine-make.zh-CN.md)

## 从 npm 安装

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

安装后重启 Codex，然后使用：

```text
$cine-make ...
```

## CLI 用法

CLI 是 skill 背后的编译器内核。普通用户优先用 `$cine-make`，CLI 主要用于测试、自动化和开发。

### 草稿模式

```bash
cine-make --mode draft \
  --out .cine-make-runs/demo \
  --duration 30s \
  --aspect 9:16 \
  --style "电影感悬疑，冷色调，克制表演" \
  "凌晨三点，外卖员陈默走进废弃医院..."
```

### 出图模式

```bash
cine-make --mode visual \
  --out .cine-make-runs/demo-visual \
  --duration 30s \
  --aspect 9:16 \
  --style "电影感悬疑，冷色调" \
  --character-image refs/hero.png \
  "故事内容..."
```

生成故事板/关键帧图片时，按 `deliverable.md` 和 `storyboard-images/README.md` 的提示词使用内置 `$imagegen`，并把结果保存为 `storyboard-images/character-reference.png`（如果没提供主角图）、`storyboard-images/scene-reference.png`、`storyboard-images/segment-01-start.png`、`storyboard-images/S01.png`...`S07.png`、`storyboard-images/segment-01-end.png` 和 `storyboard-images/contact-sheet.jpg` 等。

### 可选参考图

```bash
--character-image refs/hero.png
--scene-image refs/hospital.png
--style-image refs/noir-style.png
```

这些都不是必填项。

### 调试文件

默认输出目录只保留用户交付包：

```text
deliverable.md
storyboard-images/
```

只有调试编译器时才使用：

```bash
cine-make --mode draft --emit-internal --out .cine-make-runs/debug "故事内容"
```

这会生成：

```text
.cine-make-internal/
```

不要把 `.cine-make-internal/` 当成用户交付物。

## 如何喂给 AI 视频工具

外部视频生成按短投喂卡处理。用户只需要看 `deliverable.md`：

1. 先按 `出图清单` 和 `故事板图片清单` 生成/确认主角、场景、首帧、尾帧、`storyboard-images/Sxx.png` 与 `contact-sheet.jpg`；
2. 到 `视频工具投喂包`，每一段上传列出的图片；
3. 复制该段提示词；
4. 在 Seedance / 即梦 / 其他视频工具里生成片段；
5. 多段结果在外部工具里剪辑拼接；后一段首帧必须等于前一段尾帧。

Cine Make 不生成 MP4，只负责前期包和静态图。

## 开发

运行测试：

```bash
npm test
```

验证产物：

```bash
node src/cli.mjs validate --run .cine-make-runs/demo --stage production
```

检查 npm 包内容：

```bash
npm pack --dry-run
```

本地安装 skill：

```bash
node scripts/install-codex-skill.mjs
```

## 边界

Cine Make 负责前期制片：

```text
故事素材 -> deliverable.md -> storyboard-images/ -> 视频工具投喂包 -> 外部视频工具
```

外部视频工具负责最终合成：

```text
视频任务卡 -> 视频片段 -> 最终剪辑/导出
```

Cine Make 不能声称 Codex 生成了最终 MP4。


