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

function storyFunctionForShot(shot, index, total) {
  const text = compactAction(`${shot.action ?? ''} ${shot.blocking ?? ''} ${shot.composition ?? ''}`)
  if (index === 0) return '开场 / 空间与危险建立'
  if (index === total - 1) return '结尾钩子 / 状态重置'
  if (/刻字|10分钟|记忆只有|倒计时|00:00:00|手机/u.test(text)) return '信息揭示 / 核心机制强化'
  if (/三个人|另外三人|安娜|雷队|阿杰|嫌疑/u.test(text)) return '人物关系建立 / 嫌疑结构'
  if (/质问|拿枪|逼|怒|冲突|尸体|被杀/u.test(text)) return '冲突升级'
  if (/凯撒|谎|误导|阿杰|冷笑/u.test(text)) return '误导 / 反派钩子'
  if (/精神病院|幻觉|闪回|真相|现实/u.test(text)) return '真相靠近 / 现实裂缝'
  return '情绪推进'
}

function audienceQuestionForShot(shot, index, total) {
  const text = compactAction(shot.action)
  if (index === 0) return '这里为什么危险，主角被困在哪里？'
  if (index === total - 1) return '重置之后谁会控制局面？'
  if (/刻字|10分钟|倒计时/u.test(text)) return '林默为什么只能记住10分钟？这个规则会如何反噬他？'
  if (/血|尸体|被杀/u.test(text)) return '血是谁的，刚刚到底发生了什么？'
  if (/安娜|雷队|阿杰|三个人/u.test(text)) return '这几个人谁可信，谁在撒谎？'
  if (/凯撒|阿杰/u.test(text)) return '凯撒是真凶，还是有人在现场编造？'
  return '这个信息会把林默推向哪个错误判断？'
}

function visualInfoForShot(shot) {
  const text = compactAction(shot.action)
  if (/刻字|手臂/u.test(text)) return '手臂刻字必须可读，血迹和刀痕清楚'
  if (/倒计时|手机|00:00:00/u.test(text)) return '倒计时手机屏幕是 primary anchor'
  if (/血手|满手鲜血|双手/u.test(text)) return '林默血手和惊醒状态'
  if (/安娜|雷队|阿杰|三个人/u.test(text)) return '三人方位和嫌疑结构'
  if (/凯撒|阿杰/u.test(text)) return '阿杰低位伪装和眼神异常'
  if (/枪|雷队/u.test(text)) return '雷队堵门、枪、出口压力'
  return shotPurpose(shot)
}

function emotionalPressureForShot(shot, index, total) {
  const text = compactAction(shot.action)
  if (index === total - 1 || /归零|死亡|尸体|尖叫|真相|杀/u.test(text)) return '爆发'
  if (/质问|枪|凯撒|刻字|血/u.test(text)) return '高'
  if (/三个人|安抚|闪回|倒水/u.test(text)) return '中'
  return '低'
}

function mustKeepShot(shot, index, total) {
  const text = compactAction(shot.action)
  return index === 0 || index === total - 1 || /(刻字|10分钟|倒计时|00:00:00|血手|尸体|枪|凯撒|精神病院|真相|死亡|反转)/u.test(text)
}

function mergeCandidate(shot, index, total) {
  if (mustKeepShot(shot, index, total)) return false
  const text = compactAction(shot.action)
  return !/(新信息|关键|揭示|反转|死亡|归零|刻字|倒计时)/u.test(text)
}

function composeScriptBeats(shotlist) {
  const total = shotlist.length
  return shotlist.flatMap((shot, index) => [
    `### B${String(index + 1).padStart(2, '0')} -> ${shot.shot_id}`,
    '',
    `- story_function: ${storyFunctionForShot(shot, index, total)}`,
    `- audience_question: ${audienceQuestionForShot(shot, index, total)}`,
    `- required_visual_info: ${visualInfoForShot(shot)}`,
    `- emotional_pressure: ${emotionalPressureForShot(shot, index, total)}`,
    `- can_be_merged: ${mergeCandidate(shot, index, total)}`,
    `- must_keep: ${mustKeepShot(shot, index, total)}`,
    ''
  ])
}

