# Cine Make 中文说明

**中文主文档**：这是给中文用户直接阅读的说明。

English: [`README.md`](./README.md)

**Cine Make** 是一个给 Codex 风格 agent 使用的本地 AI 漫剧前期制片工厂。

它把小说片段、粗剧本、广告 brief、故事梗概转换成一个紧凑、用户能看懂的 AI 视频前期交付包。

Cine Make **不生成 MP4**。它负责故事、分镜、故事板图片提示词、视频工具投喂提示词；最终视频由 Seedance、即梦或其他 AI 视频工具生成。

## 用户最终拿到什么

正常运行只给用户两个东西：

```text
deliverable.md
storyboard-images/
```

这是故意的。用户不应该看到一堆内部 JSON、任务文件、调试文件。

`deliverable.md` 是核心产物，顺序按用户理解来组织：

```text
1. 成片预览
2. 故事全流程
3. 短片方案
4. 精简分镜
5. 故事板图片清单
6. 视频工具投喂包
7. 视觉参考
8. 连续性注意事项
```

其中最关键的是 **视频工具投喂包**。每一段都会明确告诉用户：

```text
上传哪些图片
复制哪段提示词
```

这里不是单纯给人看的剧情说明，而是给视频模型吃的投喂卡。长片会按短片段拆开，默认每张投喂卡 **不超过 15 秒，且不超过约 5 个镜头**，并写清主体锁定、时间线、景别、运镜、光影美术、连续性和禁止项。

## 两种模式

Cine Make 只有两个用户模式，不再发散。

| 模式 | 用途 | 是否生成图片 | 输出 |
| --- | --- | --- | --- |
| `draft` | 快速看故事、改节奏、定分镜 | 不生成图片 | `deliverable.md` + `storyboard-images/README.md` |
| `visual` | 草稿确认后，进入视觉包 | 可生成静态图 | `deliverable.md` + `storyboard-images/` |

### 草稿模式

草稿模式用于故事还没定的时候。

它回答：

- 这个短片讲什么？
- 从开头到结尾发生什么？
- 每个镜头大概是什么画面？
- 值不值得继续生成图片？

草稿模式不应该浪费时间生成图片。

### 视觉包模式

视觉包模式用于草稿确认之后。

它准备或生成：

- 人物参考图；
- 场景参考图；
- `S01.png`、`S02.png` 这类故事板关键帧；
- 给 AI 视频工具使用的分段投喂提示词。

人物图、场景图、风格图都是可选输入。有图就锁脸、服装、气质和场景；没图也能先走主流程。

## 自然语言使用方式

安装 skill 后，用户直接自然语言使用：

```text
$cine-make

把下面小说片段做成 30 秒竖屏 AI 漫剧草稿。
风格：电影感悬疑、冷色调、克制表演。

小说片段：
凌晨三点，外卖员陈默送最后一单到废弃医院。电梯停在不存在的13楼，门打开后，他看见十年前失踪的妹妹正坐在护士站，手里拿着他小时候丢掉的红色弹珠。
```

进入视觉包：

```text
$cine-make

这个草稿可以，继续进入视觉包模式。
帮我生成人物参考图、场景参考图、故事板关键帧。
```

带人物图：

```text
$cine-make

用这张人物图锁定女主的脸、发型、服装和气质。
把下面剧情做成 30 秒竖屏 AI 漫剧视觉包。

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

### 视觉包模式

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

默认输出目录只保留：

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

用户不应该把整个项目文件夹丢给 Seedance 或即梦。

外部视频生成要按短片段处理。Cine Make 默认每段 **不超过 15 秒，且不超过约 5 个镜头**；30 秒成片会拆成多个视频片段，最后再剪辑/拼接。

应该按 `deliverable.md` 里的每个分段操作：

```text
1. 上传这一段列出的参考图/故事板图片
2. 复制这一段的模型投喂卡提示词
3. 在外部视频工具生成这一段
4. 再处理下一段
```

Cine Make 负责准备投喂包，外部视频工具负责生成最终视频。

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
故事素材 -> 草稿交付物 -> 可选视觉包 -> 视频工具投喂包
```

外部视频工具负责最终合成：

```text
视频工具投喂包 -> 视频片段 -> 最终剪辑/导出
```

Cine Make 不能声称 Codex 生成了最终 MP4。
