import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const hospitalSource = [
  '雨夜，外卖骑手林野接到一单没有地址的医院订单。',
  'APP 只显示“13楼，红色弹珠”。',
  '他赶到废弃住院楼，电梯却自己亮起。',
  '13楼护士站空无一人，桌上滚出一颗红色玻璃弹珠。',
  '手机里传来小女孩的声音：“哥哥，别回头。”',
  '林野抬眼，监控屏里看见自己背后站着一个穿旧病号服的孩子；',
  '他慢慢把弹珠放回护士站，电梯门在身后打开，里面亮着温暖的白光。'
].join('')

test('visual mode produces the AI-short-drama image package contract', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-ai-package-'))
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
      hospitalSource
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual((await readdir(out)).sort(), ['deliverable.md', 'storyboard-images'])

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    const readme = await readFile(join(out, 'storyboard-images', 'README.md'), 'utf8')

    for (const text of [deliverable, readme]) {
      assert.match(text, /storyboard-images\/character-reference\.png/)
      assert.match(text, /storyboard-images\/scene-reference\.png/)
      assert.match(text, /storyboard-images\/segment-01-start\.png/)
      assert.match(text, /storyboard-images\/segment-01-end\.png/)
      assert.match(text, /storyboard-images\/S01\.png/)
      assert.match(text, /storyboard-images\/S07\.png/)
      assert.match(text, /storyboard-images\/contact-sheet\.jpg/)
      assert.doesNotMatch(text, /episodes\//)
    }

    assert.match(deliverable, /## AI分镜/)
    assert.match(deliverable, /视频生成卡/)
    assert.match(deliverable, /镜头语言/)
    assert.match(deliverable, /景别/)
    assert.match(deliverable, /焦段/)
    assert.match(deliverable, /运镜/)
    assert.match(deliverable, /构图/)
    assert.match(deliverable, /调度/)
    assert.match(deliverable, /表演/)
    assert.match(deliverable, /光影/)
    assert.match(deliverable, /连续性/)
    assert.match(deliverable, /禁止/)
    assert.match(deliverable, /主角锚点：外卖骑手林野/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('provided character image replaces generated character reference slot', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-ai-character-ref-'))
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
      '--character-image',
      'refs/hero.png',
      hospitalSource
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const readme = await readFile(join(out, 'storyboard-images', 'README.md'), 'utf8')
    assert.match(readme, /refs\/hero\.png/)
    assert.doesNotMatch(readme, /character-reference\.png/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('30 second output splits into two feed cards and reuses previous end frame as next start frame', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-ai-bridge-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      '--duration',
      '30s',
      '--aspect',
      '9:16',
      hospitalSource
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')

    assert.match(deliverable, /第 1 段/)
    assert.match(deliverable, /第 2 段/)
    assert.match(deliverable, /上一段尾帧 = 本段首帧/)

    const segmentTwoIndex = deliverable.indexOf('### 第 2 段')
    assert.notEqual(segmentTwoIndex, -1)
    const segmentTwo = deliverable.slice(segmentTwoIndex)
    assert.match(segmentTwo, /起始帧：`storyboard-images\/segment-01-end\.png`/)
    assert.match(segmentTwo, /尾帧：`storyboard-images\/segment-02-end\.png`/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('deliverable does not expose AI meta commentary in the user handoff', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-clean-handoff-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      '--duration',
      '30s',
      '--aspect',
      '9:16',
      hospitalSource
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')

    assert.doesNotMatch(deliverable, /只给\s*AI/)
    assert.doesNotMatch(deliverable, /AI_VIDEO_FEED_CARD/)
    assert.doesNotMatch(deliverable, /不是给人看的/)
    assert.doesNotMatch(deliverable, /未提供.*时生成/)
    assert.doesNotMatch(deliverable, /用来锁/)
    assert.doesNotMatch(deliverable, /出图模式必须/)
    assert.match(deliverable, /主角\/人物参考图：`storyboard-images\/character-reference\.png`/)
    assert.match(deliverable, /场景图：`storyboard-images\/scene-reference\.png`/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
