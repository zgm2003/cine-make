function modeName(mode) {
  return mode === 'visual' ? '出图模式' : '草稿模式'
}

function modeSummary(mode) {
  if (mode === 'visual') {
    return '出图模式：按分镜生成或准备生成角色参考、场景参考和首尾控制帧。'
  }
  return '草稿模式：只定故事、镜头和提示词，不生成图片。'
}

function visualReferenceLines(contract) {
  const visual = contract.visualReferences ?? {}
  const lines = []

  for (const path of visual.characterImages ?? []) lines.push(`- 人物参考图: ${path}`)
  for (const path of visual.sceneImages ?? []) lines.push(`- 场景参考图: ${path}`)
  for (const path of visual.styleImages ?? []) lines.push(`- 风格参考图: ${path}`)

  if (lines.length) return lines
  return [
    '- 未提供人物图片：可以先按角色设定生成 `storyboard-images/character-reference.png`。',
    '- 未提供场景/风格图：按导演方案生成场景参考和首尾帧控制图。'
  ]
}

function storyboardImageName(shot) {
  return `storyboard-images/${shot.shot_id}.png`
}

function compactAction(value) {
  return String(value).replace(/\s+/g, ' ').replace(/\|/g, '｜')
}

function shotPurpose(shot) {
  return compactAction(shot.action).split('；源剧情：')[0]
}

function pickStoryFlowShots(shotlist) {
  const last = shotlist.length - 1
  const indices = [0, Math.floor(last * 0.25), Math.floor(last * 0.5), Math.floor(last * 0.75), last]
  return [...new Set(indices)].map((index) => shotlist[index]).filter(Boolean)
}

function composeFilmPreview({ contract, draft, mainCharacter }) {
  const firstShot = draft.shotlist[0]
  const lastShot = draft.shotlist[draft.shotlist.length - 1]
  const subject = mainCharacter?.identity_anchor ?? '主角'

  return [
    `我们在做什么：把原始故事拆成一个 ${contract.target.durationSeconds}s、${contract.target.aspectRatio}、${contract.target.style} 的竖屏 AI 漫剧任务链；默认完整保留剧情，不压成单个爆点短片。`,
    '',
    `成片一句话：${subject}从“${shotPurpose(firstShot)}”进入故事，最后停在“${shotPurpose(lastShot)}”的悬念点上。`,
    '',
    '你先看这个部分判断故事方向；认可后再看分镜和图片提示词。'
  ]
}

function composeStoryFlow(shotlist) {
  const labels = ['开场', '异常出现', '真相靠近', '情绪推进', '悬念收束']
  return pickStoryFlowShots(shotlist).map((shot, index) => {
    return `${index + 1}. ${labels[index] ?? '剧情节点'}：${shotPurpose(shot)}`
  })
}

function composeShotTable(shotlist) {
  return [
    '| 镜头 | 时长 | 画面动作 | 故事板图 |',
    '| --- | ---: | --- | --- |',
    ...shotlist.map((shot) => `| ${shot.shot_id} | ${shot.duration_seconds}s | ${compactAction(shot.action)} | \`${storyboardImageName(shot)}\` |`)
  ]
}

function composeImagePromptList(shotlist) {
  return shotlist.flatMap((shot) => [
    `### ${shot.shot_id} -> ${storyboardImageName(shot)}`,
    '',
    '```text',
    shot.image_prompt,
    '```',
    ''
  ])
}

function composeEpisodeTaskTable(episodePlan) {
  return [
    '| 任务 | 时长 | 原剧情动作 | 导演分镜 | 起始帧 | 结束帧 |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...episodePlan.episodes.flatMap((episode) => {
      return episode.tasks.map((task) => {
        const storyboard = `${task.storyboard.shotSize}；${task.storyboard.lens}；${task.storyboard.cameraMove}；${task.storyboard.composition}；${task.storyboard.performance}`
        return `| ${episode.id}/${task.id} | ${task.durationSeconds}s | ${compactAction(task.sourceBeat)} | ${compactAction(storyboard)} | \`episodes/${episode.id}/${task.startFrame}\` | \`episodes/${episode.id}/${task.endFrame}\` |`
      })
    })
  ]
}

