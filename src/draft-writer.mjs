const SHOT_BLUEPRINTS = [
  {
    label: 'threshold call',
    purpose: '注意到不该出现的信号，在越过边界前停住',
    performance: '克制的迟疑；握住关键物的手指收紧',
    shotSize: 'wide establishing shot',
    lens: '24mm controlled wide lens',
    camera: 'slow push toward the threshold',
    composition: '主体压在下三分之一，入口或信号居中形成压迫性负空间',
    blocking: '主体先停住不跨线，手机或关键物压低在胸前'
  },
  {
    label: 'object wound',
    purpose: '查看把当下和旧伤连接起来的关键物',
    performance: '手指压得过紧；呼吸变短但表情仍然收住',
    shotSize: 'macro insert',
    lens: '85mm macro lens',
    camera: 'locked macro frame',
    composition: '关键物占据画面中心，主体指尖从边缘进入，背景只保留场景色块',
    blocking: '主体不说话，只用手指和停顿完成信息确认'
  },
  {
    label: 'entry',
    purpose: '从普通空间进入禁区',
    performance: '走得很慢，但不回头',
    shotSize: 'medium back shot',
    lens: '35mm natural perspective lens',
    camera: 'tracking behind the subject',
    composition: '主体背影挡住一半入口，画面前景保留雨水或门框遮挡',
    blocking: '主体肩膀先进画，脚步跨过边界后仍然保持犹豫'
  },
  {
    label: 'world reveal',
    purpose: '进入主体空间，意识到它重新活了过来',
    performance: '肩膀微沉，旧记忆变成可触摸的现实',
    shotSize: 'wide environmental shot',
    lens: '28mm controlled wide lens',
    camera: 'slow lateral slide',
    composition: '空间纵深从主体身侧展开，异常光源切出一条明确通道',
    blocking: '主体走到画面边缘停下，让场景自己占据主导'
  },
  {
    label: 'identity detail',
    purpose: '触碰过去的职业或私人锚点',
    performance: '手在落下前悬停半秒',
    shotSize: 'medium close-up',
    lens: '50mm intimate lens',
    camera: 'small push-in',
    composition: '人物半身和锚点同框，锚点在前景虚化后慢慢清晰',
    blocking: '主体伸手到一半停住，视线先落在锚点再落回空间'
  },
  {
    label: 'sound trigger',
    purpose: '听见不该存在的声音、信号或记忆',
    performance: '身体先僵住，脸部反应随后才出现',
    shotSize: 'insert shot',
    lens: '65mm detail lens',
    camera: 'locked frame with subtle vibration',
    composition: '声源物体在画面一侧，另一侧留出空白等待声音进入',
    blocking: '主体不立刻转头，先用肩颈僵硬表现听见'
  },
  {
    label: 'reaction',
    purpose: '消化这个不可能的信息',
    performance: '眼眶发紧但不崩溃；嘴角压住情绪',
    shotSize: 'tight close-up',
    lens: '75mm portrait lens',
    camera: 'slow eye-level push-in',
    composition: '眼睛位于上三分之一，背景异常光保持同方向不漂移',
    blocking: '主体只后退半步，身体仍朝向异常源'
  },
  {
    label: 'approach',
    purpose: '环境开始向主体逼近或开启',
    performance: '脚没有后退，反而停在边界线上',
    shotSize: 'low angle shot',
    lens: '32mm low perspective lens',
    camera: 'push along the floor line',
    composition: '地面线条把视线推向主体脚边，异常源从远端逼近',
    blocking: '主体脚尖不离开画面中的边界线，关键物保持可见'
  },
  {
    label: 'reveal',
    purpose: '不可能的载具、门、人物或通道显形',
    performance: '关键物在手里轻微颤动',
    shotSize: 'wide reveal shot',
    lens: '24mm reveal lens',
    camera: 'slow dolly backward',
    composition: '显形物居中，主体偏侧形成尺度对比，保留可剪接的稳定画面',
    blocking: '主体被迫后撤半步但不转身逃跑'
  },
  {
    label: 'reflection',
    purpose: '只通过倒影或剪影看到失去的人或真相',
    performance: '朝影像转头，却说不出话',
    shotSize: 'reflection close-up',
    lens: '50mm reflection lens',
    camera: 'parallel slide',
    composition: '真实主体和倒影分在左右两侧，倒影更亮但不完全露脸',
    blocking: '主体转头动作慢半拍，倒影先出现，真人后反应'
  },
  {
    label: 'invitation',
    purpose: '门、开口或路径刚好对准主体',
    performance: '决定前低头看了一眼关键物',
    shotSize: 'symmetrical medium shot',
    lens: '40mm balanced lens',
    camera: 'locked frontal frame',
    composition: '门缝或通道严格居中，主体站在中轴线外一点点',
    blocking: '主体先看关键物，再把身体摆正面对通道'
  },
  {
    label: 'memory object',
    purpose: '发现证明旧连接真实存在的小物件',
    performance: '手伸出去，却停在触碰之前',
    shotSize: 'insert-medium hybrid',
    lens: '60mm object-memory lens',
    camera: 'slow push toward the object',
    composition: '物件占前景三分之一，主体脸部只在背景保留压低的轮廓',
    blocking: '主体手停在物件上方，直到下一镜头才做选择'
  },
  {
    label: 'threshold decision',
    purpose: '把关键物放到边界处',
    performance: '一只脚悬在留下和离开之间',
    shotSize: 'low close-up',
    lens: '35mm ground-level lens',
    camera: 'tilt from object to foot',
    composition: '关键物和鞋尖同框，边界线横切画面下方',
    blocking: '主体先放下关键物，再让脚停在边界上，不立刻迈过'
  },
  {
    label: 'answer waits',
    purpose: '失去的人或最终信号伸出邀请，但不强迫',
    performance: '邀请停在光里等待，不抓取主体',
    shotSize: 'long lens interior shot',
    lens: '100mm compressed long lens',
    camera: 'slow rack focus',
    composition: '邀请者或信号在远端光里，主体前景轮廓压暗',
    blocking: '远端只伸手或亮起，不主动靠近主体'
  },
  {
    label: 'unresolved crossing',
    purpose: '半步踏入不可能的空间',
    performance: '恐惧还在，但身体已经向前选择',
    shotSize: 'wide final frame',
    lens: '28mm final tableau lens',
    camera: 'slow pull-back',
    composition: '主体、通道、关键物形成三角构图，留下可接下一段的开放空间',
    blocking: '主体只迈半步，尾帧冻结在可继续动作的位置'
  }
]

