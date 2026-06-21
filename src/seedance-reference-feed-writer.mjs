import { formatXiaoyunqueCameraTagLines } from './xiaoyunque-camera-tags.mjs'

function codeBlock(text) {
  return ['```text', text, '```'].join('\n')
}

function assetBindingLine(asset) {
  return `${asset.title} = ${asset.bindingLabel}`
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
  '- 直接引号里的台词必须照抄原著：不改字、不压缩、不换称谓、不改标点。',
  '- 人名、宗门/势力、功法、境界、地点、道具和因果关系以原文为准；没有出现的设定不要补。',
  '- 可以把叙述转成可见动作，但不能改变事件顺序、人物动机、信息揭示顺序和章末钩子。',
  '- 需要删减时只删叙述信息，不删关键台词；删减必须不改变原著含义。'
]

const SHOT_LANGUAGE_RULES = [
  '- 单行格式固定：`序号 地点 角色 动作画面 主体/景别/机位/构图/光影 运镜 台词/音效`。',
  '- 一条只做一个主要动作；动作必须可见，不能写抽象情绪替代画面。',
  '- 主体、景别、机位、构图、光影、运镜都要服务本条剧情信息，不堆镜头术语。',
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
    '## 底部备注栏可复制',
    '',
    codeBlock([
      pack.bottomNote,
      pack.bottomConstraint ?? `【不要字幕、不要配乐，只保留环境音和必要对白】${pack.style}，${pack.aspectRatio}，参考图优先于文字。`
    ].filter(Boolean).join('\n'))
  ].join('\n')
}
