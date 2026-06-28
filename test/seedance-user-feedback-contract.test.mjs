import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSeedanceReferenceFeedPackage } from '../src/seedance-reference-feed-extractor.mjs'
import { composeSeedanceAllReferenceFeedMarkdown } from '../src/seedance-reference-feed-writer.mjs'

const liuFeiSource = [
  '第1集 1-1 地窖/院子 日 外 人物：刘飞',
  '院子里的地窖口正冒出滚滚浓烟。刘飞满头大汗，正焦急地提着水桶往地窖里灌水。',
  '刘飞（os）：我家地窖突然着火，吓得我赶紧往里倒水。',
  '刘飞接来一根粗大的水管，对准地窖口猛灌，水花四溅。',
  '刘飞（os）：可火始终无法浇灭。于是我接来水管往里面灌了100吨水，可地窖还是没有灌满。',
  '刘飞看着依然火光冲天的地窖口，咬了咬牙。',
  '刘飞（os）：接着我便跳了进地窖查看。',
  '刘飞纵身一跃，跳进了火光闪烁的地窖深处。',
  '刘飞：这是哪啊？'
].join('\n')

test('15-second Seedance feed warns when exact OS makes pacing tight but preserves every source word', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: liuFeiSource,
    style: '仿真人，UE5超写实真人电影质感，Unreal Engine 5，Lumen电影级光照',
    aspectRatio: '16:9',
    targetSeconds: 15,
    preserveDialogueExact: true
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.equal(pack.videoLines.length, 5)
  assert.match(markdown, /15秒容量提醒：原文OS\/对白必须一字不改时，本段语速偏紧/)
  assert.match(markdown, /保留原文OS\/对白不改字，画面动作做合并压缩/)

  for (const exact of [
    '我家地窖突然着火，吓得我赶紧往里倒水。',
    '可火始终无法浇灭。于是我接来水管往里面灌了100吨水，可地窖还是没有灌满。',
    '接着我便跳了进地窖查看。',
    '这是哪啊？'
  ]) {
    assert.match(markdown, new RegExp(exact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'))
  }
})

test('copy-ready Seedance lines use the reference single-line format with day interior-exterior fields', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: liuFeiSource,
    style: '仿真人，UE5超写实真人电影质感，Unreal Engine 5，Lumen电影级光照',
    aspectRatio: '16:9',
    targetSeconds: 15,
    preserveDialogueExact: true
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.match(markdown, /## 每5条复制制作块/u)
  assert.doesNotMatch(markdown, /单行格式固定：|## 镜头语言规则/u)
  assert.match(markdown, /^1 日 外 院子地窖口 刘飞 /mu)
  assert.match(markdown, /^2 日 外 院子地窖口 刘飞 /mu)
  assert.match(markdown, /^3 日 外 院子地窖口 刘飞 /mu)
  assert.match(markdown, /^4 日 外 院子地窖口 刘飞 /mu)
  assert.match(markdown, /^5 日 内 地窖内部 刘飞 /mu)
  assert.doesNotMatch(markdown, /^1 院子地窖口/mu)
})

test('copy block reference line follows asset-first uploaded-reference style', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: liuFeiSource,
    style: '仿真人，UE5超写实真人电影质感，Unreal Engine 5，Lumen电影级光照',
    aspectRatio: '16:9',
    targetSeconds: 15,
    preserveDialogueExact: true
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.match(markdown, /上传参考图：院子地窖口场景 = 图片1；刘飞三视图 = 图片2/)
  assert.doesNotMatch(markdown, /上传参考图：图片1｜院子地窖口场景/)
})

test('GPT-image-2 prompts start with model and ratio, keep UE5 face light constraints, and end with 4K quality', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: liuFeiSource,
    style: '仿真人，UE5超写实真人电影质感，Unreal Engine 5，Lumen电影级光照',
    aspectRatio: '16:9',
    targetSeconds: 15,
    preserveDialogueExact: true
  })

  for (const asset of pack.assets.filter((item) => item.kind === 'image')) {
    assert.match(asset.prompt, /^GPT-image-2，16:9，/u)
    assert.match(asset.prompt, /UE5|Unreal Engine 5/u)
    assert.match(asset.prompt, /面光|补光|眼睛.*高光/u)
    assert.match(asset.prompt, /4K画质！$/u)
  }
})