function stripSourcePrefix(sourceText) {
  return sourceText.replace(/^(小说片段|粗剧本|广告短片|广告文案|剧情|剧本)[:：]\s*/u, '').trim()
}

function splitBeats(sourceText) {
  const cleaned = stripSourcePrefix(sourceText)
  const beats = cleaned
    .split(/[。！？!?；;]\s*/u)
    .map((part) => part.trim())
    .filter(Boolean)
  return beats.length ? beats : [cleaned]
}

function firstMatch(text, patterns, fallback) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1] || match[0]
  }
  return fallback
}

function inferAnchors(contract) {
  const text = stripSourcePrefix(contract.sourceText)
  const protagonist = firstMatch(text, [
    /((?:退役|前)?(?:潜水员|外卖骑手|外卖员|列车调度员|调度员|医生|记者|画家|警探|工程师|母亲|父亲)[\u4e00-\u9fa5]{1,4})(?=接|送|回|走|来到|收到|发现|站|进入|沿|看|听|推|把|伸|在|，|。|$)/u,
    /(女孩|男孩|女人|男人|母亲|父亲|老人|孩子)/u
  ], 'main subject')

  const lostFigure = firstMatch(text, [
    /(妹妹|哥哥|姐姐|弟弟|女儿|儿子|母亲|父亲|恋人|妻子|丈夫|朋友)/u,
    /(女孩影子|男孩影子|人影|影子)/u
  ], 'lost figure')

  const keyObject = firstMatch(text, [
    /(红色弹珠|弹珠|纸质车票|车票|蓝鲸|画纸|红围巾|信号灯|黑伞|照片|录音带|钥匙|戒指)/u,
    /(一张[\u4e00-\u9fa5]{1,8}|一盏[\u4e00-\u9fa5]{1,8}|一条[\u4e00-\u9fa5]{1,8})/u
  ], 'key object')

  const location = firstMatch(text, [
    /(废弃医院|护士站|废弃海洋馆|旧地铁站|废弃地铁站|站台|巷口|医院走廊|医院|旧影院|灯塔|车站|海边|隧道|水箱)/u
  ], 'liminal location')

  const impossibleSign = firstMatch(text, [
    /(不存在的13楼|13楼|电梯|绿色信号灯|鲸鱼的低鸣|鲸鱼低鸣|报站声|深海光|没有司机的银色列车|黑伞|广播)/u
  ], 'impossible signal')

  return {
    protagonist,
    lostFigure,
    keyObject,
    location,
    impossibleSign,
    visualStyle: contract.target.style,
    aspectRatio: contract.target.aspectRatio
  }
}

