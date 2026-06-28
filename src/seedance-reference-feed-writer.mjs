function codeBlock(text) {
  return ['```text', text, '```'].join('\n')
}

function copyBlockAssetName(asset) {
  return String(asset.title ?? '')
    .replace(/\s*\/.*$/u, '')
    .trim()
}

function copyBlockAssetMatchNames(asset) {
  const title = copyBlockAssetName(asset)
  const stripped = title
    .replace(/(?:三视图|设定图|参考图|场景|内景|外景|单体道具|单体产品图)$/u, '')
    .trim()
  return [...new Set([title, stripped])].filter(Boolean)
}

function groupUsesAsset(group, asset) {
  const text = group.join('\n')
  return copyBlockAssetMatchNames(asset).some((name) => text.includes(name))
}

function copyBlockReferenceLine(pack, group = pack.videoLines) {
  const imageAssets = pack.assets.filter((asset) => asset.kind === 'image')
  if (!imageAssets.length) return '上传参考图：无'
  const usedAssets = imageAssets.filter((asset) => groupUsesAsset(group, asset))
  const references = usedAssets.length ? usedAssets : imageAssets
  return `上传参考图：${references.map((asset) => `${copyBlockAssetName(asset)} = ${asset.bindingLabel}`).join('；')}`
}

const genericVoiceLine = '音色：按本组必要对白匹配角色年龄、身份和情绪；没有对白的组不要新增旁白。必要对白只保留本组逐条文本里的短句。'

const nonDialogueSpeakerLabels = new Set([
  '音效',
  '环境音',
  '动作音效',
  '旁白',
  '镜头',
  '画面',
  '特效',
  '字幕',
  '配乐'
])

function normalizeSpeakerName(speaker) {
  return String(speaker ?? '')
    .replace(/^\d+\s*/u, '')
    .replace(/^(?:台词摘句|台词|对白|OS|内心OS|系统提示音)\s*[:：]\s*/u, '')
    .replace(/[（(](?:内心OS|OS|心声|旁白)[）)]/gu, '')
    .replace(/[“”"「」『』\s]/gu, '')
    .trim()
}

function extractDialogueSpeakers(line) {
  const text = String(line ?? '')
  const speakers = []
  const dialoguePattern = /(?:台词摘句|台词|对白|OS|内心OS)\s*[:：]\s*([^：:，。；；、\s]{1,12})\s*[:：]/gu
  let match
  while ((match = dialoguePattern.exec(text)) !== null) {
    speakers.push(match[1])
  }

  if (!speakers.length) {
    const directPattern = /(?:^|[\s，。；])([^：:，。；；、\s]{1,12})\s*[:：]/gu
    while ((match = directPattern.exec(text)) !== null) {
      speakers.push(match[1])
    }
  }

  return speakers
    .map(normalizeSpeakerName)
    .filter((speaker) => speaker && !nonDialogueSpeakerLabels.has(speaker))
}

function voiceAssetLineForGroup(pack, group) {
  const voiceAssetMap = new Map(Object.entries(pack.voiceAssetMap ?? {}))
  if (!voiceAssetMap.size) return ''

  const speakers = [...new Set(group.flatMap(extractDialogueSpeakers))]
  const mappings = speakers
    .map((speaker) => [speaker, voiceAssetMap.get(speaker)])
    .filter(([, asset]) => asset)
    .map(([speaker, asset]) => `${speaker}音色=${asset}`)

  return mappings.length ? `音色资产：${mappings.join('；')}。` : ''
}

function composeFiveLineCopyBlocks(pack) {
  const blocks = []
  const requirementLine = `统一要求：【不要字幕、不要配乐，只保留环境音、系统提示音、动作音效和必要对白】${pack.style}，${pack.aspectRatio}。`

  for (let start = 0; start < pack.videoLines.length; start += 5) {
    const group = pack.videoLines.slice(start, start + 5)
    const end = start + group.length
    const referenceLine = copyBlockReferenceLine(pack, group)
    const voiceAssetLine = voiceAssetLineForGroup(pack, group)
    blocks.push(`### 第${Math.floor(start / 5) + 1}组｜第${start + 1}-${end}条`)
    blocks.push('')
    blocks.push(...group.map((line, offset) => numberedLine(line, start + offset)))
    blocks.push('')
    blocks.push(referenceLine)
    blocks.push('')
    blocks.push(genericVoiceLine)
    if (voiceAssetLine) blocks.push(voiceAssetLine)
    blocks.push('')
    blocks.push(requirementLine)
    blocks.push('')
  }

  return blocks
}

function numberedLine(line, index) {
  return `${index + 1} ${line}`
}

export function composeSeedanceAllReferenceFeedMarkdown(pack) {
  return [
    `# Seedance 全能参考投喂包｜${pack.title}`,
    '',
    '> 用户实际只用两块：先用 GPT-image-2 生成参考图，再按每5条复制制作块投喂视频工具。',
    `> 画幅：${pack.aspectRatio}。风格：${pack.style}。`,
    ...(pack.warnings ?? []).map((warning) => `> ${warning}`),
    '',
    '---',
    '',
    '## GPT-image-2 参考图生成提示词',
    '',
    ...pack.assets.filter((asset) => asset.kind === 'image').flatMap((asset) => [
      `### ${asset.bindingLabel} = ${asset.title}`,
      '',
      codeBlock(asset.prompt),
      ''
    ]),
    '---',
    '',
    '## 每5条复制制作块',
    '',
    '> 每组直接复制本组 5 条视频文本、上传参考图、音色和统一要求。',
    '',
    ...composeFiveLineCopyBlocks(pack)
  ].join('\n')
}
