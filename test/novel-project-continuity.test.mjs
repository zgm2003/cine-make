import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { updateProjectContinuity } from '../src/novel/continuity-manager.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('updates continuity log and stable unresolved hooks for an exported episode package', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-continuity-'))
  try {
    await writeFile(
      path.join(workspace, 'project-note.md'),
      'manual project note outside continuity files\n',
      'utf8'
    )
    const episodePackage = createEpisodePackage()

    const result = await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0001',
      episodePackage
    })

    assert.equal(result.logPath, path.join(workspace, 'continuity', 'continuity-log.md'))
    assert.equal(result.hooksPath, path.join(workspace, 'continuity', 'unresolved-hooks.json'))
    assert.deepEqual(result.addedHooks.map((hook) => hook.hookId), ['hook-0001', 'hook-0002', 'hook-0003'])
    assert.deepEqual(result.resolvedHooks, [])

    const log = await readFile(result.logPath, 'utf8')
    assert.match(log, /# Continuity Log/)
    assert.match(log, /## Episode 0001 - 第1集 - 第一章 旧影院/)
    assert.match(log, /林夏发现旧影院与失踪剪辑师有关/)
    assert.match(log, /chapter-0001 - 第一章 旧影院/)
    assert.match(log, /林夏: 红围巾, 短发/)
    assert.match(log, /周辰: 黑框眼镜/)
    assert.match(log, /红围巾/)
    assert.match(log, /胶片是谁寄来的？/)
    assert.match(log, /黑衣人为什么知道父亲的座位？/)
    assert.match(log, /旧影院门口的倒计时还剩几分钟？/)

    const hooks = JSON.parse(await readFile(result.hooksPath, 'utf8'))
    assert.deepEqual(hooks, [
      {
        hookId: 'hook-0001',
        introducedIn: 'episode-0001',
        description: '胶片是谁寄来的？',
        status: 'open',
        suggestedPayoff: '',
        relatedCharacters: ['林夏', '周辰'],
        relatedProps: ['红围巾', '神秘胶片']
      },
      {
        hookId: 'hook-0002',
        introducedIn: 'episode-0001',
        description: '黑衣人为什么知道父亲的座位？',
        status: 'open',
        suggestedPayoff: '',
        relatedCharacters: ['林夏', '周辰'],
        relatedProps: ['红围巾', '神秘胶片']
      },
      {
        hookId: 'hook-0003',
        introducedIn: 'episode-0001',
        description: '旧影院门口的倒计时还剩几分钟？',
        status: 'open',
        suggestedPayoff: '下一集揭示倒计时含义。',
        relatedCharacters: ['林夏', '周辰'],
        relatedProps: ['红围巾', '神秘胶片']
      }
    ])

    const secondResult = await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0001',
      episodePackage
    })
    assert.deepEqual(secondResult.addedHooks, [])
    assert.equal(countMatches(await readFile(result.logPath, 'utf8'), /## Episode 0001/g), 1)
    assert.equal(
      JSON.parse(await readFile(result.hooksPath, 'utf8')).filter((hook) => hook.description === '胶片是谁寄来的？').length,
      1
    )

    const resolvedResult = await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0002',
      episodePackage: {
        ...createEpisodePackage({
          episode: {
            episodeId: 'episode-0002',
            title: '第2集 - 放映室',
            goal: '林夏确认胶片寄件人与黑衣人有关。',
            includedChapters: [{ chapterId: 'chapter-0002', title: '第二章 胶片' }],
            requiredCharacters: ['林夏', '黑衣人'],
            endingHook: '父亲为什么留下座位号？'
          },
          summaries: [],
          continuity: { unresolvedHooks: [] }
        }),
        resolvedHooks: ['hook-0001'],
        resolvedHookDescriptions: ['黑衣人为什么知道父亲的座位？']
      }
    })
    assert.deepEqual(resolvedResult.resolvedHooks, ['hook-0001', 'hook-0002'])

    const updatedHooks = JSON.parse(await readFile(result.hooksPath, 'utf8'))
    assert.equal(updatedHooks.find((hook) => hook.hookId === 'hook-0001').status, 'resolved')
    assert.equal(updatedHooks.find((hook) => hook.hookId === 'hook-0002').status, 'resolved')
    assert.equal(updatedHooks.find((hook) => hook.hookId === 'hook-0003').status, 'open')
    assert.equal(updatedHooks.at(-1).hookId, 'hook-0004')
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('preserves manual continuity notes outside generated episode sections', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-continuity-manual-'))
  try {
    await mkdir(path.join(workspace, 'continuity'), { recursive: true })
    const manualLog = [
      '# Continuity Log',
      '',
      'Manual rule before generated content.',
      '',
      '<!-- cine-make:episode episode-0001:start -->',
      '## Episode 0001 - stale',
      '<!-- cine-make:episode episode-0001:end -->',
      '',
      'Manual note after generated content.'
    ].join('\n')
    await writeFile(path.join(workspace, 'continuity', 'continuity-log.md'), `${manualLog}\n`, 'utf8')

    await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0001',
      episodePackage: createEpisodePackage()
    })

    const log = await readFile(path.join(workspace, 'continuity', 'continuity-log.md'), 'utf8')
    assert.match(log, /Manual rule before generated content\./)
    assert.match(log, /Manual note after generated content\./)
    assert.doesNotMatch(log, /## Episode 0001 - stale/)
    assert.equal(countMatches(log, /## Episode 0001/g), 1)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('rerunning an earlier episode preserves chronological generated section order', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-continuity-order-'))
  try {
    await mkdir(path.join(workspace, 'continuity'), { recursive: true })
    await writeFile(
      path.join(workspace, 'continuity', 'continuity-log.md'),
      [
        '# Continuity Log',
        '',
        'Manual note before episodes.',
        '',
        'Manual note that should stay outside generated sections.'
      ].join('\n'),
      'utf8'
    )

    await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0001',
      episodePackage: createEpisodePackage()
    })
    await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0002',
      episodePackage: createEpisodePackage({
        episode: {
          episodeId: 'episode-0002',
          title: '第2集 - 放映室',
          goal: '林夏确认胶片寄件人与黑衣人有关。',
          includedChapters: [{ chapterId: 'chapter-0002', title: '第二章 胶片' }],
          requiredCharacters: ['林夏', '黑衣人'],
          endingHook: '父亲为什么留下座位号？'
        },
        summaries: [],
        continuity: { unresolvedHooks: [] }
      })
    })
    await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0001',
      episodePackage: createEpisodePackage()
    })

    const log = await readFile(path.join(workspace, 'continuity', 'continuity-log.md'), 'utf8')
    const episode1Index = log.indexOf('## Episode 0001')
    const episode2Index = log.indexOf('## Episode 0002')
    assert.notEqual(episode1Index, -1)
    assert.notEqual(episode2Index, -1)
    assert.ok(episode1Index < episode2Index, log)
    assert.equal(countMatches(log, /## Episode 0001/g), 1)
    assert.equal(countMatches(log, /## Episode 0002/g), 1)
    assert.match(log, /Manual note before episodes\./)
    assert.match(log, /Manual note that should stay outside generated sections\./)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('preserves unknown fields on existing unresolved hooks after update', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-continuity-fields-'))
  try {
    await mkdir(path.join(workspace, 'continuity'), { recursive: true })
    await writeFile(
      path.join(workspace, 'continuity', 'unresolved-hooks.json'),
      `${JSON.stringify([
        {
          hookId: 'hook-0007',
          introducedIn: 'episode-0001',
          description: '谁在监控旧影院？',
          status: 'open',
          suggestedPayoff: '后续揭示。',
          relatedCharacters: ['林夏'],
          relatedProps: ['监控录像'],
          manualNote: '导演标记：不要提前解释。',
          priority: 'high',
          task10VisualMetadata: { reference: 'security-camera' }
        }
      ], null, 2)}\n`,
      'utf8'
    )

    await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0002',
      episodePackage: createEpisodePackage({
        episode: {
          episodeId: 'episode-0002',
          title: '第2集 - 放映室',
          goal: '林夏继续调查旧影院。',
          includedChapters: [{ chapterId: 'chapter-0002', title: '第二章 放映室' }],
          requiredCharacters: ['林夏'],
          endingHook: '放映室里是谁留下的脚印？'
        },
        summaries: [],
        continuity: { unresolvedHooks: [] }
      })
    })

    const hooks = JSON.parse(await readFile(path.join(workspace, 'continuity', 'unresolved-hooks.json'), 'utf8'))
    assert.equal(hooks[0].hookId, 'hook-0007')
    assert.equal(hooks[0].manualNote, '导演标记：不要提前解释。')
    assert.equal(hooks[0].priority, 'high')
    assert.deepEqual(hooks[0].task10VisualMetadata, { reference: 'security-camera' })
    assert.equal(hooks[1].hookId, 'hook-0008')
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('does not re-add prior project unresolved hooks from exported continuity state', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-continuity-prior-hooks-'))
  try {
    await mkdir(path.join(workspace, 'continuity'), { recursive: true })
    await writeFile(
      path.join(workspace, 'continuity', 'unresolved-hooks.json'),
      `${JSON.stringify([
        {
          hookId: 'hook-0001',
          introducedIn: 'episode-0001',
          description: '胶片是谁寄来的？',
          status: 'open',
          suggestedPayoff: '',
          relatedCharacters: ['林夏'],
          relatedProps: ['神秘胶片']
        }
      ], null, 2)}\n`,
      'utf8'
    )

    const result = await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0002',
      episodePackage: createEpisodePackage({
        episode: {
          episodeId: 'episode-0002',
          title: '第2集 - 放映室',
          goal: '林夏继续调查旧影院。',
          includedChapters: [{ chapterId: 'chapter-0002', title: '第二章 放映室' }],
          requiredCharacters: ['林夏'],
          endingHook: '父亲为什么留下座位号？'
        },
        summaries: [],
        continuity: {
          unresolvedHooks: [
            { hookId: 'hook-0001', description: '胶片是谁寄来的？' },
            { id: 'legacy-hook-9', note: '黑衣人为什么知道父亲的座位？' },
            { note: '放映室里是谁留下的脚印？' }
          ]
        }
      })
    })

    assert.deepEqual(result.addedHooks.map((hook) => hook.description), [
      '父亲为什么留下座位号？',
      '放映室里是谁留下的脚印？'
    ])
    const hooks = JSON.parse(await readFile(path.join(workspace, 'continuity', 'unresolved-hooks.json'), 'utf8'))
    assert.equal(hooks.filter((hook) => hook.description === '胶片是谁寄来的？').length, 1)
    assert.equal(hooks.some((hook) => hook.description === '黑衣人为什么知道父亲的座位？'), false)
    assert.equal(hooks.find((hook) => hook.description === '放映室里是谁留下的脚印？').introducedIn, 'episode-0002')
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('resolved hook descriptions resolve only one matching open hook', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-continuity-resolve-descriptions-'))
  try {
    await mkdir(path.join(workspace, 'continuity'), { recursive: true })
    await writeFile(
      path.join(workspace, 'continuity', 'unresolved-hooks.json'),
      `${JSON.stringify([
        {
          hookId: 'hook-0001',
          introducedIn: 'episode-0001',
          description: '同一句悬念',
          status: 'open',
          suggestedPayoff: '',
          relatedCharacters: ['林夏'],
          relatedProps: []
        },
        {
          hookId: 'hook-0002',
          introducedIn: 'episode-0002',
          description: '同一句悬念',
          status: 'open',
          suggestedPayoff: '',
          relatedCharacters: ['周辰'],
          relatedProps: []
        },
        {
          hookId: 'hook-0003',
          introducedIn: 'episode-0002',
          description: '唯一可解决悬念',
          status: 'open',
          suggestedPayoff: '',
          relatedCharacters: ['林夏'],
          relatedProps: []
        }
      ], null, 2)}\n`,
      'utf8'
    )

    const result = await updateProjectContinuity({
      runDir: workspace,
      episodeId: 'episode-0003',
      episodePackage: {
        ...createEpisodePackage({
          episode: {
            episodeId: 'episode-0003',
            title: '第3集 - 天台',
            goal: '林夏获得新的线索。',
            includedChapters: [{ chapterId: 'chapter-0003', title: '第三章 天台' }],
            requiredCharacters: ['林夏'],
            endingHook: '天台信号来自哪里？'
          },
          summaries: [],
          continuity: { unresolvedHooks: [] }
        }),
        resolvedHookDescriptions: ['同一句悬念', '唯一可解决悬念']
      }
    })

    assert.deepEqual(result.resolvedHooks, ['hook-0003'])
    const hooks = JSON.parse(await readFile(path.join(workspace, 'continuity', 'unresolved-hooks.json'), 'utf8'))
    assert.equal(hooks.find((hook) => hook.hookId === 'hook-0001').status, 'open')
    assert.equal(hooks.find((hook) => hook.hookId === 'hook-0002').status, 'open')
    assert.equal(hooks.find((hook) => hook.hookId === 'hook-0003').status, 'resolved')
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel episode CLI updates continuity after exporting artifacts and prints continuity paths', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-continuity-cli-'))
  try {
    await writeProject(workspace)

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'episode',
      '--run',
      workspace,
      '--episode',
      '1',
      '--episode-minutes',
      '1'
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const defaultOut = path.join(workspace, 'episodes', 'episode-0001')
    const logPath = path.join(workspace, 'continuity', 'continuity-log.md')
    const hooksPath = path.join(workspace, 'continuity', 'unresolved-hooks.json')
    assert.match(result.stdout, /Cine Make exported novel episode:/)
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(defaultOut, 'episode-input.md'))))
    assert.match(result.stdout, new RegExp(escapeRegExp(logPath)))
    assert.match(result.stdout, new RegExp(escapeRegExp(hooksPath)))
    assert.equal(existsSync(path.join(defaultOut, 'deliverable.md')), true)
    assert.match(await readFile(logPath, 'utf8'), /## Episode 0001 - 第1集 - 第一章 旧影院/)
    assert.equal(JSON.parse(await readFile(hooksPath, 'utf8'))[0].hookId, 'hook-0001')
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

function createEpisodePackage(overrides = {}) {
  return {
    episode: {
      episodeId: 'episode-0001',
      title: '第1集 - 第一章 旧影院',
      goal: '林夏发现旧影院与失踪剪辑师有关。',
      includedChapters: [{ chapterId: 'chapter-0001', title: '第一章 旧影院' }],
      requiredCharacters: ['林夏', '周辰'],
      endingHook: '胶片是谁寄来的？'
    },
    summaries: [
      {
        chapterId: 'chapter-0001',
        title: '第一章 旧影院',
        summary: '林夏发现旧影院与失踪剪辑师有关。',
        propsOrPowers: ['红围巾', '神秘胶片'],
        openQuestions: ['胶片是谁寄来的？', '胶片是谁寄来的？', '黑衣人为什么知道父亲的座位？']
      }
    ],
    characters: [
      { name: '林夏', visualHints: ['红围巾', '短发'] },
      { name: '周辰', visualHints: ['黑框眼镜'] }
    ],
    continuity: {
      unresolvedHooks: [
        {
          note: '旧影院门口的倒计时还剩几分钟？',
          suggestedPayoff: '下一集揭示倒计时含义。',
          relatedCharacters: ['林夏'],
          relatedProps: ['神秘胶片']
        }
      ]
    },
    contract: { title: 'episode-0001-第1集 - 第一章 旧影院' },
    feedCards: [],
    ...overrides
  }
}

async function writeProject(projectDir) {
  await mkdir(path.join(projectDir, 'summaries'), { recursive: true })
  await mkdir(path.join(projectDir, 'bible'), { recursive: true })
  await writeFile(
    path.join(projectDir, 'project.json'),
    `${JSON.stringify({
      title: '旧影院',
      defaultStyle: '动漫二次元，非真人写实，冷色电影感',
      counts: { chapters: 1, summaries: 1 }
    }, null, 2)}\n`,
    'utf8'
  )
  await writeFile(
    path.join(projectDir, 'bible', 'characters.json'),
    `${JSON.stringify([
      { name: '林夏', visualHints: ['红围巾', '短发'] },
      { name: '周辰', visualHints: ['黑框眼镜'] }
    ], null, 2)}\n`,
    'utf8'
  )
  await writeFile(
    path.join(projectDir, 'summaries', 'chapter-0001.summary.json'),
    `${JSON.stringify({
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
      propsOrPowers: ['红围巾', '神秘胶片'],
      openQuestions: ['胶片是谁寄来的？'],
      adaptationNotes: []
    }, null, 2)}\n`,
    'utf8'
  )
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length ?? 0
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
