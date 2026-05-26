import test from 'node:test'
import assert from 'node:assert/strict'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'

test('parses a story request into a normalized contract', async () => {
  const options = parseArgs(['--duration', '30s', '--aspect', '9:16', '--style', 'cinematic', '--platform', 'seedance', '雨夜里，女孩在巷口停下脚步。'])
  const contract = await createInputContract(options)

  assert.equal(contract.target.durationSeconds, 30)
  assert.equal(contract.target.aspectRatio, '9:16')
  assert.equal(contract.target.style, 'cinematic，动漫二次元，非真人写实')
  assert.equal(contract.target.platform, 'seedance')
  assert.equal(contract.target.shotCount, 14)
  assert.equal(contract.target.storyboardCount, 14)
  assert.equal(contract.contentType, 'novel_excerpt')
  assert.match(contract.sourceText, /女孩/)
})

test('defaults to anime-style image-safe storyboard packs', async () => {
  const options = parseArgs(['--duration', '15s', '--aspect', '9:16', '雨夜里，女孩在巷口停下脚步。'])
  const contract = await createInputContract(options)

  assert.match(contract.target.style, /动漫二次元/)
  assert.match(contract.target.style, /非真人写实/)
  assert.equal(contract.target.shotCount, 7)
  assert.equal(contract.target.storyboardCount, 7)
})

test('rejects more than ten user visual references per run', async () => {
  const args = ['--mode', 'visual']
  for (let index = 1; index <= 11; index += 1) {
    args.push('--character-image', `refs/ref-${index}.png`)
  }
  args.push('雨夜里，女孩在巷口停下脚步。')

  await assert.rejects(() => createInputContract(parseArgs(args)), /visual references.*at most 10/)
})

test('rejects unsupported aspect ratio', async () => {
  const options = parseArgs(['--aspect', '3:2', 'story'])
  await assert.rejects(() => createInputContract(options), /Unsupported aspect ratio/)
})
