# Cine Make 剧本拆解与角色定妆规格

## 目标
把短剧剧本从“纯文本 + 通用镜头模板”升级为“剧本 profile + 多角色定妆 + 空间连续分镜”。

## 用户可见要求
- 多角色剧本必须拆出主要角色，不再只生成一个 `character-reference.png`。
- 《孤岛碎忆》这类剧本要生成林默、安娜、雷队、阿杰四张真人电影角色定妆照提示词。
- 角色定妆照采用专业影视角色设定参考图结构：左侧半身近景特写，右侧正面/侧面/背面三视图，全身旁边摆核心道具，上方预留干净信息栏。
- 提示词必须强调写实摄影、真实皮肤、自然瑕疵、低调布光、湿衣料、心理惊悚；负面词必须压住动漫、漫画、CG、塑料脸、怪物化、坏手、文字水印。
- 分镜必须从剧本事件出发，保留空间、人物位置、动作推进和镜头方向；不能再用“半步踏入不可能空间”这类通用模板替代剧情。
- 即梦投喂包仍遵守每段最多 9 张上传图；当角色参考图超过预算时，只上传本段实际出现的角色参考图。
- validator 必须检查 `storyboard-images/README.md` 中列出的图片是否真实存在，不能缺图还报 OK。

## 非目标
- 不接入外部视频 API。
- 不生成 MP4。
- 不把全部未来题材做成大而全智能编剧系统；本轮只做短剧脚本的结构化基础能力和《孤岛碎忆》验证样本。

## 数据结构
新增 `script-profile`：
- `cast[]`: id、name、role、identity、height、age、appearance、costume、bodyDetails、expression、props、mood、referenceImage、referencePrompt。
- `beats[]`: id、raw、kind、characters、location、visualAction。
- `props[]`: 从角色和剧本中抽取的关键道具。
- `scenes[]`: 场景名。

## 兼容性
- 保留 `node src/cli.mjs --mode draft|visual --out ...`。
- 保留 `deliverable.md` 和 `storyboard-images/` 为普通用户主输出。
- 无多角色剧本时继续使用旧的主角参考图行为。
