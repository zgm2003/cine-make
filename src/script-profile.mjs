const KNOWN_CHARACTER_SLUGS = new Map([
  ['林默', 'linmo'],
  ['安娜', 'anna'],
  ['雷队', 'leidui'],
  ['阿杰', 'ajie']
])

const KNOWN_CHARACTER_DETAILS = {
  林默: {
    height: '182cm',
    identity: '失忆私家侦探，本体人格',
    age: '30岁左右',
    appearance: '东亚男性，身形偏瘦，脸色苍白，神情疲惫，眼下有明显黑眼圈，嘴唇干裂，头发凌乱微湿',
    costume: '黑色湿呢大衣，白衬衫凌乱敞开一颗扣子，深色西裤，旧皮鞋；衣服有雨水痕迹、泥点和少量血迹',
    bodyDetails: '袖口卷起，手臂上有抓痕和浅浅刀刻文字“记忆只有10分钟”，双手沾有少量血迹',
    expression: '刚从噩梦中惊醒，紧张、疑心重、神经质，眼神警惕又迷茫',
    props: ['倒计时手机，屏幕显示“00:10:00”', '破旧侦探笔记', '带血小刀', '精神病院腕带'],
    mood: '孤岛暴雨、失忆、悬疑推理、人格分裂、精神病院隐喻；真实、克制、阴冷，不要夸张奇幻化'
  },
  安娜: {
    height: '168cm',
    identity: '心理医生，理智人格，自我保护机制',
    age: '32岁左右',
    appearance: '东亚女性，气质知性冷静，脸色偏冷白，黑色长发低束，银边眼镜，眼神温柔但疏离，表情克制',
    costume: '白衬衫，深灰长裙，黑色长外套，低跟黑皮鞋；衣服整洁但带轻微潮湿感，袖口有极淡血迹',
    bodyDetails: '手腕戴精神病院工作牌，指尖有药粉残留，眼下有轻微疲惫感',
    expression: '像在安抚病人，也像在隐瞒真相，冷静、温柔、带一点悲伤',
    props: ['病历夹', '药瓶', '热水杯', '精神病院工作牌', '钢笔'],
    mood: '理智、压抑、保护机制、精神病院隐喻、温柔外表下藏着秘密；真实、克制、阴冷，不要性感化，不要夸张奇幻化'
  },
  雷队: {
    height: '188cm',
    identity: '暴躁警探，攻击性人格，审判与正义的象征',
    age: '45岁左右',
    appearance: '东亚中年男性，高大强壮，脸部线条粗粝，眉骨深，胡茬明显，眼神凶狠警惕，嘴角紧绷',
    costume: '旧警服，黑色防雨外套，战术皮带，深色长裤，磨损皮靴；衣服有雨水、泥点、褶皱和少量血迹',
    bodyDetails: '手背有旧伤疤，肩膀宽厚，站姿压迫感强，习惯性把一只手放在枪套附近',
    expression: '愤怒、怀疑、控制欲强，像随时会审问或拔枪',
    props: ['老式手枪', '警徽', '强光手电筒', '染血证物袋', '旧案卷'],
    mood: '攻击性人格、审判、暴力、压迫感、暴风雨山庄式警探；真实、克制、阴冷，不要超级英雄化，不要夸张肌肉怪物化'
  },
  阿杰: {
    height: '174cm',
    identity: '瘸腿青年，邪恶人格，隐藏操控者',
    age: '24岁左右',
    appearance: '东亚青年男性，瘦弱苍白，湿乱黑发，脸颊消瘦，嘴唇发白，眼神表面惊恐，深处阴冷狡猾',
    costume: '旧深色毛衣，里面露出褪色衬衫，深灰长裤，磨损布鞋；衣服潮湿、起球、袖口磨破',
    bodyDetails: '右腿戴简陋腿部支架，一只手扶旧拐杖，站姿畏缩，肩膀内扣；身体影子姿态笔直，暗示伪装',
    expression: '嘴角微微发抖，像害怕到快哭出来，但眼底有一丝诡异笑意',
    props: ['旧拐杖', '腿部支架', '写着“凯撒”的纸牌', '折断铅笔', '旧钥匙'],
    mood: '表面怯懦、实际操控、邪恶人格、伪装、人格夺舍；真实、克制、阴冷，不要过度怪物化，不要夸张奇幻化'
  }
}

