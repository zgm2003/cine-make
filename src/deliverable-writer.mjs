function platformName(platform) {
  if (platform === 'seedance') return 'Seedance'
  if (platform === 'jimeng') return 'Jimeng'
  return 'Generic video model'
}

function modeName(mode) {
  return mode === 'visual' ? '视觉包模式' : '草稿模式'
}

function modeSummary(mode) {
  if (mode === 'visual') {
    return '慢模式：按分镜生成或准备生成角色参考、场景参考和故事板关键帧。'
  }
  return '快模式：只定故事、镜头和提示词，不生成图片。'
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
    '- 未提供场景/风格图：按导演方案生成场景参考和分镜关键帧。'
  ]
}

function storyboardImageName(shot) {
  return `storyboard-images/${shot.shot_id}.png`
}

function segmentShots(shotlist, size = 5) {
  const segments = []
  for (let index = 0; index < shotlist.length; index += size) {
    segments.push(shotlist.slice(index, index + size))
  }
  return segments
}

function compactAction(value) {
  return String(value).replace(/\s+/g, ' ').replace(/\|/g, '｜')
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

function composeVideoSegments({ contract, shotlist }) {
  const platform = platformName(contract.target.platform)
  return segmentShots(shotlist).flatMap((segment, index) => {
    const first = segment[0].shot_id
    const last = segment[segment.length - 1].shot_id
    return [
      `### ${platform} segment ${index + 1}: ${first}-${last}`,
      '',
      '```text',
      `Using storyboard images ${segment.map((shot) => storyboardImageName(shot)).join(', ')} as visual references, create a ${contract.target.aspectRatio} ${contract.target.style} cinematic sequence. Preserve the same character identity, costume, prop, scene lighting, emotional curve, and screen direction. Motion plan: ${segment.map((shot) => `${shot.shot_id}: ${shot.video_prompt_note}`).join(' ')}`,
      '```',
      ''
    ]
  })
}

export function composeDeliverable({ contract, draft }) {
  const mode = contract.mode ?? 'draft'
  const platform = platformName(contract.target.platform)
  const mainCharacter = draft.characters?.[0]

  return [
    '# Cine Make Deliverable',
    '',
    `## 交付模式：${modeName(mode)}`,
    '',
    modeSummary(mode),
    '',
    '最终交付给用户只看这两项：',
    '',
    '- `deliverable.md`',
    '- `storyboard-images/`',
    '',
    'Codex 不生成最终视频；最终 MP4 由 Seedance / 即梦 / 其他视频工具合成。',
    '',
    '## 短片方案',
    '',
    `- 标题：${contract.title}`,
    `- 时长：${contract.target.durationSeconds}s`,
    `- 画幅：${contract.target.aspectRatio}`,
    `- 风格：${contract.target.style}`,
    `- 视频工具：${platform}`,
    '',
    mainCharacter
      ? `主角锚点：${mainCharacter.identity_anchor}；服装/道具保持：${mainCharacter.costume_anchor} / ${mainCharacter.prop_anchor}。`
      : '主角锚点：按源故事和分镜设定保持一致。',
    '',
    '## 视觉参考',
    '',
    ...visualReferenceLines(contract),
    '',
    '## 精简分镜',
    '',
    ...composeShotTable(draft.shotlist),
    '',
    '## 故事板图片清单',
    '',
    mode === 'visual'
      ? '视觉包模式下，按下面顺序生成或补齐图片。'
      : '草稿模式下这里只准备提示词，不生成图片；确认方案后再跑视觉包模式。',
    '',
    ...composeImagePromptList(draft.shotlist),
    '## 视频合成提示词',
    '',
    ...composeVideoSegments({ contract, shotlist: draft.shotlist }),
    '## 连续性注意事项',
    '',
    '- 人物脸、发型、服装、道具不要漂移。',
    '- 每张故事板图只表达一个关键帧，不要求图片模型生成运动。',
    '- 视频工具只负责运动、镜头和转场，不让它重新发明剧情。',
    '- Codex 不生成最终视频。'
  ].join('\n')
}

export function composeStoryboardImagesReadme({ contract, draft }) {
  const mode = contract.mode ?? 'draft'

  return [
    '# Storyboard images',
    '',
    `当前模式：${modeName(mode)}。`,
    mode === 'visual'
      ? '这里是视觉包模式的图片生成队列。'
      : '草稿模式不生成图片，只保留后续视觉包所需的文件名和提示词。',
    '',
    '## 用户参考图',
    '',
    ...visualReferenceLines(contract),
    '',
    '## 建议生成顺序',
    '',
    '- `character-reference.png`：没有人物参考图时才需要。',
    '- `scene-reference.png`：没有场景参考图时才需要。',
    ...draft.shotlist.map((shot) => `- \`${shot.shot_id}.png\`：${compactAction(shot.action)}`),
    '',
    '## 规则',
    '',
    '- 只放静态图，不放视频。',
    '- 文件名和 `deliverable.md` 的故事板图片清单保持一致。',
    '- 如果用户已经提供人物图，就优先锁定人物，不要重新发明脸。'
  ].join('\n')
}
