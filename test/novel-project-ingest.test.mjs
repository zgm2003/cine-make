import test from 'node:test'
import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createNovelProject } from '../src/novel/project-writer.mjs'

test('creates a novel project workspace from chapter headings', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-project-'))
  const inputPath = path.join(workspace, 'My Novel.txt')
  const outDir = path.join(workspace, 'project')
  const sourceText = ['第1章 初遇', '林夏推开旧影院的门。', '第二章 回声', '银幕里传来她自己的声音。'].join('\n')
  await writeFile(inputPath, sourceText, 'utf8')

  const result = await createNovelProject({ inputPath, outDir, targetChunkChars: 2000 })

  const project = JSON.parse(await readFile(path.join(outDir, 'project.json'), 'utf8'))
  const manifest = JSON.parse(await readFile(path.join(outDir, 'source', 'source-manifest.json'), 'utf8'))
  const expectedHash = createHash('sha256').update(sourceText, 'utf8').digest('hex')
  const expectedByteLength = Buffer.byteLength(sourceText, 'utf8')

  assert.deepEqual(result.counts, { chapters: 2, chunks: 2, summaries: 0, plannedEpisodes: 0 })
  assert.equal(await readFile(path.join(outDir, 'source', 'novel.txt'), 'utf8'), sourceText)
  assert.equal(project.title, 'My Novel')
  assert.equal(project.source.path, 'source/novel.txt')
  assert.equal(project.source.sha256, expectedHash)
  assert.equal(project.source.byteLength, expectedByteLength)
  assert.equal(project.source.encoding, 'utf8')
  assert.deepEqual(project.counts, { chapters: 2, chunks: 2, summaries: 0, plannedEpisodes: 0 })
  assert.equal(manifest.inputPath, inputPath)
  assert.equal(manifest.sha256, expectedHash)
  assert.equal(manifest.byteLength, expectedByteLength)
  assert.equal(manifest.encoding, 'utf8')

  assert.equal(await readFile(path.join(outDir, 'chapters', 'chapter-0001.txt'), 'utf8'), '第1章 初遇\n林夏推开旧影院的门。\n')
  assert.equal(await readFile(path.join(outDir, 'chapters', 'chapter-0002.txt'), 'utf8'), '第二章 回声\n银幕里传来她自己的声音。')

  const chunk = JSON.parse(await readFile(path.join(outDir, 'chunks', 'chunk-000001.json'), 'utf8'))
  assert.equal(chunk.id, 'chunk-000001')
  assert.equal(chunk.chapterId, 'chapter-0001')
  assert.equal(chunk.title, '第1章 初遇')
  assert.equal(chunk.sourcePath, 'chapters/chapter-0001.txt')

  for (const dirname of ['tasks', 'summaries', 'bible', 'episodes', 'continuity']) {
    assert.equal((await stat(path.join(outDir, dirname))).isDirectory(), true)
  }
})

test('writes bounded chapter summary prompts with default style context', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-prompt-'))
  const inputPath = path.join(workspace, 'story.txt')
  const outDir = path.join(workspace, 'project')
  const sourceText = ['第一章 烟花', '只属于第一章的线索。', '第二章 雨夜', '只属于第二章的秘密。'].join('\n')
  await writeFile(inputPath, sourceText, 'utf8')

  await createNovelProject({ inputPath, outDir })

  const project = JSON.parse(await readFile(path.join(outDir, 'project.json'), 'utf8'))
  const prompt = await readFile(path.join(outDir, 'tasks', 'summarize-chapter-0001.md'), 'utf8')

  assert.equal(project.defaultStyle, '超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性')
  assert.match(prompt, /超写实真人电影质感/)
  assert.match(prompt, /85mm镜头/)
  assert.match(prompt, /4K/)
  assert.doesNotMatch(prompt, /anime|二次元|非真人写实/i)
  assert.match(prompt, /只属于第一章的线索。/)
  assert.doesNotMatch(prompt, /只属于第二章的秘密。/)
  assert.match(prompt, /output only the Chapter Summary JSON contract/i)
  for (const key of [
    'schemaVersion',
    'chapterId',
    'sourceSpan',
    'title',
    'summary',
    'beats',
    'characters',
    'locations',
    'propsOrPowers',
    'openQuestions',
    'adaptationNotes'
  ]) {
    assert.match(prompt, new RegExp(key))
  }
})

test('removes stale source-derived project artifacts when rerun', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cine-make-novel-rerun-'))
  const inputPath = path.join(workspace, 'story.txt')
  const outDir = path.join(workspace, 'project')
  const firstSource = ['第一章 星火', '第一章内容。', '第二章 潮声', '第二章内容。'].join('\n')
  const secondSource = ['第一章 星火', '改写后只保留第一章。'].join('\n')

  await writeFile(inputPath, firstSource, 'utf8')
  await createNovelProject({ inputPath, outDir })
  await writeFile(path.join(outDir, 'summaries', 'chapter-0001.summary.json'), '{"stale": true}\n', 'utf8')
  await writeFile(path.join(outDir, 'bible', 'series-bible.md'), '# stale bible\n', 'utf8')
  await writeFile(path.join(outDir, 'visual-bible', 'character-reference-plan.md'), '# stale visual bible\n', 'utf8')
  await writeFile(path.join(outDir, 'episodes', 'adaptation-plan.json'), '{"stale": true}\n', 'utf8')
  await writeFile(path.join(outDir, 'continuity', 'continuity-log.md'), '# stale continuity\n', 'utf8')

  await writeFile(inputPath, secondSource, 'utf8')
  await createNovelProject({ inputPath, outDir })

  const project = JSON.parse(await readFile(path.join(outDir, 'project.json'), 'utf8'))
  assert.deepEqual(project.counts, { chapters: 1, chunks: 1, summaries: 0, plannedEpisodes: 0 })
  assert.equal(await readFile(path.join(outDir, 'chapters', 'chapter-0001.txt'), 'utf8'), secondSource)

  await assert.rejects(access(path.join(outDir, 'chapters', 'chapter-0002.txt')), { code: 'ENOENT' })
  await assert.rejects(access(path.join(outDir, 'chunks', 'chunk-000002.json')), { code: 'ENOENT' })
  await assert.rejects(access(path.join(outDir, 'tasks', 'summarize-chapter-0002.md')), { code: 'ENOENT' })
  await assert.rejects(access(path.join(outDir, 'summaries', 'chapter-0001.summary.json')), { code: 'ENOENT' })
  await assert.rejects(access(path.join(outDir, 'bible', 'series-bible.md')), { code: 'ENOENT' })
  await assert.rejects(access(path.join(outDir, 'visual-bible', 'character-reference-plan.md')), { code: 'ENOENT' })
  await assert.rejects(access(path.join(outDir, 'episodes', 'adaptation-plan.json')), { code: 'ENOENT' })
  await assert.rejects(access(path.join(outDir, 'continuity', 'continuity-log.md')), { code: 'ENOENT' })

  for (const dirname of ['source', 'chapters', 'chunks', 'tasks', 'summaries', 'bible', 'visual-bible', 'episodes', 'continuity']) {
    assert.equal((await stat(path.join(outDir, dirname))).isDirectory(), true)
  }
})
