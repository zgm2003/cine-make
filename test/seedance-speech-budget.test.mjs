import test from 'node:test'
import assert from 'node:assert/strict'

import {
  analyzeSeedanceSpeechBudget,
  countChineseSpeechChars,
  extractSpokenTextFromVideoLine
} from '../src/seedance-speech-budget.mjs'

test('counts only spoken Chinese characters from dialogue, OS, narration, and system prompt fields', () => {
  const lines = [
    '1 日 外 许家大厅 许怡宁 拔剑抵住颈侧 主体许怡宁/近景/平视/嘴型清楚 镜头前推 台词：我不嫁。；音效：剑鸣',
    '2 日 外 许家大厅 江凡 坐在角落 主体江凡/中景/平视/沉默 固定镜头 环境音：人群压低，无对白',
    '3 日 外 灵根碑 众人 灵根碑裂开 主体灵根碑/特写/低机位/碎纹清楚 固定镜头 旁白：灵根碎了。',
    '4 日 外 灵根碑 系统 光幕闪动 主体光幕/特写/正面/文字不生成 镜头推进 系统提示：检测失败。',
    '5 日 内 地窖 刘飞 落进烟雾里 主体刘飞/中景/低机位/火光照脸 手持拍摄 刘飞（os）：这是哪啊？；音效：落地声'
  ]

  assert.equal(extractSpokenTextFromVideoLine(lines[0]), '我不嫁。')
  assert.equal(countChineseSpeechChars(lines.join('\n')), 15)

  const budget = analyzeSeedanceSpeechBudget(lines)
  assert.equal(budget.groups.length, 1)
  assert.equal(budget.groups[0].spokenCharCount, 15)
  assert.equal(budget.groups[0].spokenLineCount, 4)
  assert.equal(budget.groups[0].level, 'sparse')
})

test('does not count prose speaker tags when they point into shot-description fields', () => {
  const line = '1 日 内 许府 江凡 王映凤冷笑道： 主体江凡/中景/平视/众人围住他 固定镜头 环境音：人群压低'

  assert.equal(extractSpokenTextFromVideoLine(line), '')
  assert.equal(countChineseSpeechChars(line), 0)
})

test('does not count speaker labels before quoted dialogue as spoken characters', () => {
  const line = '1 日 内 鬼王宗 林夜 林夜抬眼 主体林夜/近景/平视/嘴型清楚 固定镜头 台词：林夜压低嗓子“我才穿越几天啊？”'

  assert.equal(extractSpokenTextFromVideoLine(line), '我才穿越几天啊？')
  assert.equal(countChineseSpeechChars(line), 7)
})

test('marks a 15-second five-line group as failed at 43 or more spoken Chinese characters', () => {
  const lines = [
    `1 日 外 雪山 道清 抬眼 主体道清/近景/平视/嘴型清楚 镜头前推 台词：${'你'.repeat(43)}；音效：风声`,
    '2 日 外 雪山 道清 沉默看向幼兽 主体道清/近景/平视/无对白 固定镜头 环境音：风声',
    '3 日 外 雪山 幼兽 蜷缩 主体幼兽/特写/平视/无对白 固定镜头 环境音：低鸣',
    '4 日 外 雪山 道清 倒下 主体道清/全景/平视/无对白 镜头下降 环境音：倒地声',
    '5 日 外 雪山 幼兽 回头 主体幼兽/近景/平视/无对白 镜头前推 环境音：风声'
  ]

  const budget = analyzeSeedanceSpeechBudget(lines)

  assert.equal(budget.groups[0].spokenCharCount, 43)
  assert.equal(budget.groups[0].level, 'fail')
  assert.match(budget.warnings.join('\n'), /15秒语音超载：第1组第1-5条含43个中文发声字，超过43字失败线/)
})
