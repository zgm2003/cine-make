import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'
import { exportCanvasPromptPack, exportCanvasStoryboardPack } from '../src/canvas-prompt-pack-exporter.mjs'

const isolatedMansionScript = `漫剧概念设定：《孤岛碎忆》

角色设定（漫剧画风建议：暗黑、重度阴影）

    林默（男主角）：私家侦探。冷静、神经质。

    安娜（女性）：心理医生，知性、冷静。一直试图“帮”林默找回记忆。

    雷队（中年男）：脾气暴躁的暴风雪山庄式警探。

    阿杰（青年男）：胆小、唯唯诺诺的瘸子，右脚有残疾。

第一集剧本：【分崩离析的10分钟】
[场景：孤岛别墅 - 客厅 - 夜]

▲ 【画面】 窗外暴雨倾盆，一道闪电划过，照亮昏暗的客厅。
▲ 【画面】 林默猛地从沙发上惊醒，大口喘气。他看向自己的双手，满是鲜血。
▲ 【音效】 惊雷声，紧接着是林默急促的呼吸声。

林默（内心独白）：
    “我是谁？这是哪？该死……我的头好痛。记忆又在消失……”

▲ 【画面】 林默急切地拉开衣袖。他的手臂上用小刀歪歪扭扭地刻着一行字：【我的记忆只有10分钟。凶手在他们中间。】

▲ 【画面】 镜头拉开，客厅里还有另外三个人。
    雷队正拿着枪，警惕地守在门口。
    安娜正在给林默倒热水，眼神充满担忧。
    阿杰（瘸子）蜷缩在角落里，瑟瑟发抖。

雷队（咬牙切齿）：
“林默，你终于醒了。刚刚停电的5分钟里，老张被杀了。现在死无对证。”

安娜（温柔安抚）：
“雷队，别逼他。林默的‘失忆症’又犯了。林默，看着我，你还记得你来这座岛是干什么的吗？”

▲ 【画面】 林默痛苦地捂住头，无数碎片画面闪过：警徽、带血的解剖刀、一座叫“圣路易斯”的精神病院大门。

林默（沙哑）：
“我是……来查案的。有人举报这里有非法活体实验……”

▲ 【画面】 角落里的瘸子阿杰突然冷笑了一声。所有人的目光看向他。

阿杰（声音颤抖，但眼神诡异）：
“查案？林侦探，你别装了。其实你早就知道凶手是谁对不对？那个人……那个叫‘凯撒’的幕后黑手，就在这间屋子里！”

▲ 【画面】 林默的手机突然定时闹钟响起：【00:00:00】时间到。
▲ 【画面】 林默眼神瞬间空洞。下一秒，他再次惊恐地看着自己的血手，仿佛第一天来到这里。

林默（惊恐）：
“你们……是谁？！”

-------------------------以下为个人总结---------------------------------
人物主要有：林默、安娜、雷队、阿杰
场景主要有：孤岛别墅、夜晚
主要元素内容：手机、茶壶、枪、警徽、带血的解剖刀`