function composeControlFramePromptList(episodePlan) {
  return episodePlan.episodes.flatMap((episode) => {
    return episode.tasks.flatMap((task) => [
      `### ${episode.id}/${task.id} -> start/end frames`,
      '',
      `任务文件：\`episodes/${episode.id}/video-tasks/${task.id}.md\``,
      `导演分镜：\`episodes/${episode.id}/storyboard.md\``,
      '',
      `- 景别/镜头：${task.storyboard.shotSize}；${task.storyboard.lens}`,
      `- 构图/表演：${task.storyboard.composition}；${task.storyboard.performance}`,
      `- start_frame：\`episodes/${episode.id}/${task.startFrame}\``,
      `- end_frame：\`episodes/${episode.id}/${task.endFrame}\``,
      '',
      '首尾帧提示词以任务文件里的 `$imagegen prompt: start frame` 和 `$imagegen prompt: end frame` 为准。',
      ''
    ])
  })
}

function composeEpisodePlanSection(episodePlan) {
  if (!episodePlan) return []

  const lines = episodePlan.episodes.flatMap((episode) => [
    `### ${episode.id}｜${episode.durationSeconds}s｜${episode.tasks.length} 个 video-tasks`,
    '',
    `导演分镜：\`episodes/${episode.id}/storyboard.md\``,
    '',
    ...episode.tasks.map((task) => {
      return `- ${task.id}：${task.sourceBeat}  \n  director_storyboard: ${task.storyboard.shotSize}；${task.storyboard.composition}；${task.storyboard.performance}  \n  start_frame: \`episodes/${episode.id}/${task.startFrame}\`  \n  end_frame: \`episodes/${episode.id}/${task.endFrame}\`  \n  task: \`episodes/${episode.id}/video-tasks/${task.id}.md\``
    }),
    ''
  ])

  return [
    '## 完整剧情拆解与视频任务队列',
    '',
    '默认策略：完整保留剧情，不把长小说压成一个爆点短片；长剧情自动拆成多段/多集，每个镜头任务只做一个可见动作变化。',
    '',
    '分镜是第一层：每条任务先有景别、镜头/焦段、构图、调度、表演、光线和转场继承；首尾帧只是从分镜派生出来的出图控制图。',
    '',
    '真正喂给即梦 / Seedance / 其他图生视频模型的不是整段小说，而是 `video-tasks/` 里的短任务：每条任务都有导演分镜、`start_frame`、`end_frame`、运动指令、主体锁定和禁止项。',
    '',
    `全局连续性表：\`continuity-bible.json\`。它锁人物、道具、场景、已发生事件和跨段继承关系。`,
    '',
    ...lines
  ]
}

function composeVideoTaskFeedPack({ episodePlan, mode }) {
  return episodePlan.episodes.flatMap((episode) => {
    return [
      `### ${episode.id}（${episode.durationSeconds}s，${episode.tasks.length} 个逐镜任务）`,
      '',
      ...episode.tasks.flatMap((task) => [
        `#### ${episode.id}/${task.id}（${task.durationSeconds}s）`,
        '',
        `- 任务文件：\`episodes/${episode.id}/video-tasks/${task.id}.md\``,
        `- start_frame：\`episodes/${episode.id}/${task.startFrame}\``,
        `- end_frame：\`episodes/${episode.id}/${task.endFrame}\``,
        '',
        '操作：',
        '',
        '1. 用任务文件里的 `$imagegen prompt: start frame` 生成/确认起始帧；',
        '2. 用任务文件里的 `$imagegen prompt: end frame` 生成/确认结束帧；',
        '3. 把 start_frame + end_frame + Video model prompt 喂给外部视频工具；',
        '4. 只生成这一条可见动作，不让模型理解整段剧情。',
        '',
        mode === 'draft'
          ? '状态：草稿模式只准备任务卡和首尾帧提示词；确认后再进入出图模式生成图片。'
          : '状态：出图模式；首尾帧补齐后可逐条生成视频片段。',
        ''
      ])
    ]
  })
}

