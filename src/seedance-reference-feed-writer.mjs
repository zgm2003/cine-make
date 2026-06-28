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

function copyBlockReferenceUsage(asset) {
  const title = copyBlockAssetName(asset)
  const rawTitle = String(asset.title ?? '')
  const id = String(asset.id ?? '')
  const searchable = `${id} ${title} ${rawTitle}`

  if (/群像|女修群|创作者群|首领群|众人/u.test(searchable)) return '群像参考'
  if (/creature|妖兽|异兽|灵兽|麒麟|虎王|坐骑/u.test(searchable)) {
    return /虎王|坐骑/u.test(searchable) ? '坐骑妖兽参考' : '异兽参考'
  }
  if (/scene|environment|场景|内景|外景|大殿|山门|石阶|雪山|地窖|院子|废墟|祠堂|楼道|客厅|大厅|高空飞行/u.test(searchable)) return '场景参考'
  if (/界面|主页|信息流|消息|私信|发布界面|拍摄发布|系统界面/u.test(searchable)) return '界面参考'
  if (/prop|手机|玉简|设计图|道具|储物袋|算盘|法器|青锋|剑/u.test(searchable)) return '道具参考'
  if (/character|人物|角色|三视图|造型|林夜|白清玄|道清|刘飞|许怡宁|许悠然|江凡|许正言|老者|壮汉|鬼财神|冥河/u.test(searchable)) return '人物参考'

  return '参考图'
}

function copyBlockReferenceLine(pack, group = pack.videoLines) {
  const imageAssets = pack.assets.filter((asset) => asset.kind === 'image')
  if (!imageAssets.length) return '上传参考图：无'
  const usedAssets = imageAssets.filter((asset) => groupUsesAsset(group, asset))
  const references = usedAssets.length ? usedAssets : imageAssets
  return `上传参考图：${references.map((asset) => `${copyBlockAssetName(asset)} = ${asset.bindingLabel}（${copyBlockReferenceUsage(asset)}）`).join('；')}`
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
