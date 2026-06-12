import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('render-images helper documents that it is not the default Seedance path', () => {
  const result = spawnSync(process.execPath, ['scripts/render-images.mjs', '--help'], {
    cwd: root,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Codex-only for image generation/u)
  assert.doesNotMatch(result.stdout, /OPENAI_API_KEY/u)
})
