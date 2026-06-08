import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { exportNovelCanvas } from '../src/novel/canvas-exporter.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('exports a semantic manifest and image-generation canvas zip from an episode package', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-canvas-export-'))
  try {
    await writeCanvasProject(workspace)

    const result = await exportNovelCanvas({
      runDir: workspace,
      episodeNumber: 1
    })

    assert.equal(result.manifestPath, path.join(workspace, 'episodes', 'episode-0001', 'canvas-manifest.json'))
    assert.equal(result.zipPath, path.join(workspace, 'episodes', 'episode-0001', 'canvas-project.zip'))
    assert.equal(existsSync(result.manifestPath), true)
    assert.equal(existsSync(result.zipPath), true)

    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))
    assert.equal(manifest.schemaVersion, 1)
    assert.equal(manifest.kind, 'cine-make-canvas-manifest')
    assert.equal(manifest.project.title, '旧影院')
    assert.equal(manifest.project.episodeId, 'episode-0001')
    assert.equal(manifest.episode.title, '第1集 - 第一章 旧影院')
    assert.equal(manifest.materialBudget.renderer, 'jimeng')
    assert.equal(manifest.materialBudget.maxUploadImages, 9)
    assert.match(manifest.materialBudget.rule, /uploaded images/i)

    const roles = new Set(manifest.nodes.map((node) => node.role))
    assert.equal(roles.has('episode_overview'), true)
    assert.equal(roles.has('character_card'), true)
    assert.equal(roles.has('scene_card'), true)
    assert.equal(roles.has('shot_card'), true)
    assert.equal(roles.has('jimeng_feed_card'), true)
    assert.equal(roles.has('continuity_log'), true)
    assert.ok(manifest.nodes.some((node) => node.id === 'shot-001' && node.title === '镜头 S01'))
    assert.ok(manifest.nodes.some((node) => node.id === 'character-lin-xia' && /红围巾/u.test(node.content)))
    assert.ok(manifest.connections.some((connection) => connection.role === 'story_flow'))

    const projectsJson = await readProjectsJsonFromZip(result.zipPath)
    assert.equal(projectsJson.app, 'infinite-canvas')
    assert.equal(projectsJson.version, 3)
    assert.equal(projectsJson.projects.length, 1)

    const item = projectsJson.projects[0]
    assert.deepEqual(item.files, [])
    assert.equal(item.project.id, 'cine-make-episode-0001')
    assert.equal(item.project.title, 'Cine Make - 第1集 - 第一章 旧影院')
    assert.deepEqual(item.project.chatSessions, [])
    assert.equal(item.project.activeChatId, null)
    assert.equal(item.project.backgroundMode, 'lines')
    assert.equal(item.project.showImageInfo, false)
    assert.deepEqual(item.project.viewport, { x: 0, y: 0, k: 1 })

    assert.ok(item.project.nodes.length >= 5)
    assert.deepEqual([...new Set(item.project.nodes.map((node) => node.type))], ['image'])

    const byId = new Map(item.project.nodes.map((node) => [node.id, node]))
    assertCanvasImageNode(byId.get('character-lin-xia'), /林夏/u, /红围巾/u)
    assertCanvasImageNode(byId.get('scene-jiu-ying-yuan'), /旧影院/u, /冷色|低照度|灰尘/u)
    assertCanvasImageNode(byId.get('shot-001'), /镜头 S01/u, /林夏进入旧影院/u)
    assertCanvasImageNode(byId.get('shot-002'), /镜头 S02/u, /父亲留下的座位号/u)
    assert.equal(byId.has('overview'), false)
    assert.equal(byId.has('continuity'), false)
    assert.equal(byId.has('feed-card-001'), false)

    for (const node of item.project.nodes) {
      assert.equal(typeof node.id, 'string')
      assert.equal(typeof node.title, 'string')
      assert.equal(typeof node.position.x, 'number')
      assert.equal(typeof node.position.y, 'number')
      assert.equal(Object.hasOwn(node, 'role'), false)
    }

    assert.ok(item.project.connections.length > 0)
    for (const connection of item.project.connections) {
      assert.deepEqual(Object.keys(connection).sort(), ['fromNodeId', 'id', 'toNodeId'])
      assert.equal(byId.has(connection.fromNodeId), true)
      assert.equal(byId.has(connection.toNodeId), true)
    }
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('CLI fails clearly when the episode package is missing', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-canvas-export-missing-'))
  try {
    await writeCanvasProject(workspace, { writeEpisodePackage: false })

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'canvas',
      '--run',
      workspace,
      '--episode',
      '1'
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Episode package is missing/)
    assert.match(result.stderr, /cine-make novel episode --run/)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('missing jimeng feed cards creates a warning while canvas remains image-generation tasks', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-canvas-export-no-feed-'))
  try {
    await writeCanvasProject(workspace, { writeFeedCards: false })

    const result = await exportNovelCanvas({
      runDir: workspace,
      episodeNumber: 1
    })

    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))
    assert.ok(manifest.warnings.some((warning) => /jimeng-feed-cards\.json/u.test(warning)))
    assert.ok(manifest.nodes.some((node) => node.role === 'export_warning' && node.title === '导出警告'))
    assert.ok(manifest.nodes.some((node) => node.role === 'jimeng_feed_card' && /not prepared|尚未准备/u.test(node.content)))
    assert.ok(manifest.nodes.some((node) => node.role === 'jimeng_feed_card' && /视频工具投喂包/u.test(node.content)))

    const projectsJson = await readProjectsJsonFromZip(result.zipPath)
    const nodes = projectsJson.projects[0].project.nodes
    assert.ok(nodes.some((node) => node.type === 'image'))
    for (const node of nodes.filter((candidate) => candidate.type === 'image')) {
      assertCanvasImageNode(node)
    }

    const textNodes = nodes.filter((node) => node.type === 'text')
    assert.equal(textNodes.length, 1)
    assert.equal(textNodes[0].id, 'warnings')
    assert.equal(textNodes[0].metadata.status, 'success')
    assert.equal(textNodes[0].metadata.generationMode, 'text')
    const content = textNodes.map((node) => node.metadata.content).join('\n')
    assert.match(content, /导出警告/u)
    assert.match(content, /jimeng-feed-cards\.json/u)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('canvas export does not read the original whole novel source', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-canvas-export-no-source-'))
  try {
    await writeCanvasProject(workspace)
    const projectPath = path.join(workspace, 'project.json')
    const project = JSON.parse(await readFile(projectPath, 'utf8'))
    project.source = { path: 'source/novel.txt', sha256: 'missing-source-sentinel' }
    await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8')

    const result = await exportNovelCanvas({
      runDir: workspace,
      episodeNumber: 1
    })

    assert.equal(existsSync(result.zipPath), true)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

async function writeCanvasProject(projectDir, { writeEpisodePackage = true, writeFeedCards = true } = {}) {
  await mkdir(path.join(projectDir, 'summaries'), { recursive: true })
  await mkdir(path.join(projectDir, 'bible'), { recursive: true })
  await mkdir(path.join(projectDir, 'visual-bible'), { recursive: true })
  await mkdir(path.join(projectDir, 'continuity'), { recursive: true })
  await mkdir(path.join(projectDir, 'episodes'), { recursive: true })

  await writeFile(
    path.join(projectDir, 'project.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      mode: 'novel-project',
      title: '旧影院',
      defaultStyle: '动漫二次元，非真人写实，冷色电影感',
      counts: { chapters: 1, summaries: 1, plannedEpisodes: 1 },
      source: { path: 'source/novel.txt', sha256: 'not-read' }
    }, null, 2)}\n`,
    'utf8'
  )

  await writeFile(
    path.join(projectDir, 'summaries', 'chapter-0001.summary.json'),
    `${JSON.stringify(chapterSummary(), null, 2)}\n`,
    'utf8'
  )

  await writeFile(
    path.join(projectDir, 'bible', 'characters.json'),
    `${JSON.stringify([
      {
        name: '林夏',
        recommendedTier: 'S',
        roleSignals: ['调查旧影院的主角'],
        visualHints: ['红围巾', '短发', '疲惫但坚定'],
        relationshipHints: ['寻找失踪的父亲']
      },
      {
        name: '周辰',
        recommendedTier: 'A',
        roleSignals: ['技术搭档'],
        visualHints: ['黑框眼镜'],
        relationshipHints: ['被林夏信任']
      }
    ], null, 2)}\n`,
    'utf8'
  )

  await writeFile(
    path.join(projectDir, 'bible', 'locations.json'),
    `${JSON.stringify([
      {
        name: '旧影院',
        visualDescription: '灰尘、冷色银幕光、破损红椅',
        lighting: '低照度蓝灰色',
        continuity: '灰尘和座椅破损状态不能跳变'
      }
    ], null, 2)}\n`,
    'utf8'
  )

  await writeFile(
    path.join(projectDir, 'visual-bible', 'character-reference-plan.md'),
    '# Character Reference Plan\n\n- 林夏：红围巾、短发、冷色电影感。\n',
    'utf8'
  )

  await writeFile(
    path.join(projectDir, 'continuity', 'continuity-log.md'),
    '# Continuity Log\n\n- 旧影院灰尘不能跳变。\n- 红围巾从第一集开始保持显眼。\n',
    'utf8'
  )

  await writeFile(
    path.join(projectDir, 'continuity', 'unresolved-hooks.json'),
    `${JSON.stringify([
      { id: 'hook-1', chapterId: 'chapter-0001', status: 'active', note: '胶片是谁寄来的？' }
    ], null, 2)}\n`,
    'utf8'
  )

  await writeFile(
    path.join(projectDir, 'episodes', 'adaptation-plan.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      episodeMinutes: 1,
      episodes: [
        {
          episodeId: 'episode-0001',
          title: '第1集 - 第一章 旧影院',
          episodeMinutes: 1,
          goal: '林夏发现旧影院与失踪剪辑师有关。',
          includedChapters: [{ chapterId: 'chapter-0001', title: '第一章 旧影院' }],
          requiredCharacters: ['林夏', '周辰'],
          endingHook: '胶片是谁寄来的？',
          beats: ['林夏进入旧影院。', '她发现父亲留下的座位号。'],
          warnings: []
        }
      ]
    }, null, 2)}\n`,
    'utf8'
  )

  if (!writeEpisodePackage) return

  const episodeDir = path.join(projectDir, 'episodes', 'episode-0001')
  await mkdir(path.join(episodeDir, 'storyboard-images'), { recursive: true })
  await writeFile(path.join(episodeDir, 'episode-input.md'), '# 第1集 - 第一章 旧影院\n\n## Shot Table\n- S01: 林夏进入旧影院。\n- S02: 她发现父亲留下的座位号。\n', 'utf8')
  await writeFile(path.join(episodeDir, 'deliverable.md'), '# Cine Make\n\n## 视频工具投喂包\n上传角色、场景、首尾帧，复制提示词到即梦。\n', 'utf8')

  if (writeFeedCards) {
    await writeFile(
      path.join(episodeDir, 'jimeng-feed-cards.json'),
      `${JSON.stringify([
        {
          id: 'episode-0001-jimeng-01',
          renderer: 'jimeng',
          maxUploadImages: 9,
          materials: [
            { ref: '@Image1', type: 'image', role: 'character_lock', path: 'storyboard-images/character-lin-xia.png' },
            { ref: '@Audio1', type: 'audio', role: 'voice_reference', path: 'references/voice.wav' }
          ],
          prompt: '@Image1 保持林夏红围巾和短发，音色参考 @Audio1，生成旧影院悬疑段落。'
        }
      ], null, 2)}\n`,
      'utf8'
    )
  }
}

function assertCanvasImageNode(node, ...promptPatterns) {
  assert.ok(node, 'expected canvas image node to exist')
  assert.equal(node.type, 'image')
  assert.equal(node.metadata.content, '')
  assert.equal(node.metadata.status, 'idle')
  assert.equal(node.metadata.generationMode, 'image')
  assert.equal(node.metadata.generationType, 'generation')
  assert.equal(node.metadata.size, '9:16')
  assert.equal(node.metadata.quality, 'auto')
  assert.equal(node.metadata.count, 1)
  assert.equal(typeof node.metadata.prompt, 'string')
  assert.ok(node.metadata.prompt.length > 0)
  for (const pattern of promptPatterns) {
    assert.match(node.metadata.prompt, pattern)
  }
  assert.equal(Object.hasOwn(node, 'role'), false)
}

function chapterSummary() {
  return {
    schemaVersion: 1,
    chapterId: 'chapter-0001',
    sourceSpan: { startByte: 0, endByte: 100 },
    title: '第一章 旧影院',
    summary: '林夏发现旧影院与失踪剪辑师有关。',
    beats: [
      { event: '林夏进入旧影院。', location: '旧影院大厅' },
      { event: '她发现父亲留下的座位号。', location: '旧影院座席' }
    ],
    characters: [{ name: '林夏' }, { name: '周辰' }],
    locations: ['旧影院'],
    propsOrPowers: ['红围巾', '旧胶片'],
    openQuestions: ['胶片是谁寄来的？'],
    adaptationNotes: ['旧影院灰尘和银幕冷光。']
  }
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
