import { createHash } from 'node:crypto'

const DEFAULT_TARGET_CHUNK_CHARS = 8000
const CHINESE_ORDINAL = '0-9０-９零〇一二三四五六七八九十百千万两'
const HEADING_PATTERNS = [
  new RegExp(`^\\s*第[${CHINESE_ORDINAL}]+\\s*[章节回部卷集篇].*$`, 'u'),
  new RegExp(`^\\s*卷[${CHINESE_ORDINAL}]+.*$`, 'u'),
  /^chapter\s+\d+.*$/iu
]

export function splitNovelText(text, options = {}) {
  const source = typeof text === 'string' ? text : ''
  const targetChunkChars = Number.isFinite(options.targetChunkChars)
    ? Math.max(1, Math.floor(options.targetChunkChars))
    : DEFAULT_TARGET_CHUNK_CHARS

  const lines = collectLines(source)
  const headingLines = lines.filter((line) => isHeadingLine(line.text))
  const spans = headingLines.length > 0
    ? splitByHeadings(source, headingLines)
    : splitByParagraphs(source, targetChunkChars)

  return {
    chapters: spans.map((span, index) => makeChapter(source, span, index))
  }
}

function collectLines(text) {
  const lines = []
  let start = 0

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '\n') {
      continue
    }

    const end = text[index - 1] === '\r' ? index - 1 : index
    lines.push({
      text: text.slice(start, end),
      start,
      end,
      endWithNewline: index + 1
    })
    start = index + 1
  }

  if (start <= text.length) {
    lines.push({
      text: text.slice(start),
      start,
      end: text.length,
      endWithNewline: text.length
    })
  }

  return lines
}

function isHeadingLine(line) {
  return HEADING_PATTERNS.some((pattern) => pattern.test(line.trim()))
}

function splitByHeadings(text, headingLines) {
  const spans = []

  if (headingLines[0].start > 0 && text.slice(0, headingLines[0].start).trim()) {
    spans.push({
      title: 'Untitled',
      start: 0,
      end: headingLines[0].start
    })
  }

  for (let index = 0; index < headingLines.length; index += 1) {
    const heading = headingLines[index]
    const nextHeading = headingLines[index + 1]
    spans.push({
      title: heading.text.trim(),
      start: heading.start,
      end: nextHeading ? nextHeading.start : text.length
    })
  }

  return spans.filter((span) => text.slice(span.start, span.end).trim())
}

function splitByParagraphs(text, targetChunkChars) {
  const paragraphs = collectParagraphs(text)
  const spans = []
  let current = null

  for (const paragraph of paragraphs) {
    if (!current) {
      current = { start: paragraph.start, end: paragraph.end }
      continue
    }

    const combinedLength = text.slice(current.start, paragraph.end).length
    if (combinedLength > targetChunkChars && text.slice(current.start, current.end).trim()) {
      spans.push({ ...current })
      current = { start: paragraph.start, end: paragraph.end }
      continue
    }

    current.end = paragraph.end
  }

  if (current && text.slice(current.start, current.end).trim()) {
    spans.push(current)
  }

  return spans
}

function collectParagraphs(text) {
  const paragraphs = []
  const lines = collectLines(text)

  for (const line of lines) {
    if (!line.text.trim()) {
      continue
    }

    paragraphs.push({
      start: line.start,
      end: line.endWithNewline
    })
  }

  return paragraphs
}

function makeChapter(source, span, index) {
  const chapterText = source.slice(span.start, span.end)
  const title = span.title ?? `Chunk ${index + 1}`

  return {
    id: `chapter-${String(index + 1).padStart(4, '0')}`,
    title,
    text: chapterText,
    startByte: Buffer.byteLength(source.slice(0, span.start), 'utf8'),
    endByte: Buffer.byteLength(source.slice(0, span.end), 'utf8'),
    sha256: createHash('sha256').update(chapterText, 'utf8').digest('hex')
  }
}
