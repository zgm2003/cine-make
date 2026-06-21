import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('cli writes the default ChatGPT-only Seedance package', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-run-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--out', out, '--aspect', '16:9', '--style', '3D国漫', '广告短片：一杯咖啡让疲惫的程序员重新抬头。'], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'seedance-all-reference-feed.md')))
    assert.equal(existsSync(join(out, 'canvas-project.zip')), false)
    assert.equal(existsSync(join(out, 'canvas-manifest.json')), false)
    assert.equal(existsSync(join(out, 'projects.json')), false)
    assert.equal(existsSync(join(out, 'prompt-pack.md')), false)
    assert.ok(existsSync(join(out, 'README.md')))
    assert.equal(existsSync(join(out, 'deliverable.md')), false)
    assert.equal(existsSync(join(out, 'storyboard-images')), false)
    assert.equal(existsSync(join(out, 'input-contract.json')), false)
    assert.equal(existsSync(join(out, 'agent-plan.json')), false)

    const feed = await readFile(join(out, 'seedance-all-reference-feed.md'), 'utf8')
    assert.match(feed, /逐条视频文本/u)
    assert.match(result.stdout, /ChatGPT-only Seedance feed ready/u)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})

test('cli help promotes ChatGPT-only Seedance only', () => {
  const result = spawnSync(process.execPath, ['src/cli.mjs', '--help'], {
    cwd: root,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /seedance-pack/u)
  assert.match(result.stdout, /ChatGPT-only Seedance all-reference feed/u)
  assert.doesNotMatch(result.stdout, /canvas-pack|canvas-storyboard-pack|canvas-full-pack|novel canvas|--mode <draft\|visual>|--mode draft|--mode visual/u)
})

for (const command of ['canvas-pack', 'canvas-storyboard-pack', 'canvas-full-pack']) {
  test(`cli rejects deprecated Canvas command: ${command}`, async () => {
    const out = await mkdtemp(join(tmpdir(), `cine-make-${command}-disabled-`))
    const input = join(out, 'script.txt')
    try {
      await writeFile(input, '第一集剧本：林默醒来，看见血手。', 'utf8')
      const result = spawnSync(process.execPath, ['src/cli.mjs', command, '--input', input, '--out', out, '--aspect', '9:16'], {
        cwd: root,
        encoding: 'utf8'
      })

      assert.notEqual(result.status, 0)
      assert.match(result.stderr, /Canvas package output is disabled/u)
      assert.equal(existsSync(join(out, 'canvas-project.zip')), false)
      assert.equal(existsSync(join(out, 'canvas-manifest.json')), false)
      assert.equal(existsSync(join(out, 'prompt-pack.md')), false)
    } finally {
      await rm(out, { recursive: true, force: true })
    }
  })
}

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
