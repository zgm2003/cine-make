const SHOT_BLUEPRINTS = [
  ['threshold call', '注意到不该出现的信号，在越过边界前停住', '克制的迟疑；握住关键物的手指收紧', 'wide establishing shot', 'slow push toward the threshold'],
  ['object wound', '查看把当下和旧伤连接起来的关键物', '手指压得过紧；呼吸变短但表情仍然收住', 'macro insert', 'locked macro frame'],
  ['entry', '从普通空间进入禁区', '走得很慢，但不回头', 'medium back shot', 'tracking behind the subject'],
  ['world reveal', '进入主体空间，意识到它重新活了过来', '肩膀微沉，旧记忆变成可触摸的现实', 'wide environmental shot', 'slow lateral slide'],
  ['identity detail', '触碰过去的职业或私人锚点', '手在落下前悬停半秒', 'medium close-up', 'small push-in'],
  ['sound trigger', '听见不该存在的声音、信号或记忆', '身体先僵住，脸部反应随后才出现', 'insert shot', 'locked frame with subtle vibration'],
  ['reaction', '消化这个不可能的信息', '眼眶发紧但不崩溃；嘴角压住情绪', 'tight close-up', 'slow eye-level push-in'],
  ['approach', '环境开始向主体逼近或开启', '脚没有后退，反而停在边界线上', 'low angle shot', 'push along the floor line'],
  ['reveal', '不可能的载具、门、人物或通道显形', '关键物在手里轻微颤动', 'wide reveal shot', 'slow dolly backward'],
  ['reflection', '只通过倒影或剪影看到失去的人或真相', '朝影像转头，却说不出话', 'reflection close-up', 'parallel slide'],
  ['invitation', '门、开口或路径刚好对准主体', '决定前低头看了一眼关键物', 'symmetrical medium shot', 'locked frontal frame'],
  ['memory object', '发现证明旧连接真实存在的小物件', '手伸出去，却停在触碰之前', 'insert-medium hybrid', 'slow push toward the object'],
  ['threshold decision', '把关键物放到边界处', '一只脚悬在留下和离开之间', 'low close-up', 'tilt from object to foot'],
  ['answer waits', '失去的人或最终信号伸出邀请，但不强迫', '邀请停在光里等待，不抓取主体', 'long lens interior shot', 'slow rack focus'],
  ['unresolved crossing', '半步踏入不可能的空间', '恐惧还在，但身体已经向前选择', 'wide final frame', 'slow pull-back']
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
    /((?:退役|前)?(?:潜水员|列车调度员|调度员|医生|记者|画家|警探|工程师|母亲|父亲)[\u4e00-\u9fa5]{2})(?=回|走|来到|收到|发现|站|进入|沿|看|听|推|把|在|，|。|$)/u,
    /(女孩|男孩|女人|男人|母亲|父亲|老人|孩子)/u
  ], 'main subject')

  const lostFigure = firstMatch(text, [
    /(女儿|儿子|母亲|父亲|恋人|妻子|丈夫|朋友)/u,
    /(女孩影子|男孩影子|人影|影子)/u
  ], 'lost figure')

  const keyObject = firstMatch(text, [
    /(纸质车票|车票|蓝鲸|画纸|红围巾|信号灯|黑伞|照片|录音带|钥匙|戒指)/u,
    /(一张[\u4e00-\u9fa5]{1,8}|一盏[\u4e00-\u9fa5]{1,8}|一条[\u4e00-\u9fa5]{1,8})/u
  ], 'key object')

  const location = firstMatch(text, [
    /(废弃海洋馆|旧地铁站|废弃地铁站|站台|巷口|医院走廊|旧影院|灯塔|车站|海边|隧道|水箱)/u
  ], 'liminal location')

  const impossibleSign = firstMatch(text, [
    /(绿色信号灯|鲸鱼的低鸣|报站声|深海光|没有司机的银色列车|黑伞|广播)/u
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
  const base = Math.floor(totalSeconds / count)
  let remainder = totalSeconds - base * count
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0
    remainder -= extra
    return Math.max(1, base + extra)
  })
}

function shotId(index) {
  return `S${String(index + 1).padStart(2, '0')}`
}

function visibleBeat(beats, index) {
  return beats[index % beats.length]
}

