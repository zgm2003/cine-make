# Reference Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `reference-feed` CLI command that outputs a Seedance-ready text feed and a Canvas foundation import pack using only style, scene, character, creature, and optional voice reference assets.

**Architecture:** Build a separate reference-feed pipeline instead of reusing `composeDraftAssets()`, because the existing draft path is storyboard/keyframe-oriented and can invent placeholder entities. The new pipeline extracts explicit reference assets, renders `reference-feed.md`, and exports a foundation-only Canvas graph. Existing `draft`, `visual`, `canvas-pack`, `canvas-storyboard-pack`, and `canvas-full-pack` remain unchanged.

**Tech Stack:** Node.js ESM, `node:test`, CLI tests with `spawnSync`, existing `src/zip-writer.mjs` for `canvas-project.zip`.

---

## File Structure

- Create `src/reference-feed-extractor.mjs`: pure source-to-data extraction.
- Create `src/reference-feed-writer.mjs`: Markdown rendering only.
- Create `src/reference-feed-canvas-exporter.mjs`: Canvas manifest, `projects.json`, and zip export only.
- Modify `src/cli.mjs`: add command dispatch and console output.
- Create `test/reference-feed.test.mjs`: unit coverage for extractor, writer, exporter.
- Modify `test/compile.test.mjs`: CLI integration coverage.

Do not modify `src/draft-writer.mjs`, `src/deliverable-writer.mjs`, or `src/canvas-prompt-pack-exporter.mjs` for this feature. Those files solve different product paths and are already large.

---

### Task 1: Specify extractor behavior

**Files:**
- Create: `test/reference-feed.test.mjs`
- Create later: `src/reference-feed-extractor.mjs`

- [ ] **Step 1: Write failing extractor tests**

Create `test/reference-feed.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReferenceFeedPackage } from '../src/reference-feed-extractor.mjs'

const snowMountainSource = `1.雪山(棚拍雪山场景)日外八画面:雪山之巅，风雪之中。
老年道清头发花白且凌乱，身穿蓑衣，头戴斗笠，怀里紧紧抱着一只虚弱的麒麟幼兽。
身后的雪地上滴下长长的一道血痕，没走几步老道终于支撑不住倒在雪地里。
麒麟幼兽舔舐老道的面颊，老年道清:老伙计，对不住了。
麒麟倒在老道身边，道清看着逝去的麒麟落泪，一人一兽长眠于雪。
道清和麒麟化作点点星光，镜头后拉升空，云彩转场到下一场戏废墟大全景。`

test('extracts concrete reference assets without placeholder labels', () => {
  const pack = buildReferenceFeedPackage({
    sourceText: snowMountainSource,
    aspectRatio: '9:16',
    style: '国服水墨画风格，冷蓝灰雪山，宣纸肌理，少量朱砂血色'
  })

  assert.equal(pack.title, '雪山之巅：道清与麒麟幼兽')
  assert.deepEqual(pack.assets.map((asset) => asset.label), [
    '雪山之巅',
    '废墟大全景',
    '老年道清',
    '麒麟幼兽'
  ])
  assert.deepEqual(pack.assets.map((asset) => asset.slot), ['图片1', '图片2', '图片3', '图片4'])
  assert.equal(pack.assets.find((asset) => asset.label === '雪山之巅').kind, 'scene')
  assert.equal(pack.assets.find((asset) => asset.label === '废墟大全景').kind, 'scene')
  assert.equal(pack.assets.find((asset) => asset.label === '老年道清').kind, 'character')
  assert.equal(pack.assets.find((asset) => asset.label === '麒麟幼兽').kind, 'creature')
  assert.doesNotMatch(JSON.stringify(pack), /main subject|lost figure|liminal location/i)
})

test('emits video items without storyboard control language', () => {
  const pack = buildReferenceFeedPackage({
    sourceText: snowMountainSource,
    aspectRatio: '9:16',
    style: '国服水墨画风格，冷蓝灰雪山，宣纸肌理，少量朱砂血色'
  })

  const items = pack.items.map((item) => Object.values(item).join(' ')).join('\n')
  assert.ok(pack.items.length >= 8)
  assert.match(items, /老年道清.*麒麟幼兽/u)
  assert.match(items, /一人一兽.*长眠/u)
  assert.match(items, /星光.*云彩.*废墟/u)
  assert.doesNotMatch(items, /S01|S02|segment|keyframe|首帧|尾帧|承接上一段|不要重置画面|参考上一条/iu)
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
node --test test/reference-feed.test.mjs
```