function distributeDurations(totalSeconds, count) {
  const segmentCount = Math.max(1, Math.ceil(totalSeconds / 15))
  const shotsPerSegment = Math.ceil(count / segmentCount)
  const durations = []
  let remainingShots = count
  let remainingSeconds = totalSeconds

  for (let segmentIndex = 0; segmentIndex < segmentCount && remainingShots > 0; segmentIndex += 1) {
    const shotsInSegment = Math.min(shotsPerSegment, remainingShots)
    const segmentSeconds = segmentIndex === segmentCount - 1
      ? remainingSeconds
      : Math.min(15, remainingSeconds - Math.max(0, segmentCount - segmentIndex - 1))
    const base = Math.floor(segmentSeconds / shotsInSegment)
    let remainder = segmentSeconds - base * shotsInSegment

    for (let index = 0; index < shotsInSegment; index += 1) {
      const extra = remainder > 0 ? 1 : 0
      remainder -= extra
      durations.push(Math.max(1, base + extra))
    }

    remainingShots -= shotsInSegment
    remainingSeconds -= segmentSeconds
  }

  return durations
}

function shotId(index) {
  return `S${String(index + 1).padStart(2, '0')}`
}

function visibleBeat(beats, index) {
  return beats[index % beats.length]
}

function selectBlueprints(count) {
  if (count === 7) return [0, 1, 3, 6, 8, 9, 12].map((index) => SHOT_BLUEPRINTS[index])
  if (count === 14) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14].map((index) => SHOT_BLUEPRINTS[index])
  return Array.from({ length: count }, (_, index) => SHOT_BLUEPRINTS[Math.floor(index * SHOT_BLUEPRINTS.length / count)])
}

function composeImagePrompt({ anchors, blueprint, action, index }) {
  return [
    `${anchors.visualStyle} AI-video storyboard keyframe, single still image`,
    `${anchors.protagonist} in ${anchors.location}`,
    `visible action: ${action}`,
    `key object: ${anchors.keyObject}`,
    `impossible sign: ${anchors.impossibleSign}`,
    `shot size: ${blueprint.shotSize}`,
    `lens: ${blueprint.lens}`,
    `camera language: ${blueprint.camera}`,
    `composition: ${blueprint.composition}`,
    `blocking: ${blueprint.blocking}`,
    `performance: ${blueprint.performance}`,
    `continuity anchor with ${anchors.lostFigure}`,
    `vertical ${anchors.aspectRatio}`,
    'no text overlay',
    'no watermark',
    `shot ${shotId(index)} ${blueprint.label}`
  ].join(', ')
}

export function composeDraftAssets(contract) {
  const anchors = inferAnchors(contract)
  const beats = splitBeats(contract.sourceText)
  const count = contract.target.shotCount
  const durations = distributeDurations(contract.target.durationSeconds, count)
  const selectedBlueprints = selectBlueprints(count)

  const shotlist = selectedBlueprints.map((blueprint, index) => {
    const beat = visibleBeat(beats, index)
    const action = `${blueprint.purpose}；源剧情：${beat}`
    return {
      shot_id: shotId(index),
      duration_seconds: durations[index],
      scene: anchors.location,
      subject: index < Math.floor(count * 0.7) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`,
      action,
      performance_detail: blueprint.performance,
      shot_size: blueprint.shotSize,
      lens: blueprint.lens,
      camera_movement: blueprint.camera,
      composition: `${blueprint.composition}；${anchors.keyObject} 与 ${anchors.impossibleSign} 必须作为稳定视觉锚点`,
      blocking: blueprint.blocking,
      lighting: `${anchors.visualStyle}; motivated by the impossible sign and practical location light`,
      dialogue_or_voiceover: index === Math.floor(count / 2) ? `${anchors.lostFigure}的声音或信号进入场景。` : '',
      image_prompt: composeImagePrompt({ anchors, blueprint, action, index }),
      continuity_from_previous: index === 0 ? 'opening shot' : `延续 ${shotId(index - 1)} 的 ${anchors.location}、${anchors.protagonist}、${anchors.keyObject} 和 ${anchors.impossibleSign}`,
      video_prompt_note: `external video tool should animate only subject motion, ${blueprint.camera}, atmosphere, and continuity-preserving transitions; keep ${blueprint.lens}`
    }
  })

  return {
    directorScript: composeDirectorScript({ contract, anchors, beats }),
    characters: composeCharacters(anchors),
    shotlist,
    storyboardBoard: composeStoryboardBoard(shotlist),
    storyboardPrompts: composeStoryboardPrompts({ anchors, shotlist }),
    referencePack: composeReferencePack({ contract, shotlist }),
    seedancePack: composeExternalPack({ platform: 'Seedance', contract, anchors, shotlist }),
    jimengPack: composeExternalPack({ platform: 'Jimeng', contract, anchors, shotlist }),
    continuityReview: composeContinuityReview({ anchors, shotlist })
  }
}

function composeDirectorScript({ contract, anchors, beats }) {
  const beatLines = beats.map((beat, index) => {
    return [
      `## Beat ${index + 1}`,
      '',
      `${beat}`,
      '',
      `导演处理：让${anchors.protagonist}始终具体地站在${anchors.location}里。围绕${anchors.keyObject}和${anchors.impossibleSign}把抽象信息变成可见动作。情绪转折必须通过呼吸、视线、手部紧张和走位读出来，不靠旁白解释。`
    ].join('\n')
  })

  return [
    '# Director script',
    '',
    '## Logline',
    '',
    `${anchors.protagonist}因${anchors.impossibleSign}进入${anchors.location}，一段与${anchors.lostFigure}有关的旧伤被重新打开。`,
    '',
    '## Director intent',
    '',
    `目标：${contract.target.durationSeconds}s，${contract.target.aspectRatio}，${contract.target.style}。整体要克制：异常现象是真实的，但表演必须落在人身上，不靠解释和大喊大叫。`,
    '',
    ...beatLines,
    '',
    '## Ending principle',
    '',
    `结束在“门槛选择”上。不要过度解释${anchors.lostFigure}，给外部视频合成保留悬念。`
  ].join('\n')
}

