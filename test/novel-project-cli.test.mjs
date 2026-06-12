import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('novel ingest creates a novel project workspace', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-cli-'))
  try {
    const inputPath = path.join(workspace, 'novel.txt')
    const outDir = path.join(workspace, 'project')
    await writeFile(inputPath, ['第1章 开场', '旧影院的银幕忽然亮起。'].join('\n'), 'utf8')

    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'ingest',
      '--input',
      inputPath,
      '--out',
      outDir
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Cine Make novel project ready/)
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(outDir, 'project.json'))))
    assert.match(result.stdout, new RegExp(escapeRegExp(path.join(outDir, 'tasks'))))

    const project = JSON.parse(await readFile(path.join(outDir, 'project.json'), 'utf8'))
    assert.equal(project.mode, 'novel-project')
    assert.equal(project.counts.chapters, 1)
    assert.equal(await readFile(path.join(outDir, 'source', 'novel.txt'), 'utf8'), '第1章 开场\n旧影院的银幕忽然亮起。')
    assert.deepEqual((await readdir(path.join(outDir, 'tasks'))).sort(), ['summarize-chapter-0001.md'])
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('novel ingest requires input', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-cli-missing-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'novel',
      'ingest',
      '--out',
      path.join(workspace, 'project')
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /novel ingest requires --input <file>/)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test('removed draft mode CLI fails clearly', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-draft-cli-'))
  try {
    const outDir = path.join(workspace, 'draft')
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'draft',
      '--out',
      outDir,
      '雨夜里，女孩在巷口停下脚步。'
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /draft\/visual.*removed.*seedance-pack/u)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
