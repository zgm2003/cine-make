# Cine Make：把小说片段变成真人电影质感 AI 短剧前期制片包

我做了一个 Codex Skill：**Cine Make**。

它不是一个“视频生成器”，也不声称自己能直接生成 MP4。它解决的是 AI 视频创作里更前置、也更容易被忽略的问题：

> 在生成视频之前，先把故事、分镜、关键帧提示词、视频工具投喂方式整理清楚。

很多 AI 视频工具已经很强，但实际使用时经常会遇到一个问题：  
用户只有一段小说、一个脑洞、一个广告 brief，却不知道应该怎么拆成镜头，怎么保持人物一致，怎么准备图片，最后又该把哪些图片和提示词喂给即梦。

Cine Make 做的就是这件事。

---

## 它解决什么问题

AI 视频生成不是从“写一句提示词”开始的。

真正稳定的流程应该是：

```text
故事素材
-> 成片预览
-> 故事全流程
-> 精简分镜
-> $imagegen 静态参考图 / 首尾帧 / 分镜关键帧
-> 每段 9 张上传图片以内的视频投喂卡
-> 外部视频工具生成视频
```

Cine Make 把这条链路整理成一个可复用的工作流。

用户不需要理解内部 agent 怎么协作。普通短片和小说片段运行，最终只看用户交付包：

```text
deliverable.md
storyboard-images/
```

其中 `deliverable.md` 是主交付物，里面会按用户能理解的顺序组织：

1. 成片预览
2. 故事全流程
3. 短片方案
4. 精简分镜
5. 出图清单
6. 视频工具投喂包
7. 视觉参考
8. 连续性注意事项

---

## 输入可以是什么

Cine Make 的最小输入是一段故事文本。

比如：

- 小说片段；
- 剧情梗概；
- 粗剧本；
- 广告短片 brief；
- 口播脚本；
- 一段还没整理好的脑洞。

在这个最小输入之上，还可以增加图片参考。

这些图片不是必填项，而是增强输入：

```text
人物参考图：锁定脸、发型、服装、气质
场景参考图：锁定空间、建筑、灯光、氛围
风格参考图：锁定色调、摄影感、画面质感
```

也就是说，用户可以只输入一段小说，让 Cine Make 先跑草稿；也可以在出图阶段补充人物图、场景图、风格图，让后续首尾控制帧更稳定。

举个例子：

```text
故事文本：
凌晨三点，外卖员陈默送最后一单到废弃医院……

可选人物图：
hero.png，用来锁定男主脸、发型、外卖服和疲惫气质

可选场景图：
hospital.png，用来锁定废弃医院的走廊、护士站、冷色灯光

可选风格图：
noir-style.png，用来锁定冷色、低饱和、电影感悬疑质感
```

当前实现里，图片输入会作为视觉参考进入交付物和后续出图流程。它不是强制要求，也不会改变主流程：  
**没有图片也能跑，有图片就更容易保持一致。**

---

## 两种模式

Cine Make 只保留两个模式。

### 1. 草稿模式

草稿模式是默认流程。

它不生成图片，只快速回答几个问题：

- 这个短片到底讲什么？
- 故事从开头到结尾怎么走？
- 每个镜头大概是什么画面？
- 值不值得继续做成出图包？

草稿阶段如果直接生成图片，会很慢，而且故事还没定，生成图片很容易浪费。

### 2. 出图模式

当草稿确认后，再进入出图模式。

这时才准备或生成：

- 人物参考图；
- 场景参考图；
- 每段首尾帧控制图；
- `S01.png` ... `Sxx.png` 分镜关键帧；
- 每段上传 9 张图片以内的即梦投喂卡。

图片生成只走 Codex `$imagegen`。Cine Make 是给 Codex 用的 skill，不要求外部图片 API，也不需要额外图片密钥。

人物图不是必填。  
有图就锁定脸、发型、服装和气质；没图也能先跑主流程。

---

## 用户怎么用

安装 skill：

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

重启 Codex 后，就可以自然语言使用：

```text
$cine-make

把下面小说片段做成竖屏 AI 短剧草稿。
风格：超写实真人电影质感，85mm镜头，4K，电影感悬疑，冷色调，克制表演。

小说片段：
凌晨三点，外卖员陈默送最后一单到废弃医院。电梯停在不存在的13楼，门打开后，他看见十年前失踪的妹妹正坐在护士站，手里拿着他小时候丢掉的红色弹珠。
```

确认草稿后：

