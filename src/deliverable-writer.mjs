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

const MAX_VIDEO_SEGMENT_SECONDS = 15
const MAX_VIDEO_SEGMENT_SHOTS = 5
const MIN_USEFUL_VIDEO_SEGMENT_SECONDS = 6

function balanceTailSegment(segments, { maxSeconds, maxShots, minSeconds = MIN_USEFUL_VIDEO_SEGMENT_SECONDS }) {
  if (segments.length < 2) return segments

  const last = segments[segments.length - 1]
  const previous = segments[segments.length - 2]

  while (segmentDuration(last) < minSeconds && previous.length > 1) {
    const candidate = previous[previous.length - 1]
    const candidateSeconds = Number(candidate.duration_seconds) || 1
    if (segmentDuration(last) + candidateSeconds > maxSeconds) break
    if (last.length + 1 > maxShots) break
    last.unshift(previous.pop())
  }

  return segments.filter((segment) => segment.length)
}

function segmentShots(shotlist, { maxSeconds = MAX_VIDEO_SEGMENT_SECONDS, maxShots = MAX_VIDEO_SEGMENT_SHOTS } = {}) {
  const segments = []
  let current = []
  let currentSeconds = 0

  for (const shot of shotlist) {
    const seconds = Number(shot.duration_seconds) || 1

    if (current.length && (currentSeconds + seconds > maxSeconds || current.length >= maxShots)) {
      segments.push(current)
      current = []
      currentSeconds = 0
    }

    current.push(shot)
    currentSeconds += seconds

    if (currentSeconds >= maxSeconds) {
      segments.push(current)
      current = []
      currentSeconds = 0
    }
  }

  if (current.length) segments.push(current)
  return balanceTailSegment(segments, { maxSeconds, maxShots })
}

function segmentDuration(segment) {
  return segment.reduce((total, shot) => total + (Number(shot.duration_seconds) || 1), 0)
}

function segmentLabel(segment) {
  const first = segment[0].shot_id
  const last = segment[segment.length - 1].shot_id
  return first === last ? first : `${first}-${last}`
}

function formatTimecode(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${rest}`
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
    `我们在做什么：把原始故事压成一个 ${contract.target.durationSeconds}s、${contract.target.aspectRatio}、${contract.target.style} 的竖屏 AI 漫剧方案。`,
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

function visualUploadLines(contract) {
  const visual = contract.visualReferences ?? {}
  const lines = []

  for (const path of visual.characterImages ?? []) lines.push(`- 人物参考图：\`${path}\``)
  for (const path of visual.sceneImages ?? []) lines.push(`- 场景参考图：\`${path}\``)
  for (const path of visual.styleImages ?? []) lines.push(`- 风格参考图：\`${path}\``)

  if (!(visual.characterImages ?? []).length) {
    lines.push('- 人物参考图：`storyboard-images/character-reference.png`（没有用户人物图时，视觉包阶段先生成/补齐）')
  }

  if (!(visual.sceneImages ?? []).length) {
    lines.push('- 场景参考图：`storyboard-images/scene-reference.png`（没有用户场景图时可选生成）')
  }

  return lines
}

function composeTimeline(segment) {
  let cursor = 0
  return segment.map((shot) => {
    const seconds = Number(shot.duration_seconds) || 1
    const start = cursor
    const end = cursor + seconds
    cursor = end
    return `${formatTimecode(start)}-${formatTimecode(end)}｜${shot.shot_id}｜景别：${shot.shot_size}｜运镜：${shot.camera_movement}｜画面：${compactAction(shot.action)}｜表演：${compactAction(shot.performance_detail)}`
  })
}

