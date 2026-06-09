import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { composeDraftAssets } from './draft-writer.mjs'
import { createStoredZip } from './zip-writer.mjs'

const CANVAS_APP = 'infinite-canvas'
const CANVAS_VERSION = 3
const IMAGE_NODE_WIDTH = 300
const IMAGE_NODE_HEIGHT = 420
const LANDSCAPE_IMAGE_NODE_WIDTH = 420
const LANDSCAPE_IMAGE_NODE_HEIGHT = 260
const TEXT_NODE_WIDTH = 340
const TEXT_NODE_HEIGHT = 260
const VIDEO_NODE_WIDTH = 360
const VIDEO_NODE_HEIGHT = 240
const GAP_X = 380
const ROW_HEIGHT = 520
const SHOTS_PER_SEGMENT = 4

const PROP_CATALOG = [
  {
    id: 'prop-phone',
    title: '道具：倒计时手机',
    label: '手机',
    triggers: ['手机', '闹钟', '倒计时', '00:00:00', '00:10:00'],
    prompt: '超写实真人电影道具参考图：一部旧智能手机，屏幕显示倒计时数字，边缘有雨水、血迹和细小划痕，心理惊悚电影氛围，暗色背景，85mm镜头，4K，真实玻璃反光，不要水印、字幕、logo。'
  },
  {
    id: 'prop-teapot',
    title: '道具：茶壶 / 热水杯',
    label: '茶壶',
    triggers: ['茶壶', '热水', '水杯', '倒水'],
    prompt: '超写实真人电影道具参考图：旧别墅茶几上的陶瓷茶壶和热水杯，杯口有热气，表面有雨夜冷光反射，悬疑片低调布光，85mm镜头，4K，真实材质，不要水印、字幕、logo。'
  },
  {
    id: 'prop-gun',
    title: '道具：老式手枪',
    label: '枪',
    triggers: ['枪', '手枪', '枪口', '拔枪'],
    prompt: '超写实真人电影道具参考图：磨损老式手枪，金属有雨水和指纹，旁边有旧警用枪套，暗黑心理惊悚氛围，85mm镜头，4K，真实金属材质，不要水印、字幕、logo。'
  },
  {
    id: 'prop-police-badge',
    title: '道具：警徽',
    label: '警徽',
    triggers: ['警徽'],
    prompt: '超写实真人电影道具参考图：旧警徽放在潮湿木桌上，边缘磨损，冷色闪电反光，心理惊悚电影低调布光，85mm镜头，4K，真实金属质感，不要水印、字幕、logo。'
  },
  {
    id: 'prop-bloody-scalpel',
    title: '道具：带血解剖刀',
    label: '带血的解剖刀',
    triggers: ['解剖刀', '解刨刀', '手术刀'],
    prompt: '超写实真人电影道具参考图：带血解剖刀放在旧证物袋旁，刀刃有暗红血迹和冷色反光，精神病院线索氛围，85mm镜头，4K，真实金属和血迹材质，不要水印、字幕、logo。'
  },
  {
    id: 'prop-bloody-knife',
    title: '道具：带血小刀 / 手臂刻字',
    label: '带血小刀',
    triggers: ['小刀', '刀刻', '刻字'],
    prompt: '超写实真人电影道具参考图：带血小刀和手臂刻字细节，浅浅刀痕写着记忆只有10分钟，皮肤纹理真实，血迹克制，心理惊悚电影低调布光，85mm镜头，4K，不要水印、字幕、logo。'
  },
  {
    id: 'prop-medical-file',
    title: '道具：病历夹 / 药瓶',
    label: '病历夹',
    triggers: ['病历', '药瓶', '精神病院', '圣路易斯'],
    prompt: '超写实真人电影道具参考图：精神病院病历夹、药瓶和旧工作牌摆在潮湿茶几上，纸张边缘发皱，冷色低调布光，85mm镜头，4K，真实纸张与玻璃材质，不要水印、字幕、logo。'
  }
]

export async function exportCanvasPromptPack({ outDir, contract } = {}) {
  if (!outDir) throw new Error('canvas prompt pack requires outDir')
  if (!contract) throw new Error('canvas prompt pack requires contract')

  await mkdir(outDir, { recursive: true })

  const draft = composeDraftAssets(contract)
  const manifest = buildCanvasPromptPackManifest({ contract, draft })
  return writeCanvasPackage({ outDir, manifest })
}

export async function exportCanvasStoryboardPack({ outDir, contract } = {}) {
  if (!outDir) throw new Error('canvas storyboard pack requires outDir')
  if (!contract) throw new Error('canvas storyboard pack requires contract')

  await mkdir(outDir, { recursive: true })

  const draft = composeDraftAssets(contract)
  const manifest = buildCanvasStoryboardPackManifest({ contract, draft })
  return writeCanvasPackage({ outDir, manifest })
}

async function writeCanvasPackage({ outDir, manifest }) {
  const canvasExport = buildCanvasExport(manifest)
  const promptPack = composePromptPackMarkdown(manifest)
  const readme = composeReadme(manifest)
  const manifestPath = join(outDir, 'canvas-manifest.json')
  const zipPath = join(outDir, 'canvas-project.zip')
  const promptPackPath = join(outDir, 'prompt-pack.md')
  const readmePath = join(outDir, 'README.md')

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await writeFile(promptPackPath, `${promptPack}\n`, 'utf8')
  await writeFile(readmePath, `${readme}\n`, 'utf8')
  await writeFile(zipPath, createStoredZip([
    { name: 'canvas-manifest.json', data: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: 'projects.json', data: `${JSON.stringify(canvasExport, null, 2)}\n` }
  ]))

  return {
    manifestPath,
    zipPath,
    promptPackPath,
    readmePath,
    manifest,
    canvasExport
  }
}