function composeCharacters(anchors) {
  return [
    {
      id: 'main_subject',
      role: 'main subject',
      identity_anchor: anchors.protagonist,
      costume_anchor: `固定服装与外观，符合${anchors.visualStyle}`,
      prop_anchor: anchors.keyObject,
      performance_anchor: 'controlled grief or fear, expressed through breath, eye line, hand tension, and restrained posture',
      continuity_notes: `Keep ${anchors.protagonist}, ${anchors.keyObject}, and the same physical silhouette stable across all shots.`
    },
    {
      id: 'lost_or_impossible_figure',
      role: 'memory, signal, or impossible invitation',
      identity_anchor: anchors.lostFigure,
      costume_anchor: 'keep partially hidden unless the source explicitly demands a reveal',
      prop_anchor: anchors.impossibleSign,
      performance_anchor: 'patient and quiet; never turns into random horror spectacle',
      continuity_notes: `Represent ${anchors.lostFigure} through voice, reflection, silhouette, object, or distant gesture before any full reveal.`
    }
  ]
}

function composeStoryboardBoard(shotlist) {
  return [
    '# Storyboard board',
    '',
    '| Shot | Image slot | Shot size | Lens | Camera | Purpose | Continuity anchor |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...shotlist.map((shot) => `| ${shot.shot_id} | \`storyboard-images/${shot.shot_id}.png\` | ${shot.shot_size} | ${shot.lens} | ${shot.camera_movement} | ${shot.action} | ${shot.continuity_from_previous} |`)
  ].join('\n')
}

function composeStoryboardPrompts({ anchors, shotlist }) {
  return [
    '# Storyboard prompts',
    '',
    'Use these as still-image generation prompts. They are not video prompts.',
    '',
    '## Reference prompts',
    '',
    `### Main subject reference`,
    `${anchors.visualStyle} character reference, ${anchors.protagonist}, consistent costume, ${anchors.keyObject}, controlled performance, vertical ${anchors.aspectRatio}, no text overlay, no watermark`,
    '',
    `### Location reference`,
    `${anchors.visualStyle} location reference, ${anchors.location}, practical light, atmospheric depth, ${anchors.impossibleSign}, vertical ${anchors.aspectRatio}, no text overlay, no watermark`,
    '',
    '## Shot prompts',
    '',
    ...shotlist.flatMap((shot) => [`### ${shot.shot_id}`, shot.image_prompt, ''])
  ].join('\n')
}

