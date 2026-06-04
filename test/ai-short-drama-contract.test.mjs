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

const longFolkloreSource = [
  '莫川躺在床上正要睡觉，又听见祭祖幻听。',
  '他怒喝之后，一枚双耳三足香炉悬浮而起，青烟扑面。',
  '烟雾中，他看见古祠堂、神龛、老人和青年正在求祖庇佑。',
  '青年冲进祠堂说黄皮子要来了，老人却舍不得祖业和薄田。',
  '老人责怪儿子惹了黄皮讨封，青年委屈说随了它自己就会死。',
  '祖宗有言，黄皮讨封，像人人亡，像神神衰。',
  '阴风吹入祠堂，白烟弥漫，供香和烛火都被压低。',
  '黄不语从烟里探首而出，状如肿胀豺狼，尖喙獠牙。',
  '它说自己修仙甲子有余，却被青年坏了仙基和道行。',
  '老人愿意修庙供奉，黄不语却只要青年性命填补道行。',
  '老人绝望呼喊列祖列宗，供香青烟钻入莫川口鼻。',
  '莫川忽然感到飨食香火，解人灾殃。',
  '黄不语猛然昂首，看向神龛牌位，惊疑不定。',
  '闪电照亮神龛，青烟里浮出不辨形体的峥嵘鬼影。',
  '黄不语问他是不是陈家老祖，莫川低头发现自己飘在牌位上。',
  '他身体透明，腰部以下若有若无，旁边烛火照不出他的影子。'
].join('\n')

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
      assert.doesNotMatch(text, /storyboard-images\/contact-sheet\.jpg/)
      assert.doesNotMatch(text, /episodes\//)
    }

    assert.match(deliverable, /动漫二次元/)
    assert.match(deliverable, /非真人写实/)
    assert.match(deliverable, /## 精简分镜/)
    assert.doesNotMatch(deliverable, /## AI分镜/)
    assert.doesNotMatch(deliverable, /视频生成卡/)
    assert.doesNotMatch(deliverable, /```text/)
    assert.match(deliverable, /景别/)
    assert.match(deliverable, /焦段/)
    assert.match(deliverable, /运镜/)
    assert.match(deliverable, /主角锚点：外卖骑手林野/)
    assert.match(deliverable, /不跳过、不合并、不串到其他段/)
    assert.match(deliverable, /主运动清楚/)
    assert.match(deliverable, /二级动画/)
    assert.match(deliverable, /焦点按主体、关键物、异常信号顺序收束/)
    assert.ok(deliverable.split('\n').length <= 180)
    assert.ok(allSegmentReferenceCounts(deliverable).every((count) => count <= 12))
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
    assert.ok(allSegmentReferenceCounts(deliverable).every((count) => count <= 12))
    assert.deepEqual(allSegmentReferenceCounts(deliverable), [11, 11])

    const segmentTwoIndex = deliverable.indexOf('### 第 2 段')
    assert.notEqual(segmentTwoIndex, -1)
    const segmentTwo = deliverable.slice(segmentTwoIndex)
    assert.match(segmentTwo, /起始帧：`storyboard-images\/segment-01-end\.png`/)
    assert.match(segmentTwo, /尾帧：`storyboard-images\/segment-02-end\.png`/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('long source without explicit duration creates multiple feed cards capped at 15 seconds', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-ai-long-plot-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'draft',
      '--out',
      out,
      '--aspect',
      '9:16',
      longFolkloreSource
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')

    assert.match(deliverable, /时长：45s|时长：60s|时长：75s|时长：90s|时长：105s|时长：120s|时长：135s|时长：150s|时长：165s|时长：180s/)
    const segmentDurations = allSegmentDurations(deliverable)
    assert.ok(segmentDurations.length > 2)
    assert.ok(segmentDurations.every((seconds) => seconds <= 15), segmentDurations.join(','))
    assert.ok(allSegmentReferenceCounts(deliverable).every((count) => count <= 12))
    assert.match(deliverable, /每波按视频工具上限拆成 15s 以内投喂段/)
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

test('enterprise documentary deliverable uses theme-film labels instead of suspense labels', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-enterprise-doc-'))
  const enterpriseSource = [
    '号声里的奋斗密码。',
    '1996年夏，我从东锅技校毕业，进入轻容分厂成为电焊工。',
    '师傅问我世上最好听的音乐是什么，我回答下班号，他说是上班号声。',
    '父亲讲起三线内迁和东锅创业史。',
    '2011年燃烧器车间九天攻坚，我们改进氩弧焊工艺，七昼夜提前交付。',
    '2025年儿子问我最动听的旋律，我回答上班号声。'
  ].join('')
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'draft',
      '--out',
      out,
      '--duration',
      '30s',
      '--aspect',
      '9:16',
      '--style',
      '企业奋斗短片，钢铁工业质感',
      enterpriseSource
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')

    assert.match(deliverable, /AI 主题短片草稿/)
    assert.match(deliverable, /按用户指定的 30s，抓精神主线/)
    assert.match(deliverable, /记忆钩子/)
    assert.match(deliverable, /攻坚突破/)
    assert.match(deliverable, /传承收束/)
    assert.doesNotMatch(deliverable, /悬念点/)
    assert.doesNotMatch(deliverable, /异常出现/)
    assert.doesNotMatch(deliverable, /真相靠近/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

function allSegmentReferenceCounts(deliverable) {
  assert.doesNotMatch(deliverable, /上传参考图\s+\d+\s+张以内/)
  assert.doesNotMatch(deliverable, /上传图片控制在\s+\d+\s+张以内/)
  const matches = [...deliverable.matchAll(/参考素材位\s+(\d+)\s+个/g)]
  assert.ok(matches.length, 'missing segment material-slot counts')
  return matches.map((match) => Number(match[1]))
}

function allSegmentDurations(deliverable) {
  const matches = [...deliverable.matchAll(/### 第 \d+ 段：[^（]+（(\d+)s，参考素材位/g)]
  assert.ok(matches.length, 'missing segment durations')
  return matches.map((match) => Number(match[1]))
}