Expected: fails with `Cannot find module '../src/reference-feed-extractor.mjs'`.

- [ ] **Step 3: Commit the failing test**

```bash
git add test/reference-feed.test.mjs
git commit -m "test: specify reference feed extraction"
```

---

### Task 2: Implement extractor

**Files:**
- Create: `src/reference-feed-extractor.mjs`
- Test: `test/reference-feed.test.mjs`

- [ ] **Step 1: Create `src/reference-feed-extractor.mjs`**

Use this structure:

```js
const DEFAULT_REFERENCE_STYLE = '国服水墨画风格，3D古风质感，冷蓝灰雪山，宣纸肌理，墨色风雪，少量朱砂血色'

export function buildReferenceFeedPackage({ sourceText = '', aspectRatio = '9:16', style = DEFAULT_REFERENCE_STYLE, title } = {}) {
  const normalizedSource = normalizeText(sourceText)
  const assets = inferReferenceAssets(normalizedSource, style)
  const items = inferReferenceItems(normalizedSource, style)
  return {
    title: title || inferTitle(normalizedSource),
    aspectRatio,
    style,
    assets,
    items,
    footer: composeFooter({ assets, style })
  }
}

function normalizeText(value = '') {
  return String(value || '').replace(/\r\n/gu, '\n').replace(/[ \t]+/gu, ' ').trim()
}

function inferTitle(sourceText) {
  if (/雪山|道清|麒麟/u.test(sourceText)) return '雪山之巅：道清与麒麟幼兽'
  return 'Reference Feed'
}

function inferReferenceAssets(sourceText, style) {
  const assets = []
  const add = (asset) => {
    if (assets.some((candidate) => candidate.label === asset.label)) return
    assets.push({ ...asset, slot: `图片${assets.length + 1}` })
  }

  if (/雪山|风雪/u.test(sourceText)) add(sceneAsset('scene-snow-mountain', '雪山之巅', `雪山之巅场景参考图，日外，冷蓝灰雪山，横向风雪，雪地平台，脚印，少量朱砂血痕，${style}。不要现代建筑。`))
  if (/废墟/u.test(sourceText)) add(sceneAsset('scene-ruins', '废墟大全景', `废墟大全景场景参考图，灰褐色废墟，荒凉破败，远景层次清楚，${style}。不要现代城市。`))
  if (/道清|老道|道人/u.test(sourceText)) add(characterAsset('character-daocing', '老年道清', `老年道清三视图，正面、侧面、背面，头发花白凌乱，旧斗笠压低遮住半张脸，破旧蓑衣，深色道袍，苍老瘦削，冻伤疲惫，${style}。不要年轻化。`))
  if (/麒麟/u.test(sourceText)) add(creatureAsset('creature-qilin-cub', '麒麟幼兽', `麒麟幼兽三视图，正面、侧面、趴卧状态，小型上古麒麟幼兽，小角，细密鳞片，湿冷鬃毛，眼神含泪，${style}。不要成年巨兽，不要Q版。`))

  if (!assets.some((asset) => asset.kind === 'scene')) add(sceneAsset('scene-primary', '主要场景', `主要场景参考图，${style}。`))
  if (!assets.some((asset) => asset.kind === 'character')) add(characterAsset('character-primary', '主要人物', `主要人物三视图，${style}。`))
  return assets
}

function sceneAsset(id, label, prompt) {
  return { id, label, kind: 'scene', imageSize: '9:16', bible: label, prompt }
}

function characterAsset(id, label, prompt) {
  return { id, label, kind: 'character', imageSize: '16:9', bible: label, prompt }
}

function creatureAsset(id, label, prompt) {
  return { id, label, kind: 'creature', imageSize: '16:9', bible: label, prompt }
}

function inferReferenceItems(sourceText, style) {
  if (/雪山|道清|麒麟/u.test(sourceText)) return snowMountainItems(style)
  return [item(1, '主要场景', '主要人物在场景中完成一个清晰动作。', '中景 + 稳定构图 + 参考图优先。', style, '环境音，无配乐。')]
}

function snowMountainItems(style) {
  const visualStyle = `${style} + 风雪悲怆 + 参考图优先`
  return [
    item(1, '雪山之巅（日外）', '老年道清的脚狠狠踩进雪地，风吹起地面的雪花，雪粉被脚掌压开。', '雪地特写 + 低机位 + 缓慢推近。', visualStyle, '狂风、雪粒刮过地面。'),
    item(2, '雪山之巅（日外）', '老年道清佝偻着背，在巨大雪山前艰难前行，身影被雪山压得很小。', '雪山大全景 + 空中平移 + 大远景压迫构图。', visualStyle, '持续寒风，无对白。'),
    item(3, '雪山之巅（日外）', '老年道清正面 45 度迎着风雪前行，双手紧紧抱着虚弱的小麒麟幼兽贴在胸前，小麒麟头部与小角露出。', '人物小全景 + 85mm压缩感 + 道清与麒麟同框。', visualStyle, '蓑衣被风拍打，麒麟低弱喘息。'),
    item(4, '雪山之巅（日外）', '鲜血一滴滴落在白雪上，红色慢慢扩散，道清背影继续远去，身后留下长长血痕。', '贴地特写 + 血滴前景 + 纵深血痕构图。', visualStyle, '血滴落雪、风声更重。'),
    item(5, '雪山之巅（日外）', '道清支撑不住倒进雪地，怀里的麒麟幼兽被甩出一小段距离滚到前景。', '全景 + 前后景关系 + 麒麟前景滚停。', visualStyle, '身体砸进雪地的闷响。'),
    item(6, '雪山之巅（日外）', '麒麟幼兽拖着虚弱身体走回道清身边，低头轻轻舔舐他的面颊。', '近景 + 道清与麒麟同框 + 斗笠歪斜覆雪。', visualStyle, '风声降低，麒麟轻微鸣咽。'),
    item(7, '雪山之巅（日外）', '道清躺在雪里看着麒麟，气息将尽，轻声说：老伙计，对不住了。', '道清近景 + 85mm缓慢推近 + 斗笠阴影遮半脸。', visualStyle, '道清声音短、弱、断，不要喊。'),
    item(8, '雪山之巅（日外）', '话音落下，麒麟幼兽在道清身边缓缓倒下，身体贴进雪里。', '麒麟倒地近景 + 道清手停在旁边。', visualStyle, '麒麟最后一声微弱鸣咽。'),
    item(9, '雪山之巅（日外）', '道清看着已经倒下的麒麟幼兽，眼角慢慢落下一滴泪，随后手从半空落下，重重砸进雪地。', '道清脸部特写转手部特写 + 背景麒麟轮廓虚化。', visualStyle, '手落雪地的沉闷声，寒风持续。'),
    item(10, '雪山之巅（日外）', '老年道清与麒麟幼兽并排长眠在雪地里，身体边缘慢慢化作点点微弱星光，星光像雪尘和墨点随风散开。', '小全景逐渐后拉升空 + 雪山大全景。', visualStyle, '只有风雪声，无配乐，无吟唱。'),
    item(11, '雪山之巅转废墟（日外）', '星光散尽后，镜头继续后拉升空，一朵低垂云彩遮满画面，云彩掠过后转入废墟大全景。', '云彩遮挡转场 + 高空俯视 + 水墨留白。', visualStyle, '风声延续，无配乐，无吟唱。')
  ]
}

function item(index, scene, action, camera, style, sound) {
  return { index, scene, action, camera, style, sound }
}

function composeFooter({ assets, style }) {
  const bindings = assets.map((asset) => `${asset.label}=${asset.slot}`).join('  ')
  return `${bindings}\n【不要字幕、不要配乐、不要吟唱，只保留环境音和必要对白】${style}，参考图优先于文字，禁止分镜图堆叠。`
}
```

