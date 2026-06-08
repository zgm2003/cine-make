import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createStoredZip } from '../zip-writer.mjs'

const MANIFEST_KIND = 'cine-make-canvas-manifest'
const CANVAS_APP = 'infinite-canvas'
const CANVAS_VERSION = 3
const MAX_UPLOAD_IMAGES = 9
const DEFAULT_STYLE = '超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性'
const TEXT_NODE_WIDTH = 420
const TEXT_NODE_HEIGHT = 280
const IMAGE_NODE_WIDTH = 340
const IMAGE_NODE_HEIGHT = 240
const GAP_X = 80
const GAP_Y = 120
const ROW_HEIGHT = TEXT_NODE_HEIGHT + GAP_Y
const CANVAS_IMAGE_GENERATION_ROLES = new Set(['character_card', 'scene_card', 'shot_card'])

export async function exportNovelCanvas({ runDir, episodeNumber, outDir } = {}) {
  if (!runDir) throw new Error('novel canvas requires --run <project-dir>')
  const selectedEpisodeNumber = validateEpisodeNumber(episodeNumber)
  const projectDir = resolve(runDir)
  const project = await readRequiredJson(join(projectDir, 'project.json'))
  if (project.mode !== 'novel-project') {
    throw new Error('novel canvas requires a Novel Studio project with mode "novel-project"')
  }

  const plan = await readRequiredJson(join(projectDir, 'episodes', 'adaptation-plan.json'))
  validateAdaptationPlan(plan)
  const episode = plan.episodes[selectedEpisodeNumber - 1]
  if (!episode) {
    throw new Error(`Episode ${selectedEpisodeNumber} does not exist; planned episodes: ${plan.episodes.length}`)
  }

  const episodeDir = outDir
    ? resolve(outDir)
    : join(projectDir, 'episodes', episode.episodeId)
  await assertEpisodePackage({ projectDir, episodeDir, selectedEpisodeNumber })
  const deliverableText = await readFile(join(episodeDir, 'deliverable.md'), 'utf8')

  const warnings = []
  const summaries = await readEpisodeSummaries({ projectDir, episode })
  const characters = await readEpisodeCharacters({ projectDir, episode })
  const locations = await readEpisodeLocations({ projectDir, summaries })
  const visualBible = await readOptionalText(join(projectDir, 'visual-bible', 'character-reference-plan.md'), {
    warnings,
    message: 'visual-bible/character-reference-plan.md is missing; character visual locks may be incomplete.'
  })
  const continuityLog = await readOptionalText(join(projectDir, 'continuity', 'continuity-log.md'), {
    warnings,
    message: 'continuity/continuity-log.md is missing; continuity notes were reduced to episode summaries.'
  })
  const unresolvedHooks = await readOptionalJson(join(projectDir, 'continuity', 'unresolved-hooks.json'), {
    fallback: [],
    warnings,
    message: 'continuity/unresolved-hooks.json is missing; unresolved hooks were reduced to the episode ending hook.'
  })
  const feedCards = await readOptionalJson(join(episodeDir, 'jimeng-feed-cards.json'), {
    fallback: null,
    warnings,
    message: 'episodes/' + episode.episodeId + '/jimeng-feed-cards.json is missing; Jimeng feed cards were not prepared yet.'
  })

  const manifest = buildCanvasManifest({
    project,
    projectDir,
    episode,
    episodeNumber: selectedEpisodeNumber,
    summaries,
    characters,
    locations,
    visualBible,
    continuityLog,
    unresolvedHooks: Array.isArray(unresolvedHooks) ? unresolvedHooks : [],
    feedCards: Array.isArray(feedCards) ? feedCards : null,
    deliverableText,
    warnings
  })
  const canvasExport = buildCanvasExport(manifest)

  await mkdir(episodeDir, { recursive: true })
  const manifestPath = join(episodeDir, 'canvas-manifest.json')
  const zipPath = join(episodeDir, 'canvas-project.zip')
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await writeFile(zipPath, createStoredZip([
    { name: 'projects.json', data: `${JSON.stringify(canvasExport, null, 2)}\n` }
  ]))

  return {
    manifestPath,
    zipPath,
    warnings: manifest.warnings,
    manifest,
    canvasExport
  }
}

function validateEpisodeNumber(value) {
  const episodeNumber = Number(value)
  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    throw new Error('novel canvas requires --episode <positive-integer>')
  }
  return episodeNumber
}

