import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('cine-make skill is a lightweight workflow contract without embedded story examples', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')

  assert.ok(skill.length < 7000, `skill is too large: ${skill.length} characters`)
  assert.doesNotMatch(skill, /雪山|麒麟|替嫁|许怡宁|许悠然|江凡|林夜|鬼王宗/u)
  assert.doesNotMatch(skill, /Good user prompts|Layered cinematic pipeline|DIRECTOR_DECISION|SCRIPT_BEATS/u)
})

test('cine-make skill names the hard gates that caused the 15-second failure', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')

  assert.match(skill, /15秒容量闸门/u)
  assert.match(skill, /不能自然容纳/u)
  assert.match(skill, /先提醒/u)
  assert.match(skill, /OS\/对白.*一字不改/u)
  assert.match(skill, /序号 时间 内\/外 具体地点 角色 动作画面 主体\/景别\/机位\/构图\/光影 运镜 台词\/音效/u)
  assert.match(skill, /上传参考图：图片1｜/u)
  assert.match(skill, /GPT-image-2，<比例>，.*4K画质！/u)
})