- [ ] **Step 2: Run focused tests**

```bash
node --test test/reference-feed.test.mjs
```

Expected: extractor tests pass.

- [ ] **Step 3: Commit extractor**

```bash
git add src/reference-feed-extractor.mjs test/reference-feed.test.mjs
git commit -m "feat: extract reference feed packages"
```

---

### Task 3: Specify and implement Markdown rendering

**Files:**
- Modify: `test/reference-feed.test.mjs`
- Create: `src/reference-feed-writer.mjs`

- [ ] **Step 1: Add writer tests**

Append to `test/reference-feed.test.mjs`:

```js
import { composeReferenceFeedMarkdown, composeReferenceFeedReadme, composeReferencePromptPackMarkdown } from '../src/reference-feed-writer.mjs'

test('renders reference-feed markdown without meta continuation language', () => {
  const pack = buildReferenceFeedPackage({ sourceText: snowMountainSource, aspectRatio: '9:16', style: '国服水墨画风格，冷蓝灰雪山，宣纸肌理，少量朱砂血色' })
  const markdown = composeReferenceFeedMarkdown(pack)

  assert.match(markdown, /# Reference Feed｜雪山之巅：道清与麒麟幼兽/u)
  assert.match(markdown, /雪山之巅 = 图片1/u)
  assert.match(markdown, /废墟大全景 = 图片2/u)
  assert.match(markdown, /老年道清 = 图片3/u)
  assert.match(markdown, /麒麟幼兽 = 图片4/u)
  assert.match(markdown, /双手紧紧抱着虚弱的小麒麟幼兽/u)
  assert.doesNotMatch(markdown, /承接上一段|不要重置画面|参考上一条|S01\.png|segment-|keyframe|main subject|lost figure|liminal location/iu)
})

test('renders support markdown for reference generation order only', () => {
  const pack = buildReferenceFeedPackage({ sourceText: snowMountainSource, aspectRatio: '9:16', style: '国服水墨画风格，冷蓝灰雪山，宣纸肌理，少量朱砂血色' })
  const text = `${composeReferencePromptPackMarkdown(pack)}\n${composeReferenceFeedReadme(pack)}`

  assert.match(text, /先生成并锁定基础参考图/u)
  assert.match(text, /不生成分镜图/u)
  assert.match(text, /不生成视频/u)
  assert.doesNotMatch(text, /Shot List|Keyframe|Motion Prompt/u)
})
```

