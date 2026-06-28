import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { buildSeedanceReferenceFeedPackage } from '../src/seedance-reference-feed-extractor.mjs'
import { composeSeedanceAllReferenceFeedMarkdown } from '../src/seedance-reference-feed-writer.mjs'

const source = '画面:雪山之巅，风雪之中。头发花白且凌乱的老道人身穿蓑衣，头戴斗笠，艰难的迎着风雪行走，双手放在胸前，怀里紧紧抱着一只虚弱的麒麟幼兽。身后的雪地上滴下长长的一道血痕，没走几步老道终于支撑不住倒在雪地里。怀里的麒麟幼兽摔在雪地上，看着倒在雪地的老道，坚强的起身用舌头舔舐老道的面颊，老道奄奄一息的伸出手触摸麒麟。'

const forbiddenMeta = /续接|承接|下一段|下一场|后续|首帧|尾帧|首尾|segment|storyboard-images|S\d{2}|keyframe|控制帧|分镜图/u
const riskySpatialStaging = /前景|后景|前后景关系|受声者反应|双主体|双人构图|同框反应/u

test('builds Seedance reference-feed package with 16:9 and GPT-image-2 tri-view prompts', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: source,
    style: '3D古风写实，超写实真人电影质感，冷蓝灰雪山',
    aspectRatio: '16:9',
    expandScript: false
  })

  assert.equal(pack.aspectRatio, '16:9')
  assert.equal(pack.expandScript, false)
  assert.equal(pack.assets[0].bindingLabel, '图片1')
  assert.equal(pack.assets.some((asset) => asset.title.includes('雪山之巅')), true)
  assert.equal(pack.assets.some((asset) => asset.title.includes('老年道清')), true)
  assert.equal(pack.assets.some((asset) => asset.title.includes('麒麟幼兽')), true)

  const oldTaoist = pack.assets.find((asset) => asset.title.includes('老年道清'))
  assert.ok(oldTaoist)
  assert.match(oldTaoist.prompt, /GPT-image-2/u)
  assert.match(oldTaoist.prompt, /最左侧单独的上半身\+头部细节展示/u)
  assert.match(oldTaoist.prompt, /正面全身照、侧面全身照、背面全身照/u)
  assert.match(oldTaoist.prompt, /三视图为一张图/u)
  assert.match(oldTaoist.prompt, /背景为白色/u)
})