function shotFunction(shot, index, total) {
  return storyFunctionForShot(shot, index, total)
}

function audienceTakeaway(shot, index, total) {
  const text = compactAction(shot.action)
  if (/刻字|10分钟/u.test(text)) return '林默的记忆规则和凶手假设被明确建立。'
  if (/倒计时|归零|00:00:00/u.test(text)) return '循环机制生效，林默回到无知状态。'
  if (/血手|满手鲜血/u.test(text)) return '林默可能刚参与过暴力事件，但他自己不知道。'
  if (/安娜|雷队|阿杰|三个人/u.test(text)) return '房间里形成嫌疑人棋盘。'
  if (/凯撒|阿杰/u.test(text)) return '阿杰开始把观众和林默带向外部凶手叙事。'
  if (index === 0) return '主角被放进封闭危险空间。'
  if (index === total - 1) return '本段以钩子结束，观众等待下一轮循环。'
  return '情绪或空间压力被推进。'
}

function visualPriority(shot) {
  const primary = visualInfoForShot(shot)
  const text = compactAction(shot.action)
  const secondary = /手机|倒计时/u.test(text) ? '血手 / 屏幕冷光' : /刻字/u.test(text) ? '血手 / 袖口' : /阿杰/u.test(text) ? '拐杖 / 腿部支架' : '人物眼神 / 关键道具'
  const background = /客厅|别墅|安娜|雷队|阿杰/u.test(text) ? '孤岛别墅客厅空间方位' : '当前环境连续性'
  return { primary, secondary, background }
}

function composeDirectorDecision(shotlist) {
  const total = shotlist.length
  return shotlist.flatMap((shot, index) => {
    const canMerge = mergeCandidate(shot, index, total)
    return [
      `### ${shot.shot_id}`,
      '',
      `- shot_purpose: ${shotFunction(shot, index, total)}`,
      `- new_information: ${audienceTakeaway(shot, index, total)}`,
      `- emotion_upgrade: ${emotionalPressureForShot(shot, index, total)}`,
      `- delete_cost: ${mustKeepShot(shot, index, total) ? '删除会损失关键规则、误导、冲突或钩子。' : '可和相邻镜头合并，前提是不损失观众读到的信息。'}`,
      `- merge_suggestion: ${canMerge ? '可合并到相邻镜头，避免平均切碎。' : '保留为独立镜头。'}`,
      ''
    ]
  })
}

function slugEnvironment(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gu, '-').replace(/^-|-$/g, '') || 'main'
}

function inferEnvironmentBibles({ contract, shotlist }) {
  const text = [contract.sourceText, ...shotlist.flatMap((shot) => [shot.scene, shot.action])].filter(Boolean).join('\n')
  const envs = []
  const add = (id, name, mode, description) => {
    if (!envs.some((env) => env.id === id)) envs.push({ id, name, mode, description })
  }
  if (/孤岛|别墅|客厅/u.test(text)) add('E01_island_villa_living_room', '孤岛别墅客厅', 'reality', '沙发、茶几、门口、窗户、角落方位稳定；暴雨窗光和室内低光持续。')
  if (/走廊/u.test(text)) add('E02_dark_corridor', '阴暗走廊', 'reality', '狭窄低天花，墙灯闪烁，脚步和拐杖声突出。')
  if (/浴室|门口/u.test(text)) add('E03_bathroom_doorway', '浴室门口', 'reality', '不可见杀戮区入口，门缝、湿地面、血迹承担悬疑。')
  if (/禁闭室|幻觉|闪回|精神病院/u.test(text)) add('E04_asylum_cell_hallucination', '精神病院禁闭室幻觉', 'hallucination', '闪电或耳鸣触发，别墅构图短暂变成冷白软墙。')
  if (/监护室|现实|束缚|医生|护士/u.test(text)) add('E05_asylum_monitoring_room_reality', '精神病院监护室现实', 'reality', '冷白荧光灯、束缚椅、防撞软墙、心电监护仪。')

  if (!envs.length) {
    const first = uniqueScenes(shotlist)[0] ?? '主场景'
    add(`E01_${slugEnvironment(first)}`, first, 'reality', '保持空间结构、光线方向、材质和入口关系稳定。')
  }
  return envs
}

