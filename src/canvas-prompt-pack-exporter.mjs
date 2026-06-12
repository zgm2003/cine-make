import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { composeDraftAssets } from './draft-writer.mjs'
import {
  isTijiaGuomanSource,
  tijiaGuomanAssetDefinitions,
  tijiaGuomanStyle,
  tijiaGuomanStyleBible
} from './tijia-guoman-profile.mjs'
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
    contentValue: 'high',
    triggers: ['手机', '闹钟', '倒计时', '00:00:00', '00:10:00'],
    prompt: '超写实真人电影道具参考图：一部旧智能手机，屏幕显示倒计时数字，边缘有雨水、血迹和细小划痕，心理惊悚电影氛围，暗色背景，85mm镜头，4K，真实玻璃反光，不要水印、字幕、logo。'
  },
  {
    id: 'prop-teapot',
    title: '道具：茶壶 / 热水杯',
    label: '茶壶',
    contentValue: 'low',
    triggers: ['茶壶', '热水', '水杯', '倒水'],
    prompt: '超写实真人电影道具参考图：旧别墅茶几上的陶瓷茶壶和热水杯，杯口有热气，表面有雨夜冷光反射，悬疑片低调布光，85mm镜头，4K，真实材质，不要水印、字幕、logo。'
  },
  {
    id: 'prop-gun',
    title: '道具：老式手枪',
    label: '枪',
    contentValue: 'high',
    triggers: ['枪', '手枪', '枪口', '拔枪'],
    prompt: '超写实真人电影道具参考图：一把磨损老式手枪，金属有雨水和指纹，干净深灰背景，暗黑心理惊悚氛围，85mm镜头，4K，真实金属材质，不要手持、不要人物、不要枪套、不要其他道具、不要水印、字幕、logo。'
  },
  {
    id: 'prop-police-badge',
    title: '道具：警徽',
    label: '警徽',
    contentValue: 'high',
    triggers: ['警徽'],
    prompt: '超写实真人电影道具参考图：一枚旧警徽，边缘磨损，冷色闪电反光，干净深灰背景，心理惊悚电影低调布光，85mm镜头，4K，真实金属质感，不要手持、不要人物、不要桌面摆拍、不要其他道具、不要水印、字幕、logo。'
  },
  {
    id: 'prop-bloody-scalpel',
    title: '道具：带血解剖刀',
    label: '带血的解剖刀',
    contentValue: 'high',
    triggers: ['解剖刀', '解刨刀', '手术刀'],
    prompt: '超写实真人电影道具参考图：一把带血解剖刀，刀刃有暗红血迹和冷色反光，干净深灰背景，精神病院线索氛围，85mm镜头，4K，真实金属和血迹材质，不要手持、不要人物、不要证物袋、不要其他道具、不要水印、字幕、logo。'
  },
  {
    id: 'prop-bloody-knife',
    title: '道具：带血小刀 / 手臂刻字',
    label: '带血小刀',
    contentValue: 'high',
    triggers: ['小刀', '刀刻', '刻字'],
    prompt: '超写实真人电影道具参考图：一把带血小刀，刀刃有克制暗红血迹，干净深灰背景，心理惊悚电影低调布光，85mm镜头，4K，真实金属材质，不要手持、不要人物、不要手臂、不要刻字皮肤、不要其他道具、不要水印、字幕、logo。'
  },
  {
    id: 'prop-medical-file',
    title: '道具：病历夹 / 药瓶',
    label: '病历夹',
    contentValue: 'high',
    triggers: ['病历', '药瓶', '精神病院', '圣路易斯'],
    prompt: '超写实真人电影道具参考图：一本精神病院病历夹，纸张边缘发皱，干净深灰背景，冷色低调布光，85mm镜头，4K，真实纸张材质，不要手持、不要人物、不要药瓶、不要工作牌、不要其他道具、不要水印、字幕、logo。'
  }
]

const LOW_CONTENT_PROP_TERMS = [
  '白瓷茶杯',
  '热水杯',
  '茶杯',
  '水杯',
  '茶壶',
  '普通玉佩',
  '玉佩',
  '普通玉牌',
  '玉牌',
  '装饰牌',
  '餐具',
  '背景摆件'
]

