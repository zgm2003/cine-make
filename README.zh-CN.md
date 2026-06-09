# Cine Make 中文说明

**中文主文档**。English: [`README.md`](./README.md)

Cine Make 是给 Codex 风格 agent 使用的本地 AI 短剧前期制片工具。它把小说片段、粗剧本、广告 brief、剧情梗概整理成一个可交付、可投喂 AI 视频工具的前期包。

Cine Make **不生成 MP4**。它只负责故事拆解、连续性锁定、静态图/关键帧提示词和即梦视频生成卡；最终视频由即梦生成。

## 当前版本

```text
0.0.5
```

## 用户最终拿到什么

普通短片和小说片段运行只交付两项：

```text
deliverable.md
storyboard-images/
```

`deliverable.md` 是用户入口，包含：

1. 成片预览
2. 故事全流程
3. 短片方案
4. 精简分镜
5. 出图清单
6. 视频工具投喂包
7. 视觉参考
8. 连续性注意事项

`storyboard-images/` 是图片资产目录，包含或准备：

```text
character-reference.png
scene-reference.png
segment-01-start.png
S01.png ... S04.png
segment-01-end.png
segment-02-end.png
```

Cine Make 默认每 15 秒即梦投喂卡约 4 个分镜关键帧，给运镜、表演和悬疑停顿留时间。每段仍然最多上传 9 张图片。角色图、场景图、首帧、分镜关键帧、尾帧都算图片。第二段首帧复用第一段尾帧，避免剪辑衔接断掉。

如果你不想在 Cine Make 里抽卡出图，而是想导入 Canvas 手动生成，使用 `canvas-pack`，只交付：

```text
canvas-project.zip
canvas-manifest.json
prompt-pack.md
README.md
```

`canvas-project.zip` 可以直接在 Canvas 里导入。当前首版只打基础：少量文本资源节点 + 可生成的风格参考图、角色参考图、场景参考图。文本资源包含 World Bible / Art Direction、Character Bible 和 Environment Bible；真正需要点击生成的是右侧图片节点。暂不生成 Shot List、Keyframes 或视频段节点。

普通短片和小说片段运行的内部调试文件只允许出现在 `.cine-make-internal/`，普通用户不应该看到这些运行里的 `episodes/`、`continuity-bible.json`、任务树或 handoff 文件。长篇小说项目模式会有意暴露项目工作区产物和单集导出包。

## 两种模式 + Canvas 提示词包

| 模式 | 用途 | 图片 | 输出 |
| --- | --- | --- | --- |
| `draft` | 快速看故事、节奏和分镜 | 不生成图片 | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | 草稿确认后进入出图模式 | 生成或准备静态图 | `deliverable.md` + `storyboard-images/` |

`canvas-pack` 不是第三种出图模式，而是给 Canvas 手动生成用的提示词包交接命令。它不生成图片、不生成视频、不创建 `storyboard-images/`。

### 草稿模式

用于故事还没定稿时。它回答：短片讲什么、剧情怎么推进、镜头怎么拆、是否值得进入出图模式。

### 出图模式

用于草稿确认后。它准备：

- 主角/人物参考图；
- 场景图；
- 每段首帧、尾帧；
- `S01.png` ... `Sxx.png` 分镜关键帧；
- `deliverable.md` 里的视频生成卡。

图片生成只用 Codex `$imagegen`。Cine Make 不走外部图片 API，也不需要额外图片密钥。

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

把下面小说片段做成 30 秒竖屏 AI 短剧草稿。
风格：超写实真人电影质感，85mm镜头，4K，电影感悬疑，冷色调，克制表演。

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
把下面剧情做成 30 秒竖屏 AI 短剧出图包。

人物图：
C:\Users\you\Desktop\refs\hero.png

