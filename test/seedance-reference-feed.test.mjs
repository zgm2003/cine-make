import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSeedanceReferenceFeedPackage } from '../src/seedance-reference-feed-extractor.mjs'
import { composeSeedanceAllReferenceFeedMarkdown } from '../src/seedance-reference-feed-writer.mjs'

const source = '画面:雪山之巅，风雪之中。头发花白且凌乱的老道人身穿蓑衣，头戴斗笠，艰难的迎着风雪行走，双手放在胸前，怀里紧紧抱着一只虚弱的麒麟幼兽。身后的雪地上滴下长长的一道血痕，没走几步老道终于支撑不住倒在雪地里。怀里的麒麟幼兽摔在雪地上，看着倒在雪地的老道，坚强的起身用舌头舔舐老道的面颊，老道奄奄一息的伸出手触摸麒麟。'

const forbiddenMeta = /续接|承接|下一段|下一场|后续|首帧|尾帧|首尾|segment|storyboard-images|S\d{2}|keyframe|控制帧|分镜图/u

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

  assert.match(markdown, /^# Seedance 全能参考投喂包/u)
  assert.match(markdown, /## GPT-image-2 参考图生成提示词/u)
  assert.match(markdown, /## 参考资产绑定/u)
  assert.match(markdown, /## 逐条视频文本/u)
  assert.match(markdown, /16:9/u)
  assert.match(markdown, /雪山之巅=图片1/u)
  assert.match(markdown, /老年道清=图片2/u)
  assert.match(markdown, /麒麟幼兽=图片3/u)
  assert.match(markdown, /^1 雪山之巅/mu)
  assert.doesNotMatch(markdown, forbiddenMeta)
})

test('preserves original novel dialogue exactly and exposes fidelity rules', () => {
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

  assert.match(markdown, /## 原著守则/u)
  assert.match(markdown, /## 镜头语言规则/u)
  assert.match(markdown, /「尔敢夺我太虚古族神树，不管你是谁，不管你在哪，我们都会找到你！会找到你！！！」/u)
  assert.match(markdown, /「当个凡人过一辈子，有什么不好呢？何必追求自己得不到的东西？」/u)
  assert.doesNotMatch(markdown, /旁白音色：“不管你是谁，不管你在哪，我们都会找到你！”/u)
})
