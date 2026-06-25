import { formatXiaoyunqueCameraTagLines } from './xiaoyunque-camera-tags.mjs'

function codeBlock(text) {
  return ['```text', text, '```'].join('\n')
}

function assetBindingLine(asset) {
  return `${asset.title} = ${asset.bindingLabel}`
}

function copyBlockAssetName(asset) {
  return String(asset.title ?? '')
    .replace(/\s*\/.*$/u, '')
    .replace(/三视图$/u, '')
    .trim()
}

function copyBlockReferenceLine(pack) {
  const imageAssets = pack.assets.filter((asset) => asset.kind === 'image')
  if (!imageAssets.length) return '上传参考图：无'
  return `上传参考图：${imageAssets.map((asset) => `${copyBlockAssetName(asset)}=${asset.bindingLabel}`).join('；')}`
}

function composeFiveLineCopyBlocks(pack) {
  const blocks = []
  const referenceLine = copyBlockReferenceLine(pack)
  const voiceLine = '音色：按本组必要对白匹配角色年龄、身份和情绪；没有对白的组不要新增旁白。必要对白只保留本组逐条文本里的短句。'
  const requirementLine = `统一要求：【不要字幕、不要配乐，只保留环境音、系统提示音、动作音效和必要对白】${pack.style}，${pack.aspectRatio}。`

  for (let start = 0; start < pack.videoLines.length; start += 5) {
    const group = pack.videoLines.slice(start, start + 5)
    const end = start + group.length
    blocks.push(`### 第${Math.floor(start / 5) + 1}组｜第${start + 1}-${end}条`)
    blocks.push('')
    blocks.push(...group.map((line, offset) => numberedLine(line, start + offset)))
    blocks.push('')
    blocks.push(referenceLine)
    blocks.push('')
    blocks.push(voiceLine)
    blocks.push('')
    blocks.push(requirementLine)
    blocks.push('')
  }

  return blocks
}

function numberedLine(line, index) {
  return `${index + 1} ${line}`
}

function isTijiaPack(pack) {
  return pack.title === '替嫁爆点 15s'
}

function compactAssetPromptLine(asset) {
  return [`### ${asset.bindingLabel}｜${asset.title}`, asset.prompt, '']
}

const ORIGINAL_FIDELITY_RULES = [
  '- 原著优先级最高的是人物动机、事件因果、关键信息、章节钩子和爆点台词。',
  '- 直接引号里的关键台词优先照抄原著；长台词为了视频呼吸可以摘取原文核心短句或轻微顺口改造。',
  '- 人名、宗门/势力、功法、境界、地点、道具和因果关系以原文为准；没有出现的设定不要补。',
  '- 可以把叙述转成可见动作，但不能改变事件顺序、人物动机、信息揭示顺序和章末钩子。',
  '- 需要删减时优先删重复解释、低价值修饰和旁白性心理活动；删减必须不改变原著含义。'
]

const SHOT_LANGUAGE_RULES = [
  '- 单行格式固定：`序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`。',
  '- 一条只做一个主要动作；动作必须可见，不能写抽象情绪替代画面。',
  '- 每 5 条约 15 秒要有呼吸感：起、压、爆、冷、落；不要把整段长台词硬塞进一条。',
  '- 每个 15 秒段落核心对白通常只保留 2-3 句短句；其余信息用动作、停顿、表情和声音补回。',
  '- 主体、景别、机位、构图、光影、运镜都要服务本条剧情信息，不堆镜头术语。',
  '- 所有视频文本都尽量用“画面上方/下方/左侧/右侧/远处/近处/居中/占画面多少”描述位置，不用“前景/后景/前后景关系/双主体”等容易让视频模型误读的电影术语。',
  '- 有对白的条目必须以说话者为单人主镜头，清楚写嘴型、眼神、手势和停顿；不要写“前景/后景/受声者反应/双主体同框”这类视频模型难理解的空间调度。',
  '- 运镜字段优先使用“小云雀运镜标签库”的原始标签；可以在标签后用括号补充速度/情绪，例如：`镜头前推（缓慢靠近）`。',
  '- 无字幕、无配乐；只保留环境音、动作音效和必要对白。',
  '- 威胁声、神识传音、旁白要标明声源和质感；不能把角色对白误写成普通解说。'
]

