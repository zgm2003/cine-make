import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

const longSource = [
  '小说片段：凌晨三点，外卖员陈默送最后一单到废弃医院。',
  '楼层显示停在不存在的十三楼，门缝里飘出消毒水和雨水混合的味道。',
  '十年前失踪的妹妹坐在护士站后，只把一颗红色弹珠推到桌沿。',
  '电梯里传来新的订单提示音，收货地址正是十三楼护士站。'
].join('')

test('main path does not expose old debug video-task workflow', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-video-tasks-removed-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--out',
      out,
      '--emit-internal',
      '--aspect',
      '16:9',
      '--style',
      '3D国漫',
      longSource
    ], { cwd: root, encoding: 'utf8' })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(join(out, 'seedance-all-reference-feed.md')), true)
    assert.equal(existsSync(join(out, '.cine-make-internal')), false)
    assert.equal(existsSync(join(out, 'episodes')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
