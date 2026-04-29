import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = '小说片段：退役潜水员周祁回到废弃海洋馆，空水箱里传来鲸鱼低鸣，玻璃内侧贴着女儿画的蓝鲸。'

test('draft mode writes one user-facing deliverable without exposing internal files in stdout', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-deliverable-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, '--duration', '30s', '--aspect', '9:16', '--platform', 'seedance', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'deliverable.md')))
    assert.ok(existsSync(join(out, 'storyboard-images', 'README.md')))
    assert.equal(existsSync(join(out, 'input-contract.json')), false)
    assert.equal(existsSync(join(out, 'agent-plan.json')), false)
    assert.equal(existsSync(join(out, 'tasks')), false)
    assert.equal(existsSync(join(out, 'reviews')), false)

    const rootEntries = (await readdir(out)).sort()
    assert.deepEqual(rootEntries, ['deliverable.md', 'storyboard-images'])

    assert.match(result.stdout, /Cine Make ready \(draft\)/)
    assert.match(result.stdout, /deliverable:/)
    assert.match(result.stdout, /storyboard images:/)
    assert.doesNotMatch(result.stdout, /input-contract\.json/)
    assert.doesNotMatch(result.stdout, /agent-plan\.json/)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /# Cine Make Deliverable/)
    assert.match(deliverable, /草稿模式/)
    assert.match(deliverable, /Seedance/)
    assert.match(deliverable, /Codex 不生成最终视频/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('debug artifacts are opt-in and isolated from the user-facing root', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-debug-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--emit-internal', '--out', out, source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual((await readdir(out)).sort(), ['.cine-make-internal', 'deliverable.md', 'storyboard-images'])
    assert.ok(existsSync(join(out, '.cine-make-internal', 'input-contract.json')))
    assert.ok(existsSync(join(out, '.cine-make-internal', 'agent-plan.json')))
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('visual mode prepares a storyboard image queue and keeps references optional', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-visual-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      '--duration',
      '15s',
      '--aspect',
      '9:16',
      '--platform',
      'jimeng',
      '--character-image',
      'refs/hero.png',
      source
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Cine Make ready \(visual\)/)

    const readme = await readFile(join(out, 'storyboard-images', 'README.md'), 'utf8')
    assert.match(readme, /视觉包模式/)
    assert.match(readme, /refs\/hero\.png/)
    assert.match(readme, /S01\.png/)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /人物参考图/)
    assert.match(deliverable, /refs\/hero\.png/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
