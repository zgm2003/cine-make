import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = '许怡宁举剑拒婚，许悠然被迫替嫁，江凡在许家大堂角落平静喝茶。'

test('default CLI writes a ChatGPT-only Seedance feed and no Canvas artifacts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-default-seedance-pack-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--out',
      out,
      '--style',
      '3D国漫，国风仙侠，偏水墨+古风写实结合',
      source
    ], { cwd: root, encoding: 'utf8' })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(join(out, 'seedance-all-reference-feed.md')), true)
    assert.equal(existsSync(join(out, 'canvas-project.zip')), false)
    assert.equal(existsSync(join(out, 'canvas-manifest.json')), false)
    assert.equal(existsSync(join(out, 'projects.json')), false)
    assert.equal(existsSync(join(out, 'prompt-pack.md')), false)
    assert.equal(existsSync(join(out, 'README.md')), true)
    assert.equal(existsSync(join(out, 'deliverable.md')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    assert.match(result.stdout, /ChatGPT-only Seedance feed ready/u)
    assert.doesNotMatch(result.stdout, /canvas-project|Canvas pack/u)

    const feed = await readFile(join(out, 'seedance-all-reference-feed.md'), 'utf8')
    assert.match(feed, /GPT-image-2 参考图生成提示词/u)
    assert.match(feed, /## 每5条复制制作块/u)
    assert.doesNotMatch(feed, /## 参考资产绑定|## 全局负面约束|## 原著守则|## 镜头语言规则|## 小云雀运镜标签库|## 逐条视频文本|## 底部备注栏可复制/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

for (const args of [
  ['--mode', 'draft'],
  ['--mode', 'visual'],
  ['--draft'],
  ['--visual']
]) {
  test(`CLI rejects removed draft/visual entry: ${args.join(' ')}`, () => {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      ...args,
      '--out',
      join(tmpdir(), 'cine-make-removed-mode'),
      source
    ], { cwd: root, encoding: 'utf8' })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /draft\/visual.*removed.*seedance-pack/u)
  })
}

test('CLI help promotes Seedance + Canvas and hides removed draft/visual modes', () => {
  const result = spawnSync(process.execPath, ['src/cli.mjs', '--help'], {
    cwd: root,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /seedance-pack/u)
  assert.doesNotMatch(result.stdout, /canvas-pack|canvas-storyboard-pack|canvas-full-pack|novel canvas/u)
  assert.doesNotMatch(result.stdout, /--mode <draft\|visual>/u)
  assert.doesNotMatch(result.stdout, /--mode draft|--mode visual/u)
})

test('CLI rejects deprecated Canvas package commands', () => {
  const result = spawnSync(process.execPath, [
    'src/cli.mjs',
    'canvas-pack',
    '--out',
    join(tmpdir(), 'cine-make-disabled-canvas'),
    '--style',
    '3D国漫',
    source
  ], { cwd: root, encoding: 'utf8' })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Canvas package output is disabled/u)
})
