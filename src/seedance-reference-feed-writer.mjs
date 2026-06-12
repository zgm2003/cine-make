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
