import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { splitNovelText } from './chapter-splitter.mjs'

const DEFAULT_STYLE = '超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性'
const PROJECT_DIRS = [
  'source',
  'chapters',
  'chunks',
  'tasks',
  'summaries',
  'bible',
  'visual-bible',
  'episodes',
  'continuity'
]

export async function createNovelProject({
  inputPath,
  outDir,
  title,
  style,
  targetChunkChars
}) {
  if (!inputPath) {
    throw new Error('inputPath is required')
  }
  if (!outDir) {
    throw new Error('outDir is required')
  }

  const sourceText = await readFile(inputPath, 'utf8')
  const sourceHash = sha256(sourceText)
  const sourceByteLength = Buffer.byteLength(sourceText, 'utf8')
  const defaultStyle = style ?? DEFAULT_STYLE
  const projectTitle = title ?? path.basename(inputPath, path.extname(inputPath))
  const split = splitNovelText(sourceText, { targetChunkChars })

  await clearManagedProjectArtifacts(outDir)
  await Promise.all(PROJECT_DIRS.map((dir) => mkdir(path.join(outDir, dir), { recursive: true })))
  await writeFile(path.join(outDir, 'source', 'novel.txt'), sourceText, 'utf8')

  const source = {
    path: 'source/novel.txt',
    sha256: sourceHash,
    byteLength: sourceByteLength,
    encoding: 'utf8'
  }
  const chunks = split.chapters.map((chapter, index) => ({
    id: `chunk-${String(index + 1).padStart(6, '0')}`,
    chapterId: chapter.id,
    title: chapter.title,
    startByte: chapter.startByte,
    endByte: chapter.endByte,
    sha256: chapter.sha256,
    sourcePath: `chapters/${chapter.id}.txt`
  }))

  const manifest = {
    inputPath,
    sha256: sourceHash,
    byteLength: sourceByteLength,
    encoding: 'utf8'
  }
  const project = {
    schemaVersion: 1,
    mode: 'novel-project',
    title: projectTitle,
    defaultStyle,
    source,
    counts: {
      chapters: split.chapters.length,
      chunks: chunks.length,
      summaries: 0,
      plannedEpisodes: 0
    },
    createdAt: new Date().toISOString()
  }

  await writeJson(path.join(outDir, 'source', 'source-manifest.json'), manifest)
  await writeJson(path.join(outDir, 'project.json'), project)

  const chapterPaths = []
  const chunkPaths = []
  const taskPaths = []

  for (const [index, chapter] of split.chapters.entries()) {
    const chapterPath = path.join(outDir, 'chapters', `${chapter.id}.txt`)
    const chunkPath = path.join(outDir, 'chunks', `${chunks[index].id}.json`)
    const taskPath = path.join(outDir, 'tasks', `summarize-${chapter.id}.md`)

    await writeFile(chapterPath, chapter.text, 'utf8')
    await writeJson(chunkPath, chunks[index])
    await writeFile(taskPath, `${summaryPrompt({ chapter, defaultStyle })}\n`, 'utf8')

    chapterPaths.push(chapterPath)
    chunkPaths.push(chunkPath)
    taskPaths.push(taskPath)
  }

  return {
    outDir,
    projectPath: path.join(outDir, 'project.json'),
    sourcePath: path.join(outDir, 'source', 'novel.txt'),
    manifestPath: path.join(outDir, 'source', 'source-manifest.json'),
    chapterPaths,
    chunkPaths,
    taskPaths,
    counts: project.counts,
    source
  }
}

function summaryPrompt({ chapter, defaultStyle }) {
  return [
    `# Summarize ${chapter.id}`,
    '',
    'You are summarizing one bounded chapter from a long novel project.',
    `Default adaptation style: ${defaultStyle}`,
    '',
    'Output only the Chapter Summary JSON contract. Do not include Markdown fences, commentary, or text outside JSON.',
    '',
    'Required JSON keys:',
    '- schemaVersion',
    '- chapterId',
    '- sourceSpan',
    '- title',
    '- summary',
    '- beats',
    '- characters',
    '- locations',
    '- propsOrPowers',
    '- openQuestions',
    '- adaptationNotes',
    '',
    'Contract notes:',
    '- schemaVersion must be 1.',
    `- chapterId must be "${chapter.id}".`,
    `- sourceSpan must include startByte ${chapter.startByte} and endByte ${chapter.endByte}.`,
    '- Keep adaptationNotes useful for photoreal live-action cinematic visual planning: character identity, wardrobe, props, practical locations, lighting, and continuity anchors.',
    '',
    'Chapter text:',
    '',
    chapter.text
  ].join('\n')
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function clearManagedProjectArtifacts(outDir) {
  await rm(path.join(outDir, 'project.json'), { force: true })
  await rm(path.join(outDir, 'source', 'novel.txt'), { force: true })
  await rm(path.join(outDir, 'source', 'source-manifest.json'), { force: true })

  await removeMatchingFiles(path.join(outDir, 'chapters'), /^chapter-\d{4}\.txt$/u)
  await removeMatchingFiles(path.join(outDir, 'chunks'), /^chunk-\d{6}\.json$/u)
  await removeMatchingFiles(path.join(outDir, 'tasks'), /^summarize-chapter-\d{4}\.md$/u)
  await rm(path.join(outDir, 'summaries'), { recursive: true, force: true })
  await rm(path.join(outDir, 'bible'), { recursive: true, force: true })
  await rm(path.join(outDir, 'visual-bible'), { recursive: true, force: true })
  await rm(path.join(outDir, 'episodes'), { recursive: true, force: true })
  await rm(path.join(outDir, 'continuity'), { recursive: true, force: true })
}

async function removeMatchingFiles(dirPath, pattern) {
  let entries
  try {
    entries = await readdir(dirPath, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return
    }
    throw error
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && pattern.test(entry.name))
      .map((entry) => rm(path.join(dirPath, entry.name), { force: true }))
  )
}
