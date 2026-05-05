# Cine Make 中文说明

**中文主文档**。English: [`README.md`](./README.md)

Cine Make 是给 Codex 风格 agent 使用的本地 AI 短剧前期制片工具。它把小说片段、粗剧本、广告 brief、剧情梗概整理成一个可交付、可投喂 AI 视频工具的前期包。

Cine Make **不生成 MP4**。它只负责故事拆解、连续性锁定、静态图/关键帧提示词和视频生成卡；最终视频由 Seedance、即梦或其他 AI 视频工具生成。

## 当前版本

```text
0.0.5
```

## 用户最终拿到什么

正常运行只交付两项：

```text
deliverable.md
storyboard-images/
```

`deliverable.md` 是用户入口，包含：

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

`storyboard-images/` 是图片资产目录，包含或准备：

```text
character-reference.png
scene-reference.png
segment-01-start.png
S01.png ... S07.png
segment-01-end.png
segment-02-end.png
contact-sheet.jpg
```

30 秒会拆成两段，每段最多 15 秒 / 7 个 AI 分镜镜头。第二段首帧复用第一段尾帧，避免剪辑衔接断掉。

内部调试文件只允许出现在 `.cine-make-internal/`，普通用户不应该看到 `episodes/`、`continuity-bible.json`、任务树或 handoff 文件。

## 两种模式

| 模式 | 用途 | 图片 | 输出 |
| --- | --- | --- | --- |
| `draft` | 快速看故事、节奏和分镜 | 不生成图片 | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | 草稿确认后进入出图模式 | 生成或准备静态图 | `deliverable.md` + `storyboard-images/` |

### 草稿模式

用于故事还没定稿时。它回答：短片讲什么、剧情怎么推进、镜头怎么拆、是否值得进入出图模式。

### 出图模式

用于草稿确认后。它准备：

- 主角/人物参考图；
- 场景图；
- 每段首帧、尾帧；
- `S01.png` ... `Sxx.png` 分镜关键帧；
- `contact-sheet.jpg` 全图缩略图；
- `deliverable.md` 里的视频生成卡。

如果用户明确要求用内建图片生成，就用当前会话可用的内建图片生成工具直接生成静态图，再复制到 `storyboard-images/`。

## 安装

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

安装后重启 Codex，然后使用：

```text
$cine-make ...
```

## 自然语言用法

### 草稿

```text
$cine-make

把下面小说片段做成 30 秒竖屏 AI 漫剧草稿。
风格：电影感悬疑、冷色调、克制表演。

小说片段：
凌晨三点，外卖员陈默送最后一单到废弃医院。电梯停在不存在的13楼，门打开后，他看见十年前失踪的妹妹正坐在护士站，手里拿着他小时候丢掉的红色弹珠。
```

### 出图

```text
$cine-make

这个草稿可以，继续进入出图模式。
帮我生成人物参考图、场景参考图、首尾控制帧和分镜关键帧。
```

### 带主角图

```text
$cine-make

用这张人物图锁定女主的脸、发型、服装和气质。
把下面剧情做成 30 秒竖屏 AI 漫剧出图包。

人物图：
C:\Users\you\Desktop\refs\hero.png

剧情：
她在雨夜收到一条来自三年前自己的短信。短信里只有一句话：不要回家。
```

用户不需要指定平台。默认使用通用视频工具投喂格式；只有用户明确说 Seedance、即梦等平台时，才做平台化适配。

## CLI 用法

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

### 可选参考图

```bash
--character-image refs/hero.png
--scene-image refs/hospital.png
--style-image refs/noir-style.png
```

这些都不是必填项。

### 调试文件

```bash
cine-make --mode draft --emit-internal --out .cine-make-runs/debug "故事内容"
```

这会额外生成：

```text
.cine-make-internal/
```

不要把 `.cine-make-internal/` 当成用户交付物。

## 如何喂给 AI 视频工具

用户只看 `deliverable.md`：

1. 按 `出图清单` 生成或确认主角、场景、首帧、尾帧、`Sxx.png` 和 `contact-sheet.jpg`；
2. 到 `视频工具投喂包`，每段上传列出的图片；
3. 复制该段提示词；
4. 在 Seedance / 即梦 / 其他视频工具里生成片段；
5. 多段结果外部剪辑拼接，后一段首帧必须等于前一段尾帧。

## 开发

```bash
npm test
node src/cli.mjs validate --run .cine-make-runs/demo --stage production
npm pack --dry-run
node scripts/install-codex-skill.mjs
```

## npm 发布

发布前检查：

```bash
npm whoami --registry=https://registry.npmjs.org/
npm test
npm pack --dry-run
```

发布：

```bash
npm publish --registry=https://registry.npmjs.org/ --access public
```

发布后确认：

```bash
npm view cine-make version --registry=https://registry.npmjs.org/
```

## 边界

Cine Make 负责前期制片：

```text
故事素材 -> deliverable.md -> storyboard-images/ -> 视频工具投喂包 -> 外部视频工具
```

外部视频工具负责最终合成：

```text
视频生成卡 -> 视频片段 -> 最终剪辑/导出
```

Cine Make 不能声称 Codex 生成了最终 MP4。