function validateAdaptationPlan(plan) {
  if (plan?.schemaVersion !== 1) {
    throw new Error('Unsupported adaptation-plan.json schemaVersion')
  }
  if (!Array.isArray(plan.episodes)) {
    throw new Error('Invalid adaptation-plan.json episodes')
  }
}

async function assertEpisodePackage({ projectDir, episodeDir, selectedEpisodeNumber }) {
  const missing = []
  for (const file of ['episode-input.md', 'deliverable.md']) {
    if (!(await pathExists(join(episodeDir, file)))) missing.push(file)
  }
  if (missing.length) {
    throw new Error([
      `Episode package is missing in ${episodeDir}: ${missing.join(', ')}`,
      `Run cine-make novel episode --run ${projectDir} --episode ${selectedEpisodeNumber} before exporting canvas.`
    ].join('\n'))
  }
}

async function readEpisodeSummaries({ projectDir, episode }) {
  const summaries = []
  for (const chapter of episode.includedChapters ?? []) {
    const summaryPath = join(projectDir, 'summaries', `${chapter.chapterId}.summary.json`)
    summaries.push(await readRequiredJson(summaryPath))
  }
  return summaries
}

async function readEpisodeCharacters({ projectDir, episode }) {
  const requiredNames = new Set(episode.requiredCharacters ?? [])
  const bibleCharacters = await readOptionalJson(join(projectDir, 'bible', 'characters.json'), { fallback: [] })
  const characters = []

  for (const name of requiredNames) {
    const found = Array.isArray(bibleCharacters)
      ? bibleCharacters.find((character) => character?.name === name)
      : null
    characters.push(found ?? { name })
  }
  return characters
}

async function readEpisodeLocations({ projectDir, summaries }) {
  const bibleLocations = await readOptionalJson(join(projectDir, 'bible', 'locations.json'), { fallback: [] })
  const byName = new Map()
  if (Array.isArray(bibleLocations)) {
    for (const location of bibleLocations) {
      if (location?.name) byName.set(location.name, location)
    }
  }

  const ordered = []
  for (const summary of summaries) {
    for (const name of summary.locations ?? []) pushUnique(ordered, name)
    for (const beat of summary.beats ?? []) {
      if (beat?.location) pushUnique(ordered, beat.location)
    }
  }

  return ordered.map((name) => byName.get(name) ?? { name })
}

function buildCanvasManifest({
  project,
  projectDir,
  episode,
  episodeNumber,
  summaries,
  characters,
  locations,
  visualBible,
  continuityLog,
  unresolvedHooks,
  feedCards,
  deliverableText,
  warnings
}) {
  const nodes = []
  const connections = []

  nodes.push(createNode({
    id: 'overview',
    title: '本集总览',
    role: 'episode_overview',
    row: 0,
    column: 0,
    content: [
      `# ${episode.title}`,
      '',
      `- 集数：${episodeNumber}`,
      `- 目标：${episode.goal || '未提供'}`,
      `- 摘要：${summaries.map((summary) => summary.summary).filter(Boolean).join(' ') || episode.goal || '未提供'}`,
      `- 结尾钩子：${episode.endingHook || '无'}`,
      `- 默认风格：${project.defaultStyle || DEFAULT_STYLE}`
    ].join('\n')
  }))

  nodes.push(createNode({
    id: 'continuity',
    title: '连续性 / 伏笔',
    role: 'continuity_log',
    row: 0,
    column: 1,
    content: composeContinuityContent({ continuityLog, unresolvedHooks, episode })
  }))

  if (warnings.length) {
    nodes.push(createNode({
      id: 'warnings',
      title: '导出警告',
      role: 'export_warning',
      row: 0,
      column: 2,
      content: warnings.map((warning) => `- ${warning}`).join('\n')
    }))
  }

  characters.forEach((character, index) => {
    nodes.push(createNode({
      id: `character-${slugId(character.name)}`,
      title: `角色：${character.name}`,
      role: 'character_card',
      row: 1,
      column: index,
      content: composeCharacterContent({ character, visualBible })
    }))
  })

  locations.forEach((location, index) => {
    nodes.push(createNode({
      id: `scene-${slugId(location.name)}`,
      title: `场景：${location.name}`,
      role: 'scene_card',
      row: 2,
      column: index,
      content: composeSceneContent(location)
    }))
  })

  const shotNodes = normalizeEpisodeBeats(episode).map((beat, index) => createNode({
    id: `shot-${String(index + 1).padStart(3, '0')}`,
    title: `镜头 S${String(index + 1).padStart(2, '0')}`,
    role: 'shot_card',
    row: 3,
    column: index,
    content: composeShotContent({ beat, index, episode })
  }))
  nodes.push(...shotNodes)

  const feedNodes = buildFeedNodes({ episode, feedCards, deliverableText })
  nodes.push(...feedNodes)

  addConnections({ nodes, connections, characters, locations, shotNodes, feedNodes })

  return {
    schemaVersion: 1,
    kind: MANIFEST_KIND,
    project: {
      title: project.title,
      runDir: projectDir,
      episodeId: episode.episodeId,
      defaultStyle: project.defaultStyle || DEFAULT_STYLE
    },
    episode: {
      number: episodeNumber,
      title: episode.title,
      goal: episode.goal || '',
      summary: summaries.map((summary) => summary.summary).filter(Boolean).join(' '),
      hook: episode.endingHook || ''
    },
    nodes,
    connections,
    materialBudget: {
      renderer: 'jimeng',
      maxUploadImages: MAX_UPLOAD_IMAGES,
      rule: 'Each feed card may include at most 9 uploaded images. Character, scene, start frame, storyboard keyframes, and end frame all count as uploaded images.'
    },
    warnings
  }
}