function stableHash(value) {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function characterSlug(name) {
  return KNOWN_CHARACTER_SLUGS.get(name) ?? stableHash(name).slice(0, 8)
}

export function stripPersonalSummary(sourceText) {
  return String(sourceText)
    .split(/\n\s*-{4,}\s*以下为个人总结\s*-{4,}[\s\S]*$/u)[0]
    .split(/\n\s*以下为个人总结[\s\S]*$/u)[0]
    .trim()
}

function compact(value) {
  return String(value).replace(/\s+/g, ' ').replace(/^[“”"'\s]+|[“”"'\s]+$/gu, '').trim()
}

function trimScriptBeatPrefix(value) {
  return compact(value)
    .replace(/^▲\s*【[^】]+】\s*/u, '')
    .replace(/^【[^】]+】\s*/u, '')
    .trim()
}

function inferGenericCharacter({ name, label, description }) {
  const isFemale = /女|医生|安娜/u.test(`${label}${description}`)
  const role = label || '角色'
  return {
    name,
    role,
    height: isFemale ? '168cm' : '178cm',
    identity: `${description || role}`,
    age: isFemale ? '30岁左右' : '30岁左右',
    appearance: isFemale
      ? '东亚女性，真实人类面部比例，神情克制，眼神有明确情绪压力'
      : '东亚男性，真实人类面部比例，神情克制，带有剧情压力和自然瑕疵',
    costume: '符合剧本身份的现实服装，真实布料、褶皱、雨水或使用痕迹',
    bodyDetails: '保留剧本中明确出现的伤痕、道具接触痕迹和身体状态，不额外怪物化',
    expression: '表情克制，眼神和呼吸先泄露情绪，不做夸张戏剧化表演',
    props: [],
    mood: '真人心理惊悚短剧气质，真实、克制、阴冷'
  }
}

function composeCharacterReferencePrompt(character) {
  const clinical = /心理医生|理智|药|病历/u.test(character.identity)
    ? ', clinical psychological horror atmosphere'
    : /警探|审判|正义|枪/u.test(character.identity)
      ? ', noir detective atmosphere'
      : /瘸|邪恶|操控|隐藏/u.test(character.identity)
        ? ', hidden villain atmosphere, subtle sinister smile'
        : ''

  return [
    '真人电影角色定妆照，写实摄影风格，白色或浅灰摄影棚背景，心理惊悚电影氛围，电影级低调布光，真实人类面部比例，真实皮肤纹理，毛孔细节，眼袋，细微皱纹，自然发丝，真实服装材质，非插画，非漫画，非CG。',
    '',
    '画面为专业影视角色设定参考图：左侧是角色半身近景特写，右侧是角色正面、侧面、背面三视图全身定妆照，旁边整齐摆放核心道具。画面上方预留干净信息栏，用于后期添加角色名称、身高和道具说明。',
    '',
    `角色名称：${character.name}`,
    `身高：${character.height}`,
    `身份：${character.identity}`,
    `年龄：${character.age}`,
    `外貌：${character.appearance}。`,
    `服装：${character.costume}。`,
    `身体细节：${character.bodyDetails}。`,
    `表情：${character.expression}。`,
    `核心道具：${character.props.length ? character.props.join('；') : '按剧本身份配置一到三件现实道具，不要发明奇幻物件'}。`,
    '',
    `整体气质：${character.mood}。`,
    '',
    `photorealistic, live action film still, cinematic portrait photography, realistic human face, realistic skin pores, natural imperfections, practical costume design, studio character reference photo, character turnaround, front view, side view, back view, prop reference, high detail, sharp focus, 35mm lens, dramatic low key lighting, muted colors, psychological thriller mood, realistic wet fabric, realistic blood stains${clinical}.`,
    '',
    '负面提示词：anime, manga, cartoon, illustration, comic style, concept art, 3d render, CGI, doll face, plastic skin, perfect skin, over smooth skin, fantasy armor, cyberpunk, exaggerated features, monster, deformed hands, extra fingers, bad anatomy, blurry text, unreadable text, watermark, logo, low resolution.'
  ].join('\n')
}

function enrichCharacter(raw) {
  const known = KNOWN_CHARACTER_DETAILS[raw.name]
  const character = known
    ? { ...known, name: raw.name, role: raw.label || raw.role }
    : { ...inferGenericCharacter(raw), name: raw.name, role: raw.label || raw.role }
  const slug = characterSlug(character.name)

  return {
    id: `character-${slug}`,
    role: character.role,
    identity_anchor: character.name,
    identity: character.identity,
    height: character.height,
    age: character.age,
    appearance: character.appearance,
    costume: character.costume,
    body_details: character.bodyDetails,
    expression: character.expression,
    props: character.props,
    mood: character.mood,
    costume_anchor: character.costume,
    prop_anchor: character.props.join('、') || '核心道具',
    performance_anchor: character.expression,
    preset_policy: `Treat ${character.name} as one stable live-action character reference across every storyboard and video feed card.`,
    continuity_notes: `Keep ${character.name}'s face, hair, body proportions, costume, wet fabric state, and props stable.`,
    reference_image: `storyboard-images/character-${slug}.png`,
    reference_prompt: composeCharacterReferencePrompt(character)
  }
}

function parseCast(sourceText) {
  const cast = []
  const seen = new Set()
  for (const line of String(sourceText).split(/\n+/u).map((item) => item.trim()).filter(Boolean)) {
    const match = line.match(/^([\u4e00-\u9fa5A-Za-z0-9]{2,8})（([^）]{1,20})）[:：]\s*(.+)$/u)
    if (!match) continue
    const [, name, label, description] = match
    if (seen.has(name)) continue
    seen.add(name)
    cast.push(enrichCharacter({ name, label, description }))
  }
  return cast
}

function scriptBody(sourceText) {
  const cleaned = stripPersonalSummary(sourceText)
  const start = cleaned.search(/第[一二三四五六七八九十0-9]+集剧本|第一集剧本|\[场景/u)
  return start === -1 ? cleaned : cleaned.slice(start)
}

function beatCharacters(raw, cast) {
  const names = cast.filter((character) => raw.includes(character.identity_anchor)).map((character) => character.identity_anchor)
  if (/另外三个人|三个人|众人|所有人/u.test(raw)) {
    for (const character of cast) {
      if (!names.includes(character.identity_anchor)) names.push(character.identity_anchor)
    }
  }
  if (!names.length && cast[0]) names.push(cast[0].identity_anchor)
  return names
}

function pushBeat(beats, cast, raw, kind, location) {
  const visualAction = trimScriptBeatPrefix(raw)
  if (!visualAction || visualAction.length < 4) return
  if (/^(第[一二三四五六七八九十0-9]+集剧本|角色设定|漫剧概念设定|核心创意)/u.test(visualAction)) return
  beats.push({
    id: `B${String(beats.length + 1).padStart(2, '0')}`,
    raw: visualAction,
    kind,
    characters: beatCharacters(visualAction, cast),
    location,
    visualAction
  })
}

function parseBeats(sourceText, cast) {
  const body = scriptBody(sourceText)
  const lines = body.split(/\n+/u).map((line) => line.trim()).filter(Boolean)
  const beats = []
  let location = ''

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const scene = line.match(/^\[场景[:：]\s*([^\]]+)\]$/u)
    if (scene) {
      location = scene[1].replace(/\s*-\s*/g, ' - ')
      continue
    }

    if (/^第[一二三四五六七八九十0-9]+集剧本/u.test(line)) continue
    if (/^[\u4e00-\u9fa5A-Za-z0-9]{2,8}（[^）]+）[:：]\s*.+$/u.test(line)) continue

    const visual = line.match(/^▲\s*【(画面|音效)】\s*(.+)$/u)
    if (visual) {
      pushBeat(beats, cast, visual[2], visual[1] === '音效' ? 'sound' : 'visual', location)
      continue
    }

    const speakerOnly = line.match(/^([^：:]{1,24})[：:]$/u)
    if (speakerOnly && index + 1 < lines.length) {
      const dialogue = trimScriptBeatPrefix(lines[index + 1])
      pushBeat(beats, cast, `${speakerOnly[1]}：${dialogue}`, 'dialogue', location)
      index += 1
      continue
    }

    const inlineDialogue = line.match(/^([^：:]{1,24})[：:]\s*(.+)$/u)
    if (inlineDialogue) {
      pushBeat(beats, cast, `${inlineDialogue[1]}：${inlineDialogue[2]}`, 'dialogue', location)
      continue
    }

    if (cast.some((character) => line.includes(character.identity_anchor))) {
      pushBeat(beats, cast, line, 'visual', location)
    }
  }

  return beats
}

function parseScenes(sourceText) {
  return [...stripPersonalSummary(sourceText).matchAll(/\[场景[:：]\s*([^\]]+)\]/gu)]
    .map((match) => match[1].replace(/\s*-\s*/g, ' - '))
}

export function extractScriptProfile(sourceText) {
  const cleaned = stripPersonalSummary(sourceText)
  const cast = parseCast(cleaned)
  const beats = parseBeats(cleaned, cast)
  const props = [...new Set(cast.flatMap((character) => character.props ?? []))]
  return {
    cast,
    beats,
    scenes: parseScenes(cleaned),
    props
  }
}

export function isScriptProfileUseful(profile) {
  return Boolean(profile && profile.cast?.length >= 3 && profile.beats?.length >= 4)
}

function uniqueCharacters(beats) {
  const names = []
  for (const beat of beats) {
    for (const name of beat.characters ?? []) {
      if (!names.includes(name)) names.push(name)
    }
  }
  return names
}

function overlayAction(beat) {
  if (beat.kind === 'sound') return `音效：${beat.visualAction}`
  if (beat.kind === 'dialogue') return `台词：${beat.visualAction}`
  return beat.visualAction
}

function composeShotVisualAction(primaryBeat, overlays) {
  return [primaryBeat.visualAction, ...overlays.map(overlayAction)]
    .filter(Boolean)
    .join('；')
}

function estimateScriptShotDuration(shot) {
  const action = shot.visualAction
  if (/阿杰.*凯撒|幕后黑手/u.test(action)) return 4
  if (/安娜.*失忆症|雷队.*老张被杀|死无对证/u.test(action)) return 4
  if (/眼神瞬间空洞.*你们.*是谁/u.test(action)) return 4
  if (/内心独白|我是谁|记忆又在消失/u.test(action)) return 3
  if (/惊醒|满是鲜血|手臂|刻着|记忆只有10分钟|捂住头|精神病院|眼神瞬间空洞/u.test(action)) return 3
  if (/另外三个人|三个人|所有人/u.test(action)) return 3
  return 2
}

function shouldOverlayBeat(beat, previousShot) {
  if (!previousShot) return false
  const previousAction = previousShot.primary.visualAction
  if (beat.kind === 'sound') return true
  return beat.kind === 'dialogue' && /你们.*是谁/u.test(beat.visualAction) && /眼神瞬间空洞|仿佛第一天|记忆清空/u.test(previousAction)
}

export function createScriptShotPlan(profile) {
  const shots = []

  for (const beat of profile?.beats ?? []) {
    if (shouldOverlayBeat(beat, shots.at(-1))) {
      shots[shots.length - 1].overlays.push(beat)
      continue
    }

    shots.push({
      primary: beat,
      overlays: []
    })
  }

  return shots.map((shot, index) => {
    const coveredBeats = [shot.primary, ...shot.overlays]
    const visualAction = composeShotVisualAction(shot.primary, shot.overlays)
    const planned = {
      id: `SP${String(index + 1).padStart(2, '0')}`,
      kind: shot.primary.kind,
      raw: visualAction,
      visualAction,
      characters: uniqueCharacters(coveredBeats),
      location: shot.primary.location,
      sourceBeatIds: coveredBeats.map((beat) => beat.id)
    }
    return {
      ...planned,
      durationSeconds: estimateScriptShotDuration(planned)
    }
  })
}

export function inferScriptProfileSizing(profile) {
  if (!isScriptProfileUseful(profile)) return null
  const shotPlan = createScriptShotPlan(profile)
  if (!shotPlan.length) return null
  return {
    durationSeconds: shotPlan.reduce((total, shot) => total + shot.durationSeconds, 0),
    shotCount: shotPlan.length
  }
}