function buildCanvasPromptPackManifest({ contract, draft }) {
  const nodes = []
  const connections = []
  const characters = normalizeCharacters(draft.characters)
  const environment = inferPrimaryScene(contract, draft)
  const props = inferProps(contract.sourceText, draft)

  nodes.push(createManifestNode({
    id: 'style-bible',
    role: 'style_bible',
    title: '资料：风格设定（非生成）',
    canvasType: 'text',
    row: 0,
    column: 0,
    content: composeStyleBible({ contract, environment, props })
  }))

  nodes.push(createManifestNode({
    id: 'style-reference',
    role: 'style_reference',
    title: '生成：整体风格参考图',
    canvasType: 'image',
    row: 0,
    column: 1,
    prompt: composeStyleReferencePrompt({ contract, environment }),
    anchor: styleReferenceAnchor(),
    inputOrder: ['style-bible']
  }))
  connect(connections, 'style-bible', 'style-reference', 'style_rules')

  characters.forEach((character, index) => {
    const row = index + 1
    const refId = characterReferenceNodeId(character)
    nodes.push(createManifestNode({
      id: character.id,
      role: 'character_bible',
      title: `资料：${character.name}人设（非生成）`,
      canvasType: 'text',
      row,
      column: 0,
      content: composeCharacterBible(character)
    }))
    nodes.push(createManifestNode({
      id: refId,
      role: 'character_reference',
      title: `生成：${character.name}角色参考图`,
      canvasType: 'image',
      row,
      column: 1,
      prompt: composeCharacterReferencePrompt({ character, contract }),
      imageSize: '16:9',
      anchor: characterReferenceAnchor(character),
      inputOrder: [character.id]
    }))
    connect(connections, character.id, refId, 'character_bible')
  })

  const environmentRow = characters.length + 1
  const environmentRefId = environmentReferenceNodeId(environment)
  nodes.push(createManifestNode({
    id: environment.id,
    role: 'environment_bible',
    title: `资料：${environment.name}（非生成）`,
    canvasType: 'text',
    row: environmentRow,
    column: 0,
    content: composeEnvironmentBible({ environment })
  }))

  nodes.push(createManifestNode({
    id: environmentRefId,
    role: 'environment_reference',
    title: `生成：${environment.name}场景参考图`,
    canvasType: 'image',
    row: environmentRow,
    column: 1,
    prompt: composeEnvironmentReferencePrompt({ environment, contract }),
    anchor: environmentReferenceAnchor(environment),
    inputOrder: ['style-bible', environment.id]
  }))
  connect(connections, 'style-bible', environmentRefId, 'style_rules')
  connect(connections, environment.id, environmentRefId, 'environment_bible')

  return {
    schemaVersion: 1,
    kind: 'cine-make-canvas-prompt-pack',
    packageType: 'manual_canvas_generation',
    createdAt: new Date().toISOString(),
    source: {
      title: contract.title,
      contentType: contract.contentType
    },
    target: {
      app: CANVAS_APP,
      version: CANVAS_VERSION,
      aspectRatio: contract.target.aspectRatio,
      style: contract.target.style,
      platform: contract.target.platform
    },
    manualWorkflow: [
      '导入 canvas-project.zip。',
      '这是基础参考图包：先不做分镜和 Keyframe。',
      '左侧是风格、人设、场景文本设定；右侧是可生成的风格参考图、角色参考图、场景参考图。',
      '用户从右侧图片节点开始操作；文本节点只作为直接上游上下文 chip。'
    ],
    outputs: ['canvas-project.zip', 'canvas-manifest.json', 'prompt-pack.md', 'README.md'],
    nodes,
    connections
  }
}

function buildCanvasStoryboardPackManifest({ contract, draft }) {
  const nodes = []
  const connections = []
  const characters = normalizeCharacters(draft.characters)
  const environment = inferPrimaryScene(contract, draft)
  const props = inferProps(contract.sourceText, draft)
  const shots = draft.shotlist ?? []
  const beats = deriveStoryBeatsForCanvas(shots)

  nodes.push(createManifestNode({
    id: 'shot-list',
    role: 'shot_list',
    title: '资料：Shot List / 分镜清单（非生成）',
    canvasType: 'text',
    row: 0,
    column: 0,
    content: composeCompactShotList({ shots, environment }),
    mergeStrategy: 'append'
  }))

  shots.forEach((shot, index) => {
    const requiredAnchors = requiredAnchorsForShot({ shot, characters, environment })
    nodes.push(createManifestNode({
      id: keyframeNodeId(shot, index),
      role: 'keyframe',
      title: `生成：${shot.shot_id || `S${String(index + 1).padStart(2, '0')}`} 关键帧`,
      canvasType: 'image',
      row: index,
      column: 1,
      prompt: composeKeyframePrompt({ shot, contract, environment, props }),
      inputOrder: requiredAnchors.map((anchor) => anchor.anchorId),
      requiredAnchors,
      promptLayer: 'keyframe_static',
      motionPrompt: composeMotionPrompt({ shot }),
      linkedBeat: beatForCanvasShot(beats, shot)?.beat_id ?? `B${String(index + 1).padStart(2, '0')}`,
      shotFunction: shotFunctionForCanvas(shot, index, shots.length),
      audienceTakeaway: audienceTakeawayForCanvas(shot, index, shots.length),
      environmentId: environment.id,
      anchorPolicy: anchorPolicyForShot(shot),
      mergeStrategy: 'append'
    }))
  })

  return {
    schemaVersion: 1,
    kind: 'cine-make-canvas-storyboard-pack',
    packageType: 'manual_canvas_storyboard_append',
    mergeTarget: 'current_canvas',
    createdAt: new Date().toISOString(),
    source: {
      title: contract.title,
      contentType: contract.contentType
    },
    target: {
      app: CANVAS_APP,
      version: CANVAS_VERSION,
      aspectRatio: contract.target.aspectRatio,
      style: contract.target.style,
      platform: contract.target.platform
    },
    manualWorkflow: [
      '先在 Canvas 当前画布里锁定人物主图、场景主图和风格主图。',
      '使用 Canvas 的“合并到当前画布 / 导入到当前画布”导入本 canvas-project.zip，不要作为新工程重新开始。',
      '本包只追加 Shot List 和 Keyframe 图片节点，不重复生成 Character / Environment / Style 参考图。',
      'Keyframe 节点会声明 requiredAnchors；Canvas 合并时应把它们连接到当前画布中已锁定的主图锚点。',
      '导入后仍由用户逐个点击右侧 Keyframe 图片节点手动生成。'
    ],
    outputs: ['canvas-project.zip', 'canvas-manifest.json', 'prompt-pack.md', 'README.md'],
    nodes,
    connections
  }
}

function normalizeCharacters(characters = []) {
  return characters.map((character, index) => ({
    id: character.id || `character-${slugId(character.identity_anchor || character.identity || String(index + 1))}`,
    name: character.identity_anchor || character.name || character.identity || `角色${index + 1}`,
    identity: character.identity || '',
    height: character.height || '',
    age: character.age || '',
    appearance: character.appearance || '',
    costume: character.costume || character.costume_anchor || '',
    bodyDetails: character.body_details || '',
    expression: character.expression || character.performance_anchor || '',
    mood: character.mood || '',
    props: character.props ?? [],
    prompt: character.reference_prompt || ''
  }))
}

