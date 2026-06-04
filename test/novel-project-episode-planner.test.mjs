import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { planNovelEpisodes } from '../src/novel/episode-planner.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('plans deterministic project episodes from accepted summaries', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-episodes-'))
  try {
    await writeProject(workspace)

    const result = await planNovelEpisodes({ runDir: workspace, episodeMinutes: 1 })

    assert.equal(result.adaptationPlanPath, path.join(workspace, 'episodes', 'adaptation-plan.md'))
    assert.equal(result.episodes.length, 3)
    assert.deepEqual(
      result.episodes.map((episode) => episode.includedChapters.map((chapter) => chapter.chapterId)),
      [['chapter-0001'], ['chapter-0002'], ['chapter-0003']]
    )

    assert.deepEqual(result.episodes[0], {
      episodeId: 'episode-0001',
      title: '第1集 - 第一章 旧影院',
      episodeMinutes: 1,
      goal: '林夏发现旧影院与失踪剪辑师有关。',
      includedChapters: [
        {
          chapterId: 'chapter-0001',
          title: '第一章 旧影院'
        }
      ],
      requiredCharacters: ['林夏', '周辰'],
      endingHook: '胶片是谁寄来的？',
      beats: ['林夏进入旧影院。', '她发现父亲留下的座位号。'],
      warnings: []
    })

    assert.equal(result.episodes[1].endingHook, '黑衣人为什么知道父亲的座位？')
    assert.deepEqual(result.episodes[1].requiredCharacters, ['林夏', '周辰', '黑衣人'])
    assert.match(result.episodes[1].warnings[0], /chapter-0002 may be too dense/)
    assert.equal(result.episodes[2].endingHook, '手机收到倒计时信号。')

    const adaptationPlan = await readFile(result.adaptationPlanPath, 'utf8')
    assert.match(adaptationPlan, /# Novel Adaptation Episode Plan/)
    assert.match(adaptationPlan, /## episode-0001 - 第1集 - 第一章 旧影院/)
    assert.match(adaptationPlan, /- Episode goal: 林夏发现旧影院与失踪剪辑师有关。/)
    assert.match(adaptationPlan, /- Included chapters: chapter-0001 \(第一章 旧影院\)/)
    assert.match(adaptationPlan, /- Required characters: 林夏, 周辰/)
    assert.match(adaptationPlan, /- Ending hook: 胶片是谁寄来的？/)
    assert.ok(adaptationPlan.indexOf('chapter-0001') < adaptationPlan.indexOf('chapter-0002'))
    assert.ok(adaptationPlan.indexOf('chapter-0002') < adaptationPlan.indexOf('chapter-0003'))

    const project = JSON.parse(await readFile(path.join(workspace, 'project.json'), 'utf8'))
    assert.equal(project.counts.plannedEpisodes, 3)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('groups multiple chapters when episode minutes allow a larger target', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-episodes-grouped-'))
  try {
    await writeProject(workspace)

    const result = await planNovelEpisodes({ runDir: workspace, episodeMinutes: 2 })

    assert.equal(result.episodes.length, 2)
    assert.deepEqual(
      result.episodes.map((episode) => episode.includedChapters.map((chapter) => chapter.chapterId)),
      [['chapter-0001', 'chapter-0002'], ['chapter-0003']]
    )
    assert.equal(result.episodes[0].episodeMinutes, 2)
    assert.equal(result.episodes[0].endingHook, '黑衣人为什么知道父亲的座位？')
    assert.deepEqual(result.episodes[0].requiredCharacters, ['林夏', '周辰', '黑衣人'])
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel plan-episodes CLI requires --run, validates minutes, and prints output path', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-episodes-cli-'))
  try {
    await writeProject(workspace)

    const missingRun = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'plan-episodes'
    ], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.notEqual(missingRun.status, 0)
    assert.match(missingRun.stderr, /novel plan-episodes requires --run <value>/)

    const badMinutes = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'plan-episodes',
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
      'plan-episodes',
      '--run',
      workspace,
      '--episode-minutes',
      '2'
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Cine Make planned novel episodes:/)
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(workspace, 'episodes', 'adaptation-plan.md'))))
    assert.match(result.stdout, /- episodes: 2/)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

async function writeProject(projectDir) {
  await mkdir(path.join(projectDir, 'summaries'), { recursive: true })
  await mkdir(path.join(projectDir, 'bible'), { recursive: true })
  await writeFile(
    path.join(projectDir, 'project.json'),
    `${JSON.stringify({ title: '旧影院', counts: { chapters: 3, summaries: 3 } }, null, 2)}\n`,
    'utf8'
  )
  await writeFile(
    path.join(projectDir, 'bible', 'characters.json'),
    `${JSON.stringify([
      { name: '林夏', recommendedTier: 'S' },
      { name: '周辰', recommendedTier: 'A' },
      { name: '黑衣人', recommendedTier: 'C' }
    ], null, 2)}\n`,
    'utf8'
  )

  const summaries = [
    chapterSummary({
      chapterId: 'chapter-0001',
      title: '第一章 旧影院',
      summary: '林夏发现旧影院与失踪剪辑师有关。',
      beats: [
        { event: '林夏进入旧影院。' },
        { event: '她发现父亲留下的座位号。' }
      ],
      characters: [
        { name: '林夏' },
        { name: '周辰' }
      ],
      openQuestions: ['胶片是谁寄来的？']
    }),
    chapterSummary({
      chapterId: 'chapter-0002',
      title: '第二章 胶片',
      summary: '林夏和周辰在旧影院放映室看到被剪掉的片段。',
      beats: [
        { event: '周辰修好放映机。' },
        { event: '胶片映出黑衣人的背影。' },
        { event: '林夏听见父亲的录音。' },
        { event: '黑衣人切断电源。' },
        { event: '周辰找到备用胶片。' },
        { event: '银幕出现座位号。' },
        { event: '林夏确认父亲曾回来过。' }
      ],
      characters: [
        { name: '林夏' },
        { name: '周辰' },
        { name: '黑衣人' }
      ],
      openQuestions: ['黑衣人为什么知道父亲的座位？']
    }),
    chapterSummary({
      chapterId: 'chapter-0003',
      title: '第三章 天台信号',
      summary: '林夏在天台接到父亲留下的倒计时信号。',
      beats: [
        { event: '林夏追到天台。' },
        { event: '手机收到倒计时信号。' }
      ],
      characters: [
        { name: '林夏' }
      ]
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
