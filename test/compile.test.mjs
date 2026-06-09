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
    assert.equal(manifest.nodes.some((node) => node.role === 'preproduction_bible'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'shot_list'), true)
    assert.equal(manifest.nodes.some((node) => node.role === 'keyframe'), true)
    assert.equal(manifest.connections.every((connection) => connection.toNodeId.startsWith('keyframe-')), true)
    assert.match(result.stdout, /manual Canvas generation/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
