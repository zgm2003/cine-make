import test from 'node:test'
import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createNovelProject } from '../src/novel/project-writer.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('novel task prints a bounded chapter summary prompt for one chapter', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-task-'))
  try {
    const projectDir = await createTwoChapterProject(workspace)

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'task',
      '--run',
      projectDir,
      '--id',
      'summarize-chapter-0001'
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Output only the Chapter Summary JSON contract/i)
    assert.match(result.stdout, /chapterId must be "chapter-0001"/)
    assert.match(result.stdout, /startByte \d+ and endByte \d+/)
    assert.match(result.stdout, /只属于第一章的线索。/)
    assert.doesNotMatch(result.stdout, /只属于第二章的秘密。/)
    assert.doesNotMatch(result.stdout, /summarize the whole novel/i)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel accept-summary validates and copies a chapter summary into summaries', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-accept-'))
  try {
    const projectDir = await createTwoChapterProject(workspace)
    const summaryPath = path.join(workspace, 'chapter-summary.json')
    await writeFile(summaryPath, `${JSON.stringify(validSummary(), null, 2)}\n`, 'utf8')

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'accept-summary',
      '--run',
      projectDir,
      '--file',
      summaryPath
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(projectDir, 'summaries', 'chapter-0001.summary.json'))))

    const accepted = JSON.parse(await readFile(path.join(projectDir, 'summaries', 'chapter-0001.summary.json'), 'utf8'))
    assert.deepEqual(accepted, validSummary())

    const project = JSON.parse(await readFile(path.join(projectDir, 'project.json'), 'utf8'))
    assert.equal(project.counts.summaries, 1)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel accept-summary rejects invalid summaries without copying', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-reject-'))
  try {
    const projectDir = await createTwoChapterProject(workspace)
    const summaryPath = path.join(workspace, 'invalid-summary.json')
    await writeFile(summaryPath, `${JSON.stringify({ schemaVersion: 1, chapterId: '' }, null, 2)}\n`, 'utf8')

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'accept-summary',
      '--run',
      projectDir,
      '--file',
      summaryPath
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /chapterId must be a non-empty string/)
    assert.match(result.stderr, /sourceSpan is required/)
    await assert.rejects(access(path.join(projectDir, 'summaries', 'chapter-0001.summary.json')), { code: 'ENOENT' })
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel accept-summary rejects path traversal chapter ids without writing outside summaries', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-traversal-'))
  try {
    const projectDir = await createTwoChapterProject(workspace)
    const summaryPath = path.join(workspace, 'traversal-summary.json')
    await writeFile(summaryPath, `${JSON.stringify(validSummary({ chapterId: '../escape' }), null, 2)}\n`, 'utf8')

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'accept-summary',
      '--run',
      projectDir,
      '--file',
      summaryPath
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /chapterId must match a chapter in this project/)
    await assert.rejects(access(path.join(projectDir, 'escape.summary.json')), { code: 'ENOENT' })
    await assert.rejects(access(path.join(projectDir, 'summaries', '../escape.summary.json')), { code: 'ENOENT' })
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel accept-summary rejects chapter ids not present in the project', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-missing-chapter-'))
  try {
    const projectDir = await createTwoChapterProject(workspace)
    const summaryPath = path.join(workspace, 'missing-chapter-summary.json')
    await writeFile(summaryPath, `${JSON.stringify(validSummary({ chapterId: 'chapter-9999' }), null, 2)}\n`, 'utf8')

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'accept-summary',
      '--run',
      projectDir,
      '--file',
      summaryPath
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /chapterId must match a chapter in this project/)
    await assert.rejects(access(path.join(projectDir, 'summaries', 'chapter-9999.summary.json')), { code: 'ENOENT' })
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel accept-summary rejects summaries with a mismatched source span', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-bad-span-'))
  try {
    const projectDir = await createTwoChapterProject(workspace)
    const summaryPath = path.join(workspace, 'bad-span-summary.json')
    await writeFile(summaryPath, `${JSON.stringify(validSummary({
      sourceSpan: {
        startByte: 1,
        endByte: 42
      }
    }), null, 2)}\n`, 'utf8')

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'accept-summary',
      '--run',
      projectDir,
      '--file',
      summaryPath
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /sourceSpan must match chapter-0001/)
    await assert.rejects(access(path.join(projectDir, 'summaries', 'chapter-0001.summary.json')), { code: 'ENOENT' })
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

async function createTwoChapterProject(workspace) {
  const inputPath = path.join(workspace, 'story.txt')
  const projectDir = path.join(workspace, 'project')
  const sourceText = ['第一章 烟花', '只属于第一章的线索。', '第二章 雨夜', '只属于第二章的秘密。'].join('\n')
  await writeFile(inputPath, sourceText, 'utf8')
  await createNovelProject({ inputPath, outDir: projectDir })
  return projectDir
}

function validSummary(overrides = {}) {
  const summary = {
    schemaVersion: 1,
    chapterId: 'chapter-0001',
    sourceSpan: {
      startByte: 0,
      endByte: 48
    },
    title: '第一章 烟花',
    summary: '林夏在烟花下发现第一章线索。',
    beats: [
      {
        event: '林夏发现线索。'
      }
    ],
    characters: [
      {
        name: '林夏'
      }
    ],
    locations: [],
    propsOrPowers: [],
    openQuestions: [],
    adaptationNotes: []
  }

  return {
    ...summary,
    ...overrides,
    sourceSpan: overrides.sourceSpan ?? summary.sourceSpan
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
