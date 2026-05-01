# Cine Make Deliverable

## 交付模式：出图模式

出图模式：按分镜生成或准备生成角色参考、场景参考和首尾控制帧。

最终交付给用户看这些：

- `deliverable.md`
- `continuity-bible.json`
- `episodes/`
- `storyboard-images/README.md`

Codex 不生成最终视频；最终 MP4 由 Seedance / 即梦 / 其他视频工具合成。

## 成片预览

我们在做什么：把原始故事拆成一个 6s、9:16、cinematic noir 的竖屏 AI 漫剧任务链；默认完整保留剧情，不压成单个爆点短片。

成片一句话：女孩从“注意到不该出现的信号，在越过边界前停住”进入故事，最后停在“失去的人或最终信号伸出邀请，但不强迫”的悬念点上。

你先看这个部分判断故事方向；认可后再看分镜和图片提示词。

## 故事全流程

1. 开场：注意到不该出现的信号，在越过边界前停住
2. 异常出现：查看把当下和旧伤连接起来的关键物
3. 真相靠近：听见不该存在的声音、信号或记忆
4. 情绪推进：只通过倒影或剪影看到失去的人或真相
5. 悬念收束：失去的人或最终信号伸出邀请，但不强迫

## 完整剧情拆解与视频任务队列

默认策略：完整保留剧情，不把长小说压成一个爆点短片；长剧情自动拆成多段/多集，每个镜头任务只做一个可见动作变化。

分镜是第一层：每条任务先有景别、镜头/焦段、构图、调度、表演、光线和转场继承；首尾帧只是从分镜派生出来的出图控制图。

真正喂给即梦 / Seedance / 其他图生视频模型的不是整段小说，而是 `video-tasks/` 里的短任务：每条任务都有导演分镜、`start_frame`、`end_frame`、运动指令、主体锁定和禁止项。

全局连续性表：`continuity-bible.json`。它锁人物、道具、场景、已发生事件和跨段继承关系。

### episode-01｜6s｜1 个 video-tasks

导演分镜：`episodes/episode-01/storyboard.md`

- S01：雨夜里，女孩在巷口停下脚步，回头看见远处的霓虹灯下有人举起一把黑伞。  
  director_storyboard: establishing wide shot -> environmental detail shot；strong leading lines, protagonist small against architecture, one readable route deeper into the scene；minimal movement, alert posture, attention pulled by the abnormal light or sound  
  start_frame: `episodes/episode-01/storyboard-images/S01-start.png`  
  end_frame: `episodes/episode-01/storyboard-images/S01-end.png`  
  task: `episodes/episode-01/video-tasks/S01.md`


## 短片方案

- 标题：novel_excerpt-cine-1xvvqta
- 时长：6s
- 画幅：9:16
- 风格：cinematic noir

主角锚点：女孩；服装/道具保持：固定服装与外观，符合cinematic noir / 黑伞。

## 精简分镜

这不是简单图片列表。每条都先锁导演分镜，再生成首尾帧。

| 任务 | 时长 | 原剧情动作 | 导演分镜 | 起始帧 | 结束帧 |
| --- | ---: | --- | --- | --- | --- |
| episode-01/S01 | 6s | 雨夜里，女孩在巷口停下脚步，回头看见远处的霓虹灯下有人举起一把黑伞。 | establishing wide shot -> environmental detail shot；32mm cinematic wide lens；slow observational drift, no dramatic shake；strong leading lines, protagonist small against architecture, one readable route deeper into the scene；minimal movement, alert posture, attention pulled by the abnormal light or sound | `episodes/episode-01/storyboard-images/S01-start.png` | `episodes/episode-01/storyboard-images/S01-end.png` |

## 故事板图片清单

出图模式下，按下面顺序生成或补齐图片。

### episode-01/S01 -> start/end frames

任务文件：`episodes/episode-01/video-tasks/S01.md`
导演分镜：`episodes/episode-01/storyboard.md`

- 景别/镜头：establishing wide shot -> environmental detail shot；32mm cinematic wide lens
- 构图/表演：strong leading lines, protagonist small against architecture, one readable route deeper into the scene；minimal movement, alert posture, attention pulled by the abnormal light or sound
- start_frame：`episodes/episode-01/storyboard-images/S01-start.png`
- end_frame：`episodes/episode-01/storyboard-images/S01-end.png`

首尾帧提示词以任务文件里的 `$imagegen prompt: start frame` 和 `$imagegen prompt: end frame` 为准。

## 视频工具投喂包

投喂单位不是整段小说，也不是 15 秒多镜头大卡；投喂单位是 `episodes/<episode>/video-tasks/Sxx.md`。每条任务只做一个可见动作，并用 start_frame / end_frame 控制视频模型。

### episode-01（6s，1 个逐镜任务）

#### episode-01/S01（6s）

- 任务文件：`episodes/episode-01/video-tasks/S01.md`
- start_frame：`episodes/episode-01/storyboard-images/S01-start.png`
- end_frame：`episodes/episode-01/storyboard-images/S01-end.png`

操作：

1. 用任务文件里的 `$imagegen prompt: start frame` 生成/确认起始帧；
2. 用任务文件里的 `$imagegen prompt: end frame` 生成/确认结束帧；
3. 把 start_frame + end_frame + Video model prompt 喂给外部视频工具；
4. 只生成这一条可见动作，不让模型理解整段剧情。

状态：出图模式；首尾帧补齐后可逐条生成视频片段。

## 视觉参考

- 未提供人物图片：可以先按角色设定生成 `storyboard-images/character-reference.png`。
- 未提供场景/风格图：按导演方案生成场景参考和首尾帧控制图。

## 连续性注意事项

- 人物脸、发型、服装、道具不要漂移。
- 每张首尾帧控制图只表达一个静态状态，不要求图片模型生成运动。
- 视频工具只负责运动、镜头和转场，不让它重新发明剧情。
- Codex 不生成最终视频。