function composeEnvironmentBibles({ contract, shotlist }) {
  return inferEnvironmentBibles({ contract, shotlist }).flatMap((env) => [
    `### ${env.id}`,
    '',
    `- name: ${env.name}`,
    `- environment_mode: ${env.mode}`,
    `- continuity_rule: ${env.description}`,
    env.id.includes('E05') ? '- transition_environment: from E01_island_villa_living_room to E05_asylum_monitoring_room_reality; trigger: thunder / wall peeling / corpse disappearance' : '',
    ''
  ].filter(Boolean))
}

function anchorsForShot(shot) {
  const text = compactAction(`${shot.action ?? ''} ${sanitizeStaticShotText(shot.composition ?? '')} ${shot.blocking ?? ''}`)
  if (/倒计时|手机|00:00:00/u.test(text)) return { primary: '倒计时手机', secondary: ['林默血手', '屏幕冷光'] }
  if (/刻字|手臂/u.test(text)) return { primary: '手臂刻字', secondary: ['血手', '袖口'] }
  if (/阿杰|凯撒/u.test(text)) return { primary: '阿杰眼神/嘴角', secondary: ['拐杖', '腿部支架'] }
  if (/雷队|枪/u.test(text)) return { primary: '雷队堵门', secondary: ['手枪', '出口'] }
  if (/安娜|药|倒水/u.test(text)) return { primary: '安娜安抚动作', secondary: ['热水杯', '药瓶'] }
  if (/血手|鲜血/u.test(text)) return { primary: '林默血手', secondary: ['沙发', '低光'] }
  return { primary: '本镜头主要视觉信息', secondary: ['环境连续性'] }
}

function composeAnchorPolicy({ characters = [], shotlist = [] }) {
  return [
    '## ANCHOR_POLICY',
    '',
    '规则：不是所有锚点都要进入每一镜。每镜最多 1 个 primary anchor，最多 2 个 secondary anchors。',
    '',
    '### global_anchors',
    '',
    '- 同一批演员脸、发型、体型和服装材质。',
    '- 暴雨孤岛心理惊悚风格 / 低饱和蓝灰 / practical lighting。',
    '- 空间方位连续，不随机换房间。',
    '',
    '### character_anchors',
    '',
    ...(characters.length ? characters.map((character) => `- ${character.identity_anchor ?? character.name}: ${character.costume_anchor ?? character.costume ?? '固定服装'} / ${character.prop_anchor ?? (character.props ?? []).join('、') ?? '关键道具'}`) : ['- 主角：同一演员、同一服装、同一道具状态。']),
    '',
    '### story_anchors',
    '',
    '- 10分钟倒计时',
    '- 手臂刻字',
    '- 血手 / 血迹',
    '- 拍立得照片 / 药丸 / 血字等只在对应剧情镜头入画',
    '',
    '### per_shot_anchors',
    '',
    ...shotlist.map((shot) => {
      const anchors = anchorsForShot(shot)
      return `- ${shot.shot_id}: primary=${anchors.primary}; secondary=${anchors.secondary.slice(0, 2).join('、')}`
    })
  ]
}

