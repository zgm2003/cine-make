function modeName(mode) {
  return mode === 'visual' ? '出图模式' : '草稿模式'
}

function modeSummary(mode) {
  if (mode === 'visual') {
    return '出图模式：按分镜生成或准备生成角色参考、场景参考和故事板关键帧。'
  }
  return '草稿模式：只定故事、镜头和提示词，不生成图片。'
}

function generatedCharacterReferences(characters = []) {
  return characters.filter((character) => character?.reference_image)
}

function visualReferenceLines(contract, characters = []) {
  return [
    ...characterReferenceLines(contract, characters),
    ...sceneReferenceLines(contract),
    ...styleReferenceLines(contract)
  ]
}

function storyboardImageName(shot) {
  return `storyboard-images/${shot.shot_id}.png`
}

function hasProvidedCharacter(contract) {
  return Boolean(contract.visualReferences?.characterImages?.length)
}

function hasProvidedScene(contract) {
  return Boolean(contract.visualReferences?.sceneImages?.length)
}

function characterReferenceLines(contract, characters = []) {
  const paths = contract.visualReferences?.characterImages ?? []
  if (paths.length) {
    return paths.map((path) => `- 主角/人物参考图：\`${path}\``)
  }
  const generated = generatedCharacterReferences(characters)
  if (generated.length) {
    return generated.map((character) => `- 人物参考图（${character.identity_anchor}）：\`${character.reference_image}\``)
  }
  return ['- 主角/人物参考图：`storyboard-images/character-reference.png`']
}

function sceneReferenceLines(contract) {
  const paths = contract.visualReferences?.sceneImages ?? []
  if (paths.length) {
    return paths.map((path) => `- 场景图：\`${path}\``)
  }
  return ['- 场景图：`storyboard-images/scene-reference.png`']
}

function styleReferenceLines(contract) {
  const paths = contract.visualReferences?.styleImages ?? []
  return paths.map((path) => `- 风格参考图：\`${path}\``)
}

function segmentStartFrameName(segmentIndex) {
  if (segmentIndex === 0) return 'storyboard-images/segment-01-start.png'
  return segmentEndFrameName(segmentIndex - 1)
}

function segmentEndFrameName(segmentIndex) {
  return `storyboard-images/segment-${String(segmentIndex + 1).padStart(2, '0')}-end.png`
}

const MAX_VIDEO_SEGMENT_SECONDS = 15
const MAX_UPLOAD_IMAGES_PER_FEED_CARD = 9
const PACED_STORYBOARD_IMAGES_PER_FEED_CARD = 4
const MAX_VIDEO_SEGMENT_SHOTS = PACED_STORYBOARD_IMAGES_PER_FEED_CARD
const MIN_USEFUL_VIDEO_SEGMENT_SECONDS = 6

function maxStoryboardImagesPerSegment() {
  const fixedFrameCount = 2
  return Math.max(1, Math.min(PACED_STORYBOARD_IMAGES_PER_FEED_CARD, MAX_UPLOAD_IMAGES_PER_FEED_CARD - fixedFrameCount))
}

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
  return compactAction(shot.action).split('；源剧情：')[0].split('；空间调度：')[0]
}

function shotSourceNote(shot) {
  return compactAction(shot.action).split('；源剧情：')[1]
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
  const isEnterpriseDocumentary = contract.contentType === 'enterprise_documentary'
  const durationNote = contract.target.durationSource === 'script_paced_from_source'
    ? contract.target.requestedDurationSeconds
      ? `用户给了 ${contract.target.requestedDurationSeconds}s，但这段剧本自然节奏是 ${contract.target.durationSeconds}s；不新增剧情、不灌水拉长`
      : `按剧本自然密度拆成 ${contract.target.durationSeconds}s；不新增剧情、不删剧情`
    : contract.target.durationSource === 'explicit'
      ? `按用户指定的 ${contract.target.durationSeconds}s`
      : `按剧情密度自动拆成 ${contract.target.durationSeconds}s`

  return [
    isEnterpriseDocumentary
      ? `我们在做什么：把原始纪实/企业稿做成一个 ${contract.target.durationSeconds}s、${contract.target.aspectRatio}、${contract.target.style} 的竖屏 AI 主题短片草稿；${durationNote}，抓精神主线，不机械铺完整原文。`
      : `我们在做什么：把原始故事做成一个 ${contract.target.durationSeconds}s、${contract.target.aspectRatio}、${contract.target.style} 的竖屏 AI 短剧方案；${durationNote}，完整保留剧情，每波按视频工具上限拆成 15s 以内投喂段。`,
    '',
    isEnterpriseDocumentary
      ? `成片一句话：${subject}从“${shotPurpose(firstShot)}”进入主题，最后落到“${shotPurpose(lastShot)}”的传承画面上。`
      : `成片一句话：${subject}从“${shotPurpose(firstShot)}”进入故事，最后停在“${shotPurpose(lastShot)}”的悬念点上。`,
    '',
    '你先看这个部分判断故事方向；认可后再看分镜和图片提示词。'
  ]
}