function createNode({ id, title, role, row, column, content }) {
  return {
    id,
    type: 'text',
    title,
    role,
    content,
    position: {
      x: column * (TEXT_NODE_WIDTH + GAP_X),
      y: row * ROW_HEIGHT
    },
    width: TEXT_NODE_WIDTH,
    height: TEXT_NODE_HEIGHT
  }
}

function composeContinuityContent({ continuityLog, unresolvedHooks, episode }) {
  const lines = ['# 连续性 / 伏笔', '']
  lines.push(continuityLog.trim() || '- 没有连续性日志；保持本集人物外观、地点状态和悬念一致。')
  lines.push('', '## 未解悬念')
  const hooks = unresolvedHooks
    .filter((hook) => !hook.status || hook.status === 'active' || hook.status === 'open')
    .map((hook) => hook.note || hook.question || hook.id)
    .filter(Boolean)
  if (hooks.length) hooks.forEach((hook) => lines.push(`- ${hook}`))
  else lines.push(`- ${episode.endingHook || '无'}`)
  return lines.join('\n')
}

function composeCharacterContent({ character, visualBible }) {
  const lines = [
    `- Tier：${character.recommendedTier || '未分级'}`,
    `- 角色信号：${formatList(character.roleSignals)}`,
    `- 视觉锚点：${formatList(character.visualHints)}`,
    `- 关系状态：${formatList(character.relationshipHints)}`
  ]
  if (visualBible && visualBible.includes(character.name)) {
    lines.push('', '## 视觉 Bible 摘要', findMentionLines(visualBible, character.name).join('\n'))
  }
  return lines.join('\n')
}

function composeSceneContent(location) {
  return [
    `- 视觉描述：${location.visualDescription || location.description || location.name}`,
    `- 光线：${location.lighting || '按本集风格统一'}`,
    `- 连续性：${location.continuity || '保持地点状态稳定'}`
  ].join('\n')
}

function composeShotContent({ beat, index, episode }) {
  return [
    `- 镜头编号：S${String(index + 1).padStart(2, '0')}`,
    `- 剧情节拍：${beat.event}`,
    `- 地点：${beat.location || '按场景节点判断'}`,
    '- 镜头语言：明确景别、机位、运动、构图、表演、光线和连续性桥接。',
    `- 结尾钩子关联：${episode.endingHook || '无'}`,
    '- 负面约束：不要引入未列出章节的人物、地点或后续信息。'
  ].join('\n')
}

function buildFeedNodes({ episode, feedCards, deliverableText }) {
  if (!feedCards) {
    return [createNode({
      id: 'feed-card-001',
      title: '即梦投喂卡 01',
      role: 'jimeng_feed_card',
      row: 4,
      column: 0,
      content: [
        'Jimeng feed cards are not prepared yet / 即梦投喂卡尚未准备。',
        `请先运行 cine-make novel episode --run <project-dir> --episode ${episodeNumberFromId(episode.episodeId)} 生成 jimeng-feed-cards.json。`,
        '',
        '## 从 deliverable.md 派生的投喂说明',
        extractDeliverableFeedText(deliverableText),
        '',
        `每段上传图片最多 ${MAX_UPLOAD_IMAGES} 张；角色图、场景图、首帧、分镜关键帧、尾帧都算图片。Cine Make 不自动生成最终视频。`
      ].join('\n')
    })]
  }

  return feedCards.map((card, index) => createNode({
    id: `feed-card-${String(index + 1).padStart(3, '0')}`,
    title: `即梦投喂卡 ${String(index + 1).padStart(2, '0')}`,
    role: 'jimeng_feed_card',
    row: 4,
    column: index,
    content: composeFeedCardContent(card)
  }))
}

