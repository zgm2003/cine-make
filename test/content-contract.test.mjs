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

test('skill keeps the normal Seedance handoff implicit and lightweight', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')

  assert.match(skill, /Seedance/)
  assert.doesNotMatch(skill, /generic adapter unless the user explicitly asks/)
  assert.match(skill, /Seedance all-reference/u)
  assert.match(skill, /Do not pass `--emit-internal` in normal user runs/)
  assert.match(skill, /seedance-all-reference-feed\.md/)
  assert.doesNotMatch(skill, /canvas-project\.zip.*user output|canvas-project\.zip` \+ `canvas-manifest/u)
  assert.doesNotMatch(skill, /完整剧情拆解与视频任务队列/)
  assert.match(skill, /15秒容量闸门/u)
  assert.match(skill, /For one 15-second segment, default to 5 single-line video texts/u)
  assert.match(skill, /不能自然容纳/u)
})

test('skill describes GPT-image-2 tri-view prompt workflow for reference-feed', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')

  assert.match(skill, /GPT-image-2/)
  assert.match(skill, /最左侧单独的上半身\+头部细节展示|far-left upper-body \+ head detail/u)
  assert.match(skill, /front full body, side full body, back full body|正面全身照、侧面全身照、背面全身照/u)
  assert.match(skill, /三视图为一张图/u)
  assert.match(skill, /16:9/)
  assert.match(skill, /visual style/u)
  assert.match(skill, /4K画质/u)
  assert.doesNotMatch(skill, /OPENAI_API_KEY/)
})

test('skill disables Canvas package output and routes to ChatGPT feed', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const chinese = await readFile(join(root, 'README.zh-CN.md'), 'utf8')
  const outputContract = await readFile(join(root, 'skills', 'cine-make', 'references', 'output-contract.md'), 'utf8')

  assert.match(skill, /Canvas handoff packages|Canvas package output is disabled|Canvas commands are deprecated and disabled/u)
  assert.match(skill, /ChatGPT-ready|ChatGPT 可校对/u)
  assert.match(skill, /Do not create `canvas-project\.zip`, `canvas-manifest\.json`, `projects\.json`, `prompt-pack\.md`/i)
  assert.match(skill, /Do not create `canvas-project\.zip`[\s\S]*`deliverable\.md`, `storyboard-images\/`/i)
  assert.match(outputContract, /Original-fidelity contract|原著守则/u)
  assert.match(outputContract, /Seedance feed|single-line video text/u)
  assert.match(chinese, /Canvas 输出已关闭/u)
  assert.match(chinese, /ChatGPT 可校对/u)
  assert.match(chinese, /原著守则和镜头语言规则/u)
  assert.doesNotMatch(chinese, /node src\/cli\.mjs canvas-pack/u)
})

test('docs allow light adaptation for breathable 15-second video segments', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const outputContract = await readFile(join(root, 'skills', 'cine-make', 'references', 'output-contract.md'), 'utf8')
  const combined = [skill, outputContract].join('\n')

  assert.match(combined, /视频呼吸|breathable/u)
  assert.match(combined, /长台词/u)
  assert.match(combined, /轻微.*改造|light adaptation/u)
  assert.match(combined, /事件顺序|event order/u)
  assert.match(combined, /人物动机|motivation/u)
  assert.match(combined, /章节?钩子|ending hooks/u)
})

test('readmes describe Seedance reference-feed and GPT-image-2 tri-view prompts', async () => {
  const english = await readFile(join(root, 'README.md'), 'utf8')
  const chinese = await readFile(join(root, 'README.zh-CN.md'), 'utf8')
  const combined = [english, chinese].join('\n')

  assert.match(combined, /reference-feed/)
  assert.match(combined, /Seedance 全能参考投喂包|Seedance all-reference/u)
  assert.match(combined, /GPT-image-2/)
  assert.match(combined, /三视图为一张图/u)
  assert.doesNotMatch(combined, /OPENAI_API_KEY/)
})

test('docs describe layered cinematic pipeline instead of repeating global rules per shot', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const english = await readFile(join(root, 'README.md'), 'utf8')
  const chinese = await readFile(join(root, 'README.zh-CN.md'), 'utf8')
  const combined = [skill, english, chinese].join('\n')

  assert.match(combined, /DIRECTOR_BIBLE/)
  assert.match(combined, /CHARACTER_BIBLE/)
  assert.match(combined, /SCENE_BIBLE/)
  assert.match(combined, /ART_DIRECTION/)
  assert.match(combined, /Shot Definition/)
  assert.match(combined, /Motion Prompt/)
  assert.match(combined, /global rules are not repeated per shot|全局规则不在每镜重复/u)
  assert.match(combined, /Keyframe prompts are static|Keyframe 提示词是静态/u)
})

test('docs describe director decision layer and quality checks', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const english = await readFile(join(root, 'README.md'), 'utf8')
  const chinese = await readFile(join(root, 'README.zh-CN.md'), 'utf8')
  const combined = [skill, english, chinese].join('\n')

  assert.match(combined, /SCRIPT_BEATS/)
  assert.match(combined, /DIRECTOR_DECISION/)
  assert.match(combined, /Environment Bibles|ENVIRONMENT_BIBLES|环境圣经数组/u)
  assert.match(combined, /Anchor Policy|ANCHOR_POLICY|锚点策略/u)
  assert.match(combined, /Director Cut|导演删减版/u)
  assert.match(combined, /Quality Check|QUALITY_CHECK|质量检查/u)
  assert.match(combined, /AI_RISK_WARNINGS/)
  assert.match(combined, /每个镜头必须证明自己不可删除|each shot must prove why it should stay/u)
  assert.match(combined, /最多 1 个 primary anchor|at most one primary anchor/u)
  assert.match(combined, /macro.*复杂表演|wide.*文字阅读|macro shot.*complex action|wide shot.*readable text/u)
})

test('docs describe director judgment v2 policies and localized prompts', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const english = await readFile(join(root, 'README.md'), 'utf8')
  const chinese = await readFile(join(root, 'README.zh-CN.md'), 'utf8')
  const combined = [skill, english, chinese].join('\n')

  assert.match(combined, /real narrative beats|真实叙事节拍/u)
  assert.match(combined, /keep\s*\/\s*merge\s*\/\s*delete\s*\/\s*rewrite|保留\s*\/\s*合并\s*\/\s*删除\s*\/\s*重写/u)
  assert.match(combined, /TEXT_READABILITY_POLICY/)
  assert.match(combined, /DIALOGUE_POLICY/)
  assert.match(combined, /SHOT_DENSITY_CONTROLLER/)
  assert.match(combined, /pass\s*\/\s*warning\s*\/\s*fail|通过\s*\/\s*警告\s*\/\s*失败/u)
  assert.match(combined, /localized Keyframe prompts|局部化 Keyframe|局部化关键帧/u)
  assert.match(combined, /Director Cut.*rewrite|导演删减版.*重写/u)
})

test('golden rain-alley example is a valid production run', async () => {
  const exampleRun = join(root, 'examples', 'rain-alley')
  const result = await validateRunDirectory({ runDir: exampleRun, stage: 'production' })

  assert.equal(result.ok, true, result.errors.join('\n'))
  assert.deepEqual(result.errors, [])
})

