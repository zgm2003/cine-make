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

test('draft mode writes a video-model task package without exposing debug internals in stdout', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-deliverable-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--mode', 'draft', '--out', out, '--duration', '30s', '--aspect', '9:16', '--platform', 'seedance', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'deliverable.md')))
    assert.ok(existsSync(join(out, 'storyboard-images', 'README.md')))
    assert.ok(existsSync(join(out, 'continuity-bible.json')))
    assert.ok(existsSync(join(out, 'episodes', 'episode-01', 'video-tasks', 'S01.md')))
    assert.equal(existsSync(join(out, 'input-contract.json')), false)
    assert.equal(existsSync(join(out, 'agent-plan.json')), false)
    assert.equal(existsSync(join(out, 'tasks')), false)
    assert.equal(existsSync(join(out, 'reviews')), false)

    const rootEntries = (await readdir(out)).sort()
    assert.deepEqual(rootEntries, ['continuity-bible.json', 'deliverable.md', 'episodes', 'storyboard-images'])

    assert.match(result.stdout, /Cine Make ready \(draft\)/)
    assert.match(result.stdout, /deliverable:/)
    assert.match(result.stdout, /storyboard images:/)
    assert.match(result.stdout, /episodes:/)
    assert.match(result.stdout, /continuity bible:/)
    assert.doesNotMatch(result.stdout, /input-contract\.json/)
    assert.doesNotMatch(result.stdout, /agent-plan\.json/)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /# Cine Make Deliverable/)
    assert.match(deliverable, /草稿模式/)
    assert.match(deliverable, /## 成片预览/)
    assert.match(deliverable, /## 故事全流程/)
    assert.match(deliverable, /## 精简分镜/)
    assert.match(deliverable, /视频工具投喂包/)
    assert.match(deliverable, /完整剧情拆解与视频任务队列/)
    assert.match(deliverable, /start_frame/)
    assert.match(deliverable, /end_frame/)
    assert.match(deliverable, /video-tasks/)
    assert.match(deliverable, /每条任务只做一个可见动作/)
    assert.match(deliverable, /\$imagegen prompt: start frame/)
    assert.match(deliverable, /\$imagegen prompt: end frame/)
    assert.match(deliverable, /Video model prompt/)
    assert.match(deliverable, /episodes\/episode-01\/storyboard-images\/S01-start\.png/)
    assert.match(deliverable, /episodes\/episode-01\/storyboard-images\/S01-end\.png/)
    assert.match(deliverable, /Codex 不生成最终视频/)

    assert.ok(deliverable.indexOf('## 成片预览') < deliverable.indexOf('## 故事全流程'))
    assert.ok(deliverable.indexOf('## 故事全流程') < deliverable.indexOf('## 完整剧情拆解与视频任务队列'))
    assert.ok(deliverable.indexOf('## 完整剧情拆解与视频任务队列') < deliverable.indexOf('## 精简分镜'))
    assert.ok(deliverable.indexOf('## 精简分镜') < deliverable.indexOf('## 故事板图片清单'))
    assert.ok(deliverable.indexOf('## 故事板图片清单') < deliverable.indexOf('## 视频工具投喂包'))
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
    assert.deepEqual((await readdir(out)).sort(), ['.cine-make-internal', 'continuity-bible.json', 'deliverable.md', 'episodes', 'storyboard-images'])
    assert.ok(existsSync(join(out, '.cine-make-internal', 'input-contract.json')))
    assert.ok(existsSync(join(out, '.cine-make-internal', 'agent-plan.json')))
    assert.ok(existsSync(join(out, 'episodes', 'episode-01', 'video-tasks', 'S01.md')))
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
    assert.match(readme, /S01-start\.png/)
    assert.match(readme, /S01-end\.png/)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /人物参考图/)
    assert.match(deliverable, /refs\/hero\.png/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
