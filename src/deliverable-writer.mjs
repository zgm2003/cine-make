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
  const action = compactAction(shot.action ?? '')
  if (index === 0) return '开场 / 空间与危险建立'
  if (index === total - 1) return '结尾钩子 / 状态重置'
  if (/刻字|10分钟|记忆只有/u.test(action) || /倒计时|00:00:00|手机/u.test(action)) return '信息揭示 / 核心机制强化'
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

function shotAnalysisText(shot) {
  return compactAction([
    shot.action,
    shot.blocking,
    sanitizeStaticShotText(shot.composition),
    shot.shot_size,
    shot.lens
  ].filter(Boolean).join(' '))
}

function beatKindForShot(shot, index, total) {
  const text = shotAnalysisText(shot)
  const action = compactAction(shot.action ?? '')
  if (index === 0 || /窗外暴雨|闪电划过|暴雨.*闪电/u.test(text)) return { key: 'opening_space', name: '暴雨孤岛建立', functionName: '开场 / 空间与危险建立' }
  if (index === total - 1 || /00:00:00|时间到|倒计时|手机|归零|空洞|你们是谁|再次失忆/u.test(action)) return { key: 'reset_hook', name: '倒计时归零，林默重置', functionName: '结尾钩子 / 状态重置' }
  if (/惊醒|血手|满手鲜血|大口喘气/u.test(text)) return { key: 'blood_anomaly', name: '林默惊醒 + 血手异常', functionName: '异常出现' }
  if (/刻字|记忆只有10分钟|我的记忆只有10分钟|手臂/u.test(text)) return { key: 'memory_rule', name: '10分钟记忆规则揭示', functionName: '核心规则揭示' }
  if (/镜头拉开|另外三个人|三个人|四个方位|嫌疑/u.test(text)) return { key: 'suspect_board', name: '三名嫌疑人建立', functionName: '人物关系 / 嫌疑结构' }
  if (/雷队|拿着枪|堵在门口|被杀|老张|死无对证/u.test(text)) return { key: 'lei_pressure', name: '雷队施压：刚刚有人被杀', functionName: '冲突升级' }
  if (/安娜|倒热水|热水杯|安抚|失忆症/u.test(text)) return { key: 'anna_control', name: '安娜安抚：失忆症线索', functionName: '关系诱导 / 可疑安抚' }
  if (/阿杰|瘸子|蜷缩|瑟瑟|拐杖|腿部支架/u.test(text) && !/冷笑|凯撒/u.test(text)) return { key: 'ajie_disguise', name: '阿杰弱者伪装伏笔', functionName: '伏笔 / 误导准备' }
  if (/精神病院|警徽|解剖刀|闪回|圣路易斯/u.test(text)) return { key: 'asylum_flash', name: '精神病院闪回', functionName: '真相靠近 / 现实裂缝' }
  if (/查案|非法活体实验|我是.*来查案/u.test(text)) return { key: 'investigation_identity', name: '林默身份线索：非法活体实验', functionName: '身份信息揭示' }
  if (/冷笑|凯撒|幕后黑手|所有人的目光/u.test(text)) return { key: 'ajie_misdirect', name: '阿杰抛出“凯撒”误导', functionName: '误导 / 反派钩子' }
  return { key: `beat_${index}`, name: shotPurpose(shot), functionName: storyFunctionForShot(shot, index, total) }
}

function deriveStoryBeats(shotlist) {
  const total = shotlist.length
  const beats = []
  for (const [index, shot] of shotlist.entries()) {
    const kind = beatKindForShot(shot, index, total)
    let beat = beats.find((candidate) => candidate.key === kind.key)
    if (!beat) {
      beat = {
        beat_id: `B${String(beats.length + 1).padStart(2, '0')}`,
        key: kind.key,
        name: kind.name,
        story_function: kind.functionName,
        shots: []
      }
      beats.push(beat)
    }
    beat.shots.push(shot)
  }
  return beats
}

function beatForShotId(beats, shotId) {
  return beats.find((beat) => beat.shots.some((shot) => shot.shot_id === shotId))
}

function recommendedShotsForBeat(beat) {
  const joined = compactAction(beat.shots.map((shot) => shot.action).join(' '))
  if (beat.key === 'blood_anomaly') return ['S02A medium close-up：林默惊醒', 'S02B insert：血手']
  if (beat.key === 'memory_rule') return ['tight insert / 85mm close-up：手臂文字占画面 60% 以上']
  if (beat.key === 'suspect_board') return ['wide / controlled 28mm：四人空间棋盘一次建立']
  if (beat.key === 'anna_control') return ['medium close-up：热水杯作为安抚/控制边界']
  if (beat.key === 'ajie_disguise') return ['low close-up：阿杰畏缩姿态 + 暗中观察眼神']
  if (beat.key === 'ajie_misdirect') return ['low close-up：阿杰嘴角冷笑 / 诡异眼神', '短台词：凯撒就在这间屋子里']
  if (beat.key === 'reset_hook') return ['phone insert：00:00:00', 'reaction close-up：林默重置后的陌生眼神']
  return beat.shots.map((shot) => `${shot.shot_id} ${shot.shot_size}：${shotPurpose(shot) || joined}`)
}