test('exports a compact foundation Canvas graph for character scene and style references', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-canvas-pack-'))
  try {
    const contract = await createInputContract(parseArgs(['--aspect', '9:16', isolatedMansionScript]))
    const result = await exportCanvasPromptPack({ outDir: out, contract })

    assert.equal(result.manifestPath, join(out, 'canvas-manifest.json'))
    assert.equal(result.zipPath, join(out, 'canvas-project.zip'))
    assert.equal(existsSync(result.manifestPath), true)
    assert.equal(existsSync(result.zipPath), true)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)

    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))
    assert.equal(manifest.schemaVersion, 1)
    assert.equal(manifest.kind, 'cine-make-canvas-prompt-pack')
    assert.equal(manifest.packageType, 'manual_canvas_generation')
    assert.equal(manifest.target.app, 'infinite-canvas')
    assert.equal(manifest.target.version, 3)
    assert.deepEqual(manifest.outputs, ['canvas-project.zip', 'canvas-manifest.json', 'prompt-pack.md', 'README.md'])

    const roles = new Set(manifest.nodes.map((node) => node.role))
    assert.deepEqual([...roles].sort(), [
      'character_bible',
      'character_reference',
      'environment_bible',
      'environment_reference',
      'style_bible',
      'style_reference'
    ])
    assert.ok(manifest.nodes.length <= 14, `expected compact foundation Canvas pack, got ${manifest.nodes.length} nodes`)

    const manifestById = new Map(manifest.nodes.map((node) => [node.id, node]))
    assert.equal(manifestById.get('style-bible').title, '资料：风格设定（非生成）')
    assert.equal(manifestById.get('character-linmo').title, '资料：林默人设（非生成）')
    assert.equal(manifestById.get('character-anna').title, '资料：安娜人设（非生成）')
    assert.equal(manifestById.get('character-leidui').title, '资料：雷队人设（非生成）')
    assert.equal(manifestById.get('character-ajie').title, '资料：阿杰人设（非生成）')
    assert.equal(manifestById.get('environment-island-villa-living-room-night').title, '资料：孤岛别墅客厅 / 暴雨夜（非生成）')
    assert.equal(manifestById.get('character-ref-linmo').title, '生成：林默角色参考图')
    assert.equal(manifestById.get('environment-ref-island-villa-living-room-night').title, '生成：孤岛别墅客厅 / 暴雨夜场景参考图')
    assert.equal(manifestById.get('style-reference').title, '生成：整体风格参考图')
    assert.deepEqual(manifestById.get('character-ref-linmo').anchor, {
      anchorId: 'character-ref-linmo',
      anchorRole: 'character_reference',
      anchorName: '林默',
      mergeStrategy: 'reuse_existing'
    })
    assert.deepEqual(manifestById.get('environment-ref-island-villa-living-room-night').anchor, {
      anchorId: 'environment-ref-island-villa-living-room-night',
      anchorRole: 'environment_reference',
      anchorName: '孤岛别墅客厅 / 暴雨夜',
      mergeStrategy: 'reuse_existing'
    })
    assert.deepEqual(manifestById.get('style-reference').anchor, {
      anchorId: 'style-reference',
      anchorRole: 'style_reference',
      anchorName: '整体风格参考图',
      mergeStrategy: 'reuse_existing'
    })
    assert.equal(manifestById.has('shot-s02'), false)
    assert.equal(manifestById.has('shot-list'), false)
    assert.equal(manifestById.has('keyframe-s02'), false)
    assert.equal(manifestById.has('prop-phone'), false)
    assert.equal(manifestById.has('video-segment-01'), false)

    assertConnection(manifest.connections, 'style-bible', 'style-reference')
    assertConnection(manifest.connections, 'character-linmo', 'character-ref-linmo')
    assertNoConnection(manifest.connections, 'style-bible', 'character-ref-linmo')
    assertNoConnection(manifest.connections, 'environment-island-villa-living-room-night', 'character-ref-linmo')
    assertConnection(manifest.connections, 'style-bible', 'environment-ref-island-villa-living-room-night')
    assertConnection(manifest.connections, 'environment-island-villa-living-room-night', 'environment-ref-island-villa-living-room-night')
    for (const connection of manifest.connections) {
      assert.match(connection.toNodeId, /^(style-reference|character-ref-|environment-ref-)/u, 'connections should feed reference image nodes only')
    }

    const projectsJson = await readProjectsJsonFromZip(result.zipPath)
    assert.equal(projectsJson.app, 'infinite-canvas')
    assert.equal(projectsJson.version, 3)
    assert.equal(projectsJson.projects.length, 1)

    const item = projectsJson.projects[0]
    assert.deepEqual(item.files, [])
    assert.match(item.project.title, /Cine Make Canvas/)
    assert.deepEqual(item.project.chatSessions, [])
    assert.equal(item.project.activeChatId, null)
    assert.equal(item.project.backgroundMode, 'lines')
    assert.equal(item.project.showImageInfo, false)
    assert.deepEqual(item.project.viewport, { x: 0, y: 0, k: 1 })

    const byId = new Map(item.project.nodes.map((node) => [node.id, node]))
    assertTextNode(byId.get('style-bible'), /资料节点/u, /右侧图片节点/u, /心理悬疑/u, /10分钟/u, /低饱和/u, /practical lighting|motivated lighting/i)
    assertTextNode(byId.get('character-linmo'), /资料节点/u, /不是出图提示词/u, /林默/u, /黑色湿呢大衣/u, /微动作/u)
    assertTextNode(byId.get('environment-island-villa-living-room-night'), /资料节点/u, /不是出图提示词/u, /孤岛别墅客厅/u, /暴雨夜/u, /声音感/u)
    assertImagePromptNode(
      byId.get('character-ref-linmo'),
      { size: '16:9' },
      /真人电影角色定妆照/u,
      /白色或浅灰摄影棚背景/u,
      /专业影视角色设定参考图/u,
      /三视图全身定妆照/u,
      /真实皮肤纹理/u,
      /毛孔细节/u,
      /角色名称：林默/u,
      /黑色湿呢大衣/u,
      /负面提示词/u,
      /anime, manga, cartoon/u
    )
    assert.deepEqual(byId.get('character-ref-linmo').metadata.cineMake.anchor, manifestById.get('character-ref-linmo').anchor)
    assert.deepEqual(byId.get('character-ref-linmo').metadata.inputOrder, ['character-linmo'])
    assertImagePromptNode(byId.get('environment-ref-island-villa-living-room-night'), { size: '9:16' }, /场景参考图/u, /孤岛别墅客厅/u, /暴雨夜/u)
    assertImagePromptNode(byId.get('style-reference'), { size: '9:16' }, /风格参考图/u, /低饱和/u, /暴雨夜/u)

    for (const node of item.project.nodes) {
      assert.equal(Object.hasOwn(node, 'role'), false)
      assert.equal(typeof node.id, 'string')
      assert.equal(typeof node.position.x, 'number')
      assert.equal(typeof node.position.y, 'number')
    }

    const canvasIds = new Set(item.project.nodes.map((node) => node.id))
    for (const connection of item.project.connections) {
      assert.deepEqual(Object.keys(connection).sort(), ['fromNodeId', 'id', 'toNodeId'])
      assert.equal(canvasIds.has(connection.fromNodeId), true)
      assert.equal(canvasIds.has(connection.toNodeId), true)
    }
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('exports a merge-friendly storyboard Canvas pack that reuses locked foundation anchors', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-canvas-storyboard-pack-'))
  try {
    const contract = await createInputContract(parseArgs(['--aspect', '9:16', isolatedMansionScript]))
    const result = await exportCanvasStoryboardPack({ outDir: out, contract })

    assert.equal(result.manifestPath, join(out, 'canvas-manifest.json'))
    assert.equal(result.zipPath, join(out, 'canvas-project.zip'))
    assert.equal(existsSync(join(out, 'storyboard-images')), false)

    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))
    assert.equal(manifest.kind, 'cine-make-canvas-storyboard-pack')
    assert.equal(manifest.packageType, 'manual_canvas_storyboard_append')
    assert.equal(manifest.mergeTarget, 'current_canvas')
    assert.match(manifest.manualWorkflow.join('\n'), /合并到当前画布/u)

    const roles = new Set(manifest.nodes.map((node) => node.role))
    assert.deepEqual([...roles].sort(), ['keyframe', 'shot_list'])
    assert.equal(manifest.nodes.some((node) => node.role === 'character_reference'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'environment_reference'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'style_reference'), false)

    const manifestById = new Map(manifest.nodes.map((node) => [node.id, node]))
    assert.ok(manifestById.has('shot-list'))
    assert.ok(manifestById.has('keyframe-s01'))
    assert.ok(manifestById.has('keyframe-s04'))
    assert.equal(manifestById.get('shot-list').canvasType, 'text')
    assert.equal(manifestById.get('keyframe-s01').canvasType, 'image')
    assert.equal(manifestById.get('keyframe-s01').mergeStrategy, 'append')
    assert.deepEqual(manifestById.get('keyframe-s01').requiredAnchors, [
      { anchorId: 'style-reference', anchorRole: 'style_reference', anchorName: '整体风格参考图' },
      { anchorId: 'environment-ref-island-villa-living-room-night', anchorRole: 'environment_reference', anchorName: '孤岛别墅客厅 / 暴雨夜' },
      { anchorId: 'character-ref-linmo', anchorRole: 'character_reference', anchorName: '林默' }
    ])
    const allRequiredAnchorIds = new Set(manifest.nodes.flatMap((node) => node.requiredAnchors?.map((anchor) => anchor.anchorId) ?? []))
    assert.equal(allRequiredAnchorIds.has('character-ref-anna'), true)
    assert.equal(allRequiredAnchorIds.has('character-ref-leidui'), true)
    assert.equal(allRequiredAnchorIds.has('character-ref-ajie'), true)
    assert.equal(manifest.connections.length, 0)

    const projectsJson = await readProjectsJsonFromZip(result.zipPath)
    const item = projectsJson.projects[0]
    const byId = new Map(item.project.nodes.map((node) => [node.id, node]))
    assertTextNode(byId.get('shot-list'), /Shot List/u, /S01/u, /摄影机脚本/u)
    assertImagePromptNode(byId.get('keyframe-s01'), { size: '9:16' }, /关键帧生成任务/u, /已锁定人物主图/u, /林默/u, /不要重新发明角色/u)
    assert.deepEqual(byId.get('keyframe-s01').metadata.cineMake.requiredAnchors, manifestById.get('keyframe-s01').requiredAnchors)
    assert.deepEqual(byId.get('keyframe-s01').metadata.inputOrder, [
      'style-reference',
      'environment-ref-island-villa-living-room-night',
      'character-ref-linmo'
    ])
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