剧情：
她在雨夜收到一条来自三年前自己的短信。短信里只有一句话：不要回家。
```

用户不需要指定平台。Cine Make 只输出即梦投喂格式。

## CLI 用法

默认视觉风格是 `超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性`。

### 草稿模式

```bash
cine-make --mode draft \
  --out .cine-make-runs/demo \
  --duration 30s \
  --aspect 9:16 \
  --style "超写实真人电影质感，85mm镜头，4K，电影感悬疑，冷色调，克制表演" \
  "凌晨三点，外卖员陈默走进废弃医院..."
```

### 出图模式

```bash
cine-make --mode visual \
  --out .cine-make-runs/demo-visual \
  --duration 30s \
  --aspect 9:16 \
  --style "超写实真人电影质感，85mm镜头，4K，电影感悬疑，冷色调" \
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

### Canvas 提示词包

如果你要在 `E:/admin_go/canvas_front_next` 之类的 Canvas 系统里手动生成，不要跑 `--mode visual`，直接跑：

```bash
cine-make canvas-pack \
  --input ./script.txt \
  --out .cine-make-runs/demo-canvas-pack \
  --aspect 9:16 \
  --style "超写实真人电影质感，85mm镜头，4K，电影感悬疑，冷色调"
```

导入 `canvas-project.zip` 后，先看左侧文本设定，再从右侧图片节点开始生成：先生成风格参考图，再生成人物参考图和场景参考图。文本节点是上游上下文 chip，不需要逐个生成。首版不动分镜，先把人设、场景和风格基础打牢。

### 长篇小说项目模式

整本小说或很大的 `.txt` 文件使用项目模式。不要把整本小说塞进一次上下文；先导入项目，再按章节任务做有边界的摘要，确认摘要后生成系列 bible、规划视觉 bible，最后按集导出现有 Cine Make 草稿交付物。

```bash
cine-make novel ingest --input ./novel.txt --out .cine-make-runs/my-novel
cine-make novel task --run .cine-make-runs/my-novel --id summarize-chapter-0001
cine-make novel accept-summary --run .cine-make-runs/my-novel --file ./chapter-0001.summary.json
cine-make novel build-bible --run .cine-make-runs/my-novel
cine-make novel visual-bible --run .cine-make-runs/my-novel
cine-make novel plan-episodes --run .cine-make-runs/my-novel
cine-make novel episode --run .cine-make-runs/my-novel --episode 1
cine-make novel canvas --run .cine-make-runs/my-novel --episode 1
```

Novel Studio MVP 不自动生成图片，只规划视觉参考；必须在视觉 bible 确认后，才显式使用 `$imagegen`。

单集导出包包含：

```text
episode-input.md
deliverable.md
storyboard-images/
jimeng-feed-cards.json
```

如果用户同时使用 Canvas 系统，可以继续运行 `novel canvas`，得到：

```text
canvas-manifest.json
canvas-project.zip
```

`canvas-manifest.json` 是 Cine Make 自己的导演语义交接文件；`canvas-project.zip` 是只含文字节点的 Canvas 导入包，可以在 Canvas 里点击 `导入画布` 使用。它不生成图片、不生成视频，也不打包媒体文件。

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

1. 按 `出图清单` 用 `$imagegen` 生成或确认主角、场景、首帧、尾帧和 `Sxx.png`；
2. 到 `视频工具投喂包`，每段上传列出的图片，确保每段不超过 9 张图片；
3. 复制该段提示词；
4. 在即梦里生成片段；
5. 多段结果外部剪辑拼接，后一段首帧必须等于前一段尾帧。

如果使用 `canvas-pack`，用户只导入 `canvas-project.zip`，然后在 Canvas 里按节点顺序手动生成。

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

或者：

```text
故事素材 -> canvas-pack -> canvas-project.zip -> Canvas 手动生成
```

外部视频工具负责最终合成：

```text
视频生成卡 -> 视频片段 -> 最终剪辑/导出
```

Cine Make 不能声称 Codex 生成了最终 MP4。