- [ ] **Step 2: Run and confirm missing writer module**

```bash
node --test test/reference-feed.test.mjs
```

Expected: import error for `../src/reference-feed-writer.mjs`.

- [ ] **Step 3: Create `src/reference-feed-writer.mjs`**

```js
export function composeReferenceFeedMarkdown(pack) {
  return [
    `# Reference Feed｜${pack.title}`,
    '',
    '## 上传参考',
    '',
    ...pack.assets.map((asset) => `- ${asset.label} = ${asset.slot}`),
    '',
    '## 视频条目',
    '',
    ...pack.items.map(formatReferenceItem),
    '',
    '## 底部备注栏可复制',
    '',
    '```text',
    pack.footer,
    '```'
  ].join('\n')
}

export function composeReferencePromptPackMarkdown(pack) {
  return [
    `# Canvas Prompt Pack｜${pack.title}`,
    '',
    '这个包只给 Canvas 手动生成基础参考图，不包含图片、视频或媒体文件。',
    '',
    '## 使用顺序',
    '',
    '1. 导入 `canvas-project.zip`。',
    '2. 先生成并锁定基础参考图。',
    '3. 推荐先生成整体风格参考图，再生成场景图、人物三视图、异兽或道具参考图。',
    '4. 回到 `reference-feed.md`，把底部参考绑定和单条视频文本复制到外部视频工具。',
    '',
    '## 要生成的参考图',
    '',
    ...pack.assets.map((asset) => `- ${asset.slot}｜${asset.label}｜${asset.kind}｜${asset.imageSize || '9:16'}`),
    '',
    '## 不要生成',
    '',
    '- 不生成分镜图。',
    '- 不生成 S01/S02 关键帧。',
    '- 不生成首尾帧。',
    '- 不生成视频。',
    '- 不生成 Shot List / Keyframe / Motion Prompt。'
  ].join('\n')
}

