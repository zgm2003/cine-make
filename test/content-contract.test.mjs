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
  assert.match(promptText, /preset locks/)
  assert.match(promptText, /secondary-animation/)
  assert.match(promptText, /no skipped, merged, duplicated, or reordered shots/)
})

test('skill keeps user prompts natural and internal output rules implicit', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')

  assert.match(skill, /Natural-language UX/)
  assert.match(skill, /The user should not have to say/)
  assert.match(skill, /Jimeng/)
  assert.doesNotMatch(skill, /generic adapter unless the user explicitly asks/)
  assert.doesNotMatch(skill, /Seedance/)
  assert.match(skill, /That rule belongs to this skill, not to the user/)
  assert.match(skill, /Do not pass `--emit-internal` in normal user runs/)
  assert.match(skill, /视频工具投喂包/)
  assert.match(skill, /deliverable\.md` plus `storyboard-images/)
  assert.match(skill, /uploaded images \+ timeline/)
  assert.doesNotMatch(skill, /完整剧情拆解与视频任务队列/)
  assert.match(skill, /成片预览/)
  assert.match(skill, /故事全流程/)
})

test('skill describes Codex-only image generation through $imagegen', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')

  assert.match(skill, /\$imagegen/)
  assert.doesNotMatch(skill, /gpt-image-2/)
  assert.doesNotMatch(skill, /OPENAI_API_KEY/)
})

test('skill routes manual Canvas work to canvas-pack instead of image generation', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const chinese = await readFile(join(root, 'README.zh-CN.md'), 'utf8')

  assert.match(skill, /canvas-pack/)
  assert.match(skill, /canvas-storyboard-pack/)
  assert.match(skill, /manual Canvas generation/i)
  assert.match(skill, /do not run `--mode visual`/i)
  assert.match(skill, /Do not create `storyboard-images\/`/i)
  assert.match(skill, /requiredAnchors/)
  assert.match(skill, /merge into current canvas|合并到当前画布/u)
  assert.match(skill, /World Bible/)
  assert.match(skill, /Art Direction/)
  assert.match(skill, /style_reference|style reference|风格参考/u)
  assert.match(skill, /character reference|角色参考/u)
  assert.match(skill, /environment reference|场景参考/u)
  assert.match(chinese, /canvas-pack/)
  assert.match(chinese, /canvas-storyboard-pack/)
  assert.match(chinese, /手动生成/)
  assert.match(chinese, /合并到当前画布/)
  assert.match(chinese, /World Bible/)
  assert.match(chinese, /Art Direction/)
  assert.match(chinese, /风格参考/)
  assert.match(chinese, /角色参考/)
  assert.match(chinese, /场景参考/)
})

test('readmes describe Codex-only image generation through $imagegen', async () => {
  const english = await readFile(join(root, 'README.md'), 'utf8')
  const chinese = await readFile(join(root, 'README.zh-CN.md'), 'utf8')

  assert.match(english, /\$imagegen/)
  assert.match(chinese, /\$imagegen/)
  assert.doesNotMatch(english, /gpt-image-2/)
  assert.doesNotMatch(chinese, /gpt-image-2/)
  assert.doesNotMatch(english, /OPENAI_API_KEY/)
  assert.doesNotMatch(chinese, /OPENAI_API_KEY/)
})

test('golden rain-alley example is a valid production run', async () => {
  const exampleRun = join(root, 'examples', 'rain-alley')
  const result = await validateRunDirectory({ runDir: exampleRun, stage: 'production' })

  assert.equal(result.ok, true, result.errors.join('\n'))
  assert.deepEqual(result.errors, [])
})
