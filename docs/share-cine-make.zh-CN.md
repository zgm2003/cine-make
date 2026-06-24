# Cine Make：把小说片段变成真人电影质感 AI 短剧前期制片包

我做了一个 Codex Skill：**Cine Make**。

它不是一个“视频生成器”，也不声称自己能直接生成 MP4。它解决的是 AI 视频创作里更前置、也更容易被忽略的问题：

> 在生成视频之前，先把故事、参考资产提示词、镜头语言、原著台词和视频工具投喂方式整理清楚。

很多 AI 视频工具已经很强，但实际使用时经常会遇到一个问题：
用户只有一段小说、一个脑洞、一个广告 brief，却不知道应该怎么拆成镜头，怎么保持人物一致，怎么准备 GPT-image-2 参考提示词，最后又该把哪些逐条视频文本交给 ChatGPT 复核、再喂给外部视频工具。

Cine Make 做的就是这件事。

---

## 它解决什么问题

AI 视频生成不是从“写一句提示词”开始的。

真正稳定的流程应该是：

```text
故事素材
-> 原著守则校对
-> GPT-image-2 参考资产提示词
-> 逐条镜头语言视频文本
-> ChatGPT 复核
-> 外部视频工具生成视频
```

Cine Make 把这条链路整理成一个可复用的工作流。

用户不需要理解内部 agent 怎么协作。普通短片和小说片段运行，最终只看 ChatGPT-only 交付包：

```text
seedance-all-reference-feed.md
README.md
```

其中 `seedance-all-reference-feed.md` 是主交付物，里面会按可复制的顺序组织：

1. GPT-image-2 参考资产提示词；
2. 参考资产绑定表；
3. 全局负面约束；
4. 原著守则；
5. 镜头语言规则；
6. 小云雀运镜标签库；
7. 逐条视频文本；
8. 可复制给 ChatGPT 的底部说明。

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

也就是说，用户可以只输入一段小说，让 Cine Make 直接生成可校对的 Seedance feed；也可以补充人物图、场景图、风格图，让参考资产提示词更稳定。

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

当前实现里，图片输入只作为参考信息进入 feed，不改变主流程：
**没有图片也能跑，有图片就更容易让 ChatGPT 和后续视频工具保持一致。**

---

## 单一路径：ChatGPT-only Seedance feed

Cine Make 不再保留草稿模式 / 出图模式作为用户入口。

默认流程只回答一个问题：

> 这段故事怎么变成可校对、可复制、可投喂外部视频工具的逐条视频文本？

它会准备：

- GPT-image-2 人物 / 场景 / 高价值道具参考提示词；
- 参考资产绑定关系；
- 原著守则；
- 镜头语言规则；
- 小云雀运镜标签，例如 `镜头前推`、`跟随拍摄`、`甩摇`、`焦点转移`、`高空航拍`；
- 逐条视频文本；
- 给 ChatGPT 复核用的底部说明。

图片生成不是默认动作。只有用户明确要静态图时，才显式使用 Codex `$imagegen`。

人物图不是必填。
有图就锁定脸、发型、服装和气质；没图也能先跑 feed 主流程。

---

## 用户怎么用

安装 skill：

```bash
npx --registry=https://registry.npmjs.org/ cine-make install-skill
```

重启 Codex 后，就可以自然语言使用：

```text
$cine-make

把下面小说片段做成竖屏 AI 短剧 Seedance 全能参考投喂包。
风格：超写实真人电影质感，85mm镜头，4K，电影感悬疑，冷色调，克制表演。

小说片段：
凌晨三点，外卖员陈默送最后一单到废弃医院。电梯停在不存在的13楼，门打开后，他看见十年前失踪的妹妹正坐在护士站，手里拿着他小时候丢掉的红色弹珠。
```

带人物图时：

```text
$cine-make

用这张人物图锁定女主的脸、发型、服装和气质。
用这张场景图锁定雨夜街道和霓虹氛围。
用这张风格图锁定整体色调。
把下面剧情做成竖屏 AI 短剧 Seedance 全能参考投喂包。

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
默认只输出 ChatGPT 可校对的 Seedance 全能参考投喂包，不再做 Canvas 包或多平台工程包。

默认视觉风格由用户指定；未指定时使用保守的电影感 / 国漫 / 写实连续性描述，不自动生成图片。

整本小说或很大的 `.txt` 文件不要直接塞进一次上下文。Novel Studio MVP 使用项目模式：

```bash
cine-make novel ingest --input ./novel.txt --out runs/my-novel
cine-make novel task --run runs/my-novel --id summarize-chapter-0001
cine-make novel accept-summary --run runs/my-novel --file ./chapter-0001.summary.json
cine-make novel build-bible --run runs/my-novel
cine-make novel visual-bible --run runs/my-novel
cine-make novel plan-episodes --run runs/my-novel
cine-make novel episode --run runs/my-novel --episode 1
```

这里的 `novel visual-bible` 只规划视觉参考，不自动生成图片；必须在视觉 bible 确认后，才显式使用 `$imagegen`。用户交付仍以 ChatGPT-ready Seedance feed 为主，不生成 Canvas 工程包。

---

## 最关键的设计：单集投喂包

很多工具的问题不是“没有提示词”，而是用户不知道下一步到底该干嘛。

普通短片和小说片段运行会直接交付：

```text
seedance-all-reference-feed.md
README.md
```

Novel Studio 会继续保留章节拆分、摘要、bible、视觉 bible 和单集计划这类中间产物；真正给用户复制的主交付物仍是 `seedance-all-reference-feed.md`。

用户实际操作时，先把 `seedance-all-reference-feed.md` 粘给 ChatGPT 按原著守则和镜头语言规则复核，再把逐条视频文本投喂外部视频工具。

Canvas 输出已关闭：Cine Make 不再生成 `canvas-project.zip`、`canvas-manifest.json`、`projects.json` 或 `prompt-pack.md`。后续统一用 ChatGPT 校对 `seedance-all-reference-feed.md`，再把逐条视频文本投喂外部视频工具。

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

- 默认 CLI / `seedance-pack` 只输出 `seedance-all-reference-feed.md + README.md`；
- `--mode draft`、`--mode visual`、旧 Canvas 命令都会快速失败；
- 普通运行不再生成 `deliverable.md`、`storyboard-images/`、`canvas-project.zip`、`canvas-manifest.json`、`projects.json`、`prompt-pack.md`；
- feed 内置原著守则、镜头语言规则和 GPT-image-2 三视图参考提示词；
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
