import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = '小说片段：退役潜水员周祁回到废弃海洋馆，空水箱里传来鲸鱼低鸣。'

test('removed deliverable/storyboard user path is not reachable through CLI', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-deliverable-removed-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /draft\/visual.*removed.*seedance-pack/u)
    assert.equal(existsSync(join(out, 'deliverable.md')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('default CLI replaces deliverable/storyboard with Seedance and Canvas artifacts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-deliverable-replaced-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--out', out, '--style', '3D国漫', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(join(out, 'seedance-all-reference-feed.md')), true)
    assert.equal(existsSync(join(out, 'canvas-project.zip')), true)
    assert.equal(existsSync(join(out, 'deliverable.md')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