function xiaoyunqueCameraTagSection() {
  return [
    '## 小云雀运镜标签库',
    '',
    '使用方式：运镜字段先写下列原始标签，再用括号补充速度、幅度或情绪；不要自造同义词替代标签。',
    '',
    ...formatXiaoyunqueCameraTagLines(),
    ''
  ]
}

function composeTijiaFeedMarkdown(pack) {
  return [
    `# Seedance 全能参考投喂包｜${pack.title}`,
    '',
    '说明：本组 1-5 条为一个完整 15 秒视频段。单行格式：序号 + 地点 + 角色 + 动作画面 + 镜头/构图/光影 + 运镜 + 台词/音效。',
    '',
    '## GPT-image-2 参考图生成提示词',
    '',
    ...pack.assets.filter((asset) => asset.kind === 'image').flatMap(compactAssetPromptLine),
    '## 参考资产绑定',
    '',
    ...pack.assets.filter((asset) => asset.kind === 'image').map(assetBindingLine),
    '',
    '## 全局负面约束',
    '',
    pack.globalNegative,
    '',
    ...xiaoyunqueCameraTagSection(),
    '## 逐条视频文本',
    '',
    ...pack.videoLines.map((line, index) => numberedLine(line, index)),
    '## 底部备注栏可复制',
    '',
    [pack.bottomNote, pack.bottomConstraint].filter(Boolean).join('\n')
  ].join('\n')
}

export function composeSeedanceAllReferenceFeedMarkdown(pack) {
  if (isTijiaPack(pack)) return composeTijiaFeedMarkdown(pack)

  return [
    `# Seedance 全能参考投喂包｜${pack.title}`,
    '',
    `> 画幅：${pack.aspectRatio}。只用全局参考图 / 音频和逐条视频文本。`,
    '> 数据结构只有两层：`参考资产` + `逐条视频文本`。每条文本只描述本条画面本身。',
    '',
    '---',
    '',
    '## 原著守则',
    '',
    ...ORIGINAL_FIDELITY_RULES,
    '',
    '## 镜头语言规则',
    '',
    ...SHOT_LANGUAGE_RULES,
    '',
    ...xiaoyunqueCameraTagSection(),
    '---',
    '',
    '## GPT-image-2 参考图生成提示词',
    '',
    ...pack.assets.filter((asset) => asset.kind === 'image').flatMap((asset) => [
      `### ${asset.bindingLabel}｜${asset.title}`,
      '',
      codeBlock(asset.prompt),
      ''
    ]),
    '---',
    '',
    '## 参考资产绑定',
    '',
    ...pack.assets.map((asset) => `- ${assetBindingLine(asset)}`),
    '',
    ...pack.assets.flatMap((asset) => [
      `### ${asset.bindingLabel}｜${asset.title}`,
      '',
      codeBlock(asset.prompt),
      ''
    ]),
    '---',
    '',
    '## 全局负面约束',
    '',
    codeBlock(pack.globalNegative),
    '',
    '---',
    '',
    '## 逐条视频文本',
    '',
    ...pack.videoLines.map((line, index) => numberedLine(line, index)),
    '---',
    '',
    '## 每5条复制制作块',
    '',
    '> 使用方法：每组直接复制本组 5 条视频文本、上传参考图、音色和统一要求。',
    '',
    ...composeFiveLineCopyBlocks(pack),
    '---',
    '',
    '## 底部备注栏可复制',
    '',
    codeBlock([
      pack.bottomNote,
      pack.bottomConstraint ?? `【不要字幕、不要配乐，只保留环境音和必要对白】${pack.style}，${pack.aspectRatio}，参考图优先于文字。`
    ].filter(Boolean).join('\n'))
  ].join('\n')
}
