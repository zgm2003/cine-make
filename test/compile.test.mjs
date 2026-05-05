import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('cli writes a draft run with the compact user deliverable', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-run-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--out', out, '--duration', '15s', '--aspect', '9:16', '--style', 'noir', '--platform', 'jimeng', '广告短片：一杯咖啡让疲惫的程序员重新抬头。'], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'deliverable.md')))
    assert.ok(existsSync(join(out, 'storyboard-images', 'README.md')))
    assert.equal(existsSync(join(out, 'input-contract.json')), false)
    assert.equal(existsSync(join(out, 'agent-plan.json')), false)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /草稿模式/)
    assert.match(deliverable, /Codex 不生成最终视频/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('cli help keeps the default example platform-neutral', () => {
  const result = spawnSync(process.execPath, ['src/cli.mjs', '--help'], {
    cwd: root,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /--platform <seedance\|jimeng\|generic>/)
  assert.doesNotMatch(result.stdout, /--mode draft[^\n]*--platform seedance/)
})
