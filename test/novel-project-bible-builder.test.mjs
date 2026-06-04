import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildSeriesBible } from '../src/novel/bible-builder.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('builds a deterministic series bible from accepted chapter summaries', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-bible-'))
  try {
    await writeAcceptedSummaries(workspace)

    const result = await buildSeriesBible({ runDir: workspace })

    assert.equal(result.seriesBiblePath, path.join(workspace, 'bible', 'series-bible.md'))
    assert.equal(result.charactersPath, path.join(workspace, 'bible', 'characters.json'))
    assert.equal(result.locationsPath, path.join(workspace, 'bible', 'locations.json'))
    assert.equal(result.timelinePath, path.join(workspace, 'bible', 'timeline.md'))
    assert.deepEqual(result.counts, {
      summaries: 3,
      characters: 3,
      locations: 2,
      warnings: 0
    })

    const seriesBible = await readFile(result.seriesBiblePath, 'utf8')
    assert.match(seriesBible, /# Series Bible/)
    assert.match(seriesBible, /## Main Arc/)
    assert.match(seriesBible, /林夏发现旧影院与失踪剪辑师有关/)
    assert.match(seriesBible, /## Volume\/Chapter Map/)
    assert.match(seriesBible, /- chapter-0001: 第一章 旧影院/)
    assert.match(seriesBible, /- chapter-0003: 第三章 天台信号/)
    assert.match(seriesBible, /## Open Questions\/Hooks/)
    assert.match(seriesBible, /胶片是谁寄来的？/)
    assert.match(seriesBible, /## Adaptation Notes/)
    assert.match(seriesBible, /旧影院灰尘和银幕冷光/)

    const characters = JSON.parse(await readFile(result.charactersPath, 'utf8'))
    assert.deepEqual(characters.map((character) => character.name), ['林夏', '周辰', '黑衣人'])
    assert.deepEqual(characters[0], {
      name: '林夏',
      firstChapter: 'chapter-0001',
      appearanceCount: 3,
      roleSignals: ['protagonist', '主角'],
      visualHints: ['红围巾', '短发', '背着旧相机'],
      relationshipHints: ['寻找失踪的父亲', '信任周辰'],
      chapters: ['chapter-0001', 'chapter-0002', 'chapter-0003'],
      recommendedTier: 'S'
    })
    assert.equal(characters.find((character) => character.name === '周辰').appearanceCount, 2)
    assert.equal(characters.find((character) => character.name === '黑衣人').recommendedTier, 'C')

    const locations = JSON.parse(await readFile(result.locationsPath, 'utf8'))
    assert.deepEqual(locations, [
      {
        name: '旧影院',
        firstChapter: 'chapter-0001',
        occurrenceCount: 2,
        chapters: ['chapter-0001', 'chapter-0002']
      },
      {
        name: '天台',
        firstChapter: 'chapter-0003',
        occurrenceCount: 1,
        chapters: ['chapter-0003']
      }
    ])

    const timeline = await readFile(result.timelinePath, 'utf8')
    assert.ok(timeline.indexOf('## chapter-0001 - 第一章 旧影院') < timeline.indexOf('## chapter-0002 - 第二章 胶片'))
    assert.ok(timeline.indexOf('## chapter-0002 - 第二章 胶片') < timeline.indexOf('## chapter-0003 - 第三章 天台信号'))
    assert.ok(timeline.indexOf('1. 林夏进入旧影院。') < timeline.indexOf('2. 她发现父亲留下的座位号。'))
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel build-bible CLI requires --run and prints output paths', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-bible-cli-'))
  try {
    await writeAcceptedSummaries(workspace)

    const missingRun = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'build-bible'
    ], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.notEqual(missingRun.status, 0)
    assert.match(missingRun.stderr, /novel build-bible requires --run <value>/)

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'build-bible',
      '--run',
      workspace
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Cine Make built novel series bible:/)
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(workspace, 'bible', 'series-bible.md'))))
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(workspace, 'bible', 'characters.json'))))
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(workspace, 'bible', 'locations.json'))))
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(workspace, 'bible', 'timeline.md'))))
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

async function writeAcceptedSummaries(projectDir) {
  const summariesDir = path.join(projectDir, 'summaries')
  await mkdir(summariesDir, { recursive: true })

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
        {
          name: '林夏',
          role: 'protagonist',
          visualHints: ['红围巾', '短发'],
          relationshipHints: ['寻找失踪的父亲']
        },
        {
          name: '周辰',
          role: 'investigator',
          visualHints: ['黑框眼镜']
        }
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
        { event: '周辰修好放映机。' },
        { event: '胶片映出黑衣人的背影。' }
      ],
      characters: [
        {
          name: '林夏',
          role: '主角',
          visualHints: ['红围巾', '背着旧相机'],
          relationshipHints: ['信任周辰']
        },
        {
          name: '周辰',
          role: 'ally',
          relationshipHints: ['被林夏信任']
        },
        {
          name: '黑衣人',
          role: 'suspect',
          visualHints: ['长风衣']
        }
      ],
      locations: ['旧影院'],
      openQuestions: ['黑衣人为什么知道父亲的座位？'],
      adaptationNotes: ['放映机光束切出悬疑感。']
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
        {
          name: '林夏',
          role: 'protagonist',
          visualHints: ['短发']
        }
      ],
      locations: ['天台'],
      openQuestions: ['倒计时结束会发生什么？'],
      adaptationNotes: ['天台风声压住对白。']
    })
  ]

  for (const summary of summaries) {
    await writeFile(
      path.join(summariesDir, `${summary.chapterId}.summary.json`),
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