function inferPrimaryScene(contract, draft) {
  const firstScene = draft.shotlist?.find((shot) => shot.scene)?.scene || '主场景'
  if (/孤岛|别墅|客厅/u.test(`${contract.sourceText}\n${firstScene}`)) {
    return {
      id: 'environment-island-villa-living-room-night',
      title: '场景设定：孤岛别墅客厅 / 暴雨夜',
      name: '孤岛别墅客厅 / 暴雨夜',
      description: '暴雨夜里的孤岛别墅客厅，沙发、茶几、门口、角落四个方位清晰，窗外闪电和雨水提供冷色主光，室内少量暖光压住人物。'
    }
  }

  const sceneName = firstScene || '主场景'
  return {
    id: `environment-${slugId(sceneName)}`,
    title: `场景设定：${sceneName}`,
    name: sceneName,
    description: `${sceneName}，保持空间结构、光线方向、材质和连续性状态稳定。`
  }
}

function inferProps(sourceText, draft) {
  const haystack = [
    sourceText,
    ...(draft.characters ?? []).flatMap((character) => character.props ?? []),
    ...(draft.shotlist ?? []).flatMap((shot) => [
      shot.action,
      shot.image_prompt,
      shot.composition,
      shot.blocking,
      shot.video_prompt_note
    ])
  ].filter(Boolean).join('\n')

  return PROP_CATALOG.filter((prop) => prop.triggers.some((trigger) => haystack.includes(trigger)))
}

function createManifestNode({ id, role, title, canvasType, row, column, prompt, content, seconds, imageSize, inputOrder, anchor, requiredAnchors, promptLayer, motionPrompt, linkedBeat, shotFunction, audienceTakeaway, environmentId, anchorPolicy, mergeStrategy }) {
  const isVideo = canvasType === 'video'
  const isText = canvasType === 'text'
  const isLandscapeImage = canvasType === 'image' && imageSize === '16:9'
  const cineMake = {
    promptLayer,
    motionPrompt,
    linkedBeat,
    shotFunction,
    audienceTakeaway,
    environmentId,
    anchorPolicy
  }
  return {
    id,
    role,
    canvasType,
    title,
    position: {
      x: column * GAP_X,
      y: row * ROW_HEIGHT
    },
    width: isVideo ? VIDEO_NODE_WIDTH : isText ? TEXT_NODE_WIDTH : isLandscapeImage ? LANDSCAPE_IMAGE_NODE_WIDTH : IMAGE_NODE_WIDTH,
    height: isVideo ? VIDEO_NODE_HEIGHT : isText ? TEXT_NODE_HEIGHT : isLandscapeImage ? LANDSCAPE_IMAGE_NODE_HEIGHT : IMAGE_NODE_HEIGHT,
    prompt,
    content,
    seconds,
    imageSize,
    inputOrder,
    anchor,
    requiredAnchors,
    metadata: {
      cineMake
    },
    promptLayer,
    motionPrompt,
    linkedBeat,
    shotFunction,
    audienceTakeaway,
    environmentId,
    anchorPolicy,
    mergeStrategy
  }
}

function buildCanvasExport(manifest) {
  const now = new Date().toISOString()
  const nodes = manifest.nodes.map((node) => toCanvasNode(node, manifest))
  const nodeIds = new Set(nodes.map((node) => node.id))
  return {
    app: CANVAS_APP,
    version: CANVAS_VERSION,
    exportedAt: now,
    projects: [
      {
        project: {
          id: `cine-make-canvas-${slugId(manifest.source.title)}`,
          title: `Cine Make Canvas - ${manifest.source.title}`,
          createdAt: now,
          updatedAt: now,
          nodes,
          connections: manifest.connections
            .filter((connection) => nodeIds.has(connection.fromNodeId) && nodeIds.has(connection.toNodeId))
            .map((connection) => ({
              id: connection.id,
              fromNodeId: connection.fromNodeId,
              toNodeId: connection.toNodeId
            })),
          chatSessions: [],
          activeChatId: null,
          backgroundMode: 'lines',
          showImageInfo: false,
          viewport: { x: 0, y: 0, k: 1 }
        },
        files: []
      }
    ]
  }
}

function toCanvasNode(node, manifest) {
  if (node.canvasType === 'text') {
    return {
      id: node.id,
      type: 'text',
      title: node.title,
      position: node.position,
      width: node.width,
      height: node.height,
      metadata: {
        content: node.content || '',
        status: 'success',
        generationMode: 'text',
        fontSize: 14,
        cineMake: cineMakeNodeMetadata(node, manifest)
      }
    }
  }

  if (node.canvasType === 'video') {
    return {
      id: node.id,
      type: 'video',
      title: node.title,
      position: node.position,
      width: node.width,
      height: node.height,
      metadata: {
        content: '',
        prompt: node.prompt,
        status: 'idle',
        generationMode: 'video',
        size: manifest.target.aspectRatio,
        seconds: node.seconds || '5',
        cineMake: cineMakeNodeMetadata(node, manifest)
      }
    }
  }

  return {
    id: node.id,
    type: 'image',
    title: node.title,
    position: node.position,
    width: node.width,
    height: node.height,
    metadata: {
      content: '',
      prompt: node.prompt,
      status: 'idle',
      generationMode: 'image',
      generationType: 'generation',
      size: node.imageSize || manifest.target.aspectRatio,
      quality: 'auto',
      count: 1,
      inputOrder: node.inputOrder,
      cineMake: cineMakeNodeMetadata(node, manifest)
    }
  }
}

function cineMakeNodeMetadata(node, manifest) {
  return {
    packageType: manifest.packageType,
    role: node.role,
    mergeStrategy: node.mergeStrategy,
    anchor: node.anchor,
    requiredAnchors: node.requiredAnchors,
    promptLayer: node.promptLayer,
    motionPrompt: node.motionPrompt,
    linkedBeat: node.linkedBeat,
    shotFunction: node.shotFunction,
    audienceTakeaway: node.audienceTakeaway,
    environmentId: node.environmentId,
    anchorPolicy: node.anchorPolicy
  }
}