test('renders clean Seedance all-reference feed without continuation or storyboard concepts', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: source,
    style: '3D古风写实，超写实真人电影质感，冷蓝灰雪山',
    aspectRatio: '16:9',
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)
  const sections = markdown.match(/^## .+$/gmu) ?? []

  assert.match(markdown, /^# Seedance 全能参考投喂包/u)
  assert.deepEqual(sections, [
    '## GPT-image-2 参考图生成提示词',
    '## 每5条复制制作块'
  ])
  assert.match(markdown, /## GPT-image-2 参考图生成提示词/u)
  assert.match(markdown, /## 每5条复制制作块/u)
  assert.doesNotMatch(markdown, /## 参考资产绑定|## 全局负面约束|## 原著守则|## 镜头语言规则|## 小云雀运镜标签库|## 逐条视频文本|## 底部备注栏可复制/u)
  assert.match(markdown, /16:9/u)
  assert.match(markdown, /### 图片1 = 雪山之巅/u)
  assert.match(markdown, /### 图片2 = 老年道清三视图/u)
  assert.match(markdown, /### 图片3 = 麒麟幼兽三视图/u)
  assert.match(markdown, /上传参考图：雪山之巅 = 图片1；老年道清三视图 = 图片2；麒麟幼兽三视图 = 图片3/u)
  assert.match(markdown, /^1 日 外 雪山之巅 老年道清 .*镜头前推/mu)
  assert.doesNotMatch(markdown, forbiddenMeta)
})

test('default story templates use time and interior-exterior fields, not legacy location-parentheses format', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: source,
    style: '3D古风写实，超写实真人电影质感，冷蓝灰雪山',
    aspectRatio: '16:9',
    expandScript: false
  })

  assert.match(pack.videoLines[0], /^日 外 雪山之巅 老年道清 /u)
  assert.doesNotMatch(pack.videoLines.join('\n'), /雪山之巅（日外）/u)
})

test('preserves original novel dialogue exactly without exposing internal fidelity sections', () => {
  const novel = [
    '第3章 涅槃归来',
    '就在江凡以为一切都结束时，一声神威浩荡的怒吼震荡而出：',
    '「尔敢夺我太虚古族神树，不管你是谁，不管你在哪，我们都会找到你！会找到你！！！」',
    '陆争揶揄道：',
    '「当个凡人过一辈子，有什么不好呢？何必追求自己得不到的东西？」'
  ].join('\\n')

  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: novel,
    style: '3D国漫，国风仙侠，偏水墨+古风写实结合',
    aspectRatio: '16:9',
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.doesNotMatch(markdown, /## 原著守则|## 镜头语言规则|## 小云雀运镜标签库/u)
  assert.match(markdown, /「尔敢夺我太虚古族神树，不管你是谁，不管你在哪，我们都会找到你！会找到你！！！」/u)
  assert.match(markdown, /「当个凡人过一辈子，有什么不好呢？何必追求自己得不到的东西？」/u)
  assert.doesNotMatch(markdown, /旁白音色：“不管你是谁，不管你在哪，我们都会找到你！”/u)
})

test('keeps video dialogue breathable by excerpting overlong source quotes', () => {
  const novel = [
    '许府后院墙角，许悠然蹲在泥地里。',
    '王映凤不以为然地拍了拍手掌，道：',
    '「练气液是我们许家的，他有骨气就自己弄去，靠一个女人偷偷给他，别说我们许府的人看不起，就是路边的乞丐都吐口痰。」',
    '「我们走！」'
  ].join('\n')

  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: novel,
    style: '3D国漫，国风仙侠，偏水墨+古风写实结合',
    aspectRatio: '16:9',
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)
  const longQuote = '「练气液是我们许家的，他有骨气就自己弄去，靠一个女人偷偷给他，别说我们许府的人看不起，就是路边的乞丐都吐口痰。」'

  assert.doesNotMatch(pack.videoLines.join('\n'), new RegExp(longQuote, 'u'))
  assert.match(pack.videoLines.join('\n'), /台词摘句：.*他有骨气就自己弄去/u)
  assert.match(pack.videoLines.join('\n'), /靠一个女人偷偷给他/u)
  assert.match(markdown, /台词摘句：.*他有骨气就自己弄去/u)
  assert.doesNotMatch(markdown, /## 原著守则|长台词允许|视频呼吸/u)
})

test('renders five-line copy blocks with references, voice, and unified requirements', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: source,
    style: '3D国漫，国风仙侠，轻喜剧反差',
    aspectRatio: '16:9',
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.match(markdown, /## 每5条复制制作块/u)
  assert.match(markdown, /### 第1组｜第1-5条/u)
  assert.match(markdown, /上传参考图：雪山之巅 = 图片1；老年道清三视图 = 图片2；麒麟幼兽三视图 = 图片3/u)
  assert.doesNotMatch(markdown, /上传参考图：图片1｜雪山之巅/u)
  assert.match(markdown, /音色：按本组必要对白匹配角色年龄、身份和情绪；没有对白的组不要新增旁白。必要对白只保留本组逐条文本里的短句。/u)
  assert.match(markdown, /统一要求：【不要字幕、不要配乐，只保留环境音、系统提示音、动作音效和必要对白】3D国漫，国风仙侠，轻喜剧反差，16:9。/u)
})

test('dialogue video lines use speaker-only shots instead of foreground/background spatial staging', () => {
  const novel = [
    '鬼王宗宗门大殿，骨灵教枯瘦老者缓缓起身。',
    '枯瘦老者禀报道：',
    '「正道奸细已处理，骨骸炼成法器」',
    '林夜面无表情，指尖压紧扶手。'
  ].join('\n')

  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: novel,
    style: '3D国漫，国风仙侠，轻喜剧反差',
    aspectRatio: '16:9',
    expandScript: false
  })

  const dialogueLines = pack.videoLines.filter((line) => /台词/.test(line))
  assert.ok(dialogueLines.length > 0)
  for (const line of dialogueLines) {
    assert.match(line, /说话者单人主镜头/u)
    assert.doesNotMatch(line, riskySpatialStaging)
  }
})

test('generated video delivery lines avoid spatial staging phrases that video tools misread', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: source,
    style: '3D国漫，国风仙侠，轻喜剧反差',
    aspectRatio: '16:9',
    expandScript: false
  })

  for (const line of pack.videoLines) {
    assert.doesNotMatch(line, riskySpatialStaging)
  }
})

test('legacy generator templates avoid foreground/background staging wording', () => {
  const files = [
    'src/seedance-reference-feed-extractor.mjs',
    'src/draft-writer.mjs',
    'src/deliverable-writer.mjs'
  ]
  const legacySpatialTemplatePhrases = [
    '前景遮挡',
    '背景纵深',
    '占前景三分之一',
    '团队轮廓在后景',
    '沙发前景',
    '安娜的手在前景',
    '警惕眼神在后景',
    '手机屏幕和血手占前景',
    '客厅人物保持背景方位'
  ]

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const phrase of legacySpatialTemplatePhrases) {
      assert.equal(text.includes(phrase), false, `${file} still contains ${phrase}`)
    }
  }
})
