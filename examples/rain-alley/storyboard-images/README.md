# Storyboard images

当前模式：出图模式。
这是根索引。真正的视频控制帧按集存放在 `episodes/<episode>/storyboard-images/`。

## 用户参考图

- 未提供人物图片：可以先按角色设定生成 `storyboard-images/character-reference.png`。
- 未提供场景/风格图：按导演方案生成场景参考和首尾帧控制图。

## 建议生成顺序

- `character-reference.png`：没有人物参考图时才需要。
- `scene-reference.png`：没有场景参考图时才需要。
- `episodes/episode-01/storyboard-images/S01-start.png`：episode-01/S01 起始帧。
- `episodes/episode-01/storyboard-images/S01-end.png`：episode-01/S01 结束帧。

## 规则

- 只放静态图，不放视频。
- 每个视频任务使用一张 start frame 和一张 end frame。
- 文件名和 `episodes/<episode>/video-tasks/Sxx.md` 保持一致。
- 如果用户已经提供人物图，就优先锁定人物，不要重新发明脸。