function composeFeedCardContent(card) {
  const materials = Array.isArray(card.materials) ? card.materials : []
  return [
    `- Renderer：${card.renderer || 'jimeng'}`,
    `- Upload image budget：${card.maxUploadImages || MAX_UPLOAD_IMAGES} uploaded images max per feed card.`,
    '- Materials:',
    ...(materials.length ? materials.map((material) => `  - ${material.ref || ''} ${material.type || 'unknown'} ${material.role || material.label || ''} ${material.path || ''}`) : ['  - none']),
    '',
    '## Prompt',
    card.prompt || '请根据本集镜头节点补全即梦提示词。',
    '',
    'Cine Make 不自动生成最终视频；最终合成属于外部视频工具。'
  ].join('\n')
}

function extractDeliverableFeedText(deliverableText) {
  const lines = deliverableText.split(/\r?\n/u)
  const startIndex = lines.findIndex((line) => /视频工具投喂包|feed card|feeding/i.test(line))
  const selected = startIndex >= 0 ? lines.slice(startIndex, startIndex + 12) : lines.slice(0, 12)
  return selected.join('\n').trim() || 'deliverable.md 中没有可派生的投喂说明。'
}

function addConnections({ nodes, connections, characters, locations, shotNodes, feedNodes }) {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const connect = (fromNodeId, toNodeId, role) => {
    if (!nodeIds.has(fromNodeId) || !nodeIds.has(toNodeId) || fromNodeId === toNodeId) return
    const id = `${fromNodeId}-to-${toNodeId}`
    if (connections.some((connection) => connection.id === id)) return
    connections.push({ id, fromNodeId, toNodeId, role })
  }

  connect('overview', 'continuity', 'continuity_context')
  connect('overview', 'warnings', 'export_warning')
  for (const character of characters) connect('overview', `character-${slugId(character.name)}`, 'episode_context')
  for (const location of locations) connect('overview', `scene-${slugId(location.name)}`, 'episode_context')
  if (shotNodes[0]) connect('overview', shotNodes[0].id, 'story_flow')

  for (let index = 0; index < shotNodes.length - 1; index += 1) {
    connect(shotNodes[index].id, shotNodes[index + 1].id, 'story_flow')
  }

  for (const character of characters) {
    const characterNodeId = `character-${slugId(character.name)}`
    const matched = shotNodes.filter((node) => node.content.includes(character.name))
    for (const shot of matched.length ? matched : shotNodes.slice(0, 1)) {
      connect(characterNodeId, shot.id, 'character_appears')
    }
  }

  for (const location of locations) {
    const sceneNodeId = `scene-${slugId(location.name)}`
    const matched = shotNodes.filter((node) => node.content.includes(location.name))
    for (const shot of matched.length ? matched : shotNodes.slice(0, 1)) {
      connect(sceneNodeId, shot.id, 'scene_setting')
    }
  }

  const feedSource = shotNodes.at(-1)?.id || 'overview'
  for (const feed of feedNodes) connect(feedSource, feed.id, 'production_handoff')
  if (feedNodes[0]) connect('continuity', feedNodes[0].id, 'continuity_context')
}

function buildCanvasExport(manifest) {
  const now = new Date().toISOString()
  const canvasNodes = manifest.nodes.flatMap((node) => toCanvasNode(node, manifest))
  const canvasNodeIds = new Set(canvasNodes.map((node) => node.id))
  const project = {
    id: `cine-make-${manifest.project.episodeId}`,
    title: `Cine Make - ${manifest.episode.title}`,
    createdAt: now,
    updatedAt: now,
    nodes: canvasNodes,
    connections: manifest.connections
      .filter((connection) => canvasNodeIds.has(connection.fromNodeId) && canvasNodeIds.has(connection.toNodeId))
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
  }

  return {
    app: CANVAS_APP,
    version: CANVAS_VERSION,
    exportedAt: now,
    projects: [{ project, files: [] }]
  }
}

function toCanvasNode(node, manifest) {
  if (CANVAS_IMAGE_GENERATION_ROLES.has(node.role)) return [toCanvasImageNode(node, manifest)]
  if (node.role === 'export_warning') return [toCanvasWarningNode(node)]
  return []
}

