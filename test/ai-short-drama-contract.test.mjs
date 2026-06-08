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

const isolatedMansionScript = [
  '漫剧概念设定：《孤岛碎忆》',
  '核心创意：主角醒来发现自己置身于一栋暴风雨中的孤岛别墅，他只有10分钟短期记忆。事实上，所有人都是他分裂出来的人格。',
  '角色设定（漫剧画风建议：暗黑、重度阴影）',
  '林默（男主角）：私家侦探。冷静、神经质。',
  '安娜（女性）：心理医生，知性、冷静。一直试图“帮”林默找回记忆。',
  '雷队（中年男）：脾气暴躁的暴风雪山庄式警探。',
  '阿杰（青年男）：胆小、唯唯诺诺的瘸子，右脚有残疾。',
  '第一集剧本：【分崩离析的10分钟】',
  '[场景：孤岛别墅 - 客厅 - 夜]',
  '▲ 【画面】 窗外暴雨倾盆，一道闪电划过，照亮昏暗的客厅。',
  '▲ 【画面】 林默猛地从沙发上惊醒，大口喘气。他看向自己的双手，满是鲜血。',
  '▲ 【画面】 林默急切地拉开衣袖。他的手臂上用小刀歪歪扭扭地刻着一行字：【我的记忆只有10分钟。凶手在他们中间。】',
  '▲ 【画面】 镜头拉开，客厅里还有另外三个人。',
  '雷队正拿着枪，警惕地守在门口。',
  '安娜正在给林默倒热水，眼神充满担忧。',
  '阿杰（瘸子）蜷缩在角落里，瑟瑟发抖。',
  '雷队（咬牙切齿）：',
  '“林默，你终于醒了。刚刚停电的5分钟里，老张被杀了。现在死无对证。”',
  '安娜（温柔安抚）：',
  '“雷队，别逼他。林默的‘失忆症’又犯了。林默，看着我，你还记得你来这座岛是干什么的吗？”',
  '▲ 【画面】 林默痛苦地捂住头，无数碎片画面闪过：警徽、带血的解剖刀、一座叫“圣路易斯”的精神病院大门。',
  '林默（沙哑）：',
  '“我是……来查案的。有人举报这里有非法活体实验……”',
  '▲ 【画面】 角落里的瘸子阿杰突然冷笑了一声。所有人的目光看向他。',
  '阿杰（声音颤抖，但眼神诡异）：',
  '“查案？林侦探，你别装了。其实你早就知道凶手是谁对不对？那个人……那个叫‘凯撒’的幕后黑手，就在这间屋子里！”',
  '▲ 【画面】 林默的手机突然定时闹钟响起：【00:00:00】时间到。',
  '▲ 【画面】 林默眼神瞬间空洞。下一秒，他再次惊恐地看着自己的血手，仿佛第一天来到这里。',
  '林默（惊恐）：',
  '“你们……是谁？！”',
  '-------------------------以下为个人总结---------------------------------',
  '人物主要有：林默、安娜、雷队、阿杰'
].join('\n')

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
      assert.match(text, /storyboard-images\/S04\.png/)
      assert.doesNotMatch(text, /storyboard-images\/S05\.png/)
      assert.doesNotMatch(text, /storyboard-images\/contact-sheet\.jpg/)
      assert.doesNotMatch(text, /episodes\//)
    }

    assert.match(deliverable, /超写实真人电影质感/)
    assert.doesNotMatch(deliverable, /动漫二次元|非真人写实/)
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
    assert.ok(allSegmentUploadImageCounts(deliverable).every((count) => count <= 9))
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
    assert.ok(allSegmentUploadImageCounts(deliverable).every((count) => count <= 9))
    assert.deepEqual(allSegmentUploadImageCounts(deliverable), [8, 8])

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
    assert.ok(allSegmentUploadImageCounts(deliverable).every((count) => count <= 9))
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

test('isolated mansion visual deliverable exposes four cinematic character reference prompts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-ai-cast-refs-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      '--duration',
      '60s',
      '--aspect',
      '9:16',
      isolatedMansionScript
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    const readme = await readFile(join(out, 'storyboard-images', 'README.md'), 'utf8')

    for (const text of [deliverable, readme]) {
      assert.match(text, /storyboard-images\/character-linmo\.png/)
      assert.match(text, /storyboard-images\/character-anna\.png/)
      assert.match(text, /storyboard-images\/character-leidui\.png/)
      assert.match(text, /storyboard-images\/character-ajie\.png/)
      assert.doesNotMatch(text, /个人总结|人物主要有/)
    }

    assert.match(deliverable, /角色名称：林默/)
    assert.match(deliverable, /角色名称：安娜/)
    assert.match(deliverable, /角色名称：雷队/)
    assert.match(deliverable, /角色名称：阿杰/)
    assert.doesNotMatch(deliverable, /标题：rough_shotlist/)
    assert.doesNotMatch(deliverable, /成片一句话：[^。\n]+空间调度/)
    assert.match(deliverable, /\| 镜头 \| 时长 \| 景别 \| 焦段 \| 运镜 \| 空间调度 \| 画面动作 \| 故事板图 \|/)
    assert.match(deliverable, /林默从沙发前景抬头，安娜靠茶几倒水，雷队堵在门口持枪，阿杰缩在背光角落/)
    assert.doesNotMatch(deliverable, /按剧本动作/u)
    assert.match(deliverable, /上方预留干净信息栏/)
    assert.match(deliverable, /character turnaround/)
    assert.match(deliverable, /prop reference/)
    assert.match(deliverable, /anime, manga, cartoon/)
    assert.match(deliverable, /锁定角色：林默、安娜、雷队、阿杰/u)
    assert.doesNotMatch(deliverable, /### 主角参考图 -> storyboard-images\/character-reference\.png/)
    assert.ok(allSegmentUploadImageCounts(deliverable).every((count) => count <= 9))
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

function allSegmentUploadImageCounts(deliverable) {
  assert.match(deliverable, /上传图片控制在\s+9\s+张以内/)
  const matches = [...deliverable.matchAll(/上传图片\s+(\d+)\s+张/g)]
  assert.ok(matches.length, 'missing segment upload-image counts')
  return matches.map((match) => Number(match[1]))
}

function allSegmentDurations(deliverable) {
  const matches = [...deliverable.matchAll(/### 第 \d+ 段：[^（]+（(\d+)s，上传图片/g)]
  assert.ok(matches.length, 'missing segment durations')
  return matches.map((match) => Number(match[1]))
}