function composeImagePrompt({ anchors, blueprint, action, shotSize, index }) {
  return [
    `${anchors.visualStyle} still keyframe`,
    `${anchors.protagonist} in ${anchors.location}`,
    `visible action: ${action}`,
    `key object: ${anchors.keyObject}`,
    `impossible sign: ${anchors.impossibleSign}`,
    shotSize,
    `continuity anchor with ${anchors.lostFigure}`,
    `vertical ${anchors.aspectRatio}`,
    'no text overlay',
    'no watermark',
    `shot ${shotId(index)} ${blueprint}`
  ].join(', ')
}

export function composeDraftAssets(contract) {
  const anchors = inferAnchors(contract)
  const beats = splitBeats(contract.sourceText)
  const count = contract.target.shotCount
  const durations = distributeDurations(contract.target.durationSeconds, count)
  const selectedBlueprints = Array.from({ length: count }, (_, index) => SHOT_BLUEPRINTS[Math.floor(index * SHOT_BLUEPRINTS.length / count)])

  const shotlist = selectedBlueprints.map(([label, purpose, performance, shotSize, camera], index) => {
    const beat = visibleBeat(beats, index)
    const action = `${purpose}；源剧情：${beat}`
    return {
      shot_id: shotId(index),
      duration_seconds: durations[index],
      scene: anchors.location,
      subject: index < Math.floor(count * 0.7) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`,
      action,
      performance_detail: performance,
      shot_size: shotSize,
      camera_movement: camera,
      composition: `${label} composition with ${anchors.keyObject} and ${anchors.impossibleSign} as visual anchors`,
      lighting: `${anchors.visualStyle}; motivated by the impossible sign and practical location light`,
      dialogue_or_voiceover: index === Math.floor(count / 2) ? `${anchors.lostFigure}的声音或信号进入场景。` : '',
      image_prompt: composeImagePrompt({ anchors, blueprint: label, action, shotSize, index }),
      continuity_from_previous: index === 0 ? 'opening shot' : `延续 ${shotId(index - 1)} 的 ${anchors.location}、${anchors.protagonist}、${anchors.keyObject} 和 ${anchors.impossibleSign}`,
      video_prompt_note: 'external video tool should animate only subject motion, camera motion, atmosphere, and continuity-preserving transitions'
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
      costume_anchor: `consistent costume fitting ${anchors.visualStyle}`,
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
    '| Shot | Image slot | Purpose | Continuity anchor |',
    '| --- | --- | --- | --- |',
    ...shotlist.map((shot) => `| ${shot.shot_id} | \`storyboard-images/${shot.shot_id}.png\` | ${shot.action} | ${shot.continuity_from_previous} |`)
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
    '- `storyboard-images/ref-main-subject.png`',
    '- `storyboard-images/ref-location.png`',
    ...shotlist.map((shot) => `- \`storyboard-images/${shot.shot_id}.png\``),
    '',
    'After Codex image generation, record actual image filenames here.'
  ].join('\n')
}

function segmentShots(shotlist, size = 5) {
  const segments = []
  for (let index = 0; index < shotlist.length; index += size) {
    segments.push(shotlist.slice(index, index + size))
  }
  return segments
}

function composeExternalPack({ platform, contract, anchors, shotlist }) {
  const segments = segmentShots(shotlist)
  return [
    `# ${platform} pack`,
    '',
    'This pack is for external video synthesis. Cine Make does not render the final video.',
    '',
    `Target: ${contract.target.durationSeconds}s ${contract.target.aspectRatio} ${contract.target.style}.`,
    '',
    ...segments.flatMap((segment, index) => {
      const first = segment[0].shot_id
      const last = segment[segment.length - 1].shot_id
      return [
        `## Segment ${index + 1}: ${first}-${last}`,
        '',
        `Reference images: ${segment.map((shot) => shot.shot_id).join(', ')} plus main subject and location references. Create a restrained cinematic sequence in ${anchors.location}. Preserve ${anchors.protagonist}, ${anchors.keyObject}, ${anchors.impossibleSign}, lighting, costume, and screen direction. Motion should follow the shot notes: ${segment.map((shot) => `${shot.shot_id}: ${shot.video_prompt_note}`).join(' ')}`,
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