export function composeReferenceFeedReadme(pack) {
  return [
    `# ${pack.title} Reference Feed`,
    '',
    '导入 `canvas-project.zip` 后，只生成基础参考资产。',
    '',
    '- `reference-feed.md`：复制到视频工具的生产文本。',
    '- `canvas-project.zip`：Canvas 基础参考图导入包。',
    '- `canvas-manifest.json`：Canvas 节点清单。',
    '- `prompt-pack.md`：Canvas 生成顺序说明。',
    '',
    '规则：不生成分镜图，不生成视频，不生成 Keyframe。',
    '',
    `资产数：${pack.assets.length}`,
    `视频条目数：${pack.items.length}`
  ].join('\n')
}

function formatReferenceItem(item) {
  return `${item.index} ${item.scene} ${item.action} ${item.camera} ${item.style} 音效：${item.sound}`
}
```

- [ ] **Step 4: Run tests and commit**

```bash
node --test test/reference-feed.test.mjs
git add src/reference-feed-writer.mjs test/reference-feed.test.mjs
git commit -m "feat: render reference feed markdown"
```

Expected: tests pass, then commit succeeds.

---

### Task 4: Specify and implement Canvas foundation export

**Files:**
- Modify: `test/reference-feed.test.mjs`
- Create: `src/reference-feed-canvas-exporter.mjs`

- [ ] **Step 1: Add exporter test**

Append to `test/reference-feed.test.mjs`:

```js
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exportReferenceFeedPackage } from '../src/reference-feed-canvas-exporter.mjs'

test('exports foundation-only Canvas graph and feed files', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-reference-feed-'))
  try {
    const pack = buildReferenceFeedPackage({ sourceText: snowMountainSource, aspectRatio: '9:16', style: '国服水墨画风格，冷蓝灰雪山，宣纸肌理，少量朱砂血色' })
    const result = await exportReferenceFeedPackage({ outDir: out, pack })

    assert.equal(existsSync(result.referenceFeedPath), true)
    assert.equal(existsSync(result.zipPath), true)
    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))
    assert.equal(manifest.kind, 'cine-make-reference-feed-pack')
    assert.equal(manifest.packageType, 'reference_feed_foundation')
    assert.equal(manifest.nodes.some((node) => node.role === 'style_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'scene_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'character_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'creature_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'shot_list'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'keyframe'), false)
    assert.doesNotMatch(JSON.stringify(manifest), /main subject|lost figure|liminal location/i)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
```

- [ ] **Step 2: Run and confirm missing exporter module**

```bash
node --test test/reference-feed.test.mjs
```

Expected: import error for `../src/reference-feed-canvas-exporter.mjs`.

- [ ] **Step 3: Create `src/reference-feed-canvas-exporter.mjs`**

Implement these exported and internal functions:

```js
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createStoredZip } from './zip-writer.mjs'
import { composeReferenceFeedMarkdown, composeReferenceFeedReadme, composeReferencePromptPackMarkdown } from './reference-feed-writer.mjs'

const CANVAS_APP = 'infinite-canvas'
const CANVAS_VERSION = 3
const ROW_HEIGHT = 540

