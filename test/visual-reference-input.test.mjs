import test from 'node:test'
import assert from 'node:assert/strict'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'

test('removed visual aliases are rejected at argument parsing', () => {
  assert.throws(() => parseArgs(['--mode', 'visual', '故事']), /draft\/visual.*removed.*seedance-pack/)
  assert.throws(() => parseArgs(['--mode', 'generate', '故事']), /draft\/visual.*removed.*seedance-pack/)
  assert.throws(() => parseArgs(['--visual', '故事']), /draft\/visual.*removed.*seedance-pack/)
})

test('visual reference inputs can still be parsed as ordinary references for non-mode internals', async () => {
  const options = parseArgs([
    '--character-image',
    'refs/hero.png',
    '--scene-image',
    'refs/alley.png',
    '--style-image',
    'refs/noir.png',
    '雨夜里，女孩在巷口停下脚步。'
  ])
  const contract = await createInputContract(options)

  assert.deepEqual(contract.visualReferences, {
    characterImages: ['refs/hero.png'],
    sceneImages: ['refs/alley.png'],
    styleImages: ['refs/noir.png']
  })
})

test('defaults to internal draft contract mode without exposing draft CLI mode', async () => {
  const contract = await createInputContract(parseArgs(['雨夜里，女孩在巷口停下脚步。']))

  assert.equal(contract.mode, 'draft')
  assert.deepEqual(contract.visualReferences, {
    characterImages: [],
    sceneImages: [],
    styleImages: []
  })
})