function composeStoryboardVersionA(shotlist) {
  return [
    '## Storyboard Version A: Full Coverage',
    '',
    '完整覆盖版：保留所有已拆镜头，用于检查剧情信息是否遗漏。',
    '',
    ...shotlist.map((shot) => `- ${shot.shot_id}: ${shotPurpose(shot)} / ${shot.shot_size} / ${shot.lens ?? 'same lens'}`)
  ]
}

function directorCutShots(shotlist) {
  const total = shotlist.length
  const keep = shotlist.filter((shot, index) => mustKeepShot(shot, index, total))
  const target = Math.min(12, Math.max(6, Math.ceil(shotlist.length * 0.7)))
  for (const shot of shotlist) {
    if (keep.length >= target) break
    if (!keep.includes(shot)) keep.push(shot)
  }
  return keep.sort((a, b) => shotlist.indexOf(a) - shotlist.indexOf(b))
}

function composeStoryboardVersionB(shotlist) {
  const cut = directorCutShots(shotlist)
  return [
    '## Storyboard Version B: Director Cut',
    '',
    '导演删减版：优先保留新信息、关系变化、关键道具、误导、反转和结尾钩子；默认推荐用这一版进入生成。',
    '',
    ...cut.map((shot) => `- ${shot.shot_id}: ${shotPurpose(shot)}`),
    '',
    '### 镜头合并建议',
    '',
    ...shotlist
      .filter((shot, index) => !cut.includes(shot) || mergeCandidate(shot, index, shotlist.length))
      .map((shot) => `- ${shot.shot_id}: 可考虑合并到相邻镜头，除非它承担明确新信息。`)
  ]
}

function composeQualityCheck(shotlist) {
  return [
    '## QUALITY_CHECK',
    '',
    '- story_clarity: 检查前10秒是否让观众知道主角处于危险中；每段结尾是否有明确钩子。',
    '- shot_efficiency: 检查是否存在只重复气氛、不推进信息的镜头；检查是否有可以合并的人物介绍镜头。',
    '- prompt_control: 检查是否每镜强制出现不必要道具；Keyframe Prompt 是否混入 Motion 描述；Motion Prompt 是否包含多个主动作。',
    '- continuity: 检查人物是否只在需要的镜头出现；场景是否绑定正确 Environment Bible；道具出现/消失是否有逻辑。',
    `- director_cut_ratio: ${directorCutShots(shotlist).length}/${shotlist.length} shots retained for recommended director cut.`
  ]
}

