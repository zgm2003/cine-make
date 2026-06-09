import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { composeDraftAssets } from './draft-writer.mjs'
import { createStoredZip } from './zip-writer.mjs'

const CANVAS_APP = 'infinite-canvas'
const CANVAS_VERSION = 3
const IMAGE_NODE_WIDTH = 300
const IMAGE_NODE_HEIGHT = 420
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
  const shots = draft.shotlist ?? []

  nodes.push(createManifestNode({
    id: 'script-breakdown',
    role: 'script_breakdown',
    title: '剧本拆解',
    canvasType: 'text',
    row: 0,
    column: 0,
    content: composeScriptBreakdown({ contract, draft, characters, environment, props })
  }))

  nodes.push(createManifestNode({
    id: 'world-bible',
    role: 'world_bible',
    title: '世界观 / 类型 / 情绪规则',
    canvasType: 'text',
    row: 1,
    column: 0,
    content: composeWorldBible({ contract, environment })
  }))
  connect(connections, 'script-breakdown', 'world-bible', 'analysis_to_world_rules')

  nodes.push(createManifestNode({
    id: 'art-direction',
    role: 'art_direction',
    title: '视觉风格锁定 / Art Direction',
    canvasType: 'text',
    row: 1,
    column: 1,
    content: composeArtDirection({ contract, environment })
  }))
  connect(connections, 'world-bible', 'art-direction', 'world_rules_to_visual_rules')

  characters.forEach((character, index) => {
    nodes.push(createManifestNode({
      id: character.id,
      role: 'character_bible',
      title: `人设：${character.name}`,
      canvasType: 'text',
      row: 2,
      column: index,
      content: composeCharacterBible(character)
    }))
    connect(connections, 'world-bible', character.id, 'world_rules_to_character')
  })

  nodes.push(createManifestNode({
    id: environment.id,
    role: 'environment_bible',
    title: environment.title,
    canvasType: 'text',
    row: 3,
    column: 0,
    content: composeEnvironmentBible({ environment })
  }))
  connect(connections, 'world-bible', environment.id, 'world_rules_to_environment')

  props.forEach((prop, index) => {
    nodes.push(createManifestNode({
      id: prop.id,
      role: 'prop_bible',
      title: prop.title,
      canvasType: 'text',
      row: 3,
      column: index + 1,
      content: composePropBible(prop)
    }))
    connect(connections, 'world-bible', prop.id, 'world_rules_to_prop')
  })

  shots.forEach((shot, index) => {
    const shotId = shotNodeId(shot, index)
    nodes.push(createManifestNode({
      id: shotId,
      role: 'shot',
      title: `分镜 ${shot.shot_id}`,
      canvasType: 'text',
      row: 4 + Math.floor(index / SHOTS_PER_SEGMENT),
      column: index % SHOTS_PER_SEGMENT,
      content: composeShotBible({ shot, environment })
    }))
    if (index > 0) connect(connections, shotNodeId(shots[index - 1], index - 1), shotId, 'shot_sequence')
  })

  shots.forEach((shot, index) => {
    const shotId = shotNodeId(shot, index)
    const keyframeId = keyframeNodeId(shot, index)
    const inputOrder = ['art-direction', environment.id, shotId]
    nodes.push(createManifestNode({
      id: keyframeId,
      role: 'keyframe',
      title: `关键帧 ${shot.shot_id}`,
      canvasType: 'image',
      row: 4 + Math.ceil(shots.length / SHOTS_PER_SEGMENT) + Math.floor(index / SHOTS_PER_SEGMENT),
      column: index,
      prompt: composeKeyframePrompt({ shot, contract, environment }),
      inputOrder
    }))

    connect(connections, 'art-direction', keyframeId, 'style_lock')
    connect(connections, environment.id, keyframeId, 'environment_reference')
    connect(connections, shotId, keyframeId, 'camera_script')
    for (const character of characters) {
      if (shotUsesCharacter(shot, character.name)) {
        connect(connections, character.id, keyframeId, 'character_reference')
        inputOrder.push(character.id)
      }
    }
    for (const prop of props) {
      if (shotUsesProp(shot, prop)) {
        connect(connections, prop.id, keyframeId, 'prop_reference')
        inputOrder.push(prop.id)
      }
    }
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
      '先阅读 Script Breakdown、World Bible、Character Bible、Environment Bible 和 Art Direction。',
      '确认这些前期规则后，再生成 Keyframe 节点。',
      '每个 Keyframe 只读取它上游连接的人设、场景、道具、Art Direction 和对应分镜。'
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
    appearance: character.appearance || '',
    costume: character.costume || character.costume_anchor || '',
    expression: character.expression || character.performance_anchor || '',
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

function createManifestNode({ id, role, title, canvasType, row, column, prompt, content, seconds, inputOrder }) {
  const isVideo = canvasType === 'video'
  const isText = canvasType === 'text'
  return {
    id,
    role,
    canvasType,
    title,
    position: {
      x: column * GAP_X,
      y: row * ROW_HEIGHT
    },
    width: isVideo ? VIDEO_NODE_WIDTH : isText ? TEXT_NODE_WIDTH : IMAGE_NODE_WIDTH,
    height: isVideo ? VIDEO_NODE_HEIGHT : isText ? TEXT_NODE_HEIGHT : IMAGE_NODE_HEIGHT,
    prompt,
    content,
    seconds,
    inputOrder
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
        fontSize: 14
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
        seconds: node.seconds || '5'
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
      size: manifest.target.aspectRatio,
      quality: 'auto',
      count: 1,
      inputOrder: node.inputOrder
    }
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

function composeCharacterBible(character) {
  return [
    `# Character Bible：${character.name}`,
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
    `- 构图：${shot.composition || ''}`,
    `- 调度：${shot.blocking || ''}`,
    `- 表演：${shot.performance_detail || ''}`,
    `- 画面动作：${shot.action || ''}`,
    `- 连续性：${shot.continuity_from_previous || ''}`
  ].join('\n')
}

function composeKeyframePrompt({ shot, contract, environment }) {
  return [
    '关键帧生成任务：生成一张电影概念帧 / 分镜定格，不是视频，不是多格漫画。',
    '',
    '必须读取并遵守上游连接：Art Direction、Environment Bible、对应 Shot、实际连接的人设和道具。未连接的人物和道具不要出现。',
    '上游连接决定角色、场景、道具和视觉风格；不要自己重新发明地点、灯光、服装或画面风格。',
    '',
    `分镜：${shot.shot_id}`,
    `画幅：${contract.target.aspectRatio}`,
    `场景锚点：${environment.name}`,
    `景别/镜头：${shot.shot_size || ''} / ${shot.lens || ''}`,
    `运镜只转化为静态构图暗示：${shot.camera_movement || ''}`,
    `画面动作：${shot.action || ''}`,
    `调度：${shot.blocking || ''}`,
    '',
    shot.image_prompt || '',
    '',
    '负面：不要字幕、水印、logo、乱加未连接角色、突然换脸、换服装、换场景、把客厅变成其他地点。'
  ].filter(Boolean).join('\n')
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
  const text = [
    shot.action,
    shot.subject,
    shot.composition,
    shot.blocking,
    shot.image_prompt,
    shot.video_prompt_note,
    shot.dialogue_or_voiceover
  ].filter(Boolean).join('\n')
  return prop.triggers.some((trigger) => text.includes(trigger))
}

function shotNodeId(shot, fallbackIndex = 0) {
  const id = shot?.shot_id || `S${String(fallbackIndex + 1).padStart(2, '0')}`
  return `shot-${id.toLowerCase()}`
}

function keyframeNodeId(shot, fallbackIndex = 0) {
  const id = shot?.shot_id || `S${String(fallbackIndex + 1).padStart(2, '0')}`
  return `keyframe-${id.toLowerCase()}`
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
