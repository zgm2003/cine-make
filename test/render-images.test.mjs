import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('render-images writes a Codex $imagegen plan without external image API settings', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-imagegen-plan-'))
  try {
    const makeResult = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      '--duration',
      '15s',
      '--aspect',
      '9:16',
      '雨夜里，女孩在巷口停下脚步。'
    ], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.equal(makeResult.status, 0, makeResult.stderr)

    const result = spawnSync(process.execPath, ['scripts/render-images.mjs', '--run', out], {
      cwd: root,
      encoding: 'utf8'
    })
    assert.equal(result.status, 0, result.stderr || result.stdout)

    const planPath = join(out, 'imagegen-plan.md')
    assert.ok(existsSync(planPath))
    const plan = await readFile(planPath, 'utf8')
    assert.match(plan, /\$imagegen/)
    assert.match(plan, /storyboard-images\/S01\.png/)
    assert.doesNotMatch(plan, /gpt-image-2/)
    assert.doesNotMatch(plan, /OPENAI_API_KEY/)
    assert.doesNotMatch(plan, /contact-sheet/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
