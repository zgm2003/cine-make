import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = '雨夜，外卖骑手林野接到一单没有地址的医院订单。13楼护士站空无一人，桌上滚出一颗红色玻璃弹珠。'

test('short-drama CLI main path is ChatGPT-only Seedance feed', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-ai-package-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--out',
      out,
      '--aspect',
      '16:9',
      '--style',
      '3D国漫，电影式构图，冷蓝雨夜',
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

    const feed = await readFile(join(out, 'seedance-all-reference-feed.md'), 'utf8')
    assert.match(feed, /GPT-image-2 参考图生成提示词/u)
    assert.match(feed, /参考资产绑定/u)
    assert.match(feed, /逐条视频文本/u)
    assert.doesNotMatch(feed, /storyboard-images|首帧|尾帧|S01/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('removed short-drama draft/visual modes fail before writing old artifacts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-removed-ai-package-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      source
    ], { cwd: root, encoding: 'utf8' })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /draft\/visual.*removed.*seedance-pack/u)
    assert.equal(existsSync(join(out, 'deliverable.md')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
