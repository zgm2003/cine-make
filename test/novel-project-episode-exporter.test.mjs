import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { exportNovelEpisode } from '../src/novel/episode-exporter.mjs'
import { planNovelEpisodes } from '../src/novel/episode-planner.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('exports one planned novel episode into existing Cine Make draft artifacts', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-export-'))
  try {
    await writeProject(workspace)
    const outDir = path.join(workspace, 'episode-one')

    const result = await exportNovelEpisode({
      runDir: workspace,
      episodeNumber: 1,
      outDir,
      episodeMinutes: 1,
      referenceMaterials: [
        { type: 'video', path: 'refs/action.mp4', label: '动作参考' },
        { type: 'audio', path: 'refs/voice.wav', label: '音色参考' },
        ...Array.from({ length: 16 }, (_, index) => ({
          type: 'image',
          path: `refs/image-${String(index + 1).padStart(2, '0')}.png`,
          label: `图像参考 ${index + 1}`
        }))
      ]
    })

    assert.equal(result.episodeInputPath, path.join(outDir, 'episode-input.md'))
    assert.equal(result.deliverablePath, path.join(outDir, 'deliverable.md'))
    assert.equal(result.storyboardImagesReadmePath, path.join(outDir, 'storyboard-images', 'README.md'))
    assert.equal(result.feedCardsPath, path.join(outDir, 'jimeng-feed-cards.json'))
    assert.equal(result.episodePackage.episode.episodeId, 'episode-0001')

    const episodeInput = await readFile(result.episodeInputPath, 'utf8')
    assert.match(episodeInput, /# 第1集 - 第一章 旧影院/)
    assert.match(episodeInput, /## Episode Goal/)
    assert.match(episodeInput, /林夏发现旧影院与失踪剪辑师有关/)
    assert.match(episodeInput, /chapter-0001 - 第一章 旧影院/)
    assert.doesNotMatch(episodeInput, /chapter-0002 - 第二章 胶片/)
    assert.match(episodeInput, /林夏/)
    assert.match(episodeInput, /红围巾/)
    assert.match(episodeInput, /周辰/)
    assert.doesNotMatch(episodeInput, /黑衣人/)
    assert.match(episodeInput, /旧影院灰尘不能跳变/)
    assert.match(episodeInput, /胶片是谁寄来的？/)
    assert.match(episodeInput, /动漫二次元，非真人写实/)
    assert.match(episodeInput, /## Shot Table/)
    assert.match(episodeInput, /## Continuity Check/)

    const deliverable = await readFile(result.deliverablePath, 'utf8')
    assert.match(deliverable, /Cine Make/)
    assert.match(deliverable, /即梦|Jimeng/i)

    assert.equal(existsSync(result.storyboardImagesReadmePath), true)
    assert.equal(existsSync(path.join(outDir, 'series-bible.md')), false)
    assert.equal(existsSync(path.join(outDir, 'characters.json')), false)
    assert.equal(existsSync(path.join(outDir, 'bible')), false)

    const feedCards = JSON.parse(await readFile(result.feedCardsPath, 'utf8'))
    assert.ok(feedCards.length > 0)
    for (const card of feedCards) {
      assert.equal(card.renderer, 'jimeng')
      assert.equal(card.maxReferenceMaterials, 12)
      assert.ok(card.materials.length <= 12)
      assert.equal(new Set(card.materials.map((material) => material.ref)).size, card.materials.length)
      assert.ok(card.materials.some((material) => material.type === 'video'))
      assert.ok(card.materials.some((material) => material.type === 'audio'))
      assert.ok(card.materials.filter((material) => material.type === 'image').length <= 10)
      assert.match(card.prompt, /@Image1/)
      assert.match(card.prompt, /@Video1/)
      assert.match(card.prompt, /@Audio1/)
    }
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel episode CLI requires run and writes default episode output path', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-export-cli-'))
  try {
    await writeProject(workspace)

    const missingRun = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'episode',
      '--episode',
      '1'
    ], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.notEqual(missingRun.status, 0)
    assert.match(missingRun.stderr, /novel episode requires --run <value>/)

    const badMinutes = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'episode',
      '--run',
      workspace,
      '--episode-minutes',
      '0'
    ], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.notEqual(badMinutes.status, 0)
    assert.match(badMinutes.stderr, /--episode-minutes must be a positive number/)

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'episode',
      '--run',
      workspace,
      '--episode',
      '1'
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    const defaultOut = path.join(workspace, 'episodes', 'episode-0001')
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Cine Make exported novel episode:/)
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(defaultOut, 'episode-input.md'))))
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(defaultOut, 'deliverable.md'))))
    assert.equal(existsSync(path.join(defaultOut, 'storyboard-images', 'README.md')), true)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('export uses existing machine-readable plan without silently replanning', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-export-existing-plan-'))
  try {
    await writeThreeChapterProject(workspace)
    const plan = await planNovelEpisodes({ runDir: workspace, episodeMinutes: 1 })
    assert.deepEqual(
      plan.episodes.map((episode) => episode.includedChapters.map((chapter) => chapter.chapterId)),
      [['chapter-0001'], ['chapter-0002'], ['chapter-0003']]
    )

    const planJsonPath = path.join(workspace, 'episodes', 'adaptation-plan.json')
    const planJsonBefore = await readFile(planJsonPath, 'utf8')
    const planMtimeBefore = (await stat(planJsonPath)).mtimeMs
    const outDir = path.join(workspace, 'episode-two')

    await exportNovelEpisode({
      runDir: workspace,
      episodeNumber: 2,
      outDir
    })

    const episodeInput = await readFile(path.join(outDir, 'episode-input.md'), 'utf8')
    assert.match(episodeInput, /chapter-0002 - 第二章 胶片/)
    assert.doesNotMatch(episodeInput, /chapter-0001 - 第一章 旧影院/)
    assert.doesNotMatch(episodeInput, /chapter-0003 - 第三章 天台信号/)

    assert.equal(await readFile(planJsonPath, 'utf8'), planJsonBefore)
    assert.equal((await stat(planJsonPath)).mtimeMs, planMtimeBefore)

    const cliOutDir = path.join(workspace, 'episode-two-cli')
    const cliResult = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'episode',
      '--run',
      workspace,
      '--episode',
      '2',
      '--episode-minutes',
      '1',
      '--out',
      cliOutDir
    ], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.equal(cliResult.status, 0, cliResult.stderr)

    const mismatchedMinutes = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'episode',
      '--run',
      workspace,
      '--episode',
      '2',
      '--episode-minutes',
      '2',
      '--out',
      path.join(workspace, 'episode-two-wrong-minutes')
    ], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.notEqual(mismatchedMinutes.status, 0)
    assert.match(mismatchedMinutes.stderr, /Existing adaptation plan uses --episode-minutes 1; got 2/)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