function composeVideoPrompt({ contract, segment, mainCharacter }) {
  const subject = mainCharacter?.identity_anchor ?? segment[0]?.subject ?? '主角'
  const costume = mainCharacter?.costume_anchor ?? '同一套服装'
  const prop = mainCharacter?.prop_anchor ?? '关键道具'
  const duration = segmentDuration(segment)
  const cameraLanguage = [...new Set(segment.map((shot) => shot.camera_movement))].join('；')
  const lighting = [...new Set(segment.map((shot) => shot.lighting))].join('；')
  const continuity = segment.map((shot) => `${shot.shot_id}：${shot.continuity_from_previous}`).join('；')

  return [
    `FORMAT：${duration}s / ${contract.target.aspectRatio} / ${contract.target.style} / multi-shot cinematic sequence`,
    '',
    `主体锁定：保持${subject}同一张脸、发型和体型；服装锚点：${costume}；道具锚点：${prop}；不要重新设计人物，不要新增无关角色。`,
    '',
    '时间线：',
    ...composeTimeline(segment),
    '',
    `镜头语言：${cameraLanguage}。动作要克制、连续，镜头只做分镜里指定的缓慢运动和自然转场。`,
    `光影/美术：${lighting}。保持同一场景方向、冷暖关系、阴影位置和画面质感。`,
    `连续性：${continuity}。关键帧图片只负责视觉锚定，视频模型只负责运动、镜头、雾气/灯光/微表情。`,
    '',
    '禁止：不要字幕、不要水印、不要跳剪、不要突然换脸、不要换服装、不要新增道具、不要把悬疑做成夸张恐怖片、不要超出本段剧情。'
  ].join('\n')
}

function composeVideoFeedPack({ contract, shotlist, mainCharacter }) {
  const mode = contract.mode ?? 'draft'
  return segmentShots(shotlist).flatMap((segment, index) => {
    const duration = segmentDuration(segment)
    return [
      `### 第 ${index + 1} 段：${segmentLabel(segment)}（${duration}s，单次生成不超过 ${MAX_VIDEO_SEGMENT_SECONDS}s / ${MAX_VIDEO_SEGMENT_SHOTS} 个镜头）`,
      '',
      '上传图片：',
      '',
      ...visualUploadLines(contract),
      ...segment.map((shot) => `- \`${storyboardImageName(shot)}\``),
      '',
      '复制提示词：',
      '',
      '```text',
      composeVideoPrompt({ contract, segment, mainCharacter }),
      '```',
      '',
      mode === 'draft'
        ? '状态：草稿模式先不要上传；等视觉包生成这些图片后再用这一段。'
        : '状态：视觉包模式；如果这些图片已在 `storyboard-images/` 里，就可以上传到视频工具。',
      ''
    ]
  })
}

export function composeDeliverable({ contract, draft }) {
  const mode = contract.mode ?? 'draft'
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
    '## 成片预览',
    '',
    ...composeFilmPreview({ contract, draft, mainCharacter }),
    '',
    '## 故事全流程',
    '',
    ...composeStoryFlow(draft.shotlist),
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
    ...composeShotTable(draft.shotlist),
    '',
    '## 故事板图片清单',
    '',
    mode === 'visual'
      ? '视觉包模式下，按下面顺序生成或补齐图片。'
      : '草稿模式下这里只准备提示词，不生成图片；确认方案后再跑视觉包模式。',
    '',
    ...composeImagePromptList(draft.shotlist),
    '## 视频工具投喂包',
    '',
    `按外部 AI 视频工具单次生成上限处理：每段最多 ${MAX_VIDEO_SEGMENT_SECONDS}s，且默认不超过 ${MAX_VIDEO_SEGMENT_SHOTS} 个镜头。30 秒成片会自动拆成多个片段，最后再剪到一起。`,
    '',
    '到 AI 视频工具里，每一段只做两件事：',
    '',
    '1. 上传这一段列出的图片；',
    '2. 复制这一段的提示词。',
    '',
    mode === 'draft'
      ? '当前是草稿模式：这里只告诉你之后该怎么投喂；先不要生成图片、不要投喂视频工具。'
      : '当前是视觉包模式：按下面分段上传图片并复制提示词。',
    '',
    ...composeVideoFeedPack({ contract, shotlist: draft.shotlist, mainCharacter }),
    '## 视觉参考',
    '',
    ...visualReferenceLines(contract),
    '',
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