function composeScriptBreakdown({ contract, draft, characters, environment, props }) {
  return [
    '# 剧本拆解',
    '',
    `- 标题：${contract.title}`,
    `- 类型：${contract.contentType}`,
    `- 目标时长：${contract.target.durationSeconds}s`,
    `- 分镜数量：${draft.shotlist?.length ?? 0}`,
    `- 人物：${characters.map((character) => character.name).join('、') || '未识别'}`,
    `- 主场景：${environment.name}`,
    `- 关键道具：${props.map((prop) => prop.label).join('、') || '未识别'}`,
    '',
    '## 核心戏剧问题',
    '失忆者在封闭空间里寻找凶手，但每条线索都指向自我分裂和被压抑的真相。',
    '',
    '## 生产边界',
    '本包只完成影视前期前五步：世界观、人设、场景、视觉风格、分镜和关键帧任务；不做视频生成和后期。'
  ].join('\n')
}

function composeWorldBible({ contract, environment }) {
  return [
    '# World Bible',
    '',
    '## 类型',
    '心理悬疑 / 暴风雨山庄 / 失忆推理 / 人格分裂。',
    '',
    '## 世界规则',
    '- 故事发生在封闭孤岛别墅，外部暴雨切断逃离路径。',
    '- 主角记忆只有10分钟，倒计时手机是世界规则的可见锚点。',
    '- 所有人物既像真实幸存者，也像主角精神结构的投影；画面不能直接拍成鬼怪或超自然。',
    '- 场景、服装、道具必须服务“记忆断裂但空间连续”的规则。',
    '',
    '## 情绪基调',
    '压抑、克制、疑心、潮湿、冷、窒息；恐惧来自信息缺口，不来自怪物露出。',
    '',
    `## 主场景规则\n${environment.description}`,
    '',
    `## 默认画幅和风格\n${contract.target.aspectRatio} / ${contract.target.style}`
  ].join('\n')
}

function composeArtDirection({ contract, environment }) {
  return [
    '# Art Direction',
    '',
    '## 色彩规则',
    '- 低饱和蓝灰为主。',
    '- 室内少量暖黄灯只作为人物和道具边缘的弱锚点。',
    '- 血迹、倒计时数字、警徽反光可以作为少量红色/高亮信号，但不能铺满画面。',
    '',
    '## 光影规则',
    '- practical lighting：灯、窗、手机屏、闪电必须是可解释光源。',
    '- motivated lighting：每个高光都要能在场景里找到来源。',
    '- 暴雨窗光和室内低照度形成冷暖对撞，禁止随机换成明亮大厅或新场景。',
    '',
    '## 摄影语言',
    '- 广角负责空间压迫和人物方位。',
    '- 85mm / macro 负责线索、血手、手机、刻字。',
    '- 长焦情绪特写只用于心理断裂，不用于炫技。',
    '- 大量负空间、门口遮挡、角落阴影，强化“有人在看”的感觉。',
    '',
    '## 场景统一',
    `${environment.name} 的沙发、茶几、门口、角落、窗户位置必须持续一致。`,
    '',
    `## 基础风格\n${contract.target.style}`
  ].join('\n')
}

function composePreproductionBible({ contract, draft, characters, environment, props }) {
  return [
    '# 前期总控 / Pre-production Bible',
    '',
    '这个节点是给 Canvas 图片节点直接读取的上游文本资源，不需要单独生成图片。',
    '',
    composeScriptBreakdown({ contract, draft, characters, environment, props }),
    '',
    composeWorldBible({ contract, environment }),
    '',
    composeArtDirection({ contract, environment }),
    '',
    '## 道具锚点',
    props.length
      ? props.map((prop) => `- ${prop.label}：${prop.triggers.join(' / ')}`).join('\n')
      : '- 本片段未识别到需要单独锁定的道具。',
    '',
    '## Canvas 使用规则',
    '- 只把本节点作为 Keyframe 图片节点的直接上游文本。',
    '- 不依赖文本节点之间的串流；生成图片时以当前 Keyframe 的 prompt 为准。',
    '- 如果画面漂移，优先检查 Keyframe 是否直接连接本节点、场景节点和需要的人物节点。'
  ].join('\n')
}

function composeStyleBible({ contract, environment, props }) {
  return [
    '# 风格设定 / World Bible / Art Direction',
    '',
    '注意：这是资料节点，不是出图提示词，不需要点击生成。请从右侧图片节点开始生成。',
    '',
    composeWorldBible({ contract, environment }),
    '',
    composeArtDirection({ contract, environment }),
    '',
    '## 道具与视觉锚点',
    props.length
      ? props.map((prop) => `- ${prop.label}：${prop.triggers.join(' / ')}`).join('\n')
      : '- 本片段未识别到需要单独锁定的道具。',
    '',
    '## 基础参考图阶段规则',
    '- 当前版本只生成人物参考图、场景参考图和整体风格参考图。',
    '- 暂不生成分镜、关键帧、视频段。',
    '- 所有参考图必须共享同一套心理悬疑、暴雨夜、低饱和蓝灰、practical lighting / motivated lighting 规则。'
  ].join('\n')
}

function composeCharacterBible(character) {
  return [
    `# Character Bible：${character.name}`,
    '',
    '注意：这是资料节点，不是出图提示词，不需要点击生成。请点击右侧“生成：角色参考图”图片节点。',
    '',
    character.identity ? `身份：${character.identity}` : '',
    character.height ? `身高：${character.height}` : '',
    '',
    '## 外观',
    character.appearance || '按剧本身份保持真实人类比例。',
    '',
    '## 服装',
    character.costume || '服装必须稳定，不随分镜随机变化。',
    '',
    '## 微动作',
    inferMicroAction(character),
    '',
    '## 情绪基调',
    character.expression || '克制，不夸张表演。',
    '',
    '## 核心道具',
    character.props?.length ? `核心道具：${character.props.join('；')}` : '',
    '',
    '## 连续性规则',
    '同一张脸、同一发型、同一体型、同一服装材质；不要换演员、换年龄、换衣服、换气质。'
  ].filter(Boolean).join('\n')
}

function inferMicroAction(character) {
  const text = `${character.name}\n${character.identity}\n${character.expression}\n${character.appearance}\n${character.costume}\n${character.props?.join('、') ?? ''}`
  if (/林默/u.test(text)) {
    return '不直接相信任何人；醒来先看手、手机和伤口；呼吸短促，手指习惯性握紧倒计时手机；视线总是先确认血迹/刻字再抬头。'
  }
  if (/安娜/u.test(text)) {
    return '倒水时指尖会停顿半秒；语气温柔但眼神回避；身体常横在林默和危险人物之间，像保护也像控制。'
  }
  if (/雷队/u.test(text)) {
    return '下颌绷紧；手习惯停在枪套附近；站姿堵住出口，靠近别人时先用肩线制造压迫感。'
  }
  if (/阿杰/u.test(text)) {
    return '肩膀内扣；一只手扶旧拐杖；嘴角先发抖再压住冷笑，眼神从怯懦里短暂漏出算计。'
  }
  return '动作克制、幅度小；先通过眼神、手指、呼吸和停顿暴露心理变化，不做夸张戏剧化表演。'
}

