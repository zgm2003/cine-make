import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = '小说片段：退役潜水员周祁回到废弃海洋馆，空水箱里传来鲸鱼低鸣，玻璃内侧贴着女儿画的蓝鲸。'

test('draft mode exposes only deliverable.md and storyboard-images to users', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-deliverable-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, '--duration', '30s', '--aspect', '9:16', '--platform', 'jimeng', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'deliverable.md')))
    assert.ok(existsSync(join(out, 'storyboard-images', 'README.md')))
    assert.equal(existsSync(join(out, 'continuity-bible.json')), false)
    assert.equal(existsSync(join(out, 'episodes')), false)
    assert.equal(existsSync(join(out, 'input-contract.json')), false)
    assert.equal(existsSync(join(out, 'agent-plan.json')), false)
    assert.equal(existsSync(join(out, 'tasks')), false)
    assert.equal(existsSync(join(out, 'reviews')), false)

    const rootEntries = (await readdir(out)).sort()
    assert.deepEqual(rootEntries, ['deliverable.md', 'storyboard-images'])

    assert.match(result.stdout, /Cine Make ready \(draft\)/)
    assert.match(result.stdout, /deliverable:/)
    assert.match(result.stdout, /storyboard images:/)
    assert.doesNotMatch(result.stdout, /episodes:/)
    assert.doesNotMatch(result.stdout, /continuity bible:/)
    assert.doesNotMatch(result.stdout, /input-contract\.json/)
    assert.doesNotMatch(result.stdout, /agent-plan\.json/)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /# Cine Make Deliverable/)
    assert.match(deliverable, /草稿模式/)
    assert.match(deliverable, /## 成片预览/)
    assert.match(deliverable, /## 故事全流程/)
    assert.match(deliverable, /## 精简分镜/)
    assert.match(deliverable, /视频工具投喂包/)
    assert.match(deliverable, /最终交付给用户只看这两项/)
    assert.match(deliverable, /storyboard-images\/S01\.png/)
    assert.match(deliverable, /超写实真人电影质感/)
    assert.doesNotMatch(deliverable, /动漫二次元|非真人写实/)
    assert.match(deliverable, /每段上传图片最多\s+9\s+张/)
    assert.match(deliverable, /上传图片控制在\s+9\s+张以内/)
    assert.doesNotMatch(deliverable, /每段即梦投喂卡最多\s+\d+\s+个参考素材位/)
    assert.doesNotMatch(deliverable, /图片、视频和音频都占用同一个素材额度/)
    assert.match(deliverable, /即梦/)
    assert.doesNotMatch(deliverable, /FORMAT：/)
    assert.doesNotMatch(deliverable, /主体锁定：/)
    assert.doesNotMatch(deliverable, /时间线：/)
    assert.doesNotMatch(deliverable, /```text/)
    assert.doesNotMatch(deliverable, /完整剧情拆解与视频任务队列/)
    assert.doesNotMatch(deliverable, /continuity-bible\.json/)
    assert.doesNotMatch(deliverable, /episodes\//)
    assert.match(deliverable, /Codex 不生成最终视频/)
    assert.match(deliverable, /出图模式/)
    assert.doesNotMatch(deliverable, /视觉包模式/)
    assert.doesNotMatch(deliverable, /生产模式/)

    assert.ok(deliverable.indexOf('## 成片预览') < deliverable.indexOf('## 故事全流程'))
    assert.ok(deliverable.indexOf('## 故事全流程') < deliverable.indexOf('## 精简分镜'))
    assert.ok(deliverable.indexOf('## 精简分镜') < deliverable.indexOf('## 出图清单'))
    assert.ok(deliverable.indexOf('## 出图清单') < deliverable.indexOf('## 视频工具投喂包'))
    assert.equal(deliverable.includes('## 故事板图片清单'), false)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('debug artifacts are opt-in and isolated from the user-facing root', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-debug-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--emit-internal', '--out', out, source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual((await readdir(out)).sort(), ['.cine-make-internal', 'deliverable.md', 'storyboard-images'])
    assert.ok(existsSync(join(out, '.cine-make-internal', 'input-contract.json')))
    assert.ok(existsSync(join(out, '.cine-make-internal', 'agent-plan.json')))
    assert.ok(existsSync(join(out, '.cine-make-internal', 'continuity-bible.json')))
    assert.ok(existsSync(join(out, '.cine-make-internal', 'episodes', 'episode-01', 'video-tasks', 'S01.md')))
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('visual mode prepares an image-output queue and keeps references optional', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-visual-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      '--duration',
      '15s',
      '--aspect',
      '9:16',
      '--platform',
      'jimeng',
      '--character-image',
      'refs/hero.png',
      source
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Cine Make ready \(visual\)/)

    const readme = await readFile(join(out, 'storyboard-images', 'README.md'), 'utf8')
    assert.match(readme, /出图模式/)
    assert.match(readme, /refs\/hero\.png/)
    assert.match(readme, /S01\.png/)
    assert.doesNotMatch(readme, /S01-start\.png/)
    assert.doesNotMatch(readme, /episodes\//)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /人物参考图/)
    assert.match(deliverable, /refs\/hero\.png/)
    assert.match(deliverable, /出图模式/)
    assert.doesNotMatch(deliverable, /视觉包模式/)
    assert.doesNotMatch(deliverable, /生产模式/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('generated character reference prompt is a photoreal white-background tri-view character sheet', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-character-sheet-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'visual', '--out', out, '--duration', '15s', '--aspect', '9:16', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    const promptStart = deliverable.indexOf('### 主角参考图 -> storyboard-images/character-reference.png')
    const promptEnd = deliverable.indexOf('### 场景图 -> storyboard-images/scene-reference.png')
    assert.ok(promptStart >= 0)
    assert.ok(promptEnd > promptStart)
    const characterPrompt = deliverable.slice(promptStart, promptEnd)

    assert.match(characterPrompt, /超写实真人电影质感/)
    assert.match(characterPrompt, /85mm镜头/)
    assert.match(characterPrompt, /4K/)
    assert.match(characterPrompt, /白底/)
    assert.match(characterPrompt, /正面/)
    assert.match(characterPrompt, /侧面/)
    assert.match(characterPrompt, /背面/)
    assert.match(characterPrompt, /人物名称/)
    assert.match(characterPrompt, /身高/)
    assert.match(characterPrompt, /核心道具/)
    assert.match(characterPrompt, /不显示年龄/)
    assert.match(characterPrompt, /毛孔清晰/)
    assert.match(characterPrompt, /服装.*细节/)
    assert.doesNotMatch(characterPrompt, /动漫|二次元|非真人写实|anime/i)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('hospital rider story keeps the delivery rider as the subject, not the girl in the phone call', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-rider-'))
  const riderSource = '雨夜，外卖骑手林野接到一单没有地址的医院订单。APP 只显示“13楼，红色弹珠”。手机里传来小女孩的声音：“哥哥，别回头。”'
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'visual', '--out', out, '--duration', '15s', '--aspect', '9:16', riderSource], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /主角锚点：外卖骑手林野/)
    assert.doesNotMatch(deliverable, /主角锚点：女孩/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('layered cinematic pipeline separates bibles static keyframes and concise motion prompts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-layered-'))
  const thrillerSource = `第一集剧本：【分崩离析的10分钟】
[场景：孤岛别墅 - 客厅 - 夜]
▲ 【画面】 窗外暴雨倾盆，一道闪电划过，照亮昏暗的客厅。
▲ 【画面】 林默猛地从沙发上惊醒，大口喘气。他看向自己的双手，满是鲜血。
▲ 【画面】 林默急切地拉开衣袖。他的手臂上刻着：【我的记忆只有10分钟。凶手在他们中间。】
▲ 【画面】 镜头拉开，客厅里还有安娜、雷队、阿杰。`

  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, '--duration', '15s', '--aspect', '9:16', thrillerSource], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')

    assert.match(deliverable, /## DIRECTOR_BIBLE/)
    assert.match(deliverable, /## CHARACTER_BIBLE/)
    assert.match(deliverable, /## SCENE_BIBLE/)
    assert.match(deliverable, /## ART_DIRECTION/)
    assert.match(deliverable, /## STORYBOARD：Shot Definition/)
    assert.match(deliverable, /## KEYFRAME_PROMPTS/)
    assert.match(deliverable, /## MOTION_PROMPTS/)
    assert.ok(deliverable.indexOf('## KEYFRAME_PROMPTS') < deliverable.indexOf('## MOTION_PROMPTS'))
    assert.match(deliverable, /Static Shot Definition/u)
    assert.match(deliverable, /Motion Prompt/u)
    assert.doesNotMatch(deliverable, /按精简分镜顺序生成 .*；.*；.*；/u)
    assert.doesNotMatch(deliverable, /表情克制，眉眼和手部先于身体动作泄露情绪/u)

    const keyframeSection = deliverable.slice(deliverable.indexOf('## KEYFRAME_PROMPTS'), deliverable.indexOf('## MOTION_PROMPTS'))
    assert.doesNotMatch(keyframeSection, /二级动画|breathing becomes|slow push-in.*breathing|视频模型/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('draft deliverable adds story beats director decisions anchor policy and quality checks', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-director-decision-'))
  const source = [
    '漫剧概念设定：《孤岛碎忆》',
    '林默醒来发现自己置身暴风雨中的孤岛别墅客厅，只有10分钟短期记忆。',
    '▲ 【画面】 林默猛地从沙发上惊醒，看见满手鲜血。',
    '▲ 【画面】 他拉开袖口，手臂刻着：我的记忆只有10分钟。凶手在他们中间。',
    '▲ 【画面】 客厅里出现安娜、雷队、阿杰三个人。',
    '▲ 【画面】 雷队拿枪质问刚刚有人被杀。',
    '▲ 【画面】 阿杰在角落里抛出凯撒悬念。',
    '▲ 【画面】 手机倒计时归零，林默再次失忆。'
  ].join('\n')

  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, '--duration', '30s', '--aspect', '9:16', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')

    assert.match(deliverable, /## SCRIPT_BEATS/)
    assert.match(deliverable, /## DIRECTOR_DECISION/)
    assert.match(deliverable, /## ENVIRONMENT_BIBLES/)
    assert.match(deliverable, /## ANCHOR_POLICY/)
    assert.match(deliverable, /## Storyboard Version A: Full Coverage/)
    assert.match(deliverable, /## Storyboard Version B: Director Cut/)
    assert.match(deliverable, /## QUALITY_CHECK/)
    assert.match(deliverable, /## AI_RISK_WARNINGS/)
    assert.match(deliverable, /story_function/)
    assert.match(deliverable, /audience_question/)
    assert.match(deliverable, /can_be_merged/)
    assert.match(deliverable, /shot_function/)
    assert.match(deliverable, /audience_takeaway/)
    assert.match(deliverable, /visual_priority/)
    assert.match(deliverable, /每镜最多 1 个 primary anchor，最多 2 个 secondary anchors/)
    assert.match(deliverable, /wide 镜头承担文字阅读|macro 镜头承担复杂表演|每镜强制出现不必要道具/u)

    assert.doesNotMatch(deliverable, /手机.*必须作为稳定视觉锚点|倒计时.*必须作为稳定视觉锚点/u)

    const keyframeSection = deliverable.slice(deliverable.indexOf('## KEYFRAME_PROMPTS'), deliverable.indexOf('## MOTION_PROMPTS'))
    assert.doesNotMatch(keyframeSection, /手机.*必须作为稳定视觉锚点|倒计时.*必须作为稳定视觉锚点/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