function composeScriptBeats(shotlist) {
  const beats = deriveStoryBeats(shotlist)
  return beats.flatMap((beat, index) => [
    `### ${beat.beat_id} ${beat.name}`,
    '',
    `- story_function: ${beat.story_function}`,
    `- script_source: ${beat.shots.map((shot) => shotPurpose(shot)).join(' / ')}`,
    `- audience_question: ${audienceQuestionForShot(beat.shots[0], index, beats.length)}`,
    '- required_visual_info:',
    ...beat.shots.map((shot) => `  - ${visualInfoForShot(shot)}`),
    `- emotional_pressure: ${beat.shots.some((shot, shotIndex) => emotionalPressureForShot(shot, shotIndex, beat.shots.length) === '爆发') ? 'high' : 'medium'}`,
    `- shot_ids: ${beat.shots.map((shot) => shot.shot_id).join(', ')}`,
    '- recommended_shots:',
    ...recommendedShotsForBeat(beat).map((line) => `  - ${line}`),
    `- can_merge_with: ${index < beats.length - 1 ? beats[index + 1].beat_id : 'none'}`,
    `- can_be_merged: ${beat.shots.length === 1 && !mustKeepShot(beat.shots[0], index, beats.length)}`,
    `- must_keep: ${beat.shots.some((shot, shotIndex) => mustKeepShot(shot, shotIndex, beat.shots.length))}`,
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

function riskTypeForShot(shot) {
  const text = shotAnalysisText(shot)
  if (/wide/i.test(shot.shot_size ?? '') && /刻字|文字|我的记忆只有10分钟|读清/u.test(text)) return 'text_readability_conflict'
  if (/macro|insert/i.test(shot.shot_size ?? '') && /惊醒|大口喘气|猛地|身体/u.test(text)) return 'macro_action_conflict'
  if (/medium close-up|tight close-up/i.test(shot.shot_size ?? '') && /四个方位|三个人|雷队|安娜|阿杰/u.test(text)) return 'multi_character_spatial_conflict'
  if (/冷笑|凯撒/u.test(text) && /(所有人的目光|三人方位|嫌疑结构|insert-medium|wide reveal)/iu.test(text)) return 'visual_priority_mismatch'
  return ''
}

function decisionForShot(shot, index, total) {
  const text = shotAnalysisText(shot)
  const risk = riskTypeForShot(shot)
  if (risk) return 'rewrite'
  if (/阿杰.*蜷缩|瑟瑟|冷笑|凯撒/u.test(text)) return 'keep'
  if (/安娜|热水杯|倒热水/u.test(text)) return 'merge'
  if (mustKeepShot(shot, index, total)) return 'keep'
  if (mergeCandidate(shot, index, total)) return 'merge'
  return 'keep'
}

function decisionProblemForShot(shot) {
  const text = shotAnalysisText(shot)
  const risk = riskTypeForShot(shot)
  if (risk === 'text_readability_conflict') return 'text_readability_conflict：wide 镜头不能稳定读清关键文字。'
  if (risk === 'macro_action_conflict') return 'macro_action_conflict：macro insert 不适合承担惊醒、身体动作和表情。'
  if (risk === 'multi_character_spatial_conflict') return 'multi_character_spatial_conflict：近景很难建立多人空间棋盘。'
  if (risk === 'visual_priority_mismatch') return 'visual_priority_mismatch：此镜重点应是阿杰嘴角/眼神，不是三人方位。'
  if (/安娜|热水杯|倒热水/u.test(text)) return '这一镜和三人介绍/安娜台词功能可能重复，但热水杯边界有价值。'
  if (/阿杰.*蜷缩|瑟瑟/u.test(text)) return '阿杰弱者伪装需要早期植入，不能只在后面突然发力。'
  return '无严重结构问题；检查是否承担新信息。'
}

function rewriteNoteForShot(shot) {
  const risk = riskTypeForShot(shot)
  const text = shotAnalysisText(shot)
  if (risk === 'text_readability_conflict') return 'rewrite as tight insert / 85mm close-up；手臂文字占画面 60% 以上。'
  if (risk === 'macro_action_conflict') return 'split into medium close-up 惊醒 + insert 血手。'
  if (risk === 'multi_character_spatial_conflict') return 'rewrite as wide / controlled 28mm / vertical deep staging。'
  if (risk === 'visual_priority_mismatch') return 'primary 改为阿杰嘴角冷笑 / 诡异眼神；其他人压成背景视线。'
  if (/安娜|热水杯|倒热水/u.test(text)) return '可合并到三人位置建立或安娜台词镜头，保留热水杯作为控制边界。'
  return '按现有镜头功能保留。'
}

function mergeIntoForShot(shot, index, shotlist) {
  const text = shotAnalysisText(shot)
  if (/安娜|热水杯|倒热水/u.test(text)) return 'S05 or S10'
  if (index > 0) return shotlist[index - 1]?.shot_id ?? 'previous shot'
  return shotlist[index + 1]?.shot_id ?? 'next shot'
}

function composeDirectorDecision(shotlist, beats = deriveStoryBeats(shotlist)) {
  const total = shotlist.length
  return shotlist.flatMap((shot, index) => {
    const decision = decisionForShot(shot, index, total)
    const beat = beatForShotId(beats, shot.shot_id)
    return [
      `### ${shot.shot_id}`,
      '',
      `- linked_beat: ${beat?.beat_id ?? `B${String(index + 1).padStart(2, '0')}`}`,
      `- shot_purpose: ${shotFunction(shot, index, total)}`,
      `- new_information: ${audienceTakeaway(shot, index, total)}`,
      `- problem: ${decisionProblemForShot(shot)}`,
      `- decision: ${decision}`,
      decision === 'merge' ? `- merge_into: ${mergeIntoForShot(shot, index, shotlist)}` : '',
      `- reason: ${decision === 'keep' ? '该镜承担规则、伏笔、关系变化或结尾钩子，删除会损失观众认知。' : decision === 'merge' ? '保留信息但减少平均切碎，让节奏更像导演取舍。' : '镜头功能重要，但当前镜头类型/构图会增加 AI 生成风险。'}`,
      `- rewrite_note: ${rewriteNoteForShot(shot)}`,
      ''
    ].filter(Boolean)
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
  const action = compactAction(shot.action ?? '')
  if (/00:00:00/u.test(action)) return { primary: '手机 00:00:00', secondary: ['林默血手', '屏幕冷光'] }
  if (/倒计时|手机/u.test(action)) return { primary: '倒计时手机', secondary: ['林默血手', '屏幕冷光'] }
  if (/刻字|手臂|我的记忆只有10分钟/u.test(text)) return { primary: '手臂刻字', secondary: ['血手', '袖口'] }
  if (/镜头拉开|另外三个人|三个人|四个方位|客厅里还有/u.test(text)) return { primary: '四人空间棋盘', secondary: ['雷队堵门', '阿杰背光角落'] }
  if (/冷笑|凯撒|眼神诡异/u.test(text)) return { primary: /冷笑/u.test(text) ? '阿杰嘴角冷笑' : '阿杰诡异眼神', secondary: ['众人视线转向阿杰', '拐杖/腿部支架'] }
  if (/阿杰|瘸子|蜷缩|瑟瑟/u.test(text)) return { primary: '阿杰诡异眼神', secondary: ['拐杖', '腿部支架'] }
  if (/安娜|热水杯|倒热水|倒水|安抚/u.test(text)) return { primary: '热水杯', secondary: ['安娜手部动作', '林默警惕眼神'] }
  if (/雷队|枪/u.test(text)) return { primary: '雷队堵门', secondary: ['手枪', '出口'] }
  if (/血手|鲜血/u.test(text)) return { primary: '林默血手', secondary: ['沙发', '低光'] }
  return { primary: '本镜头主要视觉信息', secondary: ['环境连续性'] }
}

function visualPriority(shot) {
  const anchors = anchorsForShot(shot)
  const text = compactAction(shot.action)
  const background = /客厅|别墅|安娜|雷队|阿杰|三个人/u.test(text) ? '孤岛别墅客厅空间方位' : '当前环境连续性'
  return { primary: anchors.primary, secondary: anchors.secondary.slice(0, 2).join(' / '), background }
}

function composeTextReadabilityPolicy() {
  return [
    '## TEXT_READABILITY_POLICY',
    '',
    'applies_to:',
    '- carved_text',
    '- phone_screen',
    '- photo_back',
    '- wall_blood_text',
    '- label_text',
    'rules:',
    '- 文字必须是 primary anchor 才要求可读。',
    '- 可读文字镜头必须使用 close-up / insert / tight insert。',
    '- 文字区域占画面至少 40%-60%。',
    '- 禁止 wide shot 承担关键文字阅读。',
    '- 不要在同一镜要求两段以上可读文字。'
  ]
}

function compressedDialogueSuggestion(shot) {
  const text = compactAction(shot.action)
  if (/雷队|老张|被杀|枪/u.test(text)) return '雷队：停电五分钟，老张死了。你手上的血怎么解释？'
  if (/安娜|失忆症|看着我|倒热水/u.test(text)) return '安娜：别逼他。林默，看着我。'
  if (/凯撒|幕后黑手|阿杰/u.test(text)) return '阿杰：凯撒就在这间屋子里。'
  if (/我是谁|这是哪|记忆/u.test(text)) return '林默旁白：记忆又在消失。'
  if (/查案|非法活体实验/u.test(text)) return '林默：我是来查非法实验的。'
  return ''
}

function composeDialoguePolicy(shotlist) {
  const suggestions = shotlist
    .map((shot) => {
      const suggestion = compressedDialogueSuggestion(shot)
      return suggestion ? `- ${shot.shot_id}: visual_cut_dialogue: ${suggestion}` : ''
    })
    .filter(Boolean)

  return [
    '## DIALOGUE_POLICY',
    '',
    '- preserve_full_script: true',
    '- generate_visual_cut_version: true',
    'rules:',
    '- 单镜台词超过 12-16 个中文字符，优先压缩成短台词、字幕、旁白或画面信息。',
    '- 解释型台词优先转成道具、表情、阻挡关系。',
    '- 冲突型台词保留关键词。',
    '- 每集结尾钩子台词必须保留。',
    '',
    'visual_cut_dialogue:',
    ...(suggestions.length ? suggestions : ['- none: 当前分镜未检测到需要压缩的长台词；保留短台词原则。'])
  ]
}

function composeShotDensityController(contract, shotlist) {
  const duration = Number(contract.target?.requestedDurationSeconds || contract.target?.durationSeconds || shotlist.length * 3)
  const ideal = duration >= 40 ? 12 : Math.max(6, Math.min(12, Math.round(duration / 3)))
  const minimum = Math.max(4, ideal - 2)
  const maximum = ideal + 2
  return [
    '## SHOT_DENSITY_CONTROLLER',
    '',
    `duration: ${duration}s`,
    'target_shots:',
    `  minimum: ${minimum}`,
    `  ideal: ${ideal}`,
    `  maximum: ${maximum}`,
    `current_full_coverage_shots: ${shotlist.length}`,
    'average_shot_duration: 3-4s',
    'exceptions:',
    '- key_text_insert: 2s',
    '- final_hook: 4s',
    '- multi_character_reveal: 4s',
    `recommendation: ${shotlist.length > maximum ? 'Director Cut 需要重写压缩，不要机械删镜头。' : '当前镜头密度可控；仍按信息增量检查合并。'}`
  ]
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
  const risks = shotlist.map((shot) => ({ shot, risk: riskTypeForShot(shot) })).filter((item) => item.risk)
  const hasTextFail = risks.some((item) => item.risk === 'text_readability_conflict')
  const hasSpatialRisk = risks.some((item) => item.risk === 'multi_character_spatial_conflict')
  const hasVisualMismatch = risks.some((item) => item.risk === 'visual_priority_mismatch')
  const mergeable = shotlist.filter((shot, index) => mergeCandidate(shot, index, shotlist.length))
  return [
    '## QUALITY_CHECK',
    '',
    'text_readability:',
    `  status: ${hasTextFail ? 'fail' : 'pass'}`,
    '  issues:',
    ...(hasTextFail
      ? risks.filter((item) => item.risk === 'text_readability_conflict').map((item) => `    - ${item.shot.shot_id} uses wide shot for readable key text; rewrite as tight insert / close-up.`)
      : ['    - none']),
    'shot_efficiency:',
    `  status: ${mergeable.length ? 'warning' : 'pass'}`,
    '  issues:',
    ...(mergeable.length ? mergeable.slice(0, 4).map((shot) => `    - ${shot.shot_id} may merge with adjacent beat if it only repeats atmosphere.`) : ['    - none']),
    'anchor_policy:',
    `  status: ${hasVisualMismatch || hasSpatialRisk ? 'warning' : 'pass'}`,
    '  issues:',
    ...(hasVisualMismatch || hasSpatialRisk
      ? risks
        .filter((item) => item.risk === 'visual_priority_mismatch' || item.risk === 'multi_character_spatial_conflict')
        .map((item) => `    - ${item.shot.shot_id} ${item.risk}: primary anchor or shot size needs rewrite.`)
      : ['    - none']),
    'motion_prompt:',
    '  status: pass',
    '  issues:',
    '    - Motion prompts remain separated from static keyframe prompts.',
    'director_cut:',
    `  status: ${directorCutShots(shotlist).length > 14 ? 'warning' : 'pass'}`,
    '  issues:',
    `    - director_cut_ratio: ${directorCutShots(shotlist).length}/${shotlist.length} shots retained for recommended director cut.`
  ]
}

function riskDetailsForShot(shot) {
  const risk = riskTypeForShot(shot)
  if (!risk) return null
  if (risk === 'macro_action_conflict') {
    return {
      risk_type: risk,
      severity: 'high',
      problem: 'macro / insert 镜头不适合同时承担惊醒、喘气、身体动作和表情。',
      fix: '拆成 medium close-up 惊醒 + insert 血手；一个镜头只保留一个主动作。'
    }
  }
  if (risk === 'text_readability_conflict') {
    return {
      risk_type: risk,
      severity: 'high',
      problem: 'wide shot 无法稳定读清手臂刻字、手机屏幕或其他关键文字。',
      fix: 'rewrite as tight insert / 85mm close-up；文字占画面 40%-60%，且作为 primary anchor。'
    }
  }
  if (risk === 'multi_character_spatial_conflict') {
    return {
      risk_type: risk,
      severity: 'high',
      problem: 'medium / tight close-up 很难建立四人空间棋盘和嫌疑人方位。',
      fix: '改为 wide / controlled 28mm / vertical deep staging；一次建立门口、沙发、角落和主角位置。'
    }
  }
  if (risk === 'visual_priority_mismatch') {
    return {
      risk_type: risk,
      severity: 'high',
      problem: '阿杰冷笑/凯撒钩子应成为 primary visual priority，而不是继续强调三人方位。',
      fix: '改为 low close-up 推向阿杰嘴角和眼睛；其他人只作为背景视线压力。'
    }
  }
  return null
}

function composeAIRiskWarnings(shotlist) {
  const warnings = shotlist
    .map((shot) => ({ shot, detail: riskDetailsForShot(shot) }))
    .filter((item) => item.detail)

  return [
    '## AI_RISK_WARNINGS',
    '',
    ...(warnings.length
      ? warnings.flatMap(({ shot, detail }) => [
          `### ${shot.shot_id}`,
          `- risk_type: ${detail.risk_type}`,
          `- severity: ${detail.severity}`,
          `- problem: ${detail.problem}`,
          `- fix: ${detail.fix}`,
          ''
        ])
      : ['- status: pass', '- note: 暂未发现高风险镜头；仍需人工检查 macro/文字、多人物信息过载和不必要道具入画。']),
    '重点错误类型：macro 镜头承担复杂表演；wide 镜头承担文字阅读；每镜强制出现不必要道具；macro_action_conflict；text_readability_conflict；multi_character_spatial_conflict；visual_priority_mismatch。'
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

function localizedStaticShotDefinition(shot) {
  const risk = riskTypeForShot(shot)
  const text = shotAnalysisText(shot)
  if (risk === 'text_readability_conflict') {
    return 'tight insert / 85mm close-up, readable carved text fills 40%-60% of frame'
  }
  if (risk === 'macro_action_conflict') {
    return 'medium close-up for the wake-up beat; reserve the bloody hands for a separate insert'
  }
  if (risk === 'multi_character_spatial_conflict') {
    return 'wide / controlled 28mm shot, vertical deep staging to establish the room chessboard'
  }
  if (risk === 'visual_priority_mismatch') {
    return 'low close-up on Ajie mouth and eyes; background characters reduced to pressure silhouettes'
  }
  if (/00:00:00/u.test(text)) return 'phone insert close-up, screen readable at 00:00:00'
  return `${shot.shot_size}, ${shot.lens ?? 'same lens system'}, ${sanitizeStaticShotText(shot.composition)}`
}

function sanitizeLocalPromptText(value) {
  return sanitizeStaticShotText(value)
    .replace(/超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性[;；]?\s*/gu, '')
    .replace(/^\s*[;；]\s*/u, '')
    .trim()
}

function composeStaticKeyframePrompt(shot) {
  const priority = visualPriority(shot)
  const lighting = sanitizeLocalPromptText(shot.lighting ?? 'motivated low-key cinematic lighting') || 'motivated low-key cinematic lighting'
  const continuity = sanitizeLocalPromptText(shot.continuity_from_previous ?? 'same actor, same location, same prop state') || 'same actor, same location, same prop state'
  const lines = [
    'single cinematic keyframe, photorealistic live-action film still',
    `Static Shot Definition: ${localizedStaticShotDefinition(shot)}`,
    `Visual priority: primary=${priority.primary}; secondary=${priority.secondary}; background=${priority.background}`,
    `Subject/blocking: ${compactAction(shot.blocking ?? 'spatially continuous blocking')}`,
    `Visible state: ${shotPurpose(shot)}`,
    `Lighting: ${lighting}`,
    `Continuity: ${continuity}`,
    'No motion blur, no video transition, no poster layout, no subtitles, no watermark, no extra characters.'
  ]
  if (riskTypeForShot(shot) === 'text_readability_conflict') {
    lines.push('No extra text outside the carved words; the carved Chinese text must be the only readable text.')
  }
  return lines.join(', ')
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

function composeExplicitScriptBeats(shotlist) {
  return shotlist.flatMap((shot, index) => [
    `### B${String(index + 1).padStart(2, '0')} ${shot.shot_id}`,
    '',
    `- story_function: ${shot.shot_function ?? shotFunction(shot, index, shotlist.length)}`,
    `- script_source: ${shotPurpose(shot)}`,
    `- audience_takeaway: ${shot.audience_takeaway ?? audienceTakeaway(shot, index, shotlist.length)}`,
    `- shot_ids: ${shot.shot_id}`,
    `- keep_original_order: true`,
    ''
  ])
}

function composeExplicitDialogueScript(shotlist) {
  return shotlist.flatMap((shot) => {
    const dialogue = compactAction(shot.dialogue_or_voiceover ?? '')
    const dialogueLines = dialogue
      ? dialogue.split(/\s*\/\s*/u).map((line) => `- ${line}`)
      : ['- 无台词 / 只保留画面表演。']
    return [
      `### ${shot.shot_id}`,
      '',
      ...dialogueLines,
      ''
    ]
  })
}

function composeExplicitShotDefinitions(shotlist) {
  return shotlist.flatMap((shot, index) => [
    `### ${shot.shot_id} -> ${storyboardImageName(shot)}`,
    '',
    `- linked_beat: B${String(index + 1).padStart(2, '0')}`,
    `- shot_function: ${shot.shot_function ?? shotFunction(shot, index, shotlist.length)}`,
    `- audience_takeaway: ${shot.audience_takeaway ?? audienceTakeaway(shot, index, shotlist.length)}`,
    `- characters_in_frame: ${(shot.characters?.length ? shot.characters.join('、') : '无固定人物')}`,
    `- environment_id: ${shot.scene}`,
    `- primary_visible_action: ${shotPurpose(shot)}`,
    `- shot_size: ${shot.shot_size}`,
    `- lens_hint: ${shot.lens ?? '按原分镜镜头'}`,
    `- camera_movement: ${shot.camera_movement}`,
    `- duration_seconds: ${shot.duration_seconds}`,
    `- dialogue_or_voiceover: ${compactAction(shot.dialogue_or_voiceover || '无台词')}`,
    `- visual_priority: ${sanitizeStaticShotText(shot.composition)}`,
    `- blocking: ${compactAction(shot.blocking ?? '按原分镜站位')}`,
    `- lighting: ${compactAction(shot.lighting ?? '按国漫画风延续')}`,
    ''
  ])
}

function composeExplicitKeyframePromptList(shotlist) {
  return shotlist.flatMap((shot) => [
    `### ${shot.shot_id} -> ${storyboardImageName(shot)}`,
    '',
    shot.image_prompt ?? composeStaticKeyframePrompt(shot),
    ''
  ])
}

function composeExplicitMotionPrompts(shotlist) {
  return shotlist.flatMap((shot) => [
    `### ${shot.shot_id}｜Motion Prompt`,
    '',
    shot.video_prompt_note ?? composeMotionPromptLine(shot),
    ''
  ])
}

function composeExplicitCharacterBible(characters = []) {
  if (!characters.length) return ['- 按源剧本人物表和用户已有角色图锁定角色，不把台词/动作/场景等字段名当角色。']
  return characters.flatMap((character) => [
    `### ${character.identity_anchor}`,
    '',
    `- character_id: ${character.id}`,
    `- role: ${character.role}`,
    `- costume: ${character.costume_anchor}`,
    `- key_props: ${character.prop_anchor}`,
    `- micro_behavior: ${character.performance_anchor}`,
    `- continuity_rule: ${character.continuity_notes}`,
    `- negative_constraints: 不合并角色；不把台词、动作、画面、场景、音效识别成角色。`,
    ''
  ])
}

const EXPLICIT_SCENE_MOTHER_BIBLE = new Map([
  ['SCENE_01_OLD_BUILDING_EXTERIOR', {
    name: '老旧居民楼外景',
    boundary: '老式居民楼外立面、楼下入口、斑驳墙面、偏暗自然光；无人物，无剧情动作。'
  }],
  ['SCENE_02_INDOOR_STAIRWELL', {
    name: '封闭式室内老居民楼楼道 / 楼梯平台 / 转角 / 入户门外',
    boundary: '封闭式室内单元楼楼道；楼梯在楼内；不露天；不见天空；不见树木；没有开放连廊；无人物，无剧情动作。'
  }],
  ['SCENE_03_SMALL_APARTMENT_INTERIOR', {
    name: '一室一厅老旧出租屋室内 / 客厅 / 里屋门口',
    boundary: '小户型客厅、窗边小凳子、沙发、里屋门口和门缝归为同一母场景；无人物，无剧情动作。'
  }]
])

function composeExplicitSceneBible(shotlist) {
  const scenes = uniqueScenes(shotlist)
    .filter((scene) => EXPLICIT_SCENE_MOTHER_BIBLE.has(scene))
    .sort((left, right) => [...EXPLICIT_SCENE_MOTHER_BIBLE.keys()].indexOf(left) - [...EXPLICIT_SCENE_MOTHER_BIBLE.keys()].indexOf(right))
  return scenes.flatMap((scene) => [
    `### ${scene}`,
    '',
    '- asset_type: scene_mother_reference',
    `- name: ${EXPLICIT_SCENE_MOTHER_BIBLE.get(scene).name}`,
    '- rule: 母场景只锁定空间结构、光线方向、材质和色调；不写人物，不写剧情动作。',
    `- boundary: ${EXPLICIT_SCENE_MOTHER_BIBLE.get(scene).boundary}`,
    ''
  ])
}

function composeExplicitImageQueue({ contract, shotlist, characters }) {
  return [
    ...visualReferenceLines(contract, characters),
    ...composeImageAssetQueue({ contract, shotlist, characters })
  ]
}

const PROVIDED_CHARACTER_REFERENCE_ALIASES = new Map([
  ['江渝白', ['jiang-yubai', 'jiangyubai']],
  ['林听晚', ['lin-tingwan', 'lintingwan']],
  ['李大妈', ['li-dama', 'lidama']],
  ['晚晚', ['wanwan']]
])

function providedCharacterReferenceLine(name, paths = []) {
  const aliases = PROVIDED_CHARACTER_REFERENCE_ALIASES.get(name) ?? [name]
  const path = paths.find((candidate) => aliases.some((alias) => candidate.toLowerCase().includes(alias.toLowerCase())))
  return path ? `- 人物参考图（${name}）：\`${path}\`` : ''
}

function explicitSegmentUploadLines({ contract, segment, characters = [] }) {
  const names = segmentCharacterNames({ segment, characters })
  const paths = contract.visualReferences?.characterImages ?? []
  const characterLines = paths.length
    ? names.map((name) => providedCharacterReferenceLine(name, paths)).filter(Boolean)
    : segmentCharacterReferenceLines({ contract, segment, characters })
  const availableReferenceSlots = Math.max(0, MAX_UPLOAD_IMAGES_PER_FEED_CARD - 2 - segment.length)
  return [
    ...characterLines,
    ...sceneReferenceLines(contract),
    ...styleReferenceLines(contract)
  ].slice(0, availableReferenceSlots)
}

function composeExplicitVideoFeedPack({ contract, shotlist, characters = [] }) {
  const mode = contract.mode ?? 'draft'
  return segmentShots(shotlist, { maxShots: maxStoryboardImagesPerSegment(contract) }).flatMap((segment, index) => {
    const startFrame = segmentStartFrameName(index)
    const endFrame = segmentEndFrameName(index)
    const uploadLines = [
      ...explicitSegmentUploadLines({ contract, segment, characters }),
      `- 起始帧：\`${startFrame}\``,
      ...segment.map((shot) => `- \`${storyboardImageName(shot)}\``),
      `- 尾帧：\`${endFrame}\``
    ]
    return [
      `### 第 ${index + 1} 段：${segmentLabel(segment)}（${segmentDuration(segment)}s，上传图片 ${uploadLines.length} 张）`,
      '',
      mode === 'draft' ? '状态：草稿模式先不要上传；等出图模式生成图片后再用。' : '状态：出图模式可上传对应图片。',
      '',
      '上传图片：',
      '',
      ...uploadLines,
      '',
      '复制提示词：',
      '',
      '```text',
      `${segmentDuration(segment)}s / ${contract.target.aspectRatio} / ${contract.target.style}`,
      '严格按上传关键帧执行，不重写剧情。角色脸、发型、服装、场景方位和光线保持一致。',
      ...segment.map((shot) => `${shot.shot_id}: ${shot.video_prompt_note ?? composeMotionPromptLine(shot)}`),
      '每镜只执行一个主动作；不新增角色、不新增道具、不生成字幕、不跳切。',
      '```',
      ''
    ]
  })
}

function composeExplicitStoryboardDeliverable({ contract, draft }) {
  const mode = contract.mode ?? 'draft'
  const mainCharacter = draft.characters?.[0]
  const firstShot = draft.shotlist[0]
  const lastShot = draft.shotlist[draft.shotlist.length - 1]
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
    `我们在做什么：把用户已有 ${draft.shotlist.length} 个明确分镜转成 ${contract.target.durationSeconds}s、${contract.target.aspectRatio}、${contract.target.style} 的国漫草稿包；保持原分镜数量、顺序和剧情钩子，不擅自扩写。`,
    '',
    `成片一句话：${mainCharacter?.identity_anchor ?? '主角'}从“${shotPurpose(firstShot)}”进入故事，最后停在“${shotPurpose(lastShot)}”的悬念点上。`,
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
    `- preserve_existing_shot_count: true`,
    '',
    mainCharacter
      ? `主角锚点：${mainCharacter.identity_anchor}；服装/道具保持：${mainCharacter.costume_anchor} / ${mainCharacter.prop_anchor}。`
      : '主角锚点：按源故事和分镜设定保持一致。',
    '',
    '## SCRIPT_BEATS',
    '',
    ...composeExplicitScriptBeats(draft.shotlist),
    '',
    '## DIALOGUE_SCRIPT',
    '',
    '台词保留在这一层；Keyframe Prompt 不直接生成字幕或大段文字。',
    '',
    ...composeExplicitDialogueScript(draft.shotlist),
    '',
    '## DIRECTOR_BIBLE',
    '',
    '- 类型：国漫现实主义短剧；每张图是静态关键帧，不是完整剧情解释。',
    `- 画幅 / 风格：${contract.target.aspectRatio} / ${contract.target.style}`,
    '- 视觉语言：电影式构图、干净线稿、细腻光影、低饱和暖灰色调。',
    '- 分层规则：导演分析留在文档；角色身份留在角色参考；母场景无人物；关键帧只写当前可见瞬间；运动提示只写一个动作。',
    '',
    '## CHARACTER_BIBLE',
    '',
    ...composeExplicitCharacterBible(draft.characters),
    '## SCENE_BIBLE',
    '',
    ...composeExplicitSceneBible(draft.shotlist),
    '## ART_DIRECTION',
    '',
    `- 色彩：${contract.target.style}。`,
    '- 镜头语言：可以有电影式构图和运镜，但不切换成摄影写实质感。',
    '- Keyframe 提示词只描述静态当前瞬间；Motion Prompt 才描述视频运动。',
    '',
    '## STORYBOARD：Shot Definition',
    '',
    ...composeExplicitShotDefinitions(draft.shotlist),
    '## KEYFRAME_PROMPTS',
    '',
    ...composeExplicitKeyframePromptList(draft.shotlist),
    '## MOTION_PROMPTS',
    '',
    ...composeExplicitMotionPrompts(draft.shotlist),
    '## 精简分镜',
    '',
    ...composeShotTable(draft.shotlist),
    '',
    '## 出图清单',
    '',
    mode === 'draft'
      ? '草稿模式只准备文件位和提示词，不生成图片；进入出图模式后按同一清单生成。'
      : '出图模式按此清单生成或补齐静态图。',
    '',
    ...composeExplicitImageQueue({ contract, shotlist: draft.shotlist, characters: draft.characters }),
    '',
    '## 视频工具投喂包',
    '',
    '每段只上传对应参考图、首帧、关键帧和尾帧；每条提示只执行本段 motion prompt，不新增剧情。',
    '',
    ...composeExplicitVideoFeedPack({ contract, shotlist: draft.shotlist, characters: draft.characters }),
    '## QUALITY_CHECK',
    '',
    '- shot_count_drift: pass（显式分镜数量已保持）',
    '- role_parse_error: pass（字段标签未进入角色表）',
    '- scene_mother_contamination: pass（母场景说明不含人物调度）',
    '- keyframe_current_moment: pass（关键帧只写当前可见画面）',
    '- motion_overload: pass（每条 motion prompt 一个主动作）',
    '',
    '## 视觉参考',
    '',
    ...visualReferenceLines(contract, draft.characters),
    '',
    '## 连续性注意事项',
    '',
    '- 已有角色图优先；不要重新发明脸、发型和服装。',
    '- 楼道必须是封闭式室内单元楼楼道；不露天，不见天空和树木。',
    '- 关键帧不生成字幕；台词只作为表演和节奏参考。',
    '- 最终视频合成由外部视频工具完成。'
  ].join('\n')
}

export function composeDeliverable({ contract, draft }) {
  if (contract.contentType === 'explicit_storyboard') return composeExplicitStoryboardDeliverable({ contract, draft })

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
        ...composeTextReadabilityPolicy(),
        '',
        ...composeDialoguePolicy(draft.shotlist),
        '',
        ...composeShotDensityController(contract, draft.shotlist),
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