function composeEnvironmentBible({ environment }) {
  return [
    `# Environment Bible：${environment.name}`,
    '',
    '注意：这是资料节点，不是出图提示词，不需要点击生成。请点击右侧“生成：场景参考图”图片节点。',
    '',
    '## 建筑 / 空间',
    environment.description,
    '',
    '## 灯光',
    '窗外闪电和暴雨冷光为主，室内少量暖黄灯为辅；光源必须来自窗、灯、手机屏、闪电。',
    '',
    '## 空气',
    '潮湿、灰尘、冷雾、雨水反光；地面和玻璃持续有湿痕。',
    '',
    '## 声音感',
    '暴雨拍窗、远处雷声、木地板轻响、手机闹钟、电流低鸣。即使生成图片，也要让空间像有声音。',
    '',
    '## 连续性规则',
    '沙发、茶几、门口、窗户、角落方位不能乱跳；不要突然变成医院、办公室、走廊或白天。'
  ].join('\n')
}

function composePropBible(prop) {
  return [
    `# Prop Bible：${prop.label}`,
    '',
    '## 视觉定义',
    prop.prompt,
    '',
    '## 连续性规则',
    '道具形状、材质、污渍、位置逻辑保持一致；只在被分镜需要时进入关键帧。'
  ].filter(Boolean).join('\n')
}

function composeStyleReferencePrompt({ contract, environment }) {
  return [
    '风格参考图生成任务：生成一张整体视觉 mood frame，不是分镜，不要出现具体剧情动作。',
    '',
    '必须读取直接上游文本：风格设定 / World Bible / Art Direction。',
    '',
    `画幅：${contract.target.aspectRatio}`,
    `主场景气质：${environment.name}`,
    '画面内容：暴雨夜、低饱和蓝灰、冷暖对撞、室内 practical lighting、窗外闪电冷光、潮湿空气、负空间、真实电影质感。',
    '用途：作为后续人物参考图和场景参考图的统一视觉锚点。',
    '',
    '负面：不要字幕、水印、logo、漫画风、海报排版、夸张发光、奇幻怪物、过度饱和。'
  ].join('\n')
}

function composeCharacterReferencePrompt({ character, contract }) {
  if (character.prompt?.trim()) return character.prompt.trim()

  return [
    '真人电影角色定妆照，写实摄影风格，白色或浅灰摄影棚背景，满版构图，不留顶部空白，不要大面积空白边框，4K超高画质，心理惊悚电影氛围，电影级低调布光，真实人类面部比例，真实皮肤纹理，毛孔细节，眼袋，细微皱纹，自然发丝，真实服装材质，复杂服装刺绣、褶皱、湿痕和材质细节，非插画，非漫画，非CG。',
    '',
    '画面为专业影视角色设定参考图：左侧从左上区域开始生成高清正面人脸半身大图，占据左边画面约2/3大小（如果没有清晰人脸，就用角色本身的形象大图），人物头顶接近画面上边缘但不裁切，85mm镜头，超高画质，毛孔清晰可见；右侧生成角色正面、侧面、背面三视小图，也就是三视图全身定妆照，旁边整齐摆放核心道具。只显示角色名称和身高，不显示年龄；顶部必须被人物、三视图或道具排版占满，不要空白标题栏，不要让画面上方出现空白。',
    '',
    `角色名称：${character.name}`,
    character.height ? `身高：${character.height}` : '',
    character.identity ? `身份：${character.identity}` : '',
    character.appearance ? `外貌：${character.appearance}。` : '',
    character.costume ? `服装：${character.costume}。` : '',
    character.bodyDetails ? `身体细节：${character.bodyDetails}。` : '',
    character.expression ? `表情：${character.expression}。` : '',
    character.props?.length ? `核心道具：${character.props.join('；')}。` : '',
    '',
    character.mood ? `整体气质：${character.mood}。` : '整体气质：真实、克制、阴冷，不要夸张奇幻化。',
    '',
    'photorealistic, live action film still, cinematic portrait photography, realistic human face, realistic skin pores, natural imperfections, practical costume design, studio character reference photo, full-bleed character sheet, no top blank space, no empty header bar, left large 85mm portrait half-body occupying about two thirds of the image, right small character turnaround, front view, side view, back view, prop reference, show name and height only, no age text, high detail, sharp focus, 4K, dramatic low key lighting, muted colors, psychological thriller mood, realistic wet fabric.',
    '',
    '负面提示词：anime, manga, cartoon, illustration, comic style, concept art, 3d render, CGI, doll face, plastic skin, perfect skin, over smooth skin, fantasy armor, cyberpunk, exaggerated features, monster, deformed hands, extra fingers, bad anatomy, blurry text, unreadable text, watermark, logo, low resolution.'
  ].filter(Boolean).join('\n')
}

function composeEnvironmentReferencePrompt({ environment, contract }) {
  return [
    `场景参考图生成任务：生成 ${environment.name} 的电影场景设定图。`,
    '',
    '必须读取直接上游文本：风格设定 + 当前 Environment Bible。',
    '',
    `画幅：${contract.target.aspectRatio}`,
    `场景：${environment.name}`,
    `空间定义：${environment.description}`,
    '构图：空场景或极少人物剪影；重点建立沙发、茶几、门口、窗户、角落的空间方位。',
    '光线：窗外闪电和暴雨冷光为主，室内少量暖黄 practical lighting 为辅，低饱和蓝灰，潮湿反光。',
    '用途：作为后续分镜和关键帧的空间连续性锚点。',
    '',
    '负面：不要把场景变成白天、医院、办公室、走廊；不要字幕、水印、logo；不要拥挤人物。'
  ].join('\n')
}

function sanitizeStaticShotText(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/；[^。；，,]*必须作为稳定视觉锚点/gu, '')
    .replace(/[,， ]*[^,，。；]*must[^,，。；]*stable visual anchor[^,，。；]*/giu, '')
    .replace(/、?手机10分钟倒计时\s*(与|和)\s*记忆清空倒计时/gu, '')
    .replace(/、?10分钟倒计时\s*(与|和)\s*记忆清空倒计时/gu, '')
    .trim()
}