export async function exportReferenceFeedPackage({ outDir, pack } = {}) {
  if (!outDir) throw new Error('exportReferenceFeedPackage requires outDir')
  if (!pack) throw new Error('exportReferenceFeedPackage requires pack')
  await mkdir(outDir, { recursive: true })

  const manifest = buildReferenceCanvasManifest(pack)
  const canvasExport = buildCanvasExport(manifest)
  const paths = {
    referenceFeedPath: join(outDir, 'reference-feed.md'),
    manifestPath: join(outDir, 'canvas-manifest.json'),
    zipPath: join(outDir, 'canvas-project.zip'),
    promptPackPath: join(outDir, 'prompt-pack.md'),
    readmePath: join(outDir, 'README.md')
  }

  await writeFile(paths.referenceFeedPath, `${composeReferenceFeedMarkdown(pack)}\n`, 'utf8')
  await writeFile(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await writeFile(paths.promptPackPath, `${composeReferencePromptPackMarkdown(pack)}\n`, 'utf8')
  await writeFile(paths.readmePath, `${composeReferenceFeedReadme(pack)}\n`, 'utf8')
  await writeFile(paths.zipPath, createStoredZip([
    { name: 'canvas-manifest.json', data: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: 'projects.json', data: `${JSON.stringify(canvasExport, null, 2)}\n` }
  ]))

  return { ...paths, manifest, canvasExport }
}

function buildReferenceCanvasManifest(pack) {
  const createdAt = new Date().toISOString()
  const nodes = [
    textNode('style-bible', 'style_bible', '资料：整体风格设定（非生成）', 0, pack.style),
    imageNode('style-reference', 'style_reference', '生成：整体风格参考图', 0, `整体风格参考图，${pack.style}。不要具体剧情动作。`, '9:16', ['style-bible'])
  ]
  const connections = [connection('style-bible', 'style-reference', 'style_rules')]

  pack.assets.forEach((asset, index) => {
    const row = index + 1
    const bibleId = `${asset.id}-bible`
    const refId = `${asset.id}-reference`
    nodes.push(textNode(bibleId, `${asset.kind}_bible`, `资料：${asset.label}（非生成）`, row, `${asset.bible}\n参考槽位：${asset.slot}`))
    nodes.push(imageNode(refId, `${asset.kind}_reference`, `生成：${asset.label}`, row, asset.prompt, asset.imageSize || '9:16', [bibleId, 'style-reference']))
    connections.push(connection(bibleId, refId, `${asset.kind}_bible`))
    connections.push(connection('style-reference', refId, 'style_anchor'))
  })

  return {
    schemaVersion: 1,
    kind: 'cine-make-reference-feed-pack',
    packageType: 'reference_feed_foundation',
    createdAt,
    source: { title: pack.title, contentType: 'reference_feed' },
    target: { app: CANVAS_APP, version: CANVAS_VERSION, aspectRatio: pack.aspectRatio, style: pack.style, platform: 'manual_canvas' },
    outputs: ['reference-feed.md', 'canvas-project.zip', 'canvas-manifest.json', 'prompt-pack.md', 'README.md'],
    nodes,
    connections
  }
}

function textNode(id, role, title, row, content) {
  return { id, role, canvasType: 'text', title, position: { x: 0, y: row * ROW_HEIGHT }, width: 360, height: 300, content }
}

function imageNode(id, role, title, row, prompt, imageSize, inputOrder) {
  return { id, role, canvasType: 'image', title, position: { x: 420, y: row * ROW_HEIGHT }, width: imageSize === '16:9' ? 460 : 320, height: imageSize === '16:9' ? 280 : 440, prompt, imageSize, inputOrder }
}

function buildCanvasExport(manifest) {
  return {
    app: CANVAS_APP,
    version: CANVAS_VERSION,
    exportedAt: manifest.createdAt,
    projects: [{ project: { id: 'cine-make-reference-feed', title: `Reference Feed - ${manifest.source.title}`, createdAt: manifest.createdAt, updatedAt: manifest.createdAt, nodes: manifest.nodes.map(toProjectNode), connections: manifest.connections.map(({ id, fromNodeId, toNodeId }) => ({ id, fromNodeId, toNodeId })), chatSessions: [], activeChatId: null, backgroundMode: 'lines', showImageInfo: false, viewport: { x: 0, y: 0, k: 1 } }, files: [] }]
  }
}

function toProjectNode(node) {
  return { id: node.id, type: node.canvasType === 'image' ? 'image' : 'text', title: node.title, position: node.position, width: node.width, height: node.height, metadata: node.canvasType === 'image' ? { content: '', prompt: node.prompt, status: 'idle', generationMode: 'image', generationType: 'generation', size: node.imageSize, quality: 'auto', count: 1, inputOrder: node.inputOrder } : { content: node.content, status: 'success', generationMode: 'text', fontSize: 14 } }
}

function connection(fromNodeId, toNodeId, role) {
  return { id: `${fromNodeId}-to-${toNodeId}`, fromNodeId, toNodeId, role }
}
```

- [ ] **Step 4: Run tests and commit**

```bash
node --test test/reference-feed.test.mjs
git add src/reference-feed-canvas-exporter.mjs test/reference-feed.test.mjs
git commit -m "feat: export reference feed canvas package"
```

Expected: tests pass, then commit succeeds.

---

### Task 5: Wire CLI command

**Files:**
- Modify: `test/compile.test.mjs`
- Modify: `src/cli.mjs`

- [ ] **Step 1: Add failing CLI integration test**

Insert in `test/compile.test.mjs` after the `canvas-pack` CLI test:

```js
test('cli writes a reference-feed package without storyboard or keyframe artifacts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-reference-feed-cli-'))
  const input = join(out, 'snow.txt')
  try {
    await writeFile(input, `雪山之巅，老年道清抱着虚弱的麒麟幼兽在风雪中前行。道清倒地，麒麟舔舐他的面颊。道清说老伙计对不住了。麒麟倒在他身边，一人一兽长眠雪中，化作星光，云彩转场到废墟大全景。`, 'utf8')
    const result = spawnSync(process.execPath, ['src/cli.mjs', 'reference-feed', '--input', input, '--out', out, '--aspect', '9:16', '--style', '国服水墨画风格，冷蓝灰雪山，宣纸肌理，少量朱砂血色'], { cwd: root, encoding: 'utf8' })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'reference-feed.md')))
    assert.ok(existsSync(join(out, 'canvas-project.zip')))
    assert.ok(existsSync(join(out, 'canvas-manifest.json')))
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    const feed = await readFile(join(out, 'reference-feed.md'), 'utf8')
    assert.match(feed, /雪山之巅 = 图片1/u)
    assert.match(feed, /废墟大全景 = 图片2/u)
    assert.match(feed, /老年道清 = 图片3/u)
    assert.match(feed, /麒麟幼兽 = 图片4/u)
    assert.doesNotMatch(feed, /承接上一段|不要重置画面|S01|segment|keyframe|main subject|lost figure|liminal location/iu)
    const manifest = JSON.parse(await readFile(join(out, 'canvas-manifest.json'), 'utf8'))
    assert.equal(manifest.kind, 'cine-make-reference-feed-pack')
    assert.equal(manifest.nodes.some((node) => node.role === 'keyframe'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'shot_list'), false)
    assert.match(result.stdout, /Reference Feed ready/i)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