function composeStoryFlow({ contract, shotlist }) {
  const labels = contract.contentType === 'enterprise_documentary'
    ? ['记忆钩子', '入厂锻造', '创业溯源', '攻坚突破', '传承收束']
    : contract.contentType === 'cultivation_transmigration'
      ? ['坊市传言', '魂穿判定', '机缘堵死', '筑基焦虑', '导航反转']
      : ['开场', '异常出现', '真相靠近', '情绪推进', '悬念收束']
  return pickStoryFlowShots(shotlist).map((shot, index) => {
    return `${index + 1}. ${labels[index] ?? '剧情节点'}：${shotPurpose(shot)}`
  })
}

function composeShotTable(shotlist) {
  return [
    '| 镜头 | 时长 | 景别 | 焦段 | 运镜 | 空间调度 | 画面动作 | 故事板图 |',
    '| --- | ---: | --- | --- | --- | --- | --- | --- |',
    ...shotlist.map((shot) => {
      const sourceNote = shotSourceNote(shot)
      const action = sourceNote ? `${shotPurpose(shot)}；素材节点：${sourceNote}` : compactAction(shot.action)
      const blocking = compactAction(shot.blocking ?? '按上一镜头位置连续调度')
      return `| ${shot.shot_id} | ${shot.duration_seconds}s | ${shot.shot_size} | ${shot.lens ?? '按分镜镜头'} | ${shot.camera_movement} | ${blocking} | ${action} | \`${storyboardImageName(shot)}\` |`
    })
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

function composeAIStoryboard(shotlist) {
  return shotlist.flatMap((shot) => [
    `### ${shot.shot_id}｜${shot.duration_seconds}s｜AI_VIDEO_STORYBOARD`,
    '',
    `- 画面任务：${compactAction(shot.action)}`,
    `- 镜头语言：${shot.video_prompt_note}`,
    `- 景别：${shot.shot_size}`,
    `- 焦段：${shot.lens ?? '按同一镜头系统延续'}`,
    `- 运镜：${shot.camera_movement}`,
    `- 构图：${compactAction(shot.composition)}`,
    `- 调度：${compactAction(shot.blocking ?? '主体动作从上一镜头自然延续，不突然换位')}`,
    `- 表演：${compactAction(shot.performance_detail)}`,
    `- 光影：${compactAction(shot.lighting)}`,
    `- 连续性：${compactAction(shot.continuity_from_previous)}`,
    '- 禁止：字幕、水印、跳剪、突然换脸、换服装、乱加角色、乱加道具、恐怖怪物化、脱离本镜头剧情',
    ''
  ])
}

function composeImageAssetQueue({ contract, shotlist, characters = [] }) {
  const segments = segmentShots(shotlist, { maxShots: maxStoryboardImagesPerSegment(contract) })
  const lines = [
    ...characterReferenceLines(contract, characters),
    ...sceneReferenceLines(contract),
    ...styleReferenceLines(contract)
  ]

  for (const [segmentIndex, segment] of segments.entries()) {
    const startFrame = segmentStartFrameName(segmentIndex)
    const endFrame = segmentEndFrameName(segmentIndex)
    const bridge = segmentIndex === 0 ? '' : '（上一段尾帧 = 本段首帧，不另造新首帧）'

    lines.push(`- 第 ${segmentIndex + 1} 段首帧：\`${startFrame}\`${bridge}`)
    lines.push(...segment.map((shot) => `- AI分镜关键帧：\`${storyboardImageName(shot)}\`（${shot.shot_id}）`))
    lines.push(`- 第 ${segmentIndex + 1} 段尾帧：\`${endFrame}\``)
  }

  return lines
}

function composeReferencePromptList({ contract, characters = [] }) {
  const lines = []

  if (!hasProvidedCharacter(contract)) {
    const generated = generatedCharacterReferences(characters)
    if (generated.length) {
      for (const character of generated) {
        lines.push(
          `### ${character.identity_anchor}角色定妆照 -> ${character.reference_image}`,
          '',
          character.reference_prompt,
          ''
        )
      }
    } else {
      lines.push(
        '### 主角参考图 -> storyboard-images/character-reference.png',
        '',
        '超写实真人电影质感角色设定图，白底，85mm镜头，4K，角色一致性强。版式：左侧大幅半身/头像特写，右侧三视小图：正面、侧面、背面。显示人物名称和身高，展示核心道具，不显示年龄。同一张脸、同一发型、同一体型、同一服装，毛孔清晰可见，复杂服装刺绣和材质细节清楚。无水印，无字幕，无海报字，无多余人物。',
        ''
      )
    }
  }

  if (!hasProvidedScene(contract)) {
    lines.push(
      '### 场景图 -> storyboard-images/scene-reference.png',
      '',
      '超写实真人电影质感场景参考图，4K，固定一个可复用电影空间，明确空间结构、实景光源、材质、景深和空气透视；不要字幕、水印、海报字或多余人物。',
      ''
    )
  }

  return lines
}

function visualUploadLines(contract, characters = []) {
  return [
    ...characterReferenceLines(contract, characters),
    ...sceneReferenceLines(contract),
    ...styleReferenceLines(contract)
  ]
}

function segmentCharacterReferenceLines({ contract, segment, characters = [] }) {
  if (contract.visualReferences?.characterImages?.length) return characterReferenceLines(contract, characters)
  const generated = generatedCharacterReferences(characters)
  if (!generated.length) return characterReferenceLines(contract, characters)

  const names = segmentCharacterNames({ segment, characters: generated })

  return generated
    .filter((character) => names.includes(character.identity_anchor))
    .map((character) => `- 人物参考图（${character.identity_anchor}）：\`${character.reference_image}\``)
}

function segmentCharacterNames({ segment, characters = [] }) {
  const names = []
  for (const shot of segment) {
    for (const name of shot.characters ?? []) {
      if (!names.includes(name)) names.push(name)
    }
    for (const character of characters) {
      if (compactAction(shot.action).includes(character.identity_anchor) && !names.includes(character.identity_anchor)) {
        names.push(character.identity_anchor)
      }
    }
  }
  if (!names.length && characters[0]) names.push(characters[0].identity_anchor)
  return names
}

function segmentUploadLines({ contract, segment, characters = [] }) {
  const availableReferenceSlots = Math.max(0, MAX_UPLOAD_IMAGES_PER_FEED_CARD - 2 - segment.length)
  const referenceLines = [
    ...segmentCharacterReferenceLines({ contract, segment, characters }),
    ...sceneReferenceLines(contract),
    ...styleReferenceLines(contract)
  ]
  return referenceLines.slice(0, availableReferenceSlots)
}

function composeTimeline(segment) {
  let cursor = 0
  return segment.map((shot) => {
    const seconds = Number(shot.duration_seconds) || 1
    const start = cursor
    const end = cursor + seconds
    cursor = end
    return `${formatTimecode(start)}-${formatTimecode(end)}｜${shot.shot_id}｜景别：${shot.shot_size}｜焦段：${shot.lens ?? 'same lens system'}｜运镜：${shot.camera_movement}｜构图：${compactAction(shot.composition)}｜调度：${compactAction(shot.blocking ?? '主体动作连续')}｜画面：${compactAction(shot.action)}｜表演：${compactAction(shot.performance_detail)}`
  })
}

function dynamicExpression(shot) {
  const performance = compactAction(shot.performance_detail)
  if (/恐惧|fear|惊|僵|发紧|迟疑/u.test(performance)) return '眼神先停住，呼吸变短，指尖收紧'
  if (/旧记忆|grief|伤|记忆/u.test(performance)) return '眼眶压住情绪，嘴角轻收，视线慢半拍落到关键物'
  if (/邀请|决定|选择|crossing/u.test(performance)) return '下颌收紧，视线先确认关键物，再看向通道'
  return '表情克制，眉眼和手部先于身体动作泄露情绪'
}

function secondaryAnimation(shot) {
  const action = compactAction(shot.action)
  if (/手|指|触碰|放下|关键物|弹珠|车票|照片/u.test(action)) return '手指轻颤，关键物轻微晃动，动作完成后短暂停住'
  if (/走|进入|迈|靠近|后退/u.test(action)) return '脚步带动衣摆和肩线回弹，身体重心连续移动'
  if (/抬头|看|听|声音|信号/u.test(action)) return '呼吸带动胸口微起伏，眼神焦点缓慢转移'
  return '衣角、发梢或道具做小幅连带运动，避免夸张变形'
}

function formatSeconds(value) {
  return Number(value).toFixed(1).replace(/\.0$/, '')
}

function composeVideoBeatLine({ shot, startSecond }) {
  const shotDuration = Number(shot.duration_seconds) || 1
  const firstTurn = startSecond + shotDuration * 0.35
  const secondTurn = startSecond + shotDuration * 0.68
  const endSecond = startSecond + shotDuration

  if (shotDuration <= 2) {
    return `${shot.shot_id}（${formatSeconds(startSecond)}-${formatSeconds(endSecond)}s）：${shotPurpose(shot)}；运镜 ${shot.camera_movement}；表情 ${dynamicExpression(shot)}；二级动画 ${secondaryAnimation(shot)}。`
  }

  return [
    `${shot.shot_id}（${formatSeconds(startSecond)}-${formatSeconds(firstTurn)}s）：起幅稳定，锁定主体位置和${shot.lens ?? '同一镜头系统'}，不要提前泄露下一镜。`,
    `（${formatSeconds(firstTurn)}-${formatSeconds(secondTurn)}s）：${shotPurpose(shot)}；主运动清楚，表情 ${dynamicExpression(shot)}。`,
    `（${formatSeconds(secondTurn)}-${formatSeconds(endSecond)}s）：二级动画 ${secondaryAnimation(shot)}；焦点按主体、关键物、异常信号顺序收束，尾帧可接下一段。`
  ].join('')
}

function composeCharacterLockSentence({ segment, mainCharacter, characters = [] }) {
  const generated = generatedCharacterReferences(characters)
  const names = segmentCharacterNames({ segment, characters: generated })
  const locked = generated.filter((character) => names.includes(character.identity_anchor))
  if (locked.length) {
    const namesText = locked.map((character) => character.identity_anchor).join('、')
    const detailText = locked
      .map((character) => `${character.identity_anchor}保持${character.costume_anchor}，保留${character.prop_anchor}`)
      .join('；')
    return `锁定角色：${namesText}。${detailText}。同一张脸、发型、体型、服装材质和道具不要漂移。`
  }

  const subject = mainCharacter?.identity_anchor ?? segment[0]?.subject ?? '主角'
  const costume = mainCharacter?.costume_anchor ?? '同一套服装'
  const prop = mainCharacter?.prop_anchor ?? '关键道具'
  return `锁定角色：${subject}。保持同一张脸、发型、体型和服装（${costume}），保留${prop}。`
}

function composeVideoPrompt({ contract, segment, mainCharacter, segmentIndex, characters = [] }) {
  const duration = segmentDuration(segment)
  const shotIds = segment.map((shot) => shot.shot_id).join(' -> ')
  const actions = segment.map((shot) => `${shot.shot_id} ${shotPurpose(shot)}`).join('；')
  const cameraLanguage = [...new Set(segment.map((shot) => `${shot.shot_size}/${shot.lens ?? '同一镜头系统'}/${shot.camera_movement}`))].join('；')
  let cursor = 0
  const beatLines = segment.map((shot) => {
    const line = composeVideoBeatLine({ shot, startSecond: cursor })
    cursor += Number(shot.duration_seconds) || 1
    return line
  }).join('')

  return [
    `${duration}s / ${contract.target.aspectRatio} / ${contract.target.style}。按精简分镜顺序生成 ${shotIds}：${actions}。`,
    composeCharacterLockSentence({ segment, mainCharacter, characters }),
    `镜头按分镜执行：${cameraLanguage}。只表现本段剧情，不跳过、不合并、不串到其他段。`,
    beatLines,
    '不要字幕、水印、跳剪、突然换脸、换服装、乱加角色、乱加道具或超出剧情。'
  ].join('')
}

function composeVideoFeedPack({ contract, shotlist, mainCharacter, characters = [] }) {
  const mode = contract.mode ?? 'draft'
  return segmentShots(shotlist, { maxShots: maxStoryboardImagesPerSegment(contract) }).flatMap((segment, index) => {
    const duration = segmentDuration(segment)
    const startFrame = segmentStartFrameName(index)
    const endFrame = segmentEndFrameName(index)
    const bridgeLine = index === 0 ? '本段使用独立首帧。' : '上一段尾帧 = 本段首帧。'
    const uploadLines = [
      ...segmentUploadLines({ contract, segment, characters }),
      `- 起始帧：\`${startFrame}\``,
      ...segment.map((shot) => `- \`${storyboardImageName(shot)}\``),
      `- 尾帧：\`${endFrame}\``
    ]
    return [
      `### 第 ${index + 1} 段：${segmentLabel(segment)}（${duration}s，上传图片 ${uploadLines.length} 张）`,
      '',
      bridgeLine,
      '',
      `起始帧：\`${startFrame}\``,
      `尾帧：\`${endFrame}\``,
      '',
      '上传图片：',
      '',
      ...uploadLines,
      '',
      '复制提示词：',
      '',
      composeVideoPrompt({ contract, segment, mainCharacter, segmentIndex: index, characters }),
      '',
      mode === 'draft'
        ? '状态：草稿模式先不要上传；等出图模式生成这些图片后再用这一段。'
        : '状态：出图模式；如果这些图片已在 `storyboard-images/` 里，就可以上传到视频工具。',
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
    'Codex 不生成最终视频；最终 MP4 由即梦合成。',
    '',
    '## 成片预览',
    '',
    ...composeFilmPreview({ contract, draft, mainCharacter }),
    '',
    '## 故事全流程',
    '',
    ...composeStoryFlow({ contract, shotlist: draft.shotlist }),
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
    '## 出图清单',
    '',
    mode === 'visual'
      ? `按这个清单用 Codex \`$imagegen\` 补齐静态图；每段默认 ${PACED_STORYBOARD_IMAGES_PER_FEED_CARD} 个分镜关键帧，每段上传图片最多 ${MAX_UPLOAD_IMAGES_PER_FEED_CARD} 张；角色图、场景图、首帧、分镜关键帧、尾帧都算图片。`
      : `草稿模式只准备文件位和提示词，不生成图片；进入出图模式后按同一清单生成。每段默认 ${PACED_STORYBOARD_IMAGES_PER_FEED_CARD} 个分镜关键帧，每段上传图片最多 ${MAX_UPLOAD_IMAGES_PER_FEED_CARD} 张；角色图、场景图、首帧、分镜关键帧、尾帧都算图片。`,
    '',
    ...composeImageAssetQueue({ contract, shotlist: draft.shotlist, characters: draft.characters }),
    ...(mode === 'visual' ? [
      '',
      '## 参考图提示词',
      '',
      ...composeReferencePromptList({ contract, characters: draft.characters })
    ] : []),
    '',
    '## 视频工具投喂包',
    '',
    `按即梦单次生成上限处理：每段最多 ${MAX_VIDEO_SEGMENT_SECONDS}s；默认每段约 ${PACED_STORYBOARD_IMAGES_PER_FEED_CARD} 个分镜关键帧，给运镜和表演留时间；上传图片控制在 ${MAX_UPLOAD_IMAGES_PER_FEED_CARD} 张以内。总片长 ${contract.target.durationSeconds}s 会自动拆成多个片段，最后再剪到一起。`,
    '',
    '到即梦里，每一段只做两件事：',
    '',
    '1. 上传这一段列出的图片；',
    '2. 复制这一段的提示词。',
    '',
    mode === 'draft'
      ? '当前是草稿模式：这里只告诉你之后该怎么投喂；先不要生成图片、不要投喂视频工具。'
      : '当前是出图模式：按下面分段上传图片并复制提示词。',
    '',
    ...composeVideoFeedPack({ contract, shotlist: draft.shotlist, mainCharacter, characters: draft.characters }),
    '## 视觉参考',
    '',
    ...visualReferenceLines(contract, draft.characters),
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
  const queue = composeImageAssetQueue({ contract, shotlist: draft.shotlist, characters: draft.characters })

  return [
    '# Storyboard images',
    '',
    `当前模式：${modeName(mode)}。`,
    mode === 'visual'
      ? '这里是出图模式的图片生成队列。'
      : '草稿模式不生成图片，只保留后续出图模式所需的文件名和提示词。',
    '',
    '## 用户参考图',
    '',
    ...visualReferenceLines(contract, draft.characters),
    '',
    '## 建议生成顺序',
    '',
    ...queue,
    '',
    '## AI分镜提示词索引',
    '',
    ...draft.shotlist.map((shot) => `- \`${storyboardImageName(shot)}\`：${shot.shot_size} / ${shot.lens ?? 'same lens system'} / ${shot.camera_movement} / ${compactAction(shot.action)}`),
    '',
    '## 规则',
    '',
    '- 只放静态图，不放视频。',
    '- 文件名和 `deliverable.md` 的出图清单保持一致。',
    '- 如果用户已经提供人物图，就优先锁定人物，不要重新发明脸。'
  ].join('\n')
}
