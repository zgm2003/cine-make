import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { buildSeedanceReferenceFeedPackage } from '../src/seedance-reference-feed-extractor.mjs'
import { composeSeedanceAllReferenceFeedMarkdown } from '../src/seedance-reference-feed-writer.mjs'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'
import { exportCanvasPromptPack } from '../src/canvas-prompt-pack-exporter.mjs'

const tijiaGuomanSource = `时长镜头画面描述（国漫细节版）音效/台词0-3s特写+慢推【特写】许怡宁的手死死攥着三尺青锋，剑刃抵在颈侧，雪白的脖颈映出寒光，一滴泪珠顺着下颌滑落，砸在剑身上溅开细小水花。她的眼神决绝，发髻散乱，青云宗内定弟子的玉牌在衣襟上微微晃动。音效：剑鸣轻响、泪珠落地声台词（许怡宁，尖厉决绝）：我宁死，也不嫁江凡！3-6s全景+快切【全景】许家大堂瞬间炸开，族人乱作一团，有人惊呼有人拉扯，许正言（许父）满脸冷汗，冲上前时，镜头顺着他慌乱的目光，快速切向角落的阴影里。音效：人群嘈杂声、桌椅碰撞声（鼓点骤起）6-10s中景+冷色调【中景】江凡独自坐在角落的阴影里，一袭素衣，眉眼清俊，指尖捏着白瓷茶杯，茶水微微晃动。镜头给茶杯特写，映出他平静无波却藏着冷光的眼。音效：茶水轻晃声、背景人声逐渐压低（鼓点放缓，只剩心跳声）10-15s双人镜头+慢镜头【慢镜头】镜头拉回大堂中央，众人的目光齐刷刷射向人群后的许悠然——碧衣少女垂着头，脸色惨白如纸，听到父亲以亲情相逼时，她猛地抬头，眼中蓄满泪水，绝望又无助。【最后定格】江凡抬眸，目光落在她身上，眼底闪过一丝了然的叹息与冷意。台词（许悠然，颤抖哽咽）：爹...我嫁...我嫁还不行吗？音效：心碎般的弦乐声渐起，最后以一声轻响定格国风仙侠，偏水墨+古风写实结合，镜头节奏前紧后缓，用强烈对比制造戏剧张力。`

const guomanStyle = '3D国漫，国风仙侠，偏水墨+古风写实结合，镜头节奏前紧后缓，强烈戏剧张力'
const root = fileURLToPath(new URL('..', import.meta.url))

test('替嫁国漫 Seedance feed uses the proven single-line shot-text format', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: tijiaGuomanSource,
    style: guomanStyle,
    aspectRatio: '16:9',
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.equal(pack.title, '替嫁爆点 15s')
  assert.equal(pack.videoLines.length, 5)
  assert.deepEqual(pack.assets.filter((asset) => asset.kind === 'image').map((asset) => asset.title), [
    '许家大厅',
    '许怡宁',
    '许悠然',
    '江凡',
    '许正言',
    '三尺青锋'
  ])

  assert.match(markdown, /### 图片1｜许家大厅/u)
  assert.match(markdown, /许家大厅 = 图片1/u)
  assert.match(markdown, /^1 许家大厅 许怡宁 .*三尺青锋.*极特写.*我宁愿死，也不嫁给那个哑巴废物/mu)
  assert.match(markdown, /^3 许家大厅 许正言 .*三尺青锋.*扫向角落里的许悠然.*嫡女拒婚，全家竟逼庶女替嫁/mu)
  assert.match(markdown, /^5 许家大厅暗角 江凡 .*江凡始终平静.*眼底闪过一丝冷光.*这场戏，该我收场了/mu)
  assert.match(markdown, /本组 1-5 条为一个完整 15 秒视频段/u)
  assert.match(markdown, /3D国漫/u)
  assert.doesNotMatch(markdown, /青云宗玉牌|白瓷茶杯|茶杯|玉佩|茶案/u)
  assert.doesNotMatch(markdown, /16:9，参考图优先于文字|参考图优先于文字|每\s*5\s*条视频文本\s*=\s*15s/u)
  assert.match(markdown, /## 底部备注栏可复制\s+许家大厅=图片1  许怡宁=图片2  许悠然=图片3  江凡=图片4  许正言=图片5  三尺青锋=图片6\s*$/u)
  assert.doesNotMatch(markdown, /主要场景|含泪三视图|中景 \+ 平视或轻微低机位|不要配乐|心理悬疑|暴风雨|真人电影质感/u)
})

test('替嫁国漫 prop references keep only high-content decisive props', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: tijiaGuomanSource,
    style: guomanStyle,
    aspectRatio: '16:9',
    expandScript: false
  })
  const propAssets = pack.assets.filter((asset) => asset.id.startsWith('prop-'))

  assert.deepEqual(propAssets.map((asset) => asset.title), ['三尺青锋'])
  for (const asset of propAssets) {
    assert.match(asset.prompt, /只生成一个完整道具主体/u)
    assert.match(asset.prompt, /一张图里只出现这一件道具/u)
    assert.match(asset.prompt, /干净白色或浅灰背景/u)
    assert.match(asset.prompt, /不要人物、不要手持、不要场景摆拍/u)
    assert.doesNotMatch(asset.prompt, /三视图|多角度|拆解图|组合道具|旁侧道具展示|展示正面、侧面/u)
  }
})

