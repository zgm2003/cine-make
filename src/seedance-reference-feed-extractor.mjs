import {
  isTijiaGuomanSource,
  tijiaGuomanAssetDefinitions,
  tijiaGuomanGlobalNegative,
  tijiaGuomanStyle,
  tijiaGuomanTitle,
  tijiaGuomanVideoLines
} from './tijia-guoman-profile.mjs'

const DEFAULT_ASPECT = '16:9'
const FORBIDDEN_VIDEO_META = /续接|承接|下一段|下一场|后续|首帧|尾帧|首尾|segment|storyboard-images|S\d{2}|keyframe|控制帧|分镜图/u

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function stripSourcePrefix(sourceText) {
  return compact(sourceText).replace(/^(画面|剧情|剧本|小说片段|粗剧本|广告短片|广告文案)[:：]\s*/u, '')
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

function sceneName(sourceText) {
  if (/雪山|风雪|雪地|雪峰/u.test(sourceText)) return '雪山之巅 / 棚拍雪山场景'
  if (/废墟/u.test(sourceText)) return '废墟场景'
  if (/祠堂|神龛/u.test(sourceText)) return '古祠堂'
  if (/楼道|楼梯/u.test(sourceText)) return '楼道 / 楼梯间'
  if (/客厅|室内/u.test(sourceText)) return '室内主场景'
  return '主要场景'
}

function characterName(sourceText) {
  if (/道清/u.test(sourceText)) return '老年道清'
  if (/老道人|老道|道人/u.test(sourceText)) return '老年道清'
  const named = sourceText.match(/([\u4e00-\u9fa5]{2,4})(?=身穿|头戴|抱着|走|倒|看|说|站|冲|抬|伸)/u)
  return named?.[1] ?? '主要人物'
}

function creatureName(sourceText) {
  if (/麒麟幼兽|小麒麟|幼麟/u.test(sourceText)) return '麒麟幼兽'
  if (/麒麟/u.test(sourceText)) return '麒麟幼兽'
  if (/怪物|异兽|妖兽/u.test(sourceText)) return '异兽'
  return ''
}

function makeBindingLabel(index, kind) {
  return `${kind === 'audio' ? '音频' : '图片'}${index}`
}

function characterTriViewTemplate({ name, details, style, aspectRatio }) {
  return [
    `GPT-image-2，${aspectRatio}，${style}。`,
    `【三视图生成模板】设计人物三视图：${name}，正面全身照、侧面全身照、背面全身照，最左侧单独的上半身+头部细节展示，背景为白色，整体构图工整专业。三视图为一张图。`,
    `画面最左侧：${name}的上半身+头部细节特写，脸部、发型、五官、皮肤/胡须/发丝/材质细节清晰。`,
    `画面主体区域：同一角色依次展示正面全身照、侧面全身照、背面全身照，完整显示从头到脚，不裁切脚部。`,
    `角色设定：${details}`,
    '四个展示区必须属于同一个角色，同一张脸、同一发型、同一体型、同一服装、同一配饰。',
    '白色或极浅灰纯净背景，专业影视角色设定稿排版；不要剧情动作，不要复杂场景，不要多人，不要换装，不要海报构图，不要文字水印。'
  ].join('')
}

function creatureTriViewTemplate({ name, details, style, aspectRatio }) {
  return [
    `GPT-image-2，${aspectRatio}，${style}。`,
    `【三视图生成模板】设计生物三视图：${name}，正面全身照、侧面全身照、背面全身照，最左侧单独的上半身+头部细节展示，背景为白色，整体构图工整专业。三视图为一张图。`,
    `画面最左侧：${name}的头部、眼睛、角、鬃毛、鳞片或皮毛材质细节特写。`,
    `画面主体区域：同一只${name}依次展示正面全身照、侧面全身照、背面全身照，完整显示身体比例、四肢、尾部和背部结构。`,
    `生物设定：${details}`,
    '四个展示区必须属于同一只生物，同一体型、同一比例、同一角形、同一鳞片/皮毛材质。',
    '白色或极浅灰纯净背景，专业影视生物设定稿排版；不要剧情动作，不要复杂场景，不要Q版，不要文字水印。'
  ].join('')
}

function scenePrompt({ name, sourceText, style, aspectRatio }) {
  const snow = /雪山|风雪|雪地|雪峰/u.test(sourceText)
  const base = snow
    ? '巨大雪峰背景，近处雪地平台，地面有脚印和可延伸血痕，风雪横向吹动，蓝灰低饱和，真实电影置景结合数字延展，悲怆史诗气质'
    : '核心故事场景，空间结构清楚，入口、主体活动区、前景遮挡、背景纵深和关键道具落点明确，真实电影置景质感'
  return `GPT-image-2，${aspectRatio}，${style}。${name}参考图，${base}。不要人物，不要现代多余元素，不要文字水印。`
}

function inferCharacterDetails(sourceText) {
  if (/老道人|老道|道清|道人/u.test(sourceText)) {
    return '头发花白且凌乱，旧斗笠压低遮住半张脸，破旧蓑衣，深色旧道袍，佝偻瘦削，苍老疲惫，脸部有冻伤和风雪痕迹，双手粗糙，衣摆有少量暗红血迹。不要年轻化、不要华丽仙侠服、不要干净飘逸、不要现代服装。'
  }
  return '按剧本锁定年龄、脸型、发型、体型、服装、配饰和核心道具；克制表演，影视角色设定稿质感。'
}

function inferCreatureDetails(sourceText) {
  if (/麒麟/u.test(sourceText)) {
    return '虚弱的上古麒麟幼兽，小型幼兽，可被老人抱在怀里，小角，细密鳞片，湿冷鬃毛，眼神含泪，身体沾雪和少量血迹，奄奄一息但有灵性。不要成年巨兽、不要龙化过强、不要猫狗化、不要Q版、不要大面积法术光。'
  }
  return '按剧本锁定体型、比例、头部、四肢、皮毛/鳞片材质和标志性特征，影视生物设定稿质感。'
}

function addImageAsset(assets, { id, title, prompt }) {
  assets.push({
    id,
    kind: 'image',
    bindingLabel: makeBindingLabel(assets.length + 1, 'image'),
    title,
    prompt
  })
}

function addAudioAsset(assets, { id, title, prompt }) {
  assets.push({
    id,
    kind: 'audio',
    bindingLabel: makeBindingLabel(assets.length + 1, 'audio'),
    title,
    prompt
  })
}

function buildAssets({ sourceText, style, aspectRatio }) {
  if (isTijiaGuomanSource(sourceText)) {
    const assets = []
    for (const definition of tijiaGuomanAssetDefinitions({ sourceText, style, aspectRatio })) {
      addImageAsset(assets, {
        id: definition.id,
        title: definition.title,
        prompt: definition.prompt
      })
    }
    return assets
  }

  const assets = []
  const scene = sceneName(sourceText)
  const character = characterName(sourceText)
  const creature = creatureName(sourceText)

  addImageAsset(assets, {
    id: 'scene-primary',
    title: scene,
    prompt: scenePrompt({ name: scene, sourceText, style, aspectRatio })
  })

  addImageAsset(assets, {
    id: 'character-primary',
    title: `${character}三视图`,
    prompt: characterTriViewTemplate({
      name: character,
      details: inferCharacterDetails(sourceText),
      style,
      aspectRatio
    })
  })

  if (creature) {
    addImageAsset(assets, {
      id: 'creature-primary',
      title: `${creature}三视图`,
      prompt: creatureTriViewTemplate({
        name: creature,
        details: inferCreatureDetails(sourceText),
        style,
        aspectRatio
      })
    })
  }

  if (/风雪|雪山|雪地/u.test(sourceText)) {
    addAudioAsset(assets, {
      id: 'audio-wind-snow',
      title: '风雪环境音参考',
      prompt: '高海拔雪山寒风，持续横向风声，雪粒刮过衣料和地面，空间空旷，声音冷、薄、压迫。不要音乐、不要鼓点、不要史诗配乐。'
    })
  }

  if (/麒麟|幼兽|异兽/u.test(sourceText)) {
    addAudioAsset(assets, {
      id: 'audio-creature-breath',
      title: '麒麟幼兽弱鸣参考',
      prompt: '小型幼兽虚弱喘息和低弱鸣咽，短促、轻、湿冷、带疲惫感。不要怪兽咆哮，不要宠物卖萌声，不要卡通音效。'
    })
  }

  return assets
}

function snowQilinVideoLines() {
  return [
    '雪山之巅（日外） 老年道清的旧布靴狠狠踩进厚雪，雪粉被脚掌压开，地面冰裂纹和雪粒清晰。雪地特写 + 低机位 + 缓慢推近 + 冷蓝灰高对比。环境音：狂风、雪粒刮过地面。',
    '雪山之巅（日外） 巨大雪峰前，老年道清佝偻着背艰难前行，身影被雪山压得很小，蓑衣和斗笠被风雪打湿。雪山大全景 + 轻微空中平移 + 大远景压迫构图 + 人物位于画面下方三分之一。环境音：持续寒风，无对白。',
    '雪山之巅（日外） 老年道清正面45度迎着风雪前行，花白凌乱头发从斗笠边露出，双手紧紧抱着虚弱的麒麟幼兽贴在胸前，麒麟幼兽被蓑衣和手臂护住但头部与小角露出。人物小全景 + 85mm压缩感 + 冷光侧逆光 + 蓑衣纹理清楚 + 老人与幼兽同框。环境音：蓑衣被风拍打，麒麟低弱喘息。',
    '雪山之巅（日外） 道清侧面走过，斗笠压低遮住半张脸，只露出苍白冻伤的下半张脸和结霜胡须，嘴唇失血发白。侧面近景 + 平视 + 斗笠阴影构图 + 背景雪山虚化。环境音：风声贴脸掠过，无对白。',
    '雪山之巅（日外） 道清怀中露出虚弱的麒麟幼兽，小角和细鳞沾满雪，眼睛半睁，呼吸很弱，道清粗糙双手从两侧护住它。麒麟幼兽特写 + 胸前怀抱构图 + 冷光细节 + 幼兽微弱青金反光。音效：麒麟低弱喘息。',
    '雪山之巅（日外） 鲜血一滴滴落在白雪上，暗红色在雪粒之间慢慢扩散，道清模糊背影还在前方艰难移动，身后留下长长血痕。贴地特写 + 血滴前景 + 道清背影中远景 + 纵深血痕构图。音效：血滴落雪、风声更重。',
    '雪山之巅（日外） 道清膝盖突然发软，身体向前一沉，斗笠歪斜，双臂仍本能地把麒麟幼兽往怀里护紧。半身近景 + 手持感轻微晃动 + 失衡构图 + 蓑衣边缘积雪抖落。环境音：沉重喘息、风雪拍打蓑衣。',
    '雪山之巅（日外） 道清终于支撑不住，身体倒进雪地，怀里的麒麟幼兽被甩出一小段距离，滚到前景雪地里，雪粉溅起后落下。全景 + 前后景关系 + 道清后景倒地 + 麒麟前景滚停。音效：身体砸进雪地的闷响，麒麟短促弱鸣。',
    '雪山之巅（日外） 麒麟幼兽趴在前景雪地里，艰难抬头看向远处倒下的道清，眼中含泪，细小麟角沾着雪粒。麒麟脸部特写 + 低机位 + 背景道清模糊可见 + 冷蓝灰反光。音效：麒麟低弱鸣咽。',
    '雪山之巅（日外） 麒麟幼兽拖着虚弱身体，一步一步走回道清身边，四肢陷进雪里，雪地血痕连接着老人和幼兽。中景 + 低角度跟随 + 冷白雪面反光 + 幼兽动作慢而吃力。音效：细小脚步压雪、虚弱喘息。',
    '雪山之巅（日外） 麒麟幼兽来到道清脸旁，低头靠近他沾雪的面颊，道清几乎不能动，眼睛半睁，嘴唇发白。关系近景 + 道清与麒麟同框 + 斗笠歪斜覆雪 + 亲密悲怆构图。环境音：风声稍低，麒麟轻微鸣咽。',
    '雪山之巅（日外） 麒麟幼兽用舌头轻轻舔舐道清的面颊，雪粒落在幼兽睫毛、细鳞和小角上，道清的眼神微微动了一下。特写 + 平视 + 浅景深 + 冷光反射 + 情绪克制。音效：麒麟低弱鸣咽，不要怪兽咆哮。',
    '雪山之巅（日外） 道清冻伤粗糙的手从雪中缓缓抬起，手背上的雪粉滑落，颤抖指尖朝麒麟幼兽额角靠近。手部特写 + 雪粉滑落 + 指尖接近幼兽鬃毛 + 冷蓝灰雪光。音效：衣料摩擦、风声压低。',
    '雪山之巅（日外） 道清奄奄一息地触摸麒麟幼兽的额角，麒麟幼兽低头贴近他的手，老人、幼兽、血痕和风雪都保持安静克制。近景双主体 + 85mm缓慢推近 + 斗笠阴影遮半脸 + 幼兽微弱青金反光落在老人手背。环境音：寒风、细雪摩擦蓑衣、麒麟极轻的喘息，无对白。'
  ]
}

function genericVideoLines(sourceText) {
  const cleaned = stripSourcePrefix(sourceText)
  const chunks = cleaned
    .split(/[。！？!?；;]\s*/u)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
  const parts = chunks.length ? chunks : [cleaned]
  const scene = sceneName(sourceText).split('/')[0].trim()
  return parts.map((part, index) => {
    const shot = index % 3 === 0 ? '中景' : index % 3 === 1 ? '近景' : '特写'
    return `${scene} ${part}。${shot} + 平视或轻微低机位 + 画面主体清楚 + 动作只保留当前句的可见内容。环境音：按场景保留真实声音，无对白时不加对白。`
  })
}

function buildVideoLines({ sourceText, expandScript }) {
  const lines = isTijiaGuomanSource(sourceText)
    ? tijiaGuomanVideoLines()
    : hasAny(sourceText, [/雪山/u, /麒麟/u, /老道|道清|老道人/u])
    ? snowQilinVideoLines()
    : genericVideoLines(sourceText)
  const selected = expandScript ? lines : lines.slice(0, Math.min(lines.length, 14))
  return selected.map((line) => {
    if (FORBIDDEN_VIDEO_META.test(line)) {
      throw new Error(`Seedance video line contains forbidden meta language: ${line}`)
    }
    return line
  })
}

function titleFromSource(sourceText) {
  if (isTijiaGuomanSource(sourceText)) return tijiaGuomanTitle()
  if (/雪山|麒麟|老道|道清/u.test(sourceText)) return '雪山之巅护麟'
  return sceneName(sourceText).replace(/\s*\/.*$/u, '')
}

function globalNegative({ sourceText, style, aspectRatio }) {
  if (isTijiaGuomanSource(sourceText)) return tijiaGuomanGlobalNegative({ style, aspectRatio })
  const base = [
    `不要字幕、不要配乐，只保留环境音和必要对白。${style}，${aspectRatio}，参考图优先于文字。`,
    '人物造型不能变，角色体型不能变，服装配饰不能乱，场景方向不能乱。',
    '不要现代无关元素，不要无关人物，不要卡通，不要魔法爆炸，不要画面切到剧本以外的地点。'
  ]
  if (/雪山|风雪/u.test(sourceText)) base.push('风雪方向保持横向吹动，血痕方向保持一致。')
  return base.join('')
}

function bottomNote(assets) {
  return assets
    .filter((asset) => asset.kind === 'image')
    .map((asset) => `${asset.title.replace(/\s*\/.*$/u, '').replace(/三视图$/u, '')}=${asset.bindingLabel}`)
    .join('  ')
}

export function buildSeedanceReferenceFeedPackage({
  sourceText,
  style,
  aspectRatio = DEFAULT_ASPECT,
  expandScript = false
}) {
  const cleanSourceText = stripSourcePrefix(sourceText)
  if (!cleanSourceText) throw new Error('Seedance reference feed requires source story material')
  if (!compact(style)) throw new Error('Seedance reference feed requires a visual style')
  const normalizedStyle = isTijiaGuomanSource(cleanSourceText) ? tijiaGuomanStyle(style) : compact(style)
  const assets = buildAssets({ sourceText: cleanSourceText, style: normalizedStyle, aspectRatio })
  return {
    kind: 'seedance_all_reference_feed',
    title: titleFromSource(cleanSourceText),
    sourceText: cleanSourceText,
    style: normalizedStyle,
    aspectRatio,
    expandScript: Boolean(expandScript),
    assets,
    globalNegative: globalNegative({ sourceText: cleanSourceText, style: normalizedStyle, aspectRatio }),
    videoLines: buildVideoLines({ sourceText: cleanSourceText, expandScript }),
    bottomNote: bottomNote(assets),
    bottomConstraint: isTijiaGuomanSource(cleanSourceText)
      ? `【不要字幕、不要文字水印】${normalizedStyle}，${aspectRatio}，参考图优先于文字。每5条视频文本=15s。`
      : undefined
  }
}