```text
$cine-make

这个草稿可以，继续进入出图模式。
帮我生成人物参考图、场景参考图、首尾控制帧。
```

带人物图时：

```text
$cine-make

用这张人物图锁定女主的脸、发型、服装和气质。
用这张场景图锁定雨夜街道和霓虹氛围。
用这张风格图锁定整体色调。
把下面剧情做成竖屏 AI 短剧出图包。

人物图：
C:\Users\you\Desktop\refs\hero.png

场景图：
C:\Users\you\Desktop\refs\street.png

风格图：
C:\Users\you\Desktop\refs\style.png

剧情：
她在雨夜收到一条来自三年前自己的短信。短信里只有一句话：不要回家。
```

用户不需要指定平台。  
默认只输出即梦投喂格式，不再做多平台适配。

默认视觉风格是 `超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性`。

整本小说或很大的 `.txt` 文件不要直接塞进一次上下文。Novel Studio MVP 使用项目模式：

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

这里的 `novel visual-bible` 只规划视觉参考，不自动生成图片；必须在视觉 bible 确认后，才显式使用 `$imagegen`。即梦投喂卡的硬规则是每段最多上传 9 张图片；角色图、场景图、首帧、分镜关键帧、尾帧都算图片。

---

## 最关键的设计：单集投喂包

很多工具的问题不是“没有提示词”，而是用户不知道下一步到底该干嘛。

普通短片和小说片段运行会直接交付：

```text
deliverable.md
storyboard-images/
```

Novel Studio 会暴露项目工作区产物和单集导出包。每个导出的单集包会包含：

```text
episode-input.md
deliverable.md
storyboard-images/
jimeng-feed-cards.json
```

其中 `episode-input.md` 是这一集从小说 bible 和分集计划整理出的改编输入；`deliverable.md` 是给用户阅读和复制的主交付物；`storyboard-images/` 放图片计划或已确认图片；`jimeng-feed-cards.json` 是机器可读的即梦投喂卡列表，记录每张卡的素材、提示词和 9 张上传图片预算。

用户实际喂给即梦时，先看 `deliverable.md` 里的中文说明，再用 `jimeng-feed-cards.json` 核对每张卡的素材清单和提示词。这样既保留人工可读交付物，也保留可检查、可自动化的结构化投喂卡。

如果用户还有 Canvas 系统，可以在单集包生成后运行：

```bash
cine-make novel canvas --run .cine-make-runs/my-novel --episode 1
```

它会在同一个单集目录下生成 `canvas-manifest.json` 和 `canvas-project.zip`。前者是 Cine Make 的导演语义交接文件；后者是 Canvas 可直接导入的文字画布包。这样 Cine Make 负责上游故事、分镜、连续性和投喂卡，Canvas 负责下游可视化编辑、出图、视频生成和人工迭代。

---

## 为什么不直接生成最终视频

因为 Codex 的优势不在“直接渲染 MP4”，而在：

- 理解故事；
- 拆分镜头；
- 组织工作流；
- 生成图片提示词；
- 保持连续性；
- 把复杂流程压成用户可执行的交付物。

最终视频合成应该交给专业 AI 视频工具。  
Cine Make 的定位是：**AI 视频前期制片工厂**。

---

## 当前状态

npm 包：

```text
cine-make@0.0.5
```

安装：

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

本地验证：

```bash
npm test
```

目前测试覆盖：

- 两种模式；
- 普通短片运行最终看到 `deliverable.md + storyboard-images/`；
- Novel Studio 会暴露项目工作区产物和单集导出包：`episode-input.md`、`deliverable.md`、`storyboard-images/`、`jimeng-feed-cards.json`；
- 可选人物图、场景图、风格图输入；
- `deliverable.md` 的顺序；
- 即梦投喂卡；
- skill frontmatter；
- npm package 内容。

---

## 这个项目的核心判断

这个项目没有追求“大而全”。

我反而刻意收窄了边界：

- 不做 Web IDE；
- 不做视频渲染；
- 不要求用户选平台；
- 不要求用户必须上传人物图；
- 不要求用户必须上传场景图或风格图；
- 不把内部工程文件甩给用户；
- 不设计一堆模式。

只专注一件事：

> 把故事变成一个用户看得懂、视频工具接得住的真人电影质感 AI 短剧前期制片包。

如果 AI 视频工具负责“生成画面”，那 Cine Make 负责的就是：

```text
让画面在生成之前，就已经有故事、有节奏、有镜头、有连续性。
```