function composeReferencePack({ contract, shotlist }) {
  const visual = contract.visualReferences ?? {}
  const userReferences = [
    ...(visual.characterImages ?? []).map((path) => `- 人物参考图: ${path}`),
    ...(visual.sceneImages ?? []).map((path) => `- 场景参考图: ${path}`),
    ...(visual.styleImages ?? []).map((path) => `- 风格参考图: ${path}`)
  ]

  return [
    '# Reference pack',
    '',
    'No raster images are committed by the draft writer.',
    '',
    'User-provided visual references:',
    '',
    ...(userReferences.length ? userReferences : ['- none']),
    '',
    'Recommended generation order:',
    '',
    ...(visual.characterImages?.length ? visual.characterImages.map((path) => `- user character reference: \`${path}\` (keep unchanged)`) : ['- `storyboard-images/character-reference.png`']),
    ...(visual.sceneImages?.length ? visual.sceneImages.map((path) => `- user scene reference: \`${path}\` (keep unchanged)`) : ['- `storyboard-images/scene-reference.png`']),
    '- `storyboard-images/segment-01-start.png`',
    ...shotlist.map((shot) => `- \`storyboard-images/${shot.shot_id}.png\``),
    '- `storyboard-images/segment-01-end.png`',
    '- `storyboard-images/contact-sheet.jpg`',
    '',
    'After Codex image generation, record actual image filenames here.'
  ].join('\n')
}

const MAX_VIDEO_SEGMENT_SECONDS = 6
const MAX_VIDEO_SEGMENT_SHOTS = 1
const MIN_USEFUL_VIDEO_SEGMENT_SECONDS = 3

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

function composeVideoTimeline(segment) {
  let cursor = 0
  return segment.map((shot) => {
    const seconds = Number(shot.duration_seconds) || 1
    const start = cursor
    const end = cursor + seconds
    cursor = end
    return `- ${formatTimecode(start)}-${formatTimecode(end)} | ${shot.shot_id} | shot size: ${shot.shot_size} | camera: ${shot.camera_movement} | action: ${shot.action} | performance: ${shot.performance_detail}`
  })
}

function composeExternalPack({ platform, contract, anchors, shotlist }) {
  const segments = segmentShots(shotlist)
  return [
    `# ${platform} pack`,
    '',
    'This pack is for external video synthesis. Cine Make does not render the final video.',
    '',
    `Target: ${contract.target.durationSeconds}s ${contract.target.aspectRatio} ${contract.target.style}.`,
    `Task rule: one visible action per generation task, usually ${MIN_USEFUL_VIDEO_SEGMENT_SECONDS}-${MAX_VIDEO_SEGMENT_SECONDS}s; use the storyboard images from the user-facing package.`,
    '',
    ...segments.flatMap((segment, index) => {
      const duration = segmentDuration(segment)
      const camera = [...new Set(segment.map((shot) => shot.camera_movement))].join('; ')
      const lighting = [...new Set(segment.map((shot) => shot.lighting))].join('; ')
      return [
        `## Task ${index + 1}: ${segmentLabel(segment)} (${duration}s)`,
        '',
        `Upload references: main subject reference, location reference, start frame, and end frame for ${segment.map((shot) => shot.shot_id).join(', ')}.`,
        '',
        'Prompt:',
        '',
        '```text',
        `FORMAT: ${duration}s / ${contract.target.aspectRatio} / ${contract.target.style} / start-end anchored image-to-video task`,
        '',
        `Subject lock: preserve ${anchors.protagonist}, ${anchors.keyObject}, ${anchors.impossibleSign}, costume, lighting, location, and screen direction. Do not invent unrelated characters.`,
        '',
        'Timeline:',
        ...composeVideoTimeline(segment),
        '',
        `Camera language: ${camera}. Keep motion restrained and continuous.`,
        `Lighting/art direction: ${lighting}.`,
        'Negative constraints: no subtitles, no watermark, no face drift, no costume change, no random props, no jump cuts, no story outside this segment.',
        '```',
        ''
      ]
    })
  ].join('\n')
}

function composeContinuityReview({ anchors, shotlist }) {
  return [
    '# Continuity review',
    '',
    '## Clean',
    '',
    `- Main subject anchor: ${anchors.protagonist}.`,
    `- Key object anchor: ${anchors.keyObject}.`,
    `- Location anchor: ${anchors.location}.`,
    `- Impossible sign anchor: ${anchors.impossibleSign}.`,
    '- Still-image prompts ask for keyframes only.',
    '- External video motion is isolated to Seedance/Jimeng packs.',
    `- ${shotlist.length} storyboard images are treated as pre-production/keyframe references.`,
    '',
    '## Watch',
    '',
    '- Do not let generated images invent extra characters, readable fake text, or unrelated props.',
    `- Keep ${anchors.lostFigure} visually restrained unless the user explicitly asks for a full reveal.`,
    `- Keep ${anchors.protagonist} identity stable across all shots.`,
    '- Codex does not render the final video; final synthesis belongs to the external video tool.'
  ].join('\n')
}