function composeAIRiskWarnings(shotlist) {
  const warnings = []
  for (const shot of shotlist) {
    const text = compactAction(`${shot.action ?? ''} ${sanitizeStaticShotText(shot.composition ?? '')} ${shot.shot_size ?? ''}`)
    if (/macro|insert/i.test(shot.shot_size ?? '') && /奔跑|争吵|多人|复杂|走位|扑/u.test(text)) warnings.push(`- ${shot.shot_id}: macro 镜头承担复杂表演，建议拆镜或改 medium close-up。`)
    if (/wide/i.test(shot.shot_size ?? '') && /文字|刻字|00:|读清|手机屏/u.test(text)) warnings.push(`- ${shot.shot_id}: wide 镜头承担文字阅读，建议改 close-up / insert。`)
    if (/必须作为稳定视觉锚点/u.test(text)) warnings.push(`- ${shot.shot_id}: 每镜强制出现不必要道具风险，按 ANCHOR_POLICY 限制 primary/secondary anchors。`)
  }
  return [
    '## AI_RISK_WARNINGS',
    '',
    warnings.length ? warnings.join('\n') : '- 暂未发现高风险镜头；仍需人工检查 macro/文字、多人物信息过载和不必要道具入画。',
    '',
    '重点错误类型：macro 镜头承担复杂表演；wide 镜头承担文字阅读；每镜强制出现不必要道具。'
  ]
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

function composeDirectorBible({ contract }) {
  return [
    '- 类型：超写实真人电影短剧；每张图都是 shot，不是插画。',
    `- 画幅 / 风格：${contract.target.aspectRatio} / ${contract.target.style}`,
    '- 视觉语言：低饱和、低调布光、真实镜头行为、负空间、环境叙事。',
    '- 表演规则：情绪通过眼神、呼吸、手指张力、姿态停顿泄露；避免夸张恐怖表演。',
    '- 摄影规则：允许 slow push、slow dolly、rack focus、locked frame、controlled slide；避免快切、乱晃、突然 zoom。',
    '- 连续性优先级：角色一致性 > 空间连续性 > 镜头连续性 > 光线连续性 > 情绪连续性 > 单张漂亮。',
    '- 全局规则不在每镜重复；每个镜头只写本镜头局部目标。'
  ]
}

function composeCharacterBibleLines({ characters = [], mainCharacter }) {
  const known = characters.length ? characters : [mainCharacter].filter(Boolean)
  if (!known.length) return ['- 主角：按源故事和分镜设定保持同一演员、同一服装、同一道具。']

  return known.flatMap((character) => [
    `### ${character.identity_anchor ?? character.name ?? character.id}`,
    '',
    `- 身份/锚点：${character.role ?? character.identity ?? character.identity_anchor ?? '主角'}`,
    `- 外观/服装：${character.costume_anchor ?? character.costume ?? '保持同一造型'}`,
    `- 核心道具：${character.prop_anchor ?? (character.props ?? []).join('、') ?? '关键道具'}`,
    `- 微动作：${character.performance_anchor ?? '眼神、呼吸、手指、姿态小幅变化，不夸张表演。'}`,
    `- 连续性：${character.continuity_notes ?? '同一张脸、同一发型、同一体型、同一服装材质。'}`,
    ''
  ])
}

function uniqueScenes(shotlist = []) {
  const scenes = []
  for (const shot of shotlist) {
    const scene = shot.scene || '主场景'
    if (!scenes.includes(scene)) scenes.push(scene)
  }
  return scenes
}

function composeSceneBible({ shotlist }) {
  const scenes = uniqueScenes(shotlist)
  return [
    ...scenes.map((scene) => `- ${scene}：锁定建筑结构、入口、主体站位、光线方向、材质和空气状态；不要每镜换地方。`),
    '- 空间连续性：镜头可以换机位，但沙发/门口/角落/关键通道等关系不能随机漂移。',
    '- 声音感也影响画面：雨声、电流声、脚步、道具轻响应体现在空气和材质里。'
  ]
}

function composeArtDirection({ contract }) {
  return [
    `- 色彩：${contract.target.style}；优先低饱和蓝灰、真实肤色、少量高亮信号色。`,
    '- 光线：practical lighting / motivated lighting；每个高光必须有场内来源。',
    '- 构图：负空间、前景遮挡、分层景深、环境压迫；不做海报式摆拍。',
    '- 镜头：广角建立空间，标准镜头做关系，85mm/macro 做线索和心理压缩。',
    '- Keyframe 提示词是静态画面提示；Motion Prompt 才描述视频运动。'
  ]
}

function composeShotDefinitionLine(shot, index = 0, total = 1) {
  const priority = visualPriority(shot)
  return [
    `- linked_beat: B${String(index + 1).padStart(2, '0')}`,
    `- shot_function: ${shotFunction(shot, index, total)}`,
    `- audience_takeaway: ${audienceTakeaway(shot, index, total)}`,
    `- visual_priority: primary=${priority.primary}; secondary=${priority.secondary}; background=${priority.background}`,
    `- Static Shot Definition：${shot.shot_size}，${shot.lens ?? 'same lens system'}，${sanitizeStaticShotText(shot.composition)}。`,
    `- 人物/调度：${compactAction(shot.blocking ?? '按上一镜空间连续调度')}。`,
    `- 画面状态：${shotPurpose(shot)}。`,
    `- 光影/连续性：${compactAction(shot.lighting ?? '按 Art Direction 延续')}；${sanitizeStaticShotText(shot.continuity_from_previous ?? '保持上一镜连续性')}。`
  ]
}

function composeShotDefinitions(shotlist) {
  return shotlist.flatMap((shot, index) => [
    `### ${shot.shot_id} -> ${storyboardImageName(shot)}`,
    '',
    ...composeShotDefinitionLine(shot, index, shotlist.length),
    ''
  ])
}

function sanitizeStaticShotText(value) {
  return compactAction(value)
    .replace(/；[^。；，,]*必须作为稳定视觉锚点/gu, '')
    .replace(/[,， ]*[^,，。；]*must[^,，。；]*stable visual anchor[^,，。；]*/giu, '')
    .replace(/、?手机10分钟倒计时\s*(与|和)\s*记忆清空倒计时/gu, '')
    .replace(/、?10分钟倒计时\s*(与|和)\s*记忆清空倒计时/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function composeStaticKeyframePrompt(shot) {
  const priority = visualPriority(shot)
  return [
    'single cinematic keyframe, photorealistic live-action film still',
    `Static Shot Definition: ${shot.shot_size}, ${shot.lens ?? 'same lens system'}, ${sanitizeStaticShotText(shot.composition)}`,
    `Visual priority: primary=${priority.primary}; secondary=${priority.secondary}; background=${priority.background}`,
    `Subject/blocking: ${compactAction(shot.blocking ?? 'spatially continuous blocking')}`,
    `Visible state: ${shotPurpose(shot)}`,
    `Lighting: ${compactAction(shot.lighting ?? 'motivated low-key cinematic lighting')}`,
    `Continuity: ${sanitizeStaticShotText(shot.continuity_from_previous ?? 'same actor, same location, same prop state')}`,
    'No motion blur, no video transition, no poster layout, no subtitles, no watermark, no extra characters.'
  ].join(', ')
}

function composeKeyframePromptList(shotlist) {
  return shotlist.flatMap((shot) => [
    `### ${shot.shot_id} -> ${storyboardImageName(shot)}`,
    '',
    composeStaticKeyframePrompt(shot),
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
    return `${formatTimecode(start)}-${formatTimecode(end)}｜${shot.shot_id}｜景别：${shot.shot_size}｜焦段：${shot.lens ?? 'same lens system'}｜运镜：${shot.camera_movement}｜构图：${sanitizeStaticShotText(shot.composition)}｜调度：${compactAction(shot.blocking ?? '主体动作连续')}｜画面：${compactAction(shot.action)}｜表演：${compactAction(shot.performance_detail)}`
  })
}

function formatSeconds(value) {
  return Number(value).toFixed(1).replace(/\.0$/, '')
}

function primaryMotionCue(shot) {
  const action = compactAction(shot.action)
  if (/惊醒|醒来|惊醒/u.test(action)) return 'Lin Mo wakes from the sofa, then freezes before making any second action.'
  if (/血手|满是鲜血|双手|看向自己的双手/u.test(action)) return 'He slowly raises his bloody hands into frame.'
  if (/拉开衣袖|刻着|手臂/u.test(action)) return 'He exposes the marked forearm and holds it still.'
  if (/倒计时|手机|00:00:00/u.test(action)) return 'The camera holds on the countdown phone as the screen reaches zero.'
  if (/镜头拉开|还有另外|还有安娜|还有雷队|还有阿杰/u.test(action)) return 'The camera slowly reveals the fixed room layout and character positions.'
  if (/靠近|走|进入|后退|推开/u.test(action)) return 'The subject completes one small position change, then stops.'
  if (/看|抬头|听/u.test(action)) return 'The subject shifts eye line once toward the visual cue.'
  return 'Execute only the single visible action in this shot definition.'
}

function microPerformanceCue(shot) {
  const text = `${shot.performance_detail ?? ''}\n${shot.action ?? ''}`
  if (/恐惧|惊|血|失忆|空洞|痛/u.test(text)) return 'short breath, delayed eye focus, tense fingers'
  if (/安抚|温柔|倒水|医生/u.test(text)) return 'slow hands, controlled eye contact, half-second hesitation'
  if (/暴怒|枪|警|逼/u.test(text)) return 'stiff jaw, heavy shoulders, controlled threat'
  if (/阿杰|冷笑|诡异|角落/u.test(text)) return 'small hidden smile, eyes move before the body'
  return 'subtle breath and small eye movement'
}

function composeMotionPromptLine(shot) {
  return [
    `${shot.shot_id}: ${formatSeconds(Number(shot.duration_seconds) || 1)}s.`,
    `${shot.camera_movement || 'locked frame'}.`,
    primaryMotionCue(shot),
    `Micro-performance: ${microPerformanceCue(shot)}.`,
    'No cut, no new action, no face change.'
  ].join(' ')
}

function composeMotionPrompts(shotlist) {
  return shotlist.flatMap((shot) => [
    `### ${shot.shot_id}｜Motion Prompt`,
    '',
    composeMotionPromptLine(shot),
    ''
  ])
}

function composeVideoBeatLine({ shot, startSecond }) {
  const shotDuration = Number(shot.duration_seconds) || 1
  const endSecond = startSecond + shotDuration
  return `${formatSeconds(startSecond)}-${formatSeconds(endSecond)}s｜${composeMotionPromptLine(shot)}`
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
  let cursor = 0
  const beatLines = segment.map((shot) => {
    const line = composeVideoBeatLine({ shot, startSecond: cursor })
    cursor += Number(shot.duration_seconds) || 1
    return line
  }).join('\n')

  return [
    `${duration}s / ${contract.target.aspectRatio}. Use uploaded keyframes as fixed visual state anchors.`,
    'Do not reinterpret the plot. Execute the Motion Prompts only.',
    composeCharacterLockSentence({ segment, mainCharacter, characters }),
    beatLines,
    '中文约束：主运动清楚；每镜只做一个主动作；不跳过、不合并、不串到其他段。',
    'Global avoid: no subtitles, no watermark, no jump cut, no new character, no new prop, no face/costume/location change.'
  ].join('\n')
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
  const directorJudgmentSections = mode === 'draft'
    ? [
        '## SCRIPT_BEATS',
        '',
        ...composeScriptBeats(draft.shotlist),
        '',
        '## DIRECTOR_DECISION',
        '',
        ...composeDirectorDecision(draft.shotlist),
        '',
        '## ENVIRONMENT_BIBLES',
        '',
        ...composeEnvironmentBibles({ contract, shotlist: draft.shotlist }),
        '',
        ...composeAnchorPolicy({ characters: draft.characters, shotlist: draft.shotlist }),
        '',
        ...composeStoryboardVersionA(draft.shotlist),
        '',
        ...composeStoryboardVersionB(draft.shotlist),
        '',
        ...composeQualityCheck(draft.shotlist),
        '',
        ...composeAIRiskWarnings(draft.shotlist),
        ''
      ]
    : []

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
    ...directorJudgmentSections,
    '## DIRECTOR_BIBLE',
    '',
    ...composeDirectorBible({ contract }),
    '',
    '## CHARACTER_BIBLE',
    '',
    ...composeCharacterBibleLines({ characters: draft.characters, mainCharacter }),
    '## SCENE_BIBLE',
    '',
    ...composeSceneBible({ shotlist: draft.shotlist }),
    '## ART_DIRECTION',
    '',
    ...composeArtDirection({ contract }),
    '',
    '## STORYBOARD：Shot Definition',
    '',
    ...composeShotDefinitions(draft.shotlist),
    '',
    '## KEYFRAME_PROMPTS',
    '',
    ...composeKeyframePromptList(draft.shotlist),
    '',
    '## MOTION_PROMPTS',
    '',
    ...composeMotionPrompts(draft.shotlist),
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
