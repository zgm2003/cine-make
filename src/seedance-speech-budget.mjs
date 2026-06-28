const HAN_CHARACTER = /\p{Script=Han}/gu
const FIELD_PATTERN = /(台词摘句|台词|旁白|系统提示|内心OS|OS|os|[\p{Script=Han}]{2,6}(?:（[^）]{0,24}）)?)[：:]([^；;【\n]+)/gu
const NON_SPEECH_LABEL = /音效|环境音|声音|上传|参考|要求|主体|景别|机位|构图|光影|运镜|镜头|动作|画面/u
const EXPLICIT_SPEECH_LABEL = /台词|旁白|系统提示|内心OS|OS|os/u

function cleanSpeechText(value) {
  return String(value ?? '')
    .replace(/^[^“"「『]{1,24}[“"「『]/u, '')
    .replace(/^[“"「『]+/u, '')
    .replace(/[”"」』]+$/u, '')
    .replace(/\s+/gu, '')
    .trim()
}

function looksLikeShotDescription(value) {
  const text = String(value ?? '').trim()
  return /^主体/u.test(text) || /\/(?:中景|近景|特写|全景|远景|平视|低机位|高机位)/u.test(text) || /(?:固定镜头|镜头前推|跟随拍摄|环境音)[：:]/u.test(text)
}

function countHanCharacters(value) {
  return [...String(value ?? '').matchAll(HAN_CHARACTER)].length
}

function isSpeechLabel(label) {
  const normalized = String(label ?? '').trim()
  if (!normalized || NON_SPEECH_LABEL.test(normalized)) return false
  if (EXPLICIT_SPEECH_LABEL.test(normalized)) return true
  return /^[\p{Script=Han}]{2,6}(?:（[^）]{0,24}）)?$/u.test(normalized)
}

function speechSegmentsFromLine(line) {
  const segments = []
  const text = String(line ?? '')

  for (const match of text.matchAll(FIELD_PATTERN)) {
    const [, label, rawSpeech] = match
    if (!isSpeechLabel(label)) continue

    const speech = cleanSpeechText(rawSpeech)
    if (looksLikeShotDescription(speech)) continue
    if (!speech || /无对白|不要新增旁白/u.test(speech)) continue
    if (countHanCharacters(speech) === 0) continue
    segments.push(speech)
  }

  return segments
}

export function extractSpokenTextFromVideoLine(line) {
  return speechSegmentsFromLine(line).join('')
}

export function countChineseSpeechChars(value) {
  return String(value ?? '')
    .split(/\r?\n/u)
    .reduce((count, line) => count + countHanCharacters(extractSpokenTextFromVideoLine(line)), 0)
}

function speechLevel(spokenCharCount) {
  if (spokenCharCount === 0) return 'silent'
  if (spokenCharCount < 20) return 'sparse'
  if (spokenCharCount <= 32) return 'ideal'
  if (spokenCharCount <= 36) return 'normal'
  if (spokenCharCount <= 42) return 'crowded'
  return 'fail'
}

function warningForGroup(group) {
  if (group.level === 'fail') {
    return `15秒语音超载：第${group.groupNumber}组第${group.startLine}-${group.endLine}条含${group.spokenCharCount}个中文发声字，超过43字失败线；请拆分或压缩对白，否则AI大概率念不完。`
  }

  if (group.level === 'crowded') {
    return `15秒语音偏挤：第${group.groupNumber}组第${group.startLine}-${group.endLine}条含${group.spokenCharCount}个中文发声字，37-42字只适合快速短句；建议压到20-32字。`
  }

  if (group.spokenLineCount > 3) {
    return `15秒发声线过多：第${group.groupNumber}组第${group.startLine}-${group.endLine}条有${group.spokenLineCount}条发声线；常规最多2条，特殊情况最多3条短句。`
  }

  if (group.spokenLineCount === 3 && group.spokenCharCount > 32) {
    return `15秒发声线偏满：第${group.groupNumber}组第${group.startLine}-${group.endLine}条有3条发声线且共${group.spokenCharCount}字；建议保留2条主对白，其余交给表情和动作。`
  }

  return ''
}

export function analyzeSeedanceSpeechBudget(videoLines, { groupSize = 5 } = {}) {
  const lines = Array.isArray(videoLines)
    ? videoLines.map((line) => String(line ?? ''))
    : String(videoLines ?? '').split(/\r?\n/u).filter(Boolean)

  const groups = []
  for (let start = 0; start < lines.length; start += groupSize) {
    const groupLines = lines.slice(start, start + groupSize)
    const lineBudgets = groupLines.map((line, offset) => {
      const spokenText = extractSpokenTextFromVideoLine(line)
      return {
        lineNumber: start + offset + 1,
        spokenText,
        spokenCharCount: countHanCharacters(spokenText)
      }
    })
    const spokenCharCount = lineBudgets.reduce((sum, item) => sum + item.spokenCharCount, 0)
    const spokenLineCount = lineBudgets.filter((item) => item.spokenCharCount > 0).length

    groups.push({
      groupNumber: Math.floor(start / groupSize) + 1,
      startLine: start + 1,
      endLine: start + groupLines.length,
      spokenCharCount,
      spokenLineCount,
      level: speechLevel(spokenCharCount),
      lines: lineBudgets
    })
  }

  return {
    groupSize,
    groups,
    warnings: groups.map(warningForGroup).filter(Boolean)
  }
}
