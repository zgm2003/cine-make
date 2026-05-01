const MAX_TASKS_PER_EPISODE = 6
const MIN_TASK_SECONDS = 3
const MAX_TASK_SECONDS = 6

function stripSourcePrefix(sourceText) {
  return sourceText.replace(/^(小说片段|粗剧本|广告短片|广告文案|剧情|剧本)[:：]\s*/u, '').trim()
}

export function splitStoryBeats(sourceText) {
  const cleaned = stripSourcePrefix(sourceText)
  const matches = cleaned.match(/[^。！？!?；;]+[。！？!?；;]?/gu) ?? []
  const beats = matches.map((part) => part.trim()).filter(Boolean)
  return beats.length ? beats : [cleaned]
}

function firstMatch(text, patterns, fallback) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1] || match[0]
  }
  return fallback
}

function inferContinuityAnchors(contract) {
  const text = stripSourcePrefix(contract.sourceText)
  const protagonist = firstMatch(text, [
    /((?:退役|前)?(?:外卖员|潜水员|列车调度员|调度员|医生|记者|画家|警探|工程师|母亲|父亲)[\u4e00-\u9fa5]{1,4})(?=送|回|走|来到|收到|发现|站|进入|沿|看|听|推|把|伸|在|，|。|$)/u,
    /(女孩|男孩|女人|男人|母亲|父亲|老人|孩子|主角)/u
  ], 'main subject')

  const secondary = firstMatch(text, [
    /(妹妹|哥哥|姐姐|弟弟|女儿|儿子|母亲|父亲|恋人|妻子|丈夫|朋友)/u,
    /(另一个[\u4e00-\u9fa5]{1,6}|女孩影子|男孩影子|人影|影子)/u
  ], 'secondary figure')

  const keyObject = firstMatch(text, [
    /(红色弹珠|弹珠|纸质车票|车票|蓝鲸|画纸|红围巾|信号灯|黑伞|照片|录音带|钥匙|戒指|订单)/u,
    /(一张[\u4e00-\u9fa5]{1,8}|一盏[\u4e00-\u9fa5]{1,8}|一条[\u4e00-\u9fa5]{1,8}|一颗[\u4e00-\u9fa5]{1,8})/u
  ], 'key object')

  const location = firstMatch(text, [
    /(废弃医院|护士站|废弃海洋馆|旧地铁站|废弃地铁站|站台|巷口|医院走廊|医院|旧影院|灯塔|车站|海边|隧道|水箱|电梯间|十三楼)/u
  ], 'primary location')

  const impossibleSign = firstMatch(text, [
    /(不存在的十三楼|不存在的13楼|十三楼|13楼|电梯|绿色信号灯|鲸鱼的低鸣|报站声|深海光|没有司机的银色列车|黑伞|广播|订单提示音)/u
  ], 'story trigger')

  return {
    protagonist,
    secondary,
    keyObject,
    location,
    impossibleSign,
    visualStyle: contract.target.style,
    aspectRatio: contract.target.aspectRatio
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function taskDuration(contract, beatCount) {
  const average = Math.round(contract.target.durationSeconds / Math.max(1, beatCount))
  return clamp(average || 4, MIN_TASK_SECONDS, MAX_TASK_SECONDS)
}

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function twoDigit(index) {
  return String(index + 1).padStart(2, '0')
}

function compact(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function storyboardForBeat({ beat, previousBeat, anchors, taskIndex }) {
  const text = beat.text
  const previous = previousBeat || '开场前状态'

  if (/手机|短信|订单|号码|备注/u.test(text)) {
    return {
      shotSize: 'insert close-up -> over-shoulder close-up',
      lens: '65mm macro close-up, shallow depth of field',
      cameraMove: 'locked-off insert, tiny handheld breath only',
      composition: 'phone screen foreground, protagonist fingers and wet sleeve edge in frame, background compressed into cold blur',
      blocking: `${anchors.protagonist} pauses before acting; the phone becomes the visual event, not a subtitle card`,
      performance: 'finger hesitation, breath held, eyes only partly visible or reflected; fear is suppressed',
      lighting: 'cold phone glow mixed with weak practical hospital light; no warm fill except story key object when relevant',
      transition: `inherits from previous state: ${compact(previous)}; ends by forcing ${anchors.protagonist} to re-orient`,
      framePurpose: 'make the information legible through image composition, but do not render readable UI text as the main solution'
    }
  }

  if (/电梯|门|打开|门缝|楼层|十三楼|13楼/u.test(text)) {
    return {
      shotSize: 'symmetrical wide shot -> medium push-in',
      lens: '28mm controlled wide lens',
      cameraMove: 'slow forward dolly, no whip pan, no jump cut',
      composition: 'elevator doors centered as a vertical black mouth, protagonist held on lower third, negative space above',
      blocking: `${anchors.protagonist} stays outside the threshold until the action demands crossing it`,
      performance: 'body still, shoulders slightly locked, head turns before feet move',
      lighting: 'hard cold white slit from elevator, blue-black surrounding shadows, red signal as the only aggressive accent',
      transition: `turn ${compact(previous)} into a threshold decision; end with the new doorway state clearly readable`,
      framePurpose: 'show spatial threat and screen direction; the door geometry must stay consistent between start and end'
    }
  }

  if (/弹珠|玻璃珠|倒映|滚/u.test(text)) {
    return {
      shotSize: 'low-angle prop close-up -> reaction insert',
      lens: '50mm low close-up with reflective detail',
      cameraMove: 'slow tracking move following the marble; keep motion readable and minimal',
      composition: `${anchors.keyObject} dominates foreground, shoes or hands define scale, protagonist reaction stays secondary`,
      blocking: 'the prop travels along a clean line that the video model can animate without inventing new geography',
      performance: 'reaction is delayed; hand tension and frozen posture carry the emotion',
      lighting: 'cool floor reflection with one red highlight on the marble; avoid carnival horror colors',
      transition: `continue from ${compact(previous)}; end on a clear object-state change`,
      framePurpose: 'lock the prop trajectory and reflection logic for video synthesis'
    }
  }

  if (/妹妹|抬头|白裙|护士站|哥|另一个自己|湿透/u.test(text)) {
    return {
      shotSize: 'medium-long reveal -> restrained close reaction',
      lens: '40mm human-distance lens',
      cameraMove: 'slow lateral reveal or very slow push; keep both identity and distance readable',
      composition: 'foreground protagonist silhouette, secondary figure framed by hospital geometry, clean separation between living space and impossible space',
      blocking: `${anchors.secondary} stays composed and still; ${anchors.protagonist} reacts through small body changes`,
      performance: 'no exaggerated horror acting; eyes, breath, hand tension, and delayed recognition carry the beat',
      lighting: 'sterile nurse-station light, cold blue shadows, skin tones subdued, no monster lighting',
      transition: `emotion escalates from ${compact(previous)} but does not resolve the mystery`,
      framePurpose: 'protect character identity and emotional continuity across frames'
    }
  }

  if (/雨|医院|门卫室|走廊|废弃|干净/u.test(text)) {
    return {
      shotSize: 'establishing wide shot -> environmental detail shot',
      lens: '32mm cinematic wide lens',
      cameraMove: 'slow observational drift, no dramatic shake',
      composition: 'strong leading lines, protagonist small against architecture, one readable route deeper into the scene',
      blocking: `${anchors.protagonist} is positioned as a scale reference; the environment performs the threat`,
      performance: 'minimal movement, alert posture, attention pulled by the abnormal light or sound',
      lighting: 'cool blue ambience, practical white source, wet surfaces and soft reflections',
      transition: `carry the unresolved tension from ${compact(previous)} into a clearer spatial map`,
      framePurpose: 'build geography for later start/end frames so the video model does not invent the space'
    }
  }

  return {
    shotSize: taskIndex % 2 === 0 ? 'medium shot -> tighter medium shot' : 'medium-wide shot -> medium shot',
    lens: taskIndex % 2 === 0 ? '40mm natural perspective' : '35mm controlled perspective',
    cameraMove: 'slow controlled camera movement only, no jump cut',
    composition: 'single cinematic frame, clear subject silhouette, strong foreground-midground-background separation',
    blocking: `${anchors.protagonist} completes exactly one visible action from this beat`,
    performance: 'restrained micro-expression; emotion shown through pause, breath, hand tension, and eye-line',
    lighting: `${anchors.visualStyle}; motivated practical light, stable direction, no random horror lighting`,
    transition: `inherit ${compact(previous)} and end at the new state caused by this beat`,
    framePurpose: 'make the beat visually executable without asking the video model to understand the whole plot'
  }
}

function storyboardPromptLine(storyboard) {
  return [
    `Shot size: ${storyboard.shotSize}`,
    `Lens: ${storyboard.lens}`,
    `Composition: ${storyboard.composition}`,
    `Blocking: ${storyboard.blocking}`,
    `Performance: ${storyboard.performance}`,
    `Lighting: ${storyboard.lighting}`
  ].join('\n')
}

function composeImagePrompt({ role, episodeId, shotId, beat, previousBeat, anchors, storyboard }) {
  const roleLabel = role === 'start' ? 'START_FRAME' : 'END_FRAME'
  const frameMoment = role === 'start'
    ? `moment before the visible action begins; hold the unresolved state from previous beat: ${previousBeat || 'opening state'}`
    : `moment after this visible action finishes; show the new state caused by: ${beat.text}`

  return [
    'Use case: illustration-story',
    'Asset type: AI-video control frame for image-to-video generation',
    `Frame role: ${roleLabel}`,
    `Episode: ${episodeId}`,
    `Shot id: ${shotId}`,
    `Scene/backdrop: ${anchors.location}; ${anchors.visualStyle}; vertical ${anchors.aspectRatio}`,
    `Subject: ${anchors.protagonist}; secondary figure: ${anchors.secondary}; key object: ${anchors.keyObject}`,
    `Visual delta: ${frameMoment}`,
    'Director storyboard:',
    storyboardPromptLine(storyboard),
    'Composition/framing rule: one single cinematic frame, no collage, no split panel, no storyboard sheet, clear readable subject silhouette',
    'Continuity: preserve the same face, hair, body type, costume, key prop, scene layout, lighting direction, color palette, and screen direction from the reference images',
    'Avoid: no subtitles, no watermark, no UI, no extra characters, no face drift, no costume drift, no new props, no random horror monster, no text overlay'
  ].join('\n')
}

function composeTask({ contract, anchors, episodeId, beat, previousBeat, taskIndex, durationSeconds }) {
  const shotId = `S${twoDigit(taskIndex)}`
  const startFrame = `storyboard-images/${shotId}-start.png`
  const endFrame = `storyboard-images/${shotId}-end.png`
  const storyboard = storyboardForBeat({ beat, previousBeat, anchors, taskIndex })

  return {
    id: shotId,
    beatId: beat.id,
    durationSeconds,
    sourceBeat: beat.text,
    storyboard,
    startFrame,
    endFrame,
    motion: `${anchors.protagonist}完成这一条可见动作：${compact(beat.text)} 镜头只表现这个变化，不抢跑后续剧情。`,
    camera: `${storyboard.cameraMove}; ${storyboard.lens}; no jump cut inside this task`,
    mustKeep: [
      `${anchors.protagonist} identity, face, hair, body shape, costume, and posture logic`,
      `${anchors.location} scene layout, lighting direction, color palette, and screen direction`,
      `${anchors.keyObject} as the same physical prop when it appears`,
      `story state from ${previousBeat || 'the opening state'}`,
      `director storyboard: ${storyboard.shotSize}; ${storyboard.composition}; ${storyboard.performance}`
    ],
    avoid: [
      'subtitles',
      'watermarks',
      'extra characters',
      'face drift',
      'costume drift',
      'new props',
      'random horror imagery',
      'summarizing multiple future story beats in one clip'
    ],
    startFramePrompt: composeImagePrompt({
      role: 'start',
      episodeId,
      shotId,
      beat,
      previousBeat,
      anchors,
      contract,
      storyboard
    }),
    endFramePrompt: composeImagePrompt({
      role: 'end',
      episodeId,
      shotId,
      beat,
      previousBeat,
      anchors,
      contract,
      storyboard
    })
  }
}

export function createEpisodePlan(contract) {
  const anchors = inferContinuityAnchors(contract)
  const sourceBeats = splitStoryBeats(contract.sourceText).map((text, index) => ({
    id: `B${twoDigit(index)}`,
    text
  }))
  const durationSeconds = taskDuration(contract, sourceBeats.length)
  const episodeBeatGroups = chunk(sourceBeats, MAX_TASKS_PER_EPISODE)

  const episodes = episodeBeatGroups.map((beats, episodeIndex) => {
    const episodeId = `episode-${twoDigit(episodeIndex)}`
    const tasks = beats.map((beat, taskIndex) => {
      const previousBeat = taskIndex > 0
        ? beats[taskIndex - 1].text
        : episodeIndex > 0
          ? episodeBeatGroups[episodeIndex - 1][episodeBeatGroups[episodeIndex - 1].length - 1]?.text
          : ''
      return composeTask({
        contract,
        anchors,
        episodeId,
        beat,
        previousBeat,
        taskIndex,
        durationSeconds
      })
    })

    return {
      id: episodeId,
      title: `第 ${episodeIndex + 1} 段`,
      beatIds: beats.map((beat) => beat.id),
      durationSeconds: tasks.reduce((total, task) => total + task.durationSeconds, 0),
      tasks
    }
  })

  return {
    schemaVersion: 1,
    mode: 'video-model-first',
    policy: 'preserve-full-story-and-split-into-episodes',
    anchors,
    sourceBeats,
    episodes
  }
}