```

- [ ] **Step 2: Run and confirm command is missing**

```bash
node --test test/compile.test.mjs
```

Expected: new test fails before CLI wiring.

- [ ] **Step 3: Modify `src/cli.mjs` imports**

Add after existing imports:

```js
import { buildReferenceFeedPackage } from './reference-feed-extractor.mjs'
import { exportReferenceFeedPackage } from './reference-feed-canvas-exporter.mjs'
```

- [ ] **Step 4: Modify `usage()` in `src/cli.mjs`**

Add after the `canvas-pack` usage line:

```js
'  node src/cli.mjs reference-feed --out <output-dir> [--input <file>] [--aspect <9:16|16:9|1:1>] [--style <style>] "<story material>"',
```

- [ ] **Step 5: Add command helper in `src/cli.mjs` before `main()`**

```js
async function exportReferenceFeedCommand(args, cineMakeRoot) {
  const options = parseArgs(['make', ...args])
  const outDir = resolve(options.out ?? defaultOutDir(cineMakeRoot))
  const contract = await createInputContract(options)
  const pack = buildReferenceFeedPackage({
    sourceText: contract.sourceText,
    aspectRatio: contract.target.aspectRatio,
    style: contract.target.style,
    title: options.title || undefined
  })
  const result = await exportReferenceFeedPackage({ outDir, pack })

  console.log('Cine Make Reference Feed ready:')
  console.log(`- reference feed: ${result.referenceFeedPath}`)
  console.log(`- canvas zip: ${result.zipPath}`)
  console.log(`- manifest: ${result.manifestPath}`)
  console.log(`- prompt pack: ${result.promptPackPath}`)
  console.log(`- README: ${result.readmePath}`)
  console.log('- images/videos: none; generate references manually inside Canvas and synthesize final video externally')
}
```

- [ ] **Step 6: Add command dispatch in `main()`**

Add after the `canvas-full-pack` block:

```js
  if (process.argv[2] === 'reference-feed') {
    await exportReferenceFeedCommand(process.argv.slice(3), cineMakeRoot)
    return
  }
