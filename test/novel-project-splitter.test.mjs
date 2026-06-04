import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { splitNovelText } from '../src/novel/chapter-splitter.mjs'

test('splits common Chinese chapter headings', () => {
  const text = ['第1章 初入坊市', '祁瑾站在人群中。', '第二章 筑基丹', '叮声响起。'].join('\n')
  const result = splitNovelText(text, { targetChunkChars: 2000 })

  assert.equal(result.chapters.length, 2)
  assert.equal(result.chapters[0].id, 'chapter-0001')
  assert.equal(result.chapters[0].title, '第1章 初入坊市')
  assert.match(result.chapters[1].text, /叮声响起/)
})

test('falls back to bounded chunks when chapter headings are absent', () => {
  const text = Array.from({ length: 60 }, (_, index) => `这是第${index + 1}段剧情。`).join('\n')
  const result = splitNovelText(text, { targetChunkChars: 120 })

  assert.equal(result.chapters.length > 1, true)
  assert.equal(result.chapters.every((chapter) => chapter.text.length <= 180), true)
})

test('returns stable byte spans and hashes for each source unit', () => {
  const source = ['第一章 开始', '主角醒来。', '第二章 再行', '他推门而出。'].join('\n')
  const options = { targetChunkChars: 2000 }
  const result = splitNovelText(source, options)
  const repeat = splitNovelText(source, options)

  assert.deepEqual(repeat, result)
  assert.equal(result.chapters.length, 2)
  assert.equal(result.chapters[0].startByte, 0)
  assert.equal(result.chapters[0].endByte, 33)
  assert.equal(result.chapters[1].startByte, 33)
  assert.equal(result.chapters[1].endByte, 68)

  for (const chapter of result.chapters) {
    const expectedHash = createHash('sha256').update(chapter.text, 'utf8').digest('hex')
    assert.equal(chapter.sha256, expectedHash)
  }
})