export async function exportCanvasPromptPack({ outDir, contract } = {}) {
  if (!outDir) throw new Error('canvas prompt pack requires outDir')
  if (!contract) throw new Error('canvas prompt pack requires contract')

  await mkdir(outDir, { recursive: true })

  if (isTijiaGuomanSource(contract.sourceText)) {
    const manifest = buildTijiaGuomanCanvasPromptPackManifest({ contract })
    return writeCanvasPackage({ outDir, manifest })
  }

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

export async function exportCanvasFullPack({ outDir, contract } = {}) {
  if (!outDir) throw new Error('canvas full pack requires outDir')
  if (!contract) throw new Error('canvas full pack requires contract')

  await mkdir(outDir, { recursive: true })

  const draft = composeDraftAssets(contract)
  const manifest = buildCanvasFullPackManifest({ contract, draft })
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
  const environments = inferEnvironments(contract, draft)
  const environment = environments[0]
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

  environments.forEach((sceneEnvironment, environmentIndex) => {
    const environmentRow = characters.length + 1 + environmentIndex
    const environmentRefId = environmentReferenceNodeId(sceneEnvironment)
    nodes.push(createManifestNode({
      id: sceneEnvironment.id,
      role: 'environment_bible',
      title: `资料：${sceneEnvironment.name}（非生成）`,
      canvasType: 'text',
      row: environmentRow,
      column: 0,
      content: composeEnvironmentBible({ environment: sceneEnvironment })
    }))

    nodes.push(createManifestNode({
      id: environmentRefId,
      role: 'environment_reference',
      title: `生成：${sceneEnvironment.name}场景参考图`,
      canvasType: 'image',
      row: environmentRow,
      column: 1,
      prompt: composeEnvironmentReferencePrompt({ environment: sceneEnvironment, contract }),
      anchor: environmentReferenceAnchor(sceneEnvironment),
      inputOrder: ['style-bible', sceneEnvironment.id]
    }))
    connect(connections, 'style-bible', environmentRefId, 'style_rules')
    connect(connections, sceneEnvironment.id, environmentRefId, 'environment_bible')
  })

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

function buildTijiaGuomanCanvasPromptPackManifest({ contract }) {
  const nodes = []
  const connections = []
  const aspectRatio = contract.target.aspectRatio
  const style = tijiaGuomanStyle(contract.target.style)
  const assetDefinitions = tijiaGuomanAssetDefinitions({
    sourceText: contract.sourceText,
    style,
    aspectRatio
  })
  const stylePrompt = [
    `GPT-image-2，${aspectRatio}，${style}。`,
    '3D国漫整体风格参考图，不是分镜，不要具体剧情动作。',
    '画面表现古代仙侠家族大堂内的压迫气氛：深色木梁、屏风、烛火、家主主位、角落阴影坐席、冷青剑光、暖金灯火、水墨雾气。',
    '空间有东方水墨晕染感，后续角色资产要适配高质量3D国漫建模。',
    '不要真人照片，不要现代物品，不要低幼卡通，不要Q版，不要文字水印。'
  ].join('')

  nodes.push(createManifestNode({
    id: 'style-bible',
    role: 'style_bible',
    title: '资料：3D国漫整体风格（非生成）',
    canvasType: 'text',
    row: 0,
    column: 0,
    content: tijiaGuomanStyleBible({ style, aspectRatio })
  }))
  nodes.push(createManifestNode({
    id: 'style-reference',
    role: 'style_reference',
    title: '生成：3D国漫整体风格参考图',
    canvasType: 'image',
    row: 0,
    column: 1,
    prompt: stylePrompt,
    imageSize: '16:9',
    anchor: styleReferenceAnchor(),
    inputOrder: ['style-bible']
  }))
  connect(connections, 'style-bible', 'style-reference', 'style_rules')

  assetDefinitions.forEach((asset, index) => {
    const row = index + 1
    if (asset.id.startsWith('environment-')) {
      const refId = asset.id.replace(/^environment-/u, 'environment-ref-')
      const environment = { id: asset.id, name: asset.title }
      nodes.push(createManifestNode({
        id: asset.id,
        role: 'environment_bible',
        title: `资料：${asset.title}场景（非生成）`,
        canvasType: 'text',
        row,
        column: 0,
        content: asset.bible
      }))
      nodes.push(createManifestNode({
        id: refId,
        role: 'environment_reference',
        title: `生成：${asset.title}场景参考图`,
        canvasType: 'image',
        row,
        column: 1,
        prompt: asset.prompt,
        imageSize: '16:9',
        anchor: environmentReferenceAnchor(environment),
        inputOrder: ['style-bible', asset.id]
      }))
      connect(connections, 'style-bible', refId, 'style_rules')
      connect(connections, asset.id, refId, 'environment_bible')
      return
    }

    if (asset.id.startsWith('character-')) {
      const refId = asset.id.replace(/^character-/u, 'character-ref-')
      const character = { id: asset.id, name: asset.title }
      nodes.push(createManifestNode({
        id: asset.id,
        role: 'character_bible',
        title: `资料：${asset.title}人设（非生成）`,
        canvasType: 'text',
        row,
        column: 0,
        content: asset.bible
      }))
      nodes.push(createManifestNode({
        id: refId,
        role: 'character_reference',
        title: `生成：${asset.title}3D国漫三视图`,
        canvasType: 'image',
        row,
        column: 1,
        prompt: asset.prompt,
        imageSize: '16:9',
        anchor: characterReferenceAnchor(character),
        inputOrder: [asset.id]
      }))
      connect(connections, asset.id, refId, 'character_bible')
      return
    }

    if (asset.id.startsWith('prop-')) {
      const refId = asset.id.replace(/^prop-/u, 'prop-ref-')
      nodes.push(createManifestNode({
        id: asset.id,
        role: 'prop_bible',
        title: `资料：${asset.title}道具（非生成）`,
        canvasType: 'text',
        row,
        column: 0,
        content: asset.bible
      }))
      nodes.push(createManifestNode({
        id: refId,
        role: 'prop_reference',
        title: `生成：${asset.title}道具参考图`,
        canvasType: 'image',
        row,
        column: 1,
        prompt: asset.prompt,
        imageSize: '16:9',
        anchor: {
          anchorId: refId,
          anchorRole: 'prop_reference',
          anchorName: asset.title,
          mergeStrategy: 'reuse_existing'
        },
        inputOrder: [asset.id]
      }))
      connect(connections, asset.id, refId, 'prop_bible')
    }
  })

  return {
    schemaVersion: 1,
    kind: 'cine-make-canvas-prompt-pack',
    packageType: 'manual_canvas_generation',
    createdAt: new Date().toISOString(),
    source: {
      title: '替嫁爆点-3D国漫资产生成包',
      contentType: contract.contentType
    },
    target: {
      app: CANVAS_APP,
      version: CANVAS_VERSION,
      aspectRatio,
      style,
      platform: contract.target.platform
    },
    manualWorkflow: [
      '导入 canvas-project.zip。',
      '本包只生成基础资产：3D国漫整体风格、许家大堂、4个人物三视图、1个高内容感剧情道具。',
      '左侧资料节点不要生成；点击右侧图片节点生成。',
      '生成满意后锁定这些资产；下一步再做每5条=15s的Seedance逐条视频文本投喂包。'
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
  const environments = inferEnvironments(contract, draft)
  const environment = environments[0]
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
    const shotEnvironment = environmentForShot(shot, environments)
    const requiredAnchors = requiredAnchorsForShot({ shot, characters, environment: shotEnvironment })
    nodes.push(createManifestNode({
      id: keyframeNodeId(shot, index),
      role: 'keyframe',
      title: `生成：${shot.shot_id || `S${String(index + 1).padStart(2, '0')}`} 关键帧`,
      canvasType: 'image',
      row: index,
      column: 1,
      prompt: composeKeyframePrompt({ shot, contract, environment: shotEnvironment, props }),
      inputOrder: requiredAnchors.map((anchor) => anchor.anchorId),
      requiredAnchors,
      promptLayer: 'keyframe_static',
      motionPrompt: composeMotionPrompt({ shot }),
      linkedBeat: beatForCanvasShot(beats, shot)?.beat_id ?? `B${String(index + 1).padStart(2, '0')}`,
      shotFunction: shotFunctionForCanvas(shot, index, shots.length),
      audienceTakeaway: audienceTakeawayForCanvas(shot, index, shots.length),
      environmentId: shotEnvironment.id,
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

function buildCanvasFullPackManifest({ contract, draft }) {
  const foundation = buildCanvasPromptPackManifest({ contract, draft })
  const storyboard = buildCanvasStoryboardPackManifest({ contract, draft })
  const nodes = []
  const connections = []
  const seenNodeIds = new Set()

  for (const node of foundation.nodes) {
    if (seenNodeIds.has(node.id)) continue
    seenNodeIds.add(node.id)
    nodes.push({ ...node })
  }

  for (const node of storyboard.nodes) {
    if (seenNodeIds.has(node.id)) continue
    seenNodeIds.add(node.id)
    nodes.push(repositionStoryboardNodeForFullCanvas(node))
  }

  for (const connection of foundation.connections ?? []) {
    connect(connections, connection.fromNodeId, connection.toNodeId, connection.role)
  }

  addFullCanvasKeyframeConnections({ nodes, connections })

  return {
    schemaVersion: 1,
    kind: 'cine-make-canvas-full-pack',
    packageType: 'manual_canvas_full_generation',
    createdAt: new Date().toISOString(),
    source: foundation.source,
    target: foundation.target,
    manualWorkflow: [
      '导入 canvas-project.zip。',
      '这是全量 Canvas 工程：左侧为风格、人设、场景基础资产，右侧为 Shot List 与 Keyframe 分镜链。',
      '先生成并锁定整体风格参考图、角色参考图和场景参考图。',
      'Keyframe 节点已经通过实线连接到所需风格/人物/场景参考图，并按 S01 → S02 → S03 的故事顺序串联。',
      '再按分镜链路从 S01 开始逐个生成关键帧；最后复制 prompt-pack.md 里的 Motion Prompt / 视频提示词到即梦生成视频段。'
    ],
    outputs: ['canvas-project.zip', 'canvas-manifest.json', 'prompt-pack.md', 'README.md'],
    nodes,
    connections
  }
}

function repositionStoryboardNodeForFullCanvas(node) {
  const clone = { ...node, position: { ...node.position } }
  if (clone.role === 'shot_list') {
    clone.position = {
      x: 2 * GAP_X,
      y: 0
    }
    return clone
  }
  if (clone.role === 'keyframe') {
    clone.position = {
      x: 3 * GAP_X,
      y: clone.position.y
    }
  }
  return clone
}

function addFullCanvasKeyframeConnections({ nodes, connections }) {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const keyframes = nodes
    .filter((node) => node.role === 'keyframe')
    .sort(compareKeyframeNodes)

  if (keyframes[0]) connect(connections, 'shot-list', keyframes[0].id, 'story_flow')

  for (let index = 0; index < keyframes.length; index += 1) {
    const keyframe = keyframes[index]
    for (const anchor of keyframe.requiredAnchors ?? []) {
      if (!nodeIds.has(anchor.anchorId)) continue
      connect(connections, anchor.anchorId, keyframe.id, anchorConnectionRole(anchor))
    }
    const next = keyframes[index + 1]
    if (next) connect(connections, keyframe.id, next.id, 'story_flow')
  }
}

function compareKeyframeNodes(left, right) {
  return keyframeOrder(left.id) - keyframeOrder(right.id)
}

function keyframeOrder(id) {
  const match = String(id).match(/keyframe-s(\d+)/u)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

function anchorConnectionRole(anchor) {
  if (anchor.anchorRole === 'style_reference') return 'style_anchor'
  if (anchor.anchorRole === 'environment_reference') return 'environment_anchor'
  if (anchor.anchorRole === 'character_reference') return 'character_anchor'
  return 'visual_anchor'
}

function normalizeCharacters(characters = []) {
  return characters.map((character, index) => ({
    id: normalizedCharacterId(character, index),
    name: character.identity_anchor || character.name || character.identity || `角色${index + 1}`,
    identity: character.identity || '',
    height: character.height || '',
    age: character.age || '',
    appearance: character.appearance || '',
    costume: character.costume || character.costume_anchor || '',
    bodyDetails: character.body_details || '',
    expression: character.expression || character.performance_anchor || '',
    mood: character.mood || '',
    props: valueGatePropNames(character.props ?? []),
    prompt: stripLowContentPropText(character.reference_prompt || '')
  }))
}

function normalizedCharacterId(character, index) {
  const fallbackName = character.identity_anchor || character.name || character.identity || String(index + 1)
  const id = String(character.id || '')
  if (/^character-[a-z0-9-]+$/u.test(id)) return id
  return `character-${slugId(fallbackName)}`
}

function inferEnvironments(contract, draft) {
  if (contract.contentType === 'explicit_storyboard') {
    const sceneIds = new Set((draft.shotlist ?? []).map((shot) => shot.scene).filter(Boolean))
    const explicitEnvironments = explicitStoryboardEnvironments().filter((environment) => (
      environment.sourceSceneIds.some((sceneId) => sceneIds.has(sceneId))
    ))
    if (explicitEnvironments.length) return explicitEnvironments
  }
  return [inferPrimaryScene(contract, draft)]
}

function explicitStoryboardEnvironments() {
  return [
    {
      id: 'environment-old-building-exterior',
      sourceSceneIds: ['SCENE_01_OLD_BUILDING_EXTERIOR'],
      title: '场景设定：老旧居民楼外景',
      name: '老旧居民楼外景',
      description: '略显陈旧的老式居民楼外立面，墙面斑驳但生活化，楼门入口清楚，周围是普通居民区地面和门牌；无人物、无剧情动作。',
      lighting: '上午白天自然光，外墙和单元门清楚可见，柔和暖灰生活光，画面明亮但不过曝。',
      atmosphere: '生活化、安静、旧但干净，不夸张破败，不做夜景氛围。',
      continuity: '楼体外立面、单元门位置、墙面颜色和入口方向保持一致；不要变成高档公寓、开放连廊、商业街、夜景、亮灯夜窗或黑暗楼栋。'
    },
    {
      id: 'environment-stairwell',
      sourceSceneIds: ['SCENE_02_INDOOR_STAIRWELL'],
      title: '场景设定：封闭式室内老居民楼楼道 / 楼梯平台',
      name: '封闭式室内老居民楼楼道 / 楼梯平台',
      description: '封闭式室内单元楼楼道，楼梯在楼内，不露天，不见天空，不见树木；水泥墙面旧但干净，窄楼梯平台，铁栏杆，入户门外空间可复用。',
      lighting: '上午白天楼道自然反射光，顶灯只作弱补光，台阶和墙面清楚可见，低饱和暖灰。',
      atmosphere: '狭窄、安静、有生活痕迹但不脏乱，不做恐怖片暗场。',
      continuity: '楼梯转角、平台、铁栏杆、入户门方位保持一致；不要变成室外楼梯、开放走廊、带天空的连廊、夜景或黑暗楼道。'
    },
    {
      id: 'environment-small-apartment-interior',
      sourceSceneIds: ['SCENE_03_SMALL_APARTMENT_INTERIOR'],
      title: '场景设定：一室一厅出租屋室内 / 客厅 / 里屋门口',
      name: '一室一厅出租屋室内 / 客厅 / 里屋门口',
      description: '老式一室一厅出租屋室内，客厅陈设简单但打扫得一尘不染，沙发、窗边小凳、茶几、里屋门口的方位清楚；可支持客厅对话和里屋门缝揭示。',
      lighting: '上午柔和窗光进入室内，暖色生活光只作辅助，人物和家具清楚可见，低饱和暖灰。',
      atmosphere: '整洁、压抑、生活化，带一点独居少女的温度，但不是夜景或恐怖片暗场。',
      continuity: '沙发、窗边小凳、茶几、里屋门口位置不能乱跳；晚晚只在里屋门口相关镜头出现；不要生成夜晚室内或黑暗房间。'
    }
  ]
}

function environmentForShot(shot, environments) {
  return environments.find((environment) => environment.sourceSceneIds?.includes(shot.scene)) ?? environments[0]
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

  return PROP_CATALOG
    .filter((prop) => prop.contentValue === 'high')
    .filter((prop) => prop.triggers.some((trigger) => haystack.includes(trigger)))
}

function valueGatePropNames(props = []) {
  return props.filter((prop) => !isLowContentPropText(prop))
}

function isLowContentPropText(value) {
  const text = String(value || '')
  return LOW_CONTENT_PROP_TERMS.some((term) => text.includes(term))
}

function stripLowContentPropText(value) {
  let text = String(value || '')
  for (const term of LOW_CONTENT_PROP_TERMS) {
    const escaped = escapeRegExp(term)
    text = text.replace(new RegExp(`(?:[；;、，,]\\s*)?${escaped}(?:\\s*[；;、，,])?`, 'gu'), (match) => {
      const hasLeftSeparator = /^[；;、，,]/u.test(match)
      const hasRightSeparator = /[；;、，,]$/u.test(match)
      return hasLeftSeparator && hasRightSeparator ? '；' : ''
    })
  }
  return text
    .replace(/[；;、，,]{2,}/gu, '；')
    .replace(/：\s*[；;、，,]\s*/gu, '：')
    .replace(/[；;、，,]\s*。/gu, '。')
    .replace(/核心道具：\s*。/gu, '')
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
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
  if (isIllustratedStyle(contract) || contract.contentType === 'explicit_storyboard') {
    return [
      '# World Bible',
      '',
      '## 类型',
      '国漫现实主义短剧 / 生活冲突 / 秘密揭示。',
      '',
      '## 世界规则',
      '- 故事发生在老旧居民楼和一室一厅出租屋内，空间少而稳定。',
      '- 人物脸、服装和身形以已锁定人物主图为准。',
      '- 场景母图只锁定空间结构，不承担剧情动作。',
      '- 分镜关键帧只画当前可见瞬间，不生成字幕或对白气泡。',
      '',
      '## 情绪基调',
      '克制、生活化、紧张、暖灰、压抑；秘密揭示来自人物关系和空间遮挡。',
      '',
      `## 主场景规则\n${environment.description}`,
      '',
      `## 默认画幅和风格\n${contract.target.aspectRatio} / ${contract.target.style}`
    ].join('\n')
  }
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
  if (isIllustratedStyle(contract) || contract.contentType === 'explicit_storyboard') {
    return [
      '# Art Direction',
      '',
      '## 色彩规则',
      '- 低饱和暖灰为主。',
      '- 楼道使用昏黄顶灯和局部阴影。',
      '- 室内使用柔和窗光和暖色生活灯。',
      '- 不使用过度饱和、奇幻发光或照片质感。',
      '',
      '## 光影规则',
      '- 光源必须来自楼道灯、窗光或室内生活灯。',
      '- 时间感统一为上午 / 白天，不做夜景。',
      '- 国漫现实主义风格，干净线稿和细腻光影。',
      '- 每个场景保持固定方位，不随机换成其他建筑。',
      '',
      '## 镜头语言',
      '- 全景负责空间关系。',
      '- 中近景负责冲突和人物关系。',
      '- 特写负责表情、门缝、秘密揭示。',
      '- 关键帧不写动作过程，只保留可画定格。',
      '',
      '## 场景统一',
      `${environment.name} 的入口、墙面、门窗、家具或栏杆位置必须持续一致。`,
      '',
      `## 基础风格\n${contract.target.style}`
    ].join('\n')
  }
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
    isIllustratedStyle(contract) || contract.contentType === 'explicit_storyboard'
      ? '- 所有参考图必须共享同一套国漫现实主义、低饱和暖灰、电影式构图、干净线稿和细腻光影规则。'
      : '- 所有参考图必须共享同一套心理悬疑、暴雨夜、低饱和蓝灰、practical lighting / motivated lighting 规则。'
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
    environment.lighting || '窗外闪电和暴雨冷光为主，室内少量暖黄灯为辅；光源必须来自窗、灯、手机屏、闪电。',
    '',
    '## 空气',
    environment.atmosphere || '潮湿、灰尘、冷雾、雨水反光；地面和玻璃持续有湿痕。',
    '',
    '## 声音感',
    environment.sound || '按空间保留轻微环境声感；即使生成图片，也要让空间像有声音。',
    '',
    '## 连续性规则',
    environment.continuity || '沙发、茶几、门口、窗户、角落方位不能乱跳；不要突然变成医院、办公室、走廊或白天。'
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
  if (isIllustratedStyle(contract)) {
    return [
      '风格参考图生成任务：生成一张整体国漫现实主义 mood frame，不是分镜，不要出现具体剧情动作。',
      '',
      '必须读取直接上游文本：风格设定 / World Bible / Art Direction。',
      '',
      `画幅：${contract.target.aspectRatio}`,
      `主场景气质：${environment.name}`,
      `风格：${contract.target.style}`,
      '画面内容：上午白天的老旧居民楼生活质感、低饱和暖灰、电影式构图、干净线稿、细腻光影、真实空间比例，画面清楚明亮但不过曝。',
      '用途：作为后续人物参考图、场景参考图和关键帧的统一视觉锚点。',
      '',
      '负面：不要夜景、黑暗楼栋、亮灯夜窗、恐怖片暗场、字幕、水印、logo、照片质感、真实皮肤毛孔、过度饱和、奇幻特效、海报排版。'
    ].join('\n')
  }
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
  if (isIllustratedStyle(contract)) {
    return [
      `【角色参考图】角色：${character.name}`,
      `风格：${contract.target.style}`,
      '画面为国漫角色设定图 / character sheet，干净白底或浅灰底，满版构图，不留顶部空白，不要大面积空白边框。',
      '版式必须固定：左侧从左上区域开始生成高清正面人脸半身大图，占据左边画面约2/3大小；如果没有清晰人脸，就用角色本身的形象大图占据左侧2/3。人物头顶接近画面上边缘但不裁切，脸型、发型、眼睛、服装材质和核心识别点清楚。',
      '右侧生成角色正面、侧面、背面三视小图，也就是三视图全身设定图；三视小图从上到下或竖向整齐排列，比例一致，显示完整身形、发型轮廓、服装正侧背结构。',
      '文字标注：只显示角色名称和身高，不显示年龄，不显示多余设定说明；名称和身高放在右侧三视图旁或底部小标注区，清晰可读但不要变成海报标题。',
      '如果剧本未提供身高，请根据角色身份设定合理身高，并在图中显示“身高”标注。',
      character.identity ? `身份：${character.identity}` : '',
      character.appearance ? `外观：${character.appearance}。` : '',
      character.costume ? `服装：${character.costume}。` : '',
      character.expression ? `表情基准：${character.expression}。` : '',
      character.props?.length ? `核心道具：${character.props.join('；')}。` : '',
      '',
      `角色名称：${character.name}`,
      character.height ? `身高：${character.height}` : '身高：未指定，请按角色年龄与身份合理设定并在图中标注。',
      '连续性：后续所有镜头保持脸型、发型、身形、服装稳定。',
      '国漫现实主义，电影式构图，干净线稿，细腻光影，低饱和暖灰色调，character turnaround, front view, side view, back view, left large portrait half-body occupying about two thirds of the image, right small tri-view full-body, show name and height only, no age text.',
      '负面：不要加入剧情动作，不要加入其他角色，不要复杂背景，不要对白气泡，不要水印，不要logo，不要海报排版，不要真实照片皮肤质感，不要真实毛孔特写，不要把三视图省略成单人立绘。'
    ].filter(Boolean).join('\n')
  }

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
  if (isIllustratedStyle(contract)) {
    return [
      `场景参考图生成任务：生成 ${environment.name} 的国漫母场景设定图。`,
      '',
      '必须读取直接上游文本：风格设定 + 当前 Environment Bible。',
      '',
      `画幅：${contract.target.aspectRatio}`,
      `风格：${contract.target.style}`,
      `场景：${environment.name}`,
      `空间定义：${environment.description}`,
      `光线：${environment.lighting || '低饱和暖灰色调，电影式构图，细腻光影。'}`,
      '构图：空场景，无人物，无剧情动作；上午白天生活光，画面清楚可见；重点建立空间结构、入口、家具/栏杆/门窗方位。',
      '用途：作为后续分镜和关键帧的空间连续性锚点。',
      '',
      '负面：不要夜景、黑暗楼栋、亮灯夜窗、恐怖片暗场；不要人物、不要对白、不要字幕、水印、logo；不要把室内楼道画成露天；不要新增不相关豪宅或医院。'
    ].join('\n')
  }
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
      `- 画面动作：${shot.action || ''}`,
      shot.screen_text ? `- 后期屏幕文字：${shot.screen_text}` : ''
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
    keyframeStyleLine(contract),
    '',
    keyframeNegativeLine(contract)
  ].filter(Boolean).join('\n')
}

function isIllustratedStyle(contract) {
  return /国漫|漫画|二次元|anime|manhua|comic|toon|webtoon|插画/u.test(contract.target?.style ?? '')
}

function keyframeStyleLine(contract) {
  if (isIllustratedStyle(contract)) {
    return `${contract.target.style}，电影式构图，干净线稿，细腻光影，角色脸和服装严格参考已锁定人物主图，空间结构严格参考已锁定场景主图，no motion blur, no transition, no collage.`
  }
  return 'photorealistic live-action film still, grounded cinematic realism, restrained psychological thriller mood, consistent actor face and costume, consistent physical location, no motion blur, no transition, no collage.'
}

function keyframeNegativeLine(contract) {
  if (isIllustratedStyle(contract)) {
    return '负面：不要字幕、水印、logo、对白气泡、乱加未连接角色、突然换脸、换服装、换场景、照片质感、真实皮肤毛孔、不要模拟视频运动。'
  }
  return '负面：不要字幕、水印、logo、乱加未连接角色、突然换脸、换服装、换场景、把客厅变成其他地点、不要模拟视频运动。'
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
  if (/确认地址|单元门牌|准备进门收租/u.test(text)) {
    return { primary: '江渝白到达楼下确认地址', secondary: ['租户名单', '单元门牌'] }
  }
  if (/00:00:00/u.test(action)) return { primary: '手机 00:00:00', secondary: ['林默血手', '屏幕冷光'] }
  if (/倒计时|手机/u.test(action)) return { primary: '倒计时手机', secondary: ['林默血手', '屏幕冷光'] }
  if (/刻字|手臂|我的记忆只有10分钟/u.test(text)) return { primary: '手臂刻字', secondary: ['血手', '袖口'] }
  if (/镜头拉开|另外三个人|三个人|四个方位|客厅里还有/u.test(text)) return { primary: '四人空间棋盘', secondary: ['雷队堵门', '阿杰背光角落'] }
  if (/冷笑|凯撒|眼神诡异/u.test(text)) return { primary: /冷笑/u.test(text) ? '阿杰嘴角冷笑' : '阿杰诡异眼神', secondary: ['众人视线转向阿杰', '拐杖/腿部支架'] }
  if (/阿杰|瘸子|蜷缩|瑟瑟/u.test(text)) return { primary: '阿杰诡异眼神', secondary: ['拐杖', '腿部支架'] }
  if (/热水杯|倒热水|倒水/u.test(text)) return { primary: '安娜倒水安抚/控制', secondary: ['安娜手部动作', '林默警惕眼神'] }
  if (/雷队|枪/u.test(text)) return { primary: '雷队堵门', secondary: ['手枪', '出口'] }
  if (/安娜|药|安抚/u.test(text)) return { primary: '安娜安抚/控制', secondary: ['药瓶', '林默反应'] }
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
    .replace(/江渝白/gu, 'jiang-yubai')
    .replace(/林听晚/gu, 'lin-tingwan')
    .replace(/李大妈/gu, 'li-dama')
    .replace(/晚晚/gu, 'wanwan')
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