function toCanvasImageNode(node, manifest) {
  return {
    id: node.id,
    type: 'image',
    title: node.title,
    position: node.position,
    width: IMAGE_NODE_WIDTH,
    height: IMAGE_NODE_HEIGHT,
    metadata: {
      content: '',
      prompt: composeCanvasImagePrompt(node, manifest),
      status: 'idle',
      generationMode: 'image',
      generationType: 'generation',
      size: '9:16',
      quality: 'auto',
      count: 1
    }
  }
}

function toCanvasWarningNode(node) {
  return {
    id: node.id,
    type: 'text',
    title: node.title,
    position: node.position,
    width: node.width,
    height: node.height,
    metadata: {
      content: `# 导出警告\n\n${node.content}`,
      status: 'success',
      fontSize: 14,
      generationMode: 'text'
    }
  }
}

function composeCanvasImagePrompt(node, manifest) {
  const roleInstruction = {
    character_card: '任务：生成白底角色设定图，左侧大幅半身/头像特写，右侧正面、侧面、背面三视小图，显示人物名称、身高和核心道具，不显示年龄。',
    scene_card: '任务：生成场景参考图，锁定空间结构、光线、材质和连续性状态。',
    shot_card: '任务：生成分镜关键帧，画面必须服务该镜头的剧情节拍、景别、机位、构图和表演。'
  }[node.role]

  return [
    '文生图任务：生成一张可直接作为 AI 短剧前期参考的静态图片，不是文字卡片。',
    roleInstruction,
    `节点：${node.title}`,
    `默认风格：${manifest.project.defaultStyle || DEFAULT_STYLE}`,
    `本集：${manifest.episode.title}`,
    `结尾钩子：${manifest.episode.hook || '无'}`,
    '',
    '画面信息：',
    node.content.trim(),
    '',
    '统一要求：超写实真人电影质感，85mm镜头，4K，毛孔清晰可见，复杂服装和道具材质细节，电影感构图，主体清晰，可作为后续视频生成参考。',
    '负面约束：不要生成海报文字、字幕、水印、UI、logo；不要引入未列出人物、地点或后续剧情；不要改变既有角色视觉锚点。'
  ].filter((line) => line !== undefined && line !== null).join('\n')
}

function normalizeEpisodeBeats(episode) {
  return (episode.beats ?? []).map((beat) => {
    if (typeof beat === 'string') return { event: beat }
    return { event: beat?.event || String(beat), location: beat?.location }
  })
}

async function readRequiredJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`Required file is missing: ${filePath}`)
    if (error instanceof SyntaxError) throw new Error(`Malformed JSON file: ${filePath}`)
    throw error
  }
}

async function readOptionalJson(filePath, { fallback, warnings, message } = {}) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      if (warnings && message) warnings.push(message)
      return fallback
    }
    if (error instanceof SyntaxError) throw new Error(`Malformed JSON file: ${filePath}`)
    throw error
  }
}

async function readOptionalText(filePath, { warnings, message } = {}) {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') {
      if (warnings && message) warnings.push(message)
      return ''
    }
    throw error
  }
}

async function pathExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

function formatList(value) {
  return Array.isArray(value) && value.length ? value.join('；') : '未提供'
}

function findMentionLines(text, keyword) {
  return text
    .split(/\r?\n/u)
    .filter((line) => line.includes(keyword))
    .slice(0, 3)
}

function pushUnique(values, value) {
  if (typeof value !== 'string' || !value.trim()) return
  if (!values.includes(value.trim())) values.push(value.trim())
}

const pinyinHints = new Map([
  ['林', 'lin'],
  ['夏', 'xia'],
  ['周', 'zhou'],
  ['辰', 'chen'],
  ['旧', 'jiu'],
  ['影', 'ying'],
  ['院', 'yuan']
])

function slugId(value) {
  const text = String(value)
  const parts = []
  for (const char of text) {
    if (/[a-z0-9]/iu.test(char)) {
      parts.push(char.toLowerCase())
      continue
    }
    if (pinyinHints.has(char)) {
      parts.push(pinyinHints.get(char))
      continue
    }
    const codePoint = char.codePointAt(0)
    if (codePoint && !/\s/u.test(char)) parts.push(`u${codePoint.toString(16)}`)
  }
  return parts.join('-').replace(/-+/gu, '-').replace(/^-|-$/gu, '') || 'node'
}

function episodeNumberFromId(episodeId) {
  const match = String(episodeId).match(/(\d+)$/u)
  return match ? String(Number(match[1])) : '1'
}