async function writeProject(projectDir) {
  await mkdir(path.join(projectDir, 'summaries'), { recursive: true })
  await mkdir(path.join(projectDir, 'bible'), { recursive: true })
  await mkdir(path.join(projectDir, 'continuity'), { recursive: true })
  await writeFile(
    path.join(projectDir, 'project.json'),
    `${JSON.stringify({
      title: '旧影院',
      defaultStyle: '动漫二次元，非真人写实，冷色电影感',
      counts: { chapters: 2, summaries: 2 }
    }, null, 2)}\n`,
    'utf8'
  )
  await writeFile(path.join(projectDir, 'bible', 'series-bible.md'), '# Series Bible\n', 'utf8')
  await writeFile(
    path.join(projectDir, 'bible', 'characters.json'),
    `${JSON.stringify([
      {
        name: '林夏',
        recommendedTier: 'S',
        visualHints: ['红围巾', '短发'],
        relationshipHints: ['寻找失踪的父亲']
      },
      {
        name: '周辰',
        recommendedTier: 'A',
        visualHints: ['黑框眼镜'],
        relationshipHints: ['被林夏信任']
      },
      {
        name: '黑衣人',
        recommendedTier: 'C',
        visualHints: ['长风衣']
      }
    ], null, 2)}\n`,
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
      { id: 'hook-1', chapterId: 'chapter-0001', status: 'active', note: '胶片是谁寄来的？' },
      { id: 'hook-2', chapterId: 'chapter-0002', status: 'active', note: '黑衣人为什么知道父亲的座位？' }
    ], null, 2)}\n`,
    'utf8'
  )

  const summaries = [
    chapterSummary({
      chapterId: 'chapter-0001',
      title: '第一章 旧影院',
      summary: '林夏发现旧影院与失踪剪辑师有关。',
      beats: [
        { event: '林夏进入旧影院。', location: '旧影院大厅' },
        { event: '她发现父亲留下的座位号。', location: '旧影院座席' }
      ],
      characters: [
        { name: '林夏' },
        { name: '周辰' }
      ],
      locations: ['旧影院'],
      openQuestions: ['胶片是谁寄来的？'],
      adaptationNotes: ['旧影院灰尘和银幕冷光。']
    }),
    chapterSummary({
      chapterId: 'chapter-0002',
      title: '第二章 胶片',
      summary: '林夏和周辰在旧影院放映室看到被剪掉的片段。',
      beats: [
        { event: '周辰修好放映机。', location: '放映室' },
        { event: '胶片映出黑衣人的背影。', location: '银幕前' }
      ],
      characters: [
        { name: '林夏' },
        { name: '周辰' },
        { name: '黑衣人' }
      ],
      locations: ['旧影院', '放映室'],
      openQuestions: ['黑衣人为什么知道父亲的座位？']
    })
  ]

  for (const summary of summaries) {
    await writeFile(
      path.join(projectDir, 'summaries', `${summary.chapterId}.summary.json`),
      `${JSON.stringify(summary, null, 2)}\n`,
      'utf8'
    )
  }
}

async function writeThreeChapterProject(projectDir) {
  await writeProject(projectDir)
  const project = JSON.parse(await readFile(path.join(projectDir, 'project.json'), 'utf8'))
  project.counts = { chapters: 3, summaries: 3 }
  await writeFile(path.join(projectDir, 'project.json'), `${JSON.stringify(project, null, 2)}\n`, 'utf8')

  const chapter3 = chapterSummary({
    chapterId: 'chapter-0003',
    title: '第三章 天台信号',
    summary: '林夏在天台接到父亲留下的倒计时信号。',
    beats: [
      { event: '林夏追到天台。', location: '天台' },
      { event: '手机收到倒计时信号。', location: '天台边缘' }
    ],
    characters: [
      { name: '林夏' }
    ],
    locations: ['天台'],
    openQuestions: ['手机收到倒计时信号。']
  })
  await writeFile(
    path.join(projectDir, 'summaries', 'chapter-0003.summary.json'),
    `${JSON.stringify(chapter3, null, 2)}\n`,
    'utf8'
  )
}

function chapterSummary(overrides) {
  return {
    schemaVersion: 1,
    chapterId: 'chapter-0001',
    sourceSpan: {
      startByte: 0,
      endByte: 100
    },
    title: 'Chapter',
    summary: 'Summary.',
    beats: [
      { event: 'Beat.' }
    ],
    characters: [],
    locations: [],
    propsOrPowers: [],
    openQuestions: [],
    adaptationNotes: [],
    ...overrides
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