export function composeDeliverable({ contract, draft, episodePlan = null }) {
  const mode = contract.mode ?? 'draft'
  const mainCharacter = draft.characters?.[0]

  return [
    '# Cine Make Deliverable',
    '',
    `## 交付模式：${modeName(mode)}`,
    '',
    modeSummary(mode),
    '',
    '最终交付给用户看这些：',
    '',
    '- `deliverable.md`',
    '- `continuity-bible.json`',
    '- `episodes/`',
    '- `storyboard-images/README.md`',
    '',
    'Codex 不生成最终视频；最终 MP4 由 Seedance / 即梦 / 其他视频工具合成。',
    '',
    '## 成片预览',
    '',
    ...composeFilmPreview({ contract, draft, mainCharacter }),
    '',
    '## 故事全流程',
    '',
    ...composeStoryFlow(draft.shotlist),
    '',
    ...composeEpisodePlanSection(episodePlan),
    '',
    '## 短片方案',
    '',
    `- 标题：${contract.title}`,
    `- 时长：${contract.target.durationSeconds}s`,
    `- 画幅：${contract.target.aspectRatio}`,
    `- 风格：${contract.target.style}`,
    '',
    mainCharacter
      ? `主角锚点：${mainCharacter.identity_anchor}；服装/道具保持：${mainCharacter.costume_anchor} / ${mainCharacter.prop_anchor}。`
      : '主角锚点：按源故事和分镜设定保持一致。',
    '',
    '## 精简分镜',
    '',
    '这不是简单图片列表。每条都先锁导演分镜，再生成首尾帧。',
    '',
    ...(episodePlan ? composeEpisodeTaskTable(episodePlan) : composeShotTable(draft.shotlist)),
    '',
    '## 故事板图片清单',
    '',
    mode === 'visual'
      ? '出图模式下，按下面顺序生成或补齐图片。'
      : '草稿模式下这里只准备提示词，不生成图片；确认方案后再跑出图模式。',
    '',
    ...(episodePlan ? composeControlFramePromptList(episodePlan) : composeImagePromptList(draft.shotlist)),
    '## 视频工具投喂包',
    '',
    episodePlan
      ? '投喂单位不是整段小说，也不是 15 秒多镜头大卡；投喂单位是 `episodes/<episode>/video-tasks/Sxx.md`。每条任务只做一个可见动作，并用 start_frame / end_frame 控制视频模型。'
      : '缺少 episode plan：请使用当前 Cine Make CLI 重新生成，让编译器写出 `continuity-bible.json` 和 `episodes/*/video-tasks/*.md`。',
    '',
    ...(episodePlan ? composeVideoTaskFeedPack({ episodePlan, mode }) : []),
    '## 视觉参考',
    '',
    ...visualReferenceLines(contract),
    '',
    '## 连续性注意事项',
    '',
    '- 人物脸、发型、服装、道具不要漂移。',
    '- 每张首尾帧控制图只表达一个静态状态，不要求图片模型生成运动。',
    '- 视频工具只负责运动、镜头和转场，不让它重新发明剧情。',
    '- Codex 不生成最终视频。'
  ].join('\n')
}

export function composeStoryboardImagesReadme({ contract, draft, episodePlan = null }) {
  const mode = contract.mode ?? 'draft'
  const episodeFrameLines = episodePlan
    ? episodePlan.episodes.flatMap((episode) => {
        return episode.tasks.flatMap((task) => [
          `- \`episodes/${episode.id}/${task.startFrame}\`：${episode.id}/${task.id} 起始帧。`,
          `- \`episodes/${episode.id}/${task.endFrame}\`：${episode.id}/${task.id} 结束帧。`
        ])
      })
    : draft.shotlist.map((shot) => `- \`${shot.shot_id}.png\`：${compactAction(shot.action)}`)

  return [
    '# Storyboard images',
    '',
    `当前模式：${modeName(mode)}。`,
    episodePlan
      ? '这是根索引。真正的视频控制帧按集存放在 `episodes/<episode>/storyboard-images/`。'
      : mode === 'visual'
        ? '这里是出图模式的图片生成队列。'
        : '草稿模式不生成图片，只保留后续出图模式所需的文件名和提示词。',
    '',
    '## 用户参考图',
    '',
    ...visualReferenceLines(contract),
    '',
    '## 建议生成顺序',
    '',
    '- `character-reference.png`：没有人物参考图时才需要。',
    '- `scene-reference.png`：没有场景参考图时才需要。',
    ...episodeFrameLines,
    '',
    '## 规则',
    '',
    '- 只放静态图，不放视频。',
    '- 每个视频任务使用一张 start frame 和一张 end frame。',
    '- 文件名和 `episodes/<episode>/video-tasks/Sxx.md` 保持一致。',
    '- 如果用户已经提供人物图，就优先锁定人物，不要重新发明脸。'
  ].join('\n')
}
