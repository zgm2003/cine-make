# Storyboard images

这里不是给人看的分镜图墙，而是给图生视频模型使用的首尾帧控制队列。

## Required reference images

- `character-reference.png`：锁定人物脸、发型、体型、服装。
- `scene-reference.png`：锁定空间结构、光线方向、色彩关系。

## Start/end frames

- `S01-start.png`：S01 起始帧。
- `S01-end.png`：S01 结束帧。

## Rules

- 每张图必须是单帧，不要拼图、不要分镜表、不要文字说明。
- `Sxx-start.png` 和 `Sxx-end.png` 只表达同一镜头前后的状态变化。
- 后一条任务的 start frame 应继承上一条任务的 end frame。
