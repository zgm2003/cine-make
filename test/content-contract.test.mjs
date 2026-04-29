import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateRunDirectory } from '../src/run-validator.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('skill points agents to built-in director prompt references', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const promptRef = join(root, 'skills', 'cine-make', 'references', 'director-prompts.md')

  assert.ok(existsSync(promptRef))
  assert.match(skill, /director-prompts\.md/)

  const promptText = await readFile(promptRef, 'utf8')
  assert.match(promptText, /Director rewrite prompt/)
  assert.match(promptText, /micro-performance/)
  assert.match(promptText, /screen direction/)
})

test('skill keeps user prompts natural and internal output rules implicit', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')

  assert.match(skill, /Natural-language UX/)
  assert.match(skill, /The user should not have to say/)
  assert.match(skill, /generic adapter unless the user explicitly asks/)
  assert.match(skill, /That rule belongs to this skill, not to the user/)
  assert.match(skill, /Do not pass `--emit-internal` in normal user runs/)
  assert.match(skill, /视频工具投喂包/)
  assert.match(skill, /上传哪些图片，复制哪段提示词/)
  assert.match(skill, /成片预览/)
  assert.match(skill, /故事全流程/)
})

test('golden rain-alley example is a valid production run', async () => {
  const exampleRun = join(root, 'examples', 'rain-alley')
  const result = await validateRunDirectory({ runDir: exampleRun, stage: 'production' })

  assert.equal(result.ok, true, result.errors.join('\n'))
  assert.deepEqual(result.errors, [])
})
