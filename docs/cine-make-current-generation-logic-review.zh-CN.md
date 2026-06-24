# Cine Make 当前生成逻辑评审文档

日期：2026-06-21
用途：给编剧、分镜导演和 AI 视频工作流人员确认 Cine Make 当前真实产品边界。

> 本文描述的是当前代码和用户交付契约，不是旧 Canvas / draft / visual 设计稿。

---

## 1. 项目定位

Cine Make 是本地短剧前期制片编译器，不直接生成 MP4，不调用外部视频 API，也不再生产 Canvas 包。

当前主目标只有一个：

- 把小说片段、剧本、广告 brief、故事素材编成 ChatGPT 可校对的 `seedance-all-reference-feed.md`。

默认用户交付物只有：

```text
seedance-all-reference-feed.md
README.md
```

不再作为用户交付生产：

```text
canvas-project.zip
canvas-manifest.json
projects.json
prompt-pack.md
deliverable.md
storyboard-images/
```

当前默认产品契约见：

- `skills/cine-make/SKILL.md`
- `skills/cine-make/references/output-contract.md`
- `README.md`
- `README.zh-CN.md`

---

## 2. CLI 入口与模式

主入口：

```text
src/cli.mjs
```

用户可用主路径：

```bash
node src/cli.mjs --out <run-dir> --input <script> --style <style>
node src/cli.mjs seedance-pack --out <run-dir> --input <script> --style <style>
node src/cli.mjs reference-feed --out <run-dir> --input <script> --style <style>
```

其中：

- 默认命令 / `seedance-pack`：输出 `seedance-all-reference-feed.md` 和 `README.md`；
- `reference-feed`：只输出 `seedance-all-reference-feed.md`；
- 长篇小说仍走 `novel ingest / task / accept-summary / build-bible / visual-bible / plan-episodes / episode`，但不走 `novel canvas`。

已移除或禁用的用户入口：

```text
--mode draft
--mode visual
--draft
--visual
canvas-pack
canvas-storyboard-pack
canvas-full-pack
novel canvas
```

这些入口必须快速失败，并提示改用 ChatGPT-only Seedance feed。

---

## 3. Feed 内容顺序

`seedance-all-reference-feed.md` 必须按可操作顺序组织：

1. GPT-image-2 参考资产提示词；
2. 参考资产绑定表；
3. 全局负面约束；
4. 原著守则；
5. 镜头语言规则；
6. 小云雀运镜标签库；
7. 逐条视频文本；
8. 可复制给 ChatGPT / 外部视频工具的底部说明。

逐条视频文本固定格式：

```text
序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效
```

每条只保留一个主动作、一个可见故事目标，给表演、运镜和悬念留空间。默认不写字幕、不写配乐，只保留环境声、动作声和必要对白。

---

## 4. 原著守则

小说改编优先守原文：

- 短而承重的直接引号对白优先照抄；长台词允许为 15 秒视频呼吸摘取核心短句或轻微顺口化；
- 人名、势力、功法、境界、地点、道具、因果必须来自原文；
- 叙述可转成可见动作，但事件顺序、人物动机、揭示顺序、章末钩子不能改；
- 要缩短时先删重复解释、低价值修饰和旁白性心理活动，不能改关键台词含义；
- 真实原文优先级高于已经生成的旧包。

《太虚至尊》第三章这类项目必须先校对原著台词，再判断旁白音色。威胁声、神念传音、旁白都要写清来源和声音质感，不能把角色对白误写成泛泛旁白。

---

## 5. 镜头语言规则

Cine Make 的镜头语言不是文学分镜标题，而是给 AI 视频模型直接执行的单行文本。

每行必须包含：

- 地点；
- 角色；
- 可见动作；
- 主体 / 景别 / 机位 / 构图 / 光影；
- 运镜；
- 台词 / 音效。

不要写抽象概念，例如“男主看着建筑”。应该写成可见画面，例如“背对镜头的男主站在画面下方中央，头微微仰起，视线朝向前方居民楼入口”。

每 5 条视频文本默认等于 15 秒，除非用户明确改时长。

小云雀运镜标签必须用原词，不用同义词替换。核心标签库包括：固定镜头、镜头上摇、镜头下摇、镜头左摇、镜头右摇、镜头上升、镜头下降、镜头左移、镜头右移、镜头前推、镜头后移、变焦推进、变焦拉远、跟随拍摄、迎面跟拍、侧面跟拍、手持拍摄、第一视角、横滑揭示、前景擦过、穿越镜头、甩摇、焦点转移、急速变焦、希区柯克、环绕拍摄、盘旋抬升、盘旋下降、穿越机运镜、稳定器行进、高空航拍、俯冲下降、拉开离场。

---

## 6. Legacy 代码边界

仓库里仍可能保留 `draft-writer`、旧 Canvas exporter 或历史计划文档，用于兼容旧测试、内部调试或回看旧设计。

这不改变产品边界：

- 不把旧 exporter 接回公开 CLI；
- 不把 `canvas-project.zip` 当用户交付；
- 不把 `deliverable.md` / `storyboard-images/` 当普通运行输出；
- 新需求默认进入 ChatGPT-only Seedance feed。

如果旧代码和当前输出契约冲突，以 `src/cli.mjs` 的当前可达路径、`skills/cine-make/SKILL.md` 和 `output-contract.md` 为准。

---

## 7. 验证重点

改动 Cine Make 后，至少验证：

```bash
npm test
git diff --check
```

关键断言：

- 默认 CLI / `seedance-pack` 只生成 `seedance-all-reference-feed.md` 和 `README.md`；
- Canvas 命令快速失败，错误包含 `Canvas package output is disabled`；
- feed 包含 `## 原著守则` 和 `## 镜头语言规则`；
- feed 包含 `## 小云雀运镜标签库`，并且运镜字段优先使用小云雀原始标签；
- 短关键台词保真；长台词不会硬塞进单条视频文本，摘句后不改变人物动机、因果和章末钩子；
- 普通运行不产生 Canvas 包或旧 draft/visual 产物。
