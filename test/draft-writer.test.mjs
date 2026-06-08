import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'
import { composeDraftAssets } from '../src/draft-writer.mjs'
import { validateRunDirectory } from '../src/run-validator.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = '小说片段：凌晨四点，退役潜水员周祁回到废弃海洋馆。主水箱里没有水，却传来鲸鱼的低鸣。他发现玻璃内侧贴着一张女儿小时候画的蓝鲸，画纸没有被水泡烂。远处的检修门自动打开，门后是一片真实的深海光。'
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
  '▲ 【音效】 惊雷声，紧接着是林默急促的呼吸声。',
  '林默（内心独白）：',
  '“我是谁？这是哪？该死……我的头好痛。记忆又在消失……”',
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
  '人物主要有：林默、安娜、雷队、阿杰',
  '场景主要有：孤岛别墅、夜晚',
  '主要元素内容：手机、茶壶、枪、警徽、带血的解剖刀'
].join('\n')

test('composeDraftAssets creates production assets from a story contract', async () => {
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', '--platform', 'jimeng', source]))
  const draft = composeDraftAssets(contract)

  assert.match(draft.directorScript, /# Director script/)
  assert.match(draft.directorScript, /退役潜水员周祁/)
  assert.doesNotMatch(draft.directorScript, /周祁回 enters|让退役潜水员周祁回/)
  assert.match(draft.directorScript, /退役潜水员周祁因/)
  assert.equal(draft.characters.length >= 2, true)
  assert.equal(draft.shotlist.length, contract.target.shotCount)
  assert.equal(draft.shotlist[0].shot_id, 'S01')
  assert.match(draft.storyboardPrompts, /still-image generation prompts/)
  assert.match(draft.storyboardPrompts, /preset lock: protagonist/)
  assert.match(draft.storyboardPrompts, /secondary animation cue frozen as a still/)
  assert.match(draft.storyboardPrompts, /do not turn the still prompt into a video prompt/)
  assert.equal(draft.seedancePack, undefined)
  assert.match(draft.jimengPack, /external video synthesis/)
  assert.match(draft.jimengPack, /Shot alignment: generate exactly/)
  assert.match(draft.jimengPack, /do not skip, merge, split, or borrow story from other shots/)
  assert.match(draft.continuityReview, /Codex does not render the final video/)
})

test('composeDraftAssets extracts common short-drama anchors', async () => {
  const hospitalSource = '小说片段：凌晨三点，外卖员陈默送最后一单到废弃医院。电梯停在不存在的13楼，门打开后，他看见十年前失踪的妹妹正坐在护士站，手里拿着他小时候丢掉的红色弹珠。'
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', hospitalSource]))
  const draft = composeDraftAssets(contract)

  assert.match(draft.directorScript, /外卖员陈默/)
  assert.match(draft.directorScript, /废弃医院/)
  assert.match(JSON.stringify(draft.characters), /红色弹珠/)
  assert.match(draft.storyboardPrompts, /妹妹/)
})

test('composeDraftAssets extracts isolated-mansion memory thriller anchors', async () => {
  const memorySource = [
    '警探林默穿着湿透的深色风衣，在暴风雨孤岛别墅客厅的沙发上猛然惊醒，满手鲜血。',
    '林默撩开衣袖，手臂上有新鲜刀刻血字，提示他只有10分钟记忆。',
    '心理医生安娜倒热水，雷队持枪守在门口，瘸子阿杰蜷缩在角落。',
    '手机10分钟倒计时归零后，林默记忆清空，再次问你们是谁。'
  ].join('')
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', memorySource]))
  const draft = composeDraftAssets(contract)
  const serialized = JSON.stringify(draft)

  assert.match(draft.directorScript, /警探林默/)
  assert.match(serialized, /孤岛别墅/)
  assert.match(serialized, /手机10分钟倒计时|10分钟倒计时/)
  assert.match(serialized, /手臂血字|刀刻血字/)
  assert.match(serialized, /记忆清空|倒计时归零/)
  assert.doesNotMatch(serialized, /identity_anchor":"医生正/)
})

test('composeDraftAssets ignores role preamble and extracts isolated-mansion episode beats', async () => {
  const episodeSource = [
    '角色设定',
    '林默（男主角）：私家侦探。冷静、神经质。',
    '安娜（女性）：心理医生，知性、冷静。',
    '第一集剧本：【分崩离析的10分钟】',
    '[场景：孤岛别墅 - 客厅 - 夜]',
    '▲ 【画面】 窗外暴雨倾盆，一道闪电划过，照亮昏暗的客厅。',
    '▲ 【画面】 林默猛地从沙发上惊醒，大口喘气。他看向自己的双手，满是鲜血。',
    '▲ 【画面】 林默急切地拉开衣袖。他的手臂上刻着一行字：【我的记忆只有10分钟。凶手在他们中间。】',
    '▲ 【画面】 林默的手机突然定时闹钟响起：【00:10:00】时间到。',
    '林默（惊恐）：“你们……是谁？！”'
  ].join('\n')
  const contract = await createInputContract(parseArgs(['--duration', '60s', '--aspect', '9:16', episodeSource]))
  const draft = composeDraftAssets(contract)
  const serialized = JSON.stringify(draft)

  assert.match(serialized, /私家侦探林默/)
  assert.match(serialized, /孤岛别墅客厅/)
  assert.match(serialized, /手机10分钟倒计时/)
  assert.doesNotMatch(draft.shotlist[0].action, /角色设定|男主角/)
  assert.match(draft.shotlist.at(-1).action, /你们.*是谁|00:10:00|时间到/)
  assert.equal(draft.shotlist.some((shot) => /源剧情：[“”"'\s]+$/u.test(shot.action)), false)
})

test('composeDraftAssets extracts isolated-mansion cast into cinematic character reference profiles', async () => {
  const contract = await createInputContract(parseArgs(['--duration', '60s', '--aspect', '9:16', isolatedMansionScript]))
  const draft = composeDraftAssets(contract)
  const names = draft.characters.map((character) => character.identity_anchor)
  const serialized = JSON.stringify(draft)

  assert.equal(contract.contentType, 'short_drama_script')
  assert.deepEqual(names, ['林默', '安娜', '雷队', '阿杰'])
  assert.match(serialized, /character-linmo\.png/)
  assert.match(serialized, /character-anna\.png/)
  assert.match(serialized, /character-leidui\.png/)
  assert.match(serialized, /character-ajie\.png/)
  assert.match(serialized, /上方预留干净信息栏/)
  assert.match(serialized, /character turnaround/)
  assert.match(serialized, /prop reference/)
  assert.match(serialized, /anime, manga, cartoon/)
  assert.equal(draft.shotlist.some((shot) => /个人总结|人物主要有|主要元素内容/u.test(shot.action)), false)
  assert.match(draft.shotlist[0].action, /窗外暴雨倾盆|暴雨/)
  assert.doesNotMatch(draft.shotlist[0].action, /^注意到不该出现的信号/)
  assert.equal(draft.shotlist.some((shot) => /空间调度|镜头方向/u.test(shot.action)), false)

  const groupReveal = draft.shotlist.find((shot) => shot.characters?.length === 4)
  assert.match(groupReveal.blocking, /林默.*安娜.*雷队.*阿杰/u)

  const leiShot = draft.shotlist.find((shot) => shot.characters?.includes('雷队') && !shot.characters?.includes('林默'))
  assert.match(leiShot.blocking, /雷队.*门口/u)
  assert.match(leiShot.image_prompt, /character locks: 雷队/u)
  assert.doesNotMatch(leiShot.image_prompt, /preset lock: protagonist .*林默/u)
})

test('short-drama script uses source-paced duration instead of stretching explicit runtime', async () => {
  const contract = await createInputContract(parseArgs(['--duration', '60s', '--aspect', '9:16', isolatedMansionScript]))
  const draft = composeDraftAssets(contract)
  const actions = draft.shotlist.map((shot) => shot.action).join('\n')

  assert.equal(contract.contentType, 'short_drama_script')
  assert.equal(contract.target.requestedDurationSeconds, 60)
  assert.equal(contract.target.durationSource, 'script_paced_from_source')
  assert.ok(contract.target.durationSeconds < 60, `should not pad script to 60s, got ${contract.target.durationSeconds}`)
  assert.ok(contract.target.durationSeconds >= 40, `should keep enough room for the full scene, got ${contract.target.durationSeconds}`)
  assert.equal(draft.shotlist.reduce((total, shot) => total + shot.duration_seconds, 0), contract.target.durationSeconds)

  assert.match(actions, /林默猛地从沙发上惊醒/u)
  assert.match(actions, /手臂上.*记忆只有10分钟/u)
  assert.match(actions, /镜头拉开，客厅里还有另外三个人/u)
  assert.match(actions, /雷队.*老张被杀/u)
  assert.match(actions, /安娜.*失忆症/u)
  assert.match(actions, /阿杰突然冷笑/u)
  assert.match(actions, /凯撒/u)
  assert.match(actions, /00:00:00/u)
  assert.match(actions, /你们.*是谁/u)
  assert.equal(draft.shotlist.length, 16)
  assert.match(draft.shotlist.at(-1).action, /眼神瞬间空洞.*你们.*是谁/u)
})

test('enterprise documentary draft condenses long essays into a 30 second theme film', async () => {
  const essay = [
    '号声里的奋斗密码。',
    '桃花山下，父亲每天听着下班号声从东方锅炉归来。',
    '1996年夏，我从东锅技校毕业，进入轻容分厂成为电焊工。',
    '师傅于进川问我世上最好听的音乐是什么，我回答下班号，他却说是上班号声。',
    '父亲讲起三线内迁和创业岁月，东锅人靠双手和实干托起厂房。',
    '2011年燃烧器车间落户德阳制造基地，海外2×660MW锅炉稳燃器任务只有九天。',
    '我们退掉端午车票，改进氩弧焊工艺，七昼夜攻坚提前交付。',
    '2025年儿子问我最动听的旋律，我回答上班号声，那是东锅人向智能未来集结的战鼓。'
  ].join('')
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', '--style', '企业奋斗短片，钢铁工业质感', essay]))
  const draft = composeDraftAssets(contract)

  assert.equal(contract.contentType, 'enterprise_documentary')
  assert.match(draft.directorScript, /东锅人因上班号声/)
  assert.match(JSON.stringify(draft.characters), /东锅人/)
  assert.match(JSON.stringify(draft.characters), /上班号声/)
  assert.match(JSON.stringify(draft.characters), /东方锅炉车间/)
  assert.doesNotMatch(JSON.stringify(draft), /不可能|失去的人|半步踏入/)
  assert.match(draft.shotlist[0].action, /建立精神母题/)
  assert.match(draft.shotlist.at(-1).action, /传承到新一代/)
  assert.doesNotMatch(draft.shotlist.at(-1).action, /技术难题逼近失败边缘/)
  assert.equal(draft.shotlist.length, 8)
})

test('folklore fantasy draft preserves the protagonist, ritual object, monster, and twist', async () => {
  const source = [
    '莫川躺在床上正要睡觉，又听见祭祖幻听。',
    '他怒喝之后，一枚双耳三足香炉悬浮而起，青烟扑面。',
    '烟雾中，他看见古祠堂、神龛、老人和青年正在求祖庇佑。',
    '老人说黄皮子讨封被坏了道行，陈家要遭灾。',
    '白烟涌入祠堂，黄不语探首而入，要取青年性命填补道行。',
    '老人绝望呼喊列祖列宗，供香青烟钻入莫川口鼻。',
    '莫川忽然感到飨食香火，解人灾殃。',
    '闪电照亮神龛，黄不语惊问他是不是陈家老祖。',
    '莫川低头发现自己飘在牌位上，透明无影，疑似成了鬼。'
  ].join('')
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', '--style', '民俗玄幻惊悚，古祠堂，香火烟雾', source]))
  const draft = composeDraftAssets(contract)
  const serialized = JSON.stringify(draft)

  assert.equal(contract.contentType, 'novel_excerpt')
  assert.match(draft.directorScript, /莫川/)
  assert.match(serialized, /双耳三足香炉/)
  assert.match(serialized, /黄不语/)
  assert.match(serialized, /陈家老祖/)
  assert.doesNotMatch(serialized, /主角锚点：老人|identity_anchor":"老人/)
  assert.match(draft.shotlist[0].action, /祭祖幻听/)
  assert.match(draft.shotlist.at(-1).action, /牌位上发现自己成了透明鬼影/)
})

test('cultivation transmigration draft keeps Qijin, cultivation fortunes, and pill navigation', async () => {
  const source = [
    '元武国，神兵门坊市。',
    '祁瑾站在人群之中，听见越国六派被魔道大败，黄枫谷已经金蝉脱壳。',
    '他一个月前魂穿到同名同姓的祁氏修仙者身上，练气九层，三灵根。',
    '祁瑾判定自己穿越到了凡人修仙世界，原本想去找掌天瓶和升仙令。',
    '可魔道已经入侵，韩立大概率已经传送乱星海，掌天瓶、噬金虫、金雷竹和风雷翅都够不着了。',
    '祁氏只是神兵门下小家族，太上长老也不过筑基初期。',
    '祁瑾越想越气，喃喃道：筑基丹，上哪去找啊。',
    '叮！筑基丹，距离七十五公里。已为你选择最近路线，请在合适的位置掉头。'
  ].join('')
  const contract = await createInputContract(parseArgs(['--duration', '45s', '--aspect', '9:16', '--style', '国风修仙，坊市危机，黑色幽默', source]))
  const draft = composeDraftAssets(contract)
  const serialized = JSON.stringify(draft)

  assert.equal(contract.contentType, 'cultivation_transmigration')
  assert.match(draft.directorScript, /祁瑾/)
  assert.match(serialized, /掌天瓶/)
  assert.match(serialized, /筑基丹/)
  assert.match(serialized, /最近路线/)
  assert.doesNotMatch(serialized, /莫川|黄不语|双耳三足香炉|陈家老祖/)
  assert.match(draft.shotlist[0].action, /魔道入侵与越国六派大败|越国六派大败/)
  assert.match(draft.shotlist.at(-1).action, /掉头追丹|最近筑基丹|路线箭头/)
})

test('cli --draft writes a production-valid run', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-draft-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--draft', '--out', out, '--duration', '30s', '--aspect', '9:16', '--style', 'cinematic deep-sea mystery', '--platform', 'jimeng', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'deliverable.md')))
    assert.ok(existsSync(join(out, 'storyboard-images', 'README.md')))
    assert.equal(existsSync(join(out, 'director-script.md')), false)
    assert.equal(existsSync(join(out, 'shotlist.json')), false)
    assert.equal(existsSync(join(out, 'seedance-pack.md')), false)
    assert.equal(existsSync(join(out, 'jimeng-pack.md')), false)

    const validation = await validateRunDirectory({ runDir: out, stage: 'production' })
    assert.equal(validation.ok, true, validation.errors.join('\n'))

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /完整保留剧情/)
    assert.match(deliverable, /storyboard-images\/S01\.png/)
    assert.doesNotMatch(deliverable, /episodes\/episode-01\/storyboard-images\/S01-start\.png/)
    assert.doesNotMatch(deliverable, /episodes\/episode-01\/video-tasks\/S01\.md/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
