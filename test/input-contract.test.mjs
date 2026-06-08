import test from 'node:test'
import assert from 'node:assert/strict'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'

test('parses a story request into a normalized contract', async () => {
  const options = parseArgs(['--duration', '30s', '--aspect', '9:16', '--style', 'cinematic', '--platform', 'jimeng', '雨夜里，女孩在巷口停下脚步。'])
  const contract = await createInputContract(options)

  assert.equal(contract.target.durationSeconds, 30)
  assert.equal(contract.target.aspectRatio, '9:16')
  assert.equal(contract.target.style, 'cinematic，超写实真人电影质感')
  assert.equal(contract.target.platform, 'jimeng')
  assert.equal(contract.target.shotCount, 8)
  assert.equal(contract.target.storyboardCount, 8)
  assert.equal(contract.contentType, 'novel_excerpt')
  assert.match(contract.sourceText, /女孩/)
})

test('defaults to photoreal live-action cinematic storyboard packs', async () => {
  const options = parseArgs(['--duration', '15s', '--aspect', '9:16', '雨夜里，女孩在巷口停下脚步。'])
  const contract = await createInputContract(options)

  assert.match(contract.target.style, /超写实真人电影质感/)
  assert.match(contract.target.style, /85mm镜头/)
  assert.match(contract.target.style, /4K/)
  assert.doesNotMatch(contract.target.style, /动漫|二次元|非真人写实|anime/i)
  assert.equal(contract.target.shotCount, 4)
  assert.equal(contract.target.storyboardCount, 4)
})

test('classifies enterprise documentary essays separately from novels', async () => {
  const source = '号声里的奋斗密码。1996年夏，我从东锅技校毕业，成为东方锅炉轻容分厂电焊工。师傅说最好听的是上班号声。2011年燃烧器车间攻坚海外项目，东锅人提前交付。2025年儿子问我最动听的旋律。'
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', source]))

  assert.equal(contract.contentType, 'enterprise_documentary')
  assert.match(contract.title, /enterprise_documentary/)
})

test('infers longer default duration from dense folklore fantasy plot', async () => {
  const source = [
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
  const contract = await createInputContract(parseArgs(['--aspect', '9:16', source]))

  assert.equal(contract.contentType, 'novel_excerpt')
  assert.equal(contract.target.durationSource, 'inferred_from_source')
  assert.ok(contract.target.durationSeconds > 30)
  assert.equal(contract.target.durationSeconds % 15, 0)
  assert.ok(contract.target.shotCount > 8)
  assert.ok(contract.target.shotCount <= Math.ceil(contract.target.durationSeconds / 15) * 4)
})

test('explicit duration still overrides long-source duration inference', async () => {
  const source = Array.from({ length: 20 }, (_, index) => `第${index + 1}段，莫川在祠堂里看见香炉、黄皮子和牌位继续逼近。`).join('\n')
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', source]))

  assert.equal(contract.target.durationSource, 'explicit')
  assert.equal(contract.target.durationSeconds, 30)
  assert.equal(contract.target.shotCount, 8)
})

test('classifies cultivation transmigration without confusing xianxia families for folklore spirits', async () => {
  const source = '元武国神兵门坊市，祁瑾听见越国六派大败，意识到韩立可能已经带着掌天瓶传送去了乱星海。他只是练气九层，祁氏修仙家族也只有老筑基坐镇。祁瑾低声念筑基丹上哪找，忽然听见叮的一声：筑基丹，距离七十五公里。'
  const contract = await createInputContract(parseArgs(['--aspect', '9:16', source]))

  assert.equal(contract.contentType, 'cultivation_transmigration')
  assert.equal(contract.target.durationSource, 'inferred_from_source')
  assert.ok(contract.target.durationSeconds >= 30)
  assert.match(contract.title, /cultivation_transmigration/)
})

test('defaults to Jimeng and rejects non-Jimeng video platforms', async () => {
  const contract = await createInputContract(parseArgs(['雨夜里，女孩在巷口停下脚步。']))

  assert.equal(contract.target.platform, 'jimeng')
  await assert.rejects(
    () => createInputContract(parseArgs(['--platform', 'seedance', '雨夜里，女孩在巷口停下脚步。'])),
    /only supports jimeng/
  )
})

test('rejects more than twelve user visual references per run', async () => {
  const args = ['--mode', 'visual']
  for (let index = 1; index <= 13; index += 1) {
    args.push('--character-image', `refs/ref-${index}.png`)
  }
  args.push('雨夜里，女孩在巷口停下脚步。')

  await assert.rejects(() => createInputContract(parseArgs(args)), /visual references.*at most 12/)
})

test('rejects unsupported aspect ratio', async () => {
  const options = parseArgs(['--aspect', '3:2', 'story'])
  await assert.rejects(() => createInputContract(options), /Unsupported aspect ratio/)
})