function shotTextForCanvas(shot) {
  return [
    shot.action,
    shot.blocking,
    sanitizeStaticShotText(shot.composition),
    shot.shot_size,
    shot.lens
  ].filter(Boolean).join('\n')
}

function beatKindForCanvasShot(shot, index, total) {
  const text = shotTextForCanvas(shot)
  const action = String(shot.action || '')
  if (index === 0 || /窗外暴雨|闪电划过|暴雨.*闪电/u.test(text)) return { key: 'opening_space' }
  if (index === total - 1 || /00:00:00|时间到|倒计时|手机|归零|空洞|你们是谁|再次失忆/u.test(action)) return { key: 'reset_hook' }
  if (/惊醒|血手|满手鲜血|大口喘气/u.test(text)) return { key: 'blood_anomaly' }
  if (/刻字|记忆只有10分钟|我的记忆只有10分钟|手臂/u.test(text)) return { key: 'memory_rule' }
  if (/镜头拉开|另外三个人|三个人|四个方位|嫌疑/u.test(text)) return { key: 'suspect_board' }
  if (/冷笑|凯撒|幕后黑手|所有人的目光/u.test(text)) return { key: 'ajie_misdirect' }
  if (/雷队|拿着枪|堵在门口|被杀|老张|死无对证/u.test(text)) return { key: 'lei_pressure' }
  if (/安娜|倒热水|热水杯|安抚|失忆症/u.test(text)) return { key: 'anna_control' }
  if (/阿杰|瘸子|蜷缩|瑟瑟|拐杖|腿部支架/u.test(text)) return { key: 'ajie_disguise' }
  if (/精神病院|警徽|解剖刀|闪回|圣路易斯/u.test(text)) return { key: 'asylum_flash' }
  if (/查案|非法活体实验|我是.*来查案/u.test(text)) return { key: 'investigation_identity' }
  return { key: `beat_${index}` }
}

function deriveStoryBeatsForCanvas(shots = []) {
  const beats = []
  const total = shots.length
  for (const [index, shot] of shots.entries()) {
    const kind = beatKindForCanvasShot(shot, index, total)
    let beat = beats.find((candidate) => candidate.key === kind.key)
    if (!beat) {
      beat = {
        beat_id: `B${String(beats.length + 1).padStart(2, '0')}`,
        key: kind.key,
        shots: []
      }
      beats.push(beat)
    }
    beat.shots.push(shot)
  }
  return beats
}

function beatForCanvasShot(beats, shot) {
  return beats.find((beat) => beat.shots.includes(shot))
}

function riskTypeForCanvasShot(shot) {
  const text = shotTextForCanvas(shot)
  if (/wide/i.test(shot.shot_size ?? '') && /刻字|文字|我的记忆只有10分钟|读清/u.test(text)) return 'text_readability_conflict'
  if (/macro|insert/i.test(shot.shot_size ?? '') && /惊醒|大口喘气|猛地|身体/u.test(text)) return 'macro_action_conflict'
  if (/medium close-up|tight close-up/i.test(shot.shot_size ?? '') && /四个方位|三个人|雷队|安娜|阿杰/u.test(text)) return 'multi_character_spatial_conflict'
  if (/冷笑|凯撒/u.test(text) && /(所有人的目光|三人方位|嫌疑结构|insert-medium|wide reveal)/iu.test(text)) return 'visual_priority_mismatch'
  return ''
}

function localizedStaticShotDefinitionForCanvas(shot) {
  const risk = riskTypeForCanvasShot(shot)
  const text = shotTextForCanvas(shot)
  if (risk === 'text_readability_conflict') return 'tight insert / 85mm close-up, readable carved text fills 40%-60% of frame'
  if (risk === 'macro_action_conflict') return 'medium close-up for the wake-up beat; reserve bloody hands for a separate insert'
  if (risk === 'multi_character_spatial_conflict') return 'wide / controlled 28mm shot, vertical deep staging to establish the room chessboard'
  if (risk === 'visual_priority_mismatch') return 'low close-up on Ajie mouth and eyes; background characters reduced to pressure silhouettes'
  if (/00:00:00/u.test(text)) return 'phone insert close-up, screen readable at 00:00:00'
  return `${shot.shot_size || ''} / ${shot.lens || ''} / ${sanitizeStaticShotText(shot.composition)}`
}

function sanitizeLocalPromptText(value = '') {
  return sanitizeStaticShotText(value)
    .replace(/超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性[;；]?\s*/gu, '')
    .replace(/^\s*[;；]\s*/u, '')
    .trim()
}

function composeShotBible({ shot, environment }) {
  return [
    `# Shot List：${shot.shot_id}`,
    '',
    '这是摄影机脚本，不是剧情复述。',
    '',
    `- 场景：${shot.scene || environment.name}`,
    `- 人物：${(shot.characters ?? []).join('、') || shot.subject || '无'}`,
    `- 时长：${shot.duration_seconds}s`,
    `- 景别：${shot.shot_size || ''}`,
    `- 镜头：${shot.lens || ''}`,
    `- 机位/运镜：${shot.camera_movement || ''}`,
    `- 构图：${sanitizeStaticShotText(shot.composition)}`,
    `- 调度：${shot.blocking || ''}`,
    `- 表演：${shot.performance_detail || ''}`,
    `- 画面动作：${shot.action || ''}`,
    `- 连续性：${sanitizeStaticShotText(shot.continuity_from_previous)}`
  ].join('\n')
}

function composeCompactShotList({ shots, environment }) {
  return [
    '# Shot List / 摄影机脚本',
    '',
    '这是人工审阅用的分镜清单。Keyframe 图片节点自己的 prompt 已经包含对应镜头，不需要把本节点连接到每个 Keyframe。',
    '',
    ...shots.map((shot) => [
      `## ${shot.shot_id}`,
      `- 场景：${shot.scene || environment.name}`,
      `- 人物：${(shot.characters ?? []).join('、') || shot.subject || '无'}`,
      `- 镜头：${shot.shot_size || ''} / ${shot.lens || ''} / ${shot.camera_movement || ''}`,
      `- 构图：${sanitizeStaticShotText(shot.composition)}`,
      `- 调度：${shot.blocking || ''}`,
      `- 画面动作：${shot.action || ''}`
    ].join('\n'))
  ].join('\n\n')
}

