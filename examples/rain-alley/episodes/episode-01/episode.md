# 第 1 段

这一段保留原剧情顺序，不把长剧情压成一个爆点短片。

## Continuity anchors

- 主体：女孩
- 关联人物：secondary figure
- 关键道具：黑伞
- 场景：巷口
- 异常信号：黑伞

## Video tasks

- S01 / 6s / B01: 雨夜里，女孩在巷口停下脚步，回头看见远处的霓虹灯下有人举起一把黑伞。

## Director storyboard

详见 `storyboard.md`。这里的分镜不是图片墙，而是每条视频任务的景别、镜头、构图、调度、表演和光线设计。

## Workflow

1. 先用 `$imagegen` 生成或确认本集所需的 start/end 控制帧。
2. 每个 `video-tasks/Sxx.md` 只喂给视频模型一次。
3. 下一条任务继承上一条任务的 end frame，不让视频模型自己脑补跨段剧情。