function assertConnection(connections, fromNodeId, toNodeId) {
  assert.ok(connections.some((connection) => connection.fromNodeId === fromNodeId && connection.toNodeId === toNodeId), `${fromNodeId} should connect to ${toNodeId}`)
}

function assertTextNode(node, ...patterns) {
  assert.ok(node, 'expected canvas text node to exist')
  assert.equal(node.type, 'text')
  assert.equal(node.metadata.status, 'success')
  assert.equal(node.metadata.generationMode, 'text')
  assert.equal(node.metadata.fontSize, 14)
  for (const pattern of patterns) assert.match(node.metadata.content, pattern)
}

function assertNoConnection(connections, fromNodeId, toNodeId) {
  assert.equal(connections.some((connection) => connection.fromNodeId === fromNodeId && connection.toNodeId === toNodeId), false, `${fromNodeId} should not connect to ${toNodeId}`)
}

function assertImagePromptNode(node, optionsOrPattern, ...patterns) {
  const options = optionsOrPattern && typeof optionsOrPattern === 'object' && !(optionsOrPattern instanceof RegExp)
    ? optionsOrPattern
    : { size: '9:16' }
  if (optionsOrPattern instanceof RegExp) patterns.unshift(optionsOrPattern)
  assert.ok(node, 'expected canvas image prompt node to exist')
  assert.equal(node.type, 'image')
  assert.equal(node.metadata.content, '')
  assert.equal(node.metadata.status, 'idle')
  assert.equal(node.metadata.generationMode, 'image')
  assert.equal(node.metadata.generationType, 'generation')
  assert.equal(node.metadata.size, options.size)
  assert.equal(node.metadata.quality, 'auto')
  assert.equal(node.metadata.count, 1)
  for (const pattern of patterns) assert.match(node.metadata.prompt, pattern)
}

async function readProjectsJsonFromZip(zipPath) {
  const entries = readStoredZipEntries(await readFile(zipPath))
  const projects = entries.get('projects.json')
  assert.ok(projects, 'projects.json should exist in zip')
  return JSON.parse(projects.toString('utf8'))
}

function readStoredZipEntries(buffer) {
  const entries = new Map()
  let offset = 0
  while (offset + 4 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset)
    if (signature === 0x02014b50 || signature === 0x06054b50) break
    assert.equal(signature, 0x04034b50)
    const method = buffer.readUInt16LE(offset + 8)
    assert.equal(method, 0)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const fileNameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const nameEnd = nameStart + fileNameLength
    const dataStart = nameEnd + extraLength
    const dataEnd = dataStart + compressedSize
    const name = buffer.subarray(nameStart, nameEnd).toString('utf8')
    entries.set(name, buffer.subarray(dataStart, dataEnd))
    offset = dataEnd
  }
  return entries
}