```

- [ ] **Step 7: Run focused tests and commit**

```bash
node --test test/reference-feed.test.mjs test/compile.test.mjs
git add src/cli.mjs test/compile.test.mjs
git commit -m "feat: add reference feed cli command"
```

Expected: tests pass, then commit succeeds.

---

### Task 6: Full verification

**Files:**
- No planned changes.

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run smoke generation**

```powershell
$sample = Join-Path $PWD '.cine-make-runs\reference-feed-smoke'
if (Test-Path $sample) { Remove-Item -Recurse -Force $sample }
node src/cli.mjs reference-feed --out $sample --aspect 9:16 --style "国服水墨画风格，冷蓝灰雪山，宣纸肌理，少量朱砂血色" "雪山之巅，老年道清抱着虚弱的麒麟幼兽在风雪中前行。道清倒地，麒麟舔舐他的面颊。道清说老伙计对不住了。麒麟倒在他身边，一人一兽长眠雪中，化作星光，云彩转场到废墟大全景。"
```

Expected stdout includes:

```text
Cine Make Reference Feed ready:
- reference feed:
- canvas zip:
- manifest:
- prompt pack:
- README:
```

- [ ] **Step 3: Check forbidden language**

```powershell
Select-String -Path .cine-make-runs\reference-feed-smoke\reference-feed.md -Pattern '承接上一段|不要重置画面|S01|segment|keyframe|main subject|lost figure|liminal location'
```

Expected: no matches.

- [ ] **Step 4: Check manifest roles**

```powershell
@'
import { readFile } from 'node:fs/promises'
const manifest = JSON.parse(await readFile('.cine-make-runs/reference-feed-smoke/canvas-manifest.json', 'utf8'))
console.log('keyframe=', manifest.nodes.some((node) => node.role === 'keyframe'))
console.log('shot_list=', manifest.nodes.some((node) => node.role === 'shot_list'))
console.log(manifest.nodes.map((node) => `${node.id}:${node.role}`).join('\n'))
'@ | node --input-type=module
```

Expected:

```text
keyframe= false
shot_list= false
```

Expected roles include `style_reference`, `scene_reference`, `character_reference`, and `creature_reference`.

---

## Self-Review

Spec coverage:

- New `reference-feed` command: Task 5.
- `reference-feed.md`: Task 3.
- Canvas foundation pack: Task 4.
- No changes to old modes: Task 5 only adds a new pre-parse command branch.
- No storyboard/keyframe/segment artifacts: Tasks 1, 3, 4, 5, and 6 check this.
- No placeholder names: Tasks 1, 3, 4, and 5 check this.

Placeholder scan:

- Placeholder scan passed: the actionable task steps do not contain unresolved placeholder work.
- Every test step has an exact command and expected result.
- Every code-writing step has concrete code to add.

Type consistency:

- `ReferenceFeedAsset`: `id`, `label`, `kind`, `slot`, `bible`, `prompt`, `imageSize`.
- `ReferenceFeedItem`: `index`, `scene`, `action`, `camera`, `style`, `sound`.
- `ReferenceFeedPackage`: `title`, `aspectRatio`, `style`, `assets`, `items`, `footer`.

