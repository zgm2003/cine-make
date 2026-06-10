# Cine Make Director Package Design

## Goal
把 Cine Make 从“已有分层提示词输出”升级为稳定的 AI 漫剧导演系统：底层生成结构化导演资产，最终 `deliverable.md` 按用户定义的 6 大章节输出，可直接服务即梦静帧和视频投喂。

## Requirements

1. `composeDraftAssets(contract)` 必须在返回值中新增结构化字段：
   - `projectUnderstanding`
   - `globalVisualStyle`
   - `assetPlan`
   - `directorAtoms`
   - `formalStoryboards`
   - `consistencyChecklist`
2. 每个 `directorAtoms[]` 项必须包含导演视角拆剧所需字段：镜头编号、镜头功能、景别、机位、运镜、画面主体、人物动作、表情情绪、人物站位、空间关系、关键道具、画面重点、与下一镜头衔接。
3. 每个 `formalStoryboards[]` 项必须包含正式分镜字段：场景、时长、景别、机位、运镜、画面、人物动作、表情情绪、人物站位、空间关系、关键道具、镜头分析、即梦静帧提示词、即梦视频提示词。
4. `deliverable.md` 必须优先输出固定结构：
   - `# 1. 项目理解`
   - `# 2. 全局视觉风格`
   - `# 3. 资产规划`
   - `# 4. 导演视角拆剧`
   - `# 5. 正式分镜输出`
   - `# 6. 一致性提醒`
5. 不删除现有管线能力：角色一致性、场景一致性、KEYFRAME/MOTION 语义、Canvas 包、显式分镜模式仍可工作。
6. 静帧提示词必须描述单张完整画面，不写镜头运动；视频提示词必须描述镜头如何动、人物如何动、环境如何动、焦点如何转移。
7. 显式分镜剧本必须保持原分镜数量、顺序、角色和对白核心含义。

## Architecture

采用兼容式增强：在 `src/draft-writer.mjs` 中新增 director package 构建函数，把现有 `shotlist`、`characters`、`contract` 映射为结构化导演资产；在 `src/deliverable-writer.mjs` 中新增 CINE-MAKE 6 章渲染函数，优先使用新字段输出，同时保留原有视频投喂/出图清单内容。

## Data Mapping

- `projectUnderstanding` 从 `contract.contentType`、`contract.sourceText`、`shotlist`、`characters` 推断题材、世界观、核心看点、情绪基调、视觉重点。
- `globalVisualStyle` 从 `contract.target.style` 和题材推断画风、质感、光线、色彩、镜头语言、节奏风格。
- `assetPlan.characters` 来自 `draft.characters`。
- `assetPlan.scenes` 来自 `shotlist[].scene` 去重。
- `assetPlan.props` 从角色锚点、镜头动作和常见道具词中提取。
- `assetPlan.effects` 从玄幻/战斗/科幻/悬疑/天气关键词中提取。
- `directorAtoms` 和 `formalStoryboards` 一对一映射现有 shotlist，避免改剧情。

## Testing

新增/修改测试：

1. `test/draft-writer.test.mjs`：验证 `composeDraftAssets` 返回 director package 字段，且数组长度等于 `shotlist.length`。
2. `test/deliverable-writer.test.mjs`：验证 CLI 生成的 `deliverable.md` 包含 6 大章节，且每个正式分镜包含镜头分析、即梦静帧提示词、即梦视频提示词。
3. 显式分镜测试继续验证不污染角色、不把动态词混入静帧、不改掉原角色与分镜数量。

## Non-goals

- 不生成 MP4。
- 不调用外部视频 API。
- 不移除 Canvas 包。
- 不把所有旧章节一次性删除；只把用户入口改为新 6 章结构并保留必要投喂信息。
