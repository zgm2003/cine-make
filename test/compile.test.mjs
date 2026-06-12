import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('cli writes a draft run with the compact user deliverable', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-run-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--out', out, '--duration', '15s', '--aspect', '9:16', '--style', 'noir', '--platform', 'jimeng', '广告短片：一杯咖啡让疲惫的程序员重新抬头。'], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'deliverable.md')))
    assert.ok(existsSync(join(out, 'storyboard-images', 'README.md')))
    assert.equal(existsSync(join(out, 'input-contract.json')), false)
    assert.equal(existsSync(join(out, 'agent-plan.json')), false)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /草稿模式/)
    assert.match(deliverable, /Codex 不生成最终视频/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('cli help is Jimeng-only', () => {
  const result = spawnSync(process.execPath, ['src/cli.mjs', '--help'], {
    cwd: root,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /--platform <jimeng>/)
  assert.doesNotMatch(result.stdout, /seedance|generic/i)
})

test('cli writes a manual Canvas prompt pack without storyboard images', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-canvas-pack-cli-'))
  const input = join(out, 'script.txt')
  try {
    await writeFile(input, `第一集剧本：【分崩离析的10分钟】
[场景：孤岛别墅 - 客厅 - 夜]
角色设定：
林默（男主角）：私家侦探。冷静、神经质。
安娜（女性）：心理医生，知性、冷静。
雷队（中年男）：脾气暴躁的警探。
阿杰（青年男）：胆小、唯唯诺诺的瘸子。
▲ 【画面】 林默猛地从沙发上惊醒，大口喘气。他看向自己的双手，满是鲜血。
▲ 【画面】 镜头拉开，客厅里还有另外三个人。
雷队（咬牙切齿）：
“林默，你终于醒了。”
安娜（温柔安抚）：
“林默，看着我。”
▲ 【画面】 林默的手机突然定时闹钟响起：【00:00:00】时间到。`, 'utf8')

    const result = spawnSync(process.execPath, ['src/cli.mjs', 'canvas-pack', '--input', input, '--out', out, '--aspect', '9:16'], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'canvas-project.zip')))
    assert.ok(existsSync(join(out, 'canvas-manifest.json')))
    assert.ok(existsSync(join(out, 'prompt-pack.md')))
    assert.ok(existsSync(join(out, 'README.md')))
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    const manifest = JSON.parse(await readFile(join(out, 'canvas-manifest.json'), 'utf8'))
    assert.equal(manifest.nodes.some((node) => node.role === 'video_segment'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'style_bible'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'style_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'character_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'environment_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'shot_list'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'keyframe'), false)
    assert.equal(manifest.connections.every((connection) => /^(style-reference|character-ref-|environment-ref-)/u.test(connection.toNodeId)), true)
    assert.match(result.stdout, /manual Canvas generation/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('cli writes a manual Canvas storyboard append pack without foundation nodes', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-canvas-storyboard-pack-cli-'))
  const input = join(out, 'script.txt')
  try {
    await writeFile(input, `第一集剧本：【分崩离析的10分钟】
[场景：孤岛别墅 - 客厅 - 夜]
角色设定：
林默（男主角）：私家侦探。冷静、神经质。
安娜（女性）：心理医生，知性、冷静。
雷队（中年男）：脾气暴躁的警探。
阿杰（青年男）：胆小、唯唯诺诺的瘸子。
▲ 【画面】 林默猛地从沙发上惊醒，大口喘气。他看向自己的双手，满是鲜血。
▲ 【画面】 镜头拉开，客厅里还有另外三个人。
雷队（咬牙切齿）：
“林默，你终于醒了。”
安娜（温柔安抚）：
“林默，看着我。”
▲ 【画面】 林默的手机突然定时闹钟响起：【00:00:00】时间到。`, 'utf8')

    const result = spawnSync(process.execPath, ['src/cli.mjs', 'canvas-storyboard-pack', '--input', input, '--out', out, '--aspect', '9:16'], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'canvas-project.zip')))
    assert.ok(existsSync(join(out, 'canvas-manifest.json')))
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    const manifest = JSON.parse(await readFile(join(out, 'canvas-manifest.json'), 'utf8'))
    assert.equal(manifest.kind, 'cine-make-canvas-storyboard-pack')
    assert.equal(manifest.packageType, 'manual_canvas_storyboard_append')
    assert.equal(manifest.mergeTarget, 'current_canvas')
    assert.equal(manifest.nodes.some((node) => node.role === 'shot_list'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'keyframe'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'character_reference'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'environment_reference'), false)
    assert.equal(manifest.nodes.some((node) => node.role === 'style_reference'), false)
    assert.match(result.stdout, /storyboard Canvas append/i)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('cli writes a full Canvas pack with reference-to-keyframe and storyboard-flow connections', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-canvas-full-pack-cli-'))
  const input = join(out, 'script.txt')
  try {
    await writeFile(input, `AI漫剧剧本：收租偶遇同班哑巴校花
人物
- 江渝白：男主，高中生
- 林听晚：女主，同班校花，对外装作哑巴
- 李大妈：二房东
- 晚晚：和林听晚容貌一致的少女

【分镜1】外景·老旧居民楼 全景
时长：3s
画面：江渝白站在楼下，抬头望楼。

【分镜2】楼道·楼梯间 中景
时长：4s
画面：江渝白缓步走上楼梯，前方传来一高一低两道女声。

【分镜3】结尾定格画面 双人+少女 全景
时长：5s
画面：江渝白震惊地看着里屋门口的少女。林听晚挡在前方，晚晚从门口探出。`, 'utf8')

    const result = spawnSync(process.execPath, ['src/cli.mjs', 'canvas-full-pack', '--input', input, '--out', out, '--aspect', '9:16', '--style', '国漫现实主义风格'], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'canvas-project.zip')))
    assert.ok(existsSync(join(out, 'canvas-manifest.json')))
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    const manifest = JSON.parse(await readFile(join(out, 'canvas-manifest.json'), 'utf8'))
    assert.equal(manifest.kind, 'cine-make-canvas-full-pack')
    assert.equal(manifest.packageType, 'manual_canvas_full_generation')
    assert.equal(manifest.nodes.some((node) => node.role === 'style_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'character_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'environment_reference'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'shot_list'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'keyframe'), true)
    assert.equal(manifest.connections.some((connection) => connection.fromNodeId === 'shot-list' && connection.toNodeId === 'keyframe-s01'), true)
    assert.equal(manifest.connections.some((connection) => connection.fromNodeId === 'keyframe-s01' && connection.toNodeId === 'keyframe-s02'), true)
    assert.equal(manifest.connections.some((connection) => connection.fromNodeId === 'style-reference' && connection.toNodeId === 'keyframe-s01'), true)
    assert.match(result.stdout, /full Canvas generation/i)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('cli writes a Seedance all-reference feed without storyboard artifacts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-seedance-feed-cli-'))
  const input = join(out, 'script.txt')
  try {
    await writeFile(input, '画面:雪山之巅，风雪之中。头发花白且凌乱的老道人身穿蓑衣，头戴斗笠，艰难的迎着风雪行走，双手放在胸前，怀里紧紧抱着一只虚弱的麒麟幼兽。身后的雪地上滴下长长的一道血痕，没走几步老道终于支撑不住倒在雪地里。怀里的麒麟幼兽摔在雪地上，看着倒在雪地的老道，坚强的起身用舌头舔舐老道的面颊，老道奄奄一息的伸出手触摸麒麟。', 'utf8')

    const result = spawnSync(process.execPath, ['src/cli.mjs', 'reference-feed', '--input', input, '--out', out, '--style', '3D古风写实，超写实真人电影质感，冷蓝灰雪山'], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'seedance-all-reference-feed.md')))
    assert.equal(existsSync(join(out, 'deliverable.md')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    const feed = await readFile(join(out, 'seedance-all-reference-feed.md'), 'utf8')
    assert.match(feed, /GPT-image-2 参考图生成提示词/u)
    assert.match(feed, /最左侧单独的上半身\+头部细节展示/u)
    assert.match(feed, /三视图为一张图/u)
    assert.match(feed, /16:9/u)
    assert.match(feed, /雪山之巅=图片1/u)
    assert.match(feed, /老年道清=图片2/u)
    assert.match(feed, /麒麟幼兽=图片3/u)
    assert.doesNotMatch(feed, /续接|承接|下一段|首帧|尾帧|segment|storyboard-images|S01/u)
    assert.match(result.stdout, /Seedance all-reference feed ready/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