test('替嫁国漫 Canvas pack exports only 3D guoman foundation assets', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-tijia-guoman-canvas-'))
  try {
    const contract = await createInputContract(parseArgs(['--aspect', '16:9', '--style', guomanStyle, tijiaGuomanSource]))
    const result = await exportCanvasPromptPack({ outDir: out, contract })
    assert.equal(existsSync(result.zipPath), true)

    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))
    assert.equal(manifest.packageType, 'manual_canvas_generation')
    assert.equal(manifest.target.style, guomanStyle)
    const byId = new Map(manifest.nodes.map((node) => [node.id, node]))

    for (const id of [
      'style-reference',
      'environment-ref-xu-hall',
      'character-ref-xuyining',
      'character-ref-xuyouran',
      'character-ref-jiangfan',
      'character-ref-xuzhengyan',
      'prop-ref-qingfeng-sword'
    ]) {
      assert.ok(byId.has(id), `${id} should exist`)
      assert.equal(byId.get(id).canvasType, 'image')
      assert.match(byId.get(id).prompt, /3D国漫/u)
    }

    assert.equal(byId.has('prop-ref-qingyun-token'), false)
    assert.equal(byId.has('prop-ref-white-teacup'), false)
    assert.doesNotMatch(byId.get('character-ref-xuyining').prompt, /青云宗玉牌|玉牌.*锚点/u)
    assert.doesNotMatch(byId.get('character-ref-jiangfan').prompt, /白瓷茶杯|茶杯.*锚点/u)
    assert.match(byId.get('environment-ref-xu-hall').prompt, /许家大厅/u)
    for (const id of ['prop-ref-qingfeng-sword']) {
      assert.match(byId.get(id).prompt, /只生成一个完整道具主体/u)
      assert.match(byId.get(id).prompt, /不要人物、不要手持、不要场景摆拍/u)
      assert.doesNotMatch(byId.get(id).prompt, /三视图|多角度|拆解图|组合道具/u)
    }
    assert.doesNotMatch(JSON.stringify(manifest), /青云宗玉牌|白瓷茶杯|茶案|prop-ref-qingyun-token|prop-ref-white-teacup/u)
    assert.doesNotMatch(JSON.stringify(manifest), /心理悬疑|暴风雨|liminal|倒计时|手机|真人电影质感|超写实真人/u)
    assert.equal(manifest.nodes.filter((node) => node.canvasType === 'video').length, 0)
    assert.equal(manifest.nodes.filter((node) => node.canvasType === 'image').length, 7)
    assert.equal(manifest.nodes.filter((node) => node.canvasType === 'text').length, 2)
    assert.equal(manifest.connections.length, 7)
    assert.ok(manifest.connections.some((connection) => connection.fromNodeId === 'style-bible' && connection.toNodeId === 'style-reference'))
    for (const id of [
      'environment-ref-xu-hall',
      'character-ref-xuyining',
      'character-ref-xuyouran',
      'character-ref-jiangfan',
      'character-ref-xuzhengyan',
      'prop-ref-qingfeng-sword'
    ]) {
      assert.ok(manifest.connections.some((connection) => connection.fromNodeId === 'style-reference' && connection.toNodeId === id), `${id} should connect to style reference`)
    }
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('seedance-pack CLI writes only Seedance feed and Canvas import assets', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-tijia-guoman-seedance-pack-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      'seedance-pack',
      '--out',
      out,
      '--aspect',
      '16:9',
      '--style',
      guomanStyle,
      tijiaGuomanSource
    ], { cwd: root, encoding: 'utf8' })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(join(out, 'seedance-all-reference-feed.md')), true)
    assert.equal(existsSync(join(out, 'canvas-project.zip')), true)
    assert.equal(existsSync(join(out, 'canvas-manifest.json')), true)
    assert.equal(existsSync(join(out, 'prompt-pack.md')), true)
    assert.equal(existsSync(join(out, 'README.md')), true)
    assert.equal(existsSync(join(out, 'deliverable.md')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    assert.match(result.stdout, /Seedance \+ Canvas pack ready/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
