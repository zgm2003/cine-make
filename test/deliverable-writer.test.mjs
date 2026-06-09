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
const isolatedMansionFullSource = `漫剧概念设定：《孤岛碎忆》

角色设定：
林默（男主角）：私家侦探。冷静、神经质。
安娜（女性）：心理医生，知性、冷静。一直试图“帮”林默找回记忆。
雷队（中年男）：脾气暴躁的暴风雪山庄式警探。
阿杰（青年男）：胆小、唯唯诺诺的瘸子，右脚有残疾。

第一集剧本：【分崩离析的10分钟】
[场景：孤岛别墅 - 客厅 - 夜]
▲ 【画面】 窗外暴雨倾盆，一道闪电划过，照亮昏暗的客厅。
▲ 【画面】 林默猛地从沙发上惊醒，大口喘气。他看向自己的双手，满是鲜血。
▲ 【音效】 惊雷声，紧接着是林默急促的呼吸声。
林默（内心独白）：“我是谁？这是哪？该死……我的头好痛。记忆又在消失……”
▲ 【画面】 林默急切地拉开衣袖。他的手臂上用小刀歪歪扭扭地刻着一行字：【我的记忆只有10分钟。凶手在他们中间。】
▲ 【画面】 镜头拉开，客厅里还有另外三个人。
雷队正拿着枪，警惕地守在门口。
安娜正在给林默倒热水，眼神充满担忧。
阿杰（瘸子）蜷缩在角落里，瑟瑟发抖。
雷队（咬牙切齿）：“林默，你终于醒了。刚刚停电的5分钟里，老张被杀了。现在死无对证。”
安娜（温柔安抚）：“雷队，别逼他。林默的‘失忆症’又犯了。林默，看着我，你还记得你来这座岛是干什么的吗？”
▲ 【画面】 林默痛苦地捂住头，无数碎片画面闪过：警徽、带血的解剖刀、一座叫“圣路易斯”的精神病院大门。
林默（沙哑）：“我是……来查案的。有人举报这里有非法活体实验……”
▲ 【画面】 角落里的瘸子阿杰突然冷笑了一声。所有人的目光看向他。
阿杰（声音颤抖，但眼神诡异）：“查案？林侦探，你别装了。其实你早就知道凶手是谁对不对？那个人……那个叫‘凯撒’的幕后黑手，就在这间屋子里！”
▲ 【画面】 林默的手机突然定时闹钟响起：【00:00:00】时间到。
▲ 【画面】 林默眼神瞬间空洞。下一秒，他再次惊恐地看着自己的血手，仿佛第一天来到这里。
林默（惊恐）：“你们……是谁？！”`

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

test('draft director judgment v2 groups beats and outputs concrete keep merge rewrite decisions', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-director-judgment-v2-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, '--duration', '46s', '--aspect', '9:16', isolatedMansionFullSource], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    const beats = sectionBetween(deliverable, '## SCRIPT_BEATS', '## DIRECTOR_DECISION')
    const decisions = sectionBetween(deliverable, '## DIRECTOR_DECISION', '## DIRECTOR_BIBLE')
    const shotDefinitions = sectionBetween(deliverable, '## STORYBOARD：Shot Definition', '## KEYFRAME_PROMPTS')

    const beatCount = [...beats.matchAll(/^### B\d{2}\b/gm)].length
    const shotCount = [...shotDefinitions.matchAll(/^### S\d{2}\b/gm)].length
    assert.ok(beatCount > 0, 'expected grouped beats')
    assert.ok(shotCount > beatCount, `expected fewer beats than shots, got beats=${beatCount}, shots=${shotCount}`)
    assert.doesNotMatch(beats, /### B\d{2}\s*->\s*S\d{2}/u)
    assert.match(beats, /script_source:/u)
    assert.match(beats, /recommended_shots:/u)
    assert.match(beats, /can_merge_with:/u)
    assert.match(beats, /B02[\s\S]*林默惊醒[\s\S]*血手/u)
    assert.match(beats, /B03[\s\S]*10分钟|B03[\s\S]*记忆规则/u)

    assert.match(decisions, /decision: keep/u)
    assert.match(decisions, /decision: merge/u)
    assert.match(decisions, /decision: rewrite/u)
    assert.match(decisions, /S0[34][\s\S]*text_readability_conflict[\s\S]*tight insert|S0[34][\s\S]*文字阅读[\s\S]*tight insert/u)
    assert.match(decisions, /S0[67][\s\S]*安娜[\s\S]*热水杯[\s\S]*decision: (merge|rewrite)/u)
    assert.match(decisions, /S0[78][\s\S]*阿杰[\s\S]*弱者伪装[\s\S]*decision: keep/u)
    assert.match(decisions, /S(09|1[34])[\s\S]*阿杰[\s\S]*(冷笑|嘴角|诡异眼神)/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('draft director judgment v2 emits smart anchors structured risks policies quality states and local keyframes', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-director-judgment-v2-quality-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, '--duration', '46s', '--aspect', '9:16', isolatedMansionFullSource], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')

    assert.match(deliverable, /## TEXT_READABILITY_POLICY/)
    assert.match(deliverable, /文字必须是 primary anchor/u)
    assert.match(deliverable, /## DIALOGUE_POLICY/)
    assert.match(deliverable, /visual_cut_dialogue|短台词/u)
    assert.match(deliverable, /## SHOT_DENSITY_CONTROLLER/)
    assert.match(deliverable, /ideal: 12|ideal_shots: 12/u)

    const anchorPolicy = sectionBetween(deliverable, '## ANCHOR_POLICY', '## STORYBOARD：Shot Definition')
    assert.match(anchorPolicy, /S0[45]: primary=(四人空间棋盘|屋内三人位置)/u)
    assert.match(anchorPolicy, /S0[67]: primary=热水杯/u)
    assert.match(anchorPolicy, /S(09|1[34]): primary=阿杰(嘴角冷笑|诡异眼神)/u)
    assert.match(anchorPolicy, /S1[05]: primary=手机 00:00:00/u)

    const risks = sectionBetween(deliverable, '## AI_RISK_WARNINGS', '## DIRECTOR_BIBLE')
    assert.match(risks, /risk_type: macro_action_conflict/u)
    assert.match(risks, /risk_type: text_readability_conflict/u)
    assert.match(risks, /risk_type: multi_character_spatial_conflict/u)
    assert.match(risks, /risk_type: visual_priority_mismatch/u)
    assert.match(risks, /severity: high/u)
    assert.match(risks, /problem:/u)
    assert.match(risks, /fix:/u)

    const quality = sectionBetween(deliverable, '## QUALITY_CHECK', '## AI_RISK_WARNINGS')
    assert.match(quality, /text_readability:[\s\S]*status: fail/u)
    assert.match(quality, /anchor_policy:[\s\S]*status: warning|anchor_policy:[\s\S]*status: pass/u)
    assert.match(quality, /motion_prompt:[\s\S]*status: pass/u)

    const keyframes = sectionBetween(deliverable, '## KEYFRAME_PROMPTS', '## MOTION_PROMPTS')
    assert.doesNotMatch(keyframes, /超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性/u)
    assert.match(keyframes, /S0[34][\s\S]*(tight insert|close-up)[\s\S]*我的记忆只有10分钟/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

function sectionBetween(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading)
  assert.notEqual(start, -1, `missing ${startHeading}`)
  const end = text.indexOf(endHeading, start + startHeading.length)
  assert.notEqual(end, -1, `missing ${endHeading}`)
  return text.slice(start, end)
}
