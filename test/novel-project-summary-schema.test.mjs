import test from 'node:test'
import assert from 'node:assert/strict'
import { validateChapterSummary } from '../src/novel/summary-schema.mjs'

function validSummary(overrides = {}) {
  return {
    schemaVersion: 1,
    chapterId: 'chapter-0001',
    sourceSpan: {
      startByte: 0,
      endByte: 128
    },
    title: '第一章 雨夜',
    summary: '林夏在旧影院发现一张写着自己名字的票根。',
    beats: [
      {
        event: '林夏进入旧影院。',
        purpose: '建立悬疑入口。'
      }
    ],
    characters: [
      {
        name: '林夏',
        role: 'protagonist'
      }
    ],
    locations: ['旧影院'],
    propsOrPowers: ['票根'],
    openQuestions: ['票根是谁留下的？'],
    adaptationNotes: ['雨夜霓虹和影院尘埃适合二次元视觉化。'],
    ...overrides
  }
}

test('valid chapter summary passes schema validation', () => {
  assert.deepEqual(validateChapterSummary(validSummary()), { ok: true, errors: [] })
})

test('missing chapterId fails schema validation', () => {
  const summary = validSummary()
  delete summary.chapterId

  assert.deepEqual(validateChapterSummary(summary), {
    ok: false,
    errors: ['chapterId is required']
  })
})

test('empty beats fails schema validation', () => {
  assert.deepEqual(validateChapterSummary(validSummary({ beats: [] })), {
    ok: false,
    errors: ['beats must be a non-empty array']
  })
})

test('beat without event fails schema validation', () => {
  assert.deepEqual(validateChapterSummary(validSummary({ beats: [{}] })), {
    ok: false,
    errors: ['beats[0].event must be a non-empty string']
  })
})

test('blank beat event fails schema validation', () => {
  assert.deepEqual(validateChapterSummary(validSummary({ beats: [{ event: '   ' }] })), {
    ok: false,
    errors: ['beats[0].event must be a non-empty string']
  })
})

test('malformed characters fails schema validation', () => {
  assert.deepEqual(validateChapterSummary(validSummary({ characters: [{ role: 'protagonist' }] })), {
    ok: false,
    errors: ['characters[0].name must be a non-empty string']
  })
})

test('long copied source text in summary fails schema validation', () => {
  assert.deepEqual(validateChapterSummary(validSummary({ summary: '雨'.repeat(2001) })), {
    ok: false,
    errors: ['summary must not exceed 2000 characters']
  })
})

test('invalid source span and optional arrays return specific errors', () => {
  assert.deepEqual(
    validateChapterSummary(
      validSummary({
        sourceSpan: { startByte: 10, endByte: 8 },
        locations: '旧影院',
        openQuestions: null
      })
    ),
    {
      ok: false,
      errors: [
        'sourceSpan.endByte must not be less than sourceSpan.startByte',
        'locations must be an array when present',
        'openQuestions must be an array when present'
      ]
    }
  )
})