function composeKeyframePrompt({ shot, contract, environment, props = [] }) {
  const usedProps = props.filter((prop) => shotUsesProp(shot, prop))
  const anchor = anchorPolicyForShot(shot)
  const lighting = sanitizeLocalPromptText(shot.lighting || 'motivated low-key cinematic lighting') || 'motivated low-key cinematic lighting'
  return [
    '关键帧生成任务：生成一张 single cinematic keyframe / 电影概念帧 / 分镜定格。',
    'Static Shot Definition：这是一张静态图片提示词，只描述构图、人物位置、光线、场景和情绪状态。',
    '',
    '必须使用 Canvas 中已锁定人物主图、已锁定场景主图和已锁定风格主图作为直接视觉参考。',
    '已锁定人物主图决定演员脸、发型、体型、服装和道具；不要重新发明角色，不要换演员。',
    '已锁定场景主图决定空间结构、门窗、沙发、茶几、角落和灯光方向；不要重新发明地点。',
    '未连接的人物不要出现；未声明的场景不要出现。',
    '',
    `分镜：${shot.shot_id}`,
    `画幅：${contract.target.aspectRatio}`,
    `场景锚点：${environment.name}`,
    `出场人物：${(shot.characters ?? []).join('、') || shot.subject || '无'}`,
    usedProps.length ? `关键道具：${usedProps.map((prop) => prop.label).join('、')}` : '',
    `景别/镜头：${localizedStaticShotDefinitionForCanvas(shot)}`,
    `visual_priority: primary=${anchor.primary}; secondary=${anchor.secondary.slice(0, 2).join(' / ')}`,
    `构图：${sanitizeLocalPromptText(shot.composition)}`,
    `空间调度：${shot.blocking || ''}`,
    `画面状态：${shot.action || ''}`,
    `光影：${lighting}`,
    `调度：${shot.blocking || ''}`,
    riskTypeForCanvasShot(shot) === 'text_readability_conflict' ? '文字可读性：只允许刻字本身可读，不要额外字幕或海报字。' : '',
    '',
    'photorealistic live-action film still, grounded cinematic realism, restrained psychological thriller mood, consistent actor face and costume, consistent physical location, no motion blur, no transition, no collage.',
    '',
    '负面：不要字幕、水印、logo、乱加未连接角色、突然换脸、换服装、换场景、把客厅变成其他地点、不要模拟视频运动。'
  ].filter(Boolean).join('\n')
}

function composeMotionPrompt({ shot }) {
  return [
    `${shot.shot_id}: ${Number(shot.duration_seconds) || 1}s.`,
    `${shot.camera_movement || 'locked frame'}.`,
    motionCueForShot(shot),
    `Micro-performance: ${microCueForShot(shot)}.`,
    'No cut. No new action. No face change.'
  ].join(' ')
}

function motionCueForShot(shot) {
  const action = [shot.action, shot.blocking, sanitizeStaticShotText(shot.composition)].filter(Boolean).join('\n')
  if (/惊醒|醒来/u.test(action)) return 'Lin Mo wakes from the sofa, then freezes.'
  if (/血手|双手|满是鲜血/u.test(action)) return 'He slowly raises bloody hands into frame.'
  if (/拉开衣袖|刻着|手臂/u.test(action)) return 'He exposes the marked forearm and holds it still.'
  if (/倒计时|00:00:00|手机/u.test(action)) return 'Hold on the countdown phone as the screen reaches zero.'
  if (/镜头拉开|还有另外|安娜|雷队|阿杰/u.test(action)) return 'Reveal the fixed room layout and character positions only.'
  if (/靠近|走|后退|进入/u.test(action)) return 'The subject completes one small position change, then stops.'
  return 'Execute only the single visible action described by this shot definition.'
}

function microCueForShot(shot) {
  const text = [shot.action, shot.performance_detail].filter(Boolean).join('\n')
  if (/阿杰|冷笑|诡异/u.test(text)) return 'small hidden smile, eyes move before the body'
  if (/雷队|枪|暴躁|门口/u.test(text)) return 'stiff jaw, heavy shoulders, controlled threat'
  if (/安娜|医生|倒水|安抚/u.test(text)) return 'slow hands, controlled eye contact, half-second hesitation'
  if (/血|惊|怕|失忆|空洞/u.test(text)) return 'short breath, delayed eye focus, tense fingers'
  return 'subtle breath and small eye movement'
}

function shotFunctionForCanvas(shot, index, total) {
  const text = [shot.action, shot.blocking, sanitizeStaticShotText(shot.composition)].filter(Boolean).join('\n')
  const action = String(shot.action || '')
  if (index === 0) return '开场 / 空间与危险建立'
  if (index === total - 1) return '结尾钩子 / 状态重置'
  if (/刻字|10分钟/u.test(action) || /倒计时|00:00:00|手机/u.test(action)) return '信息揭示 / 核心机制强化'
  if (/三个人|另外三人|安娜|雷队|阿杰|嫌疑/u.test(text)) return '人物关系建立 / 嫌疑结构'
  if (/质问|拿枪|逼|怒|冲突|尸体|被杀/u.test(text)) return '冲突升级'
  if (/凯撒|谎|误导|阿杰|冷笑/u.test(text)) return '误导 / 反派钩子'
  if (/精神病院|幻觉|闪回|真相|现实/u.test(text)) return '真相靠近 / 现实裂缝'
  return '情绪推进'
}

function audienceTakeawayForCanvas(shot, index, total) {
  const text = [shot.action, shot.blocking, sanitizeStaticShotText(shot.composition)].filter(Boolean).join('\n')
  const action = String(shot.action || '')
  if (/刻字|10分钟/u.test(action)) return '林默的记忆规则和凶手假设被明确建立。'
  if (/倒计时|归零|00:00:00|手机/u.test(action)) return '循环机制生效，林默回到无知状态。'
  if (/血手|满手鲜血|双手/u.test(text)) return '林默可能刚参与过暴力事件，但他自己不知道。'
  if (/安娜|雷队|阿杰|三个人/u.test(text)) return '房间里形成嫌疑人棋盘。'
  if (/凯撒|阿杰/u.test(text)) return '阿杰开始把观众和林默带向外部凶手叙事。'
  if (index === 0) return '主角被放进封闭危险空间。'
  if (index === total - 1) return '本段以钩子结束，观众等待下一轮循环。'
  return '情绪或空间压力被推进。'
}

