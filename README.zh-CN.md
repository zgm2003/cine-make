# Cine Make 中文说明

**中文主文档**：这是给中文用户直接阅读的说明。

English: [`README.md`](./README.md)

**Cine Make** 是一个给 Codex 风格 agent 使用的本地 AI 漫剧前期制片工厂。

它把小说片段、粗剧本、广告 brief、故事梗概转换成一个紧凑、可执行的 AI 视频前期交付包。

Cine Make **不生成 MP4**。它负责拆解故事、锁定连续性、准备首尾帧提示词、优先通过 `gpt-image-2` 生成高质量控制帧，失败时再用 `$imagegen` 兜底，并生成视频模型任务卡；最终视频由 Seedance、即梦或其他 AI 视频工具生成。

## 用户最终拿到什么

正常运行给用户这些东西：

```text
deliverable.md
continuity-bible.json
episodes/
storyboard-images/README.md
```

这是故意的。用户不应该看到一堆内部调试文件，但应该拿到真正能喂给视频模型的 `episodes/*/video-tasks/*.md`。

`deliverable.md` 是核心产物，顺序按用户理解来组织：

```text
1. 成片预览
2. 故事全流程
3. 完整剧情拆解与视频任务队列
4. 短片方案
5. 精简分镜
6. 故事板图片清单
7. 视频工具投喂包
8. 视觉参考
9. 连续性注意事项
```

其中最关键的是 **完整剧情拆解与视频任务队列**。长剧情默认完整保留，不压成一个爆点短片，而是自动拆成多段/多集。每个视频任务都会明确告诉用户：

```text
start_frame 是哪张图
end_frame 是哪张图
motion 怎么写
must_keep 锁什么
avoid 禁什么
```

首尾控制帧不是分镜的替代品。分镜必须先决定景别、镜头/焦段、运镜、构图、人物调度、表演细节、光线色彩和转场继承；然后出图器才按分镜去生成 `start_frame` / `end_frame`。

这里不是单纯给人看的剧情说明，而是给视频模型吃的任务卡。默认每个任务只做一个可见动作变化，通常 **3-6 秒**，用首帧和尾帧硬控画面，不再指望视频模型自己理解整段自然语言剧情。

## 两种模式

Cine Make 只有两个用户模式，不再发散。

| 模式 | 用途 | 是否生成图片 | 输出 |
| --- | --- | --- | --- |
| `draft` | 快速看故事、改节奏、拆剧集/任务 | 不生成图片 | `deliverable.md` + `continuity-bible.json` + `episodes/*/video-tasks/*.md` |
| `visual` | 草稿确认后，进入出图模式，补齐首尾控制帧 | 默认先走 `gpt-image-2` + `quality=high`，失败才走 `$imagegen` | `deliverable.md` + `continuity-bible.json` + `episodes/*/storyboard-images/` |

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
- `S01-start.png`、`S01-end.png` 这类首尾帧控制图；
- 给 AI 视频工具使用的逐镜任务卡。

出图模式的图片链路固定为：先请求本地 `gpt-image-2` CLI/API，默认 `quality=high`，并按画幅使用高分辨率尺寸（例如 `9:16 -> 2160x3840`）；如果本机 API Key、CPA 代理、网络或工具链失败，再生成 `imagegen-fallback.md/json`，由 Codex 内置 `$imagegen` 兜底。

这里的 CLI/API 不是只能走 OpenAI 官方域名。如果你使用的是 **CPA（CLI Proxy API）**，并且 CPA 已经把 `gpt-image-2` 反代出来，那么 Cine Make 只认下面这两个环境变量：

```text
OPENAI_API_KEY   必填。官方 OpenAI 就填官方 key；CPA 就填 CPA key。
OPENAI_BASE_URL  可选。填了就走 CPA / OpenAI-compatible 代理；不填就走 OpenAI SDK 官方默认地址 https://api.openai.com/v1。
```

也就是说，最终约定非常简单：

- `OPENAI_API_KEY` 是图片 API 的唯一 key 环境变量；
- `OPENAI_BASE_URL` 是图片 API 的唯一 base URL 环境变量；
- 不使用 `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_BASE_URL` 做图片 API 鉴权；
- 模型名固定还是 `gpt-image-2`；
- 如果请求失败，不管是 key 错、额度不够、CPA 不通、网络超时，都会写 `imagegen-fallback.md/json`，然后走 `$imagegen` 兜底。

CPA 调试时这样配：

```powershell
$env:OPENAI_BASE_URL="https://你的-cpa-base-url/v1"
$env:OPENAI_API_KEY="你的-cpa-api-key"

node scripts/render-images.mjs --run .cine-make-runs/demo-visual --quality high
```

官方 OpenAI 调试时，不配置 `OPENAI_BASE_URL` 即可：

```powershell
Remove-Item Env:OPENAI_BASE_URL -ErrorAction SilentlyContinue
$env:OPENAI_API_KEY="你的-openai-api-key"

node scripts/render-images.mjs --run .cine-make-runs/demo-visual --quality high
```

Windows 用户要持久保存到当前用户环境变量，可以这样：

```powershell
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", "https://你的-cpa-base-url/v1", "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "你的-cpa-api-key", "User")
```

如果要切回官方 OpenAI，把 `OPENAI_BASE_URL` 删除，保留 `OPENAI_API_KEY`：

```powershell
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", $null, "User")
```

设置后重启 Codex / PowerShell。验证时不要打印 key，只看是否存在：

```powershell
$env:OPENAI_BASE_URL
[bool]$env:OPENAI_API_KEY
```

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

生成首尾控制帧：

```bash
node scripts/render-images.mjs --run .cine-make-runs/demo-visual --quality high
```

这一步默认使用 `gpt-image-2`。它只看 `OPENAI_API_KEY` 和可选的 `OPENAI_BASE_URL`：`OPENAI_BASE_URL` 有值就走 CPA / OpenAI-compatible 代理，没值就走官方 OpenAI 默认地址；如果失败，会在 run 目录写入 `imagegen-fallback.md` / `imagegen-fallback.json`，再按清单用 `$imagegen` 兜底出图。

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
continuity-bible.json
episodes/
storyboard-images/README.md
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

外部视频生成要按短任务处理。Cine Make 默认每个任务只表达一个可见动作变化，通常 **3-6 秒**；长剧情会先拆成多集，每集再拆成多个 `video-tasks/Sxx.md`，最后再剪辑/拼接。

应该按 `episodes/<episode>/video-tasks/Sxx.md` 逐条操作：

```text
1. 先看 episodes/<episode>/storyboard.md 的导演分镜
2. 先用 gpt-image-2 + quality=high 按分镜生成 start_frame / end_frame；失败才用 $imagegen 兜底
3. 上传这一条任务列出的首尾帧和参考图
4. 复制这一条任务的 Video model prompt
5. 在外部视频工具生成这一条短视频
6. 下一条任务继承上一条 end_frame
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
故事素材 -> 完整剧情拆解 -> 多集/多段任务 -> 首尾帧出图包 -> 视频任务卡
```

外部视频工具负责最终合成：

```text
视频任务卡 -> 视频片段 -> 最终剪辑/导出
```

Cine Make 不能声称 Codex 生成了最终 MP4。


