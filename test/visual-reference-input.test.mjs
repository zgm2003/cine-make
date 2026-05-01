import test from 'node:test'
import assert from 'node:assert/strict'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'

test('parses the two product modes and optional visual references', async () => {
  const options = parseArgs([
    '--mode',
    'visual',
    '--character-image',
    'refs/hero.png',
    '--scene-image',
    'refs/alley.png',
    '--style-image',
    'refs/noir.png',
    '雨夜里，女孩在巷口停下脚步。'
  ])
  const contract = await createInputContract(options)

  assert.equal(contract.mode, 'visual')
  assert.deepEqual(contract.visualReferences, {
    characterImages: ['refs/hero.png'],
    sceneImages: ['refs/alley.png'],
    styleImages: ['refs/noir.png']
  })
})

test('keeps generate as a user-facing alias for visual mode', async () => {
  const options = parseArgs(['--mode', 'generate', '故事'])
  const contract = await createInputContract(options)

  assert.equal(contract.mode, 'visual')
})

test('defaults to draft mode without requiring reference images', async () => {
  const contract = await createInputContract(parseArgs(['雨夜里，女孩在巷口停下脚步。']))

  assert.equal(contract.mode, 'draft')
  assert.deepEqual(contract.visualReferences, {
    characterImages: [],
    sceneImages: [],
    styleImages: []
  })
})