function anchorPolicyForShot(shot) {
  const text = [shot.action, shot.blocking, sanitizeStaticShotText(shot.composition)].filter(Boolean).join('\n')
  const action = String(shot.action || '')
  if (/00:00:00/u.test(action)) return { primary: '手机 00:00:00', secondary: ['林默血手', '屏幕冷光'] }
  if (/倒计时|手机/u.test(action)) return { primary: '倒计时手机', secondary: ['林默血手', '屏幕冷光'] }
  if (/刻字|手臂|我的记忆只有10分钟/u.test(text)) return { primary: '手臂刻字', secondary: ['血手', '袖口'] }
  if (/镜头拉开|另外三个人|三个人|四个方位|客厅里还有/u.test(text)) return { primary: '四人空间棋盘', secondary: ['雷队堵门', '阿杰背光角落'] }
  if (/冷笑|凯撒|眼神诡异/u.test(text)) return { primary: /冷笑/u.test(text) ? '阿杰嘴角冷笑' : '阿杰诡异眼神', secondary: ['众人视线转向阿杰', '拐杖/腿部支架'] }
  if (/阿杰|瘸子|蜷缩|瑟瑟/u.test(text)) return { primary: '阿杰诡异眼神', secondary: ['拐杖', '腿部支架'] }
  if (/热水杯|倒热水|倒水/u.test(text)) return { primary: '热水杯', secondary: ['安娜手部动作', '林默警惕眼神'] }
  if (/雷队|枪/u.test(text)) return { primary: '雷队堵门', secondary: ['手枪', '出口'] }
  if (/安娜|药|安抚/u.test(text)) return { primary: '安娜安抚/控制', secondary: ['热水杯', '药瓶'] }
  if (/血手|鲜血|双手/u.test(text)) return { primary: '林默血手', secondary: ['沙发', '低光'] }
  return { primary: '本镜头主要视觉信息', secondary: ['环境连续性'] }
}

function composePromptPackMarkdown(manifest) {
  return [
    '# Canvas Prompt Pack',
    '',
    '这个包只给 Canvas 手动生成使用，不包含图片、视频或媒体文件。',
    '',
    '## 使用顺序',
    '',
    ...manifest.manualWorkflow.map((item, index) => `${index + 1}. ${item}`),
    '',
    '## 节点',
    '',
    ...manifest.nodes.map((node) => `- ${node.id}｜${node.role}｜${node.title}`)
  ].join('\n')
}

function composeReadme(manifest) {
  return [
    '# Cine Make Canvas Prompt Pack',
    '',
    '导入 `canvas-project.zip` 后，画布里会出现 Script Breakdown、World Bible、Character Bible、Environment Bible、Prop Bible、Art Direction、Shot List 和 Keyframes 节点。',
    '',
    '不要一次性全生成。先阅读上游前期规则节点，再手动生成 Keyframes。每个 Keyframe 只连接它实际需要的人物、场景、道具、视觉风格和对应分镜；本包不生成图片、视频或 `storyboard-images/`。',
    '',
    `节点数：${manifest.nodes.length}`,
    `连接数：${manifest.connections.length}`
  ].join('\n')
}

function connect(connections, fromNodeId, toNodeId, role) {
  if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) return
  const id = `${fromNodeId}-to-${toNodeId}`
  if (connections.some((connection) => connection.id === id)) return
  connections.push({ id, fromNodeId, toNodeId, role })
}

function shotUsesCharacter(shot, characterName) {
  return (shot.characters ?? []).includes(characterName)
}

function shotUsesProp(shot, prop) {
  if (prop.id === 'prop-phone') {
    const directPhoneCue = [
      shot.action,
      shot.subject,
      shot.dialogue_or_voiceover
    ].filter(Boolean).join('\n')
    return prop.triggers.some((trigger) => directPhoneCue.includes(trigger))
  }

  const text = [
    shot.action,
    shot.subject,
    sanitizeStaticShotText(shot.composition),
    shot.blocking,
    shot.image_prompt,
    shot.video_prompt_note,
    shot.dialogue_or_voiceover
  ].filter(Boolean).join('\n')
  return prop.triggers.some((trigger) => text.includes(trigger))
}

function styleReferenceAnchor() {
  return {
    anchorId: 'style-reference',
    anchorRole: 'style_reference',
    anchorName: '整体风格参考图',
    mergeStrategy: 'reuse_existing'
  }
}

function characterReferenceAnchor(character) {
  return {
    anchorId: characterReferenceNodeId(character),
    anchorRole: 'character_reference',
    anchorName: character.name,
    mergeStrategy: 'reuse_existing'
  }
}

function environmentReferenceAnchor(environment) {
  return {
    anchorId: environmentReferenceNodeId(environment),
    anchorRole: 'environment_reference',
    anchorName: environment.name,
    mergeStrategy: 'reuse_existing'
  }
}

function requiredAnchor(anchor) {
  return {
    anchorId: anchor.anchorId,
    anchorRole: anchor.anchorRole,
    anchorName: anchor.anchorName
  }
}

function requiredAnchorsForShot({ shot, characters, environment }) {
  const anchors = [
    requiredAnchor(styleReferenceAnchor()),
    requiredAnchor(environmentReferenceAnchor(environment))
  ]
  const usedCharacterNames = new Set(shot.characters ?? [])
  for (const character of characters) {
    if (!usedCharacterNames.has(character.name)) continue
    anchors.push(requiredAnchor(characterReferenceAnchor(character)))
  }
  return anchors
}

function shotNodeId(shot, fallbackIndex = 0) {
  const id = shot?.shot_id || `S${String(fallbackIndex + 1).padStart(2, '0')}`
  return `shot-${id.toLowerCase()}`
}

function keyframeNodeId(shot, fallbackIndex = 0) {
  const id = shot?.shot_id || `S${String(fallbackIndex + 1).padStart(2, '0')}`
  return `keyframe-${id.toLowerCase()}`
}

function characterReferenceNodeId(character) {
  return character.id.replace(/^character-/u, 'character-ref-')
}

function environmentReferenceNodeId(environment) {
  return environment.id.replace(/^environment-/u, 'environment-ref-')
}

function totalDuration(shots) {
  return shots.reduce((sum, shot) => sum + (Number(shot.duration_seconds) || 0), 0)
}

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

function slugId(value) {
  const text = String(value || '').trim().toLowerCase()
  const ascii = text.match(/[a-z0-9]+/g)
  if (ascii?.length) return ascii.slice(0, 6).join('-')
  return text
    .replace(/林默/gu, 'linmo')
    .replace(/安娜/gu, 'anna')
    .replace(/雷队/gu, 'leidui')
    .replace(/阿杰/gu, 'ajie')
    .replace(/孤岛/gu, 'island')
    .replace(/别墅/gu, 'villa')
    .replace(/客厅/gu, 'living-room')
    .replace(/夜/gu, 'night')
    .replace(/[^a-z0-9-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    || 'node'
}
