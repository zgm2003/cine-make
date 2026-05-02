import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

const longSource = [
  '小说片段：凌晨三点，外卖员陈默送最后一单到废弃医院。',
  '门卫室的灯早就坏了，只有电梯间从楼里透出一条冷白光。',
  '他按下一楼按钮，电梯却自己下降到负一层又猛地升高。',
  '楼层显示停在不存在的十三楼，门缝里飘出消毒水和雨水混合的味道。',
  '门开后，十年前失踪的妹妹坐在护士站后，穿着失踪当天的白裙。',
  '她没有说话，只把一颗红色弹珠推到桌沿。',
  '陈默认出那是小时候他弄丢的弹珠，手指开始发抖。',
  '弹珠滚过地面，在他鞋尖前停住，里面倒映出电梯门正在合拢。',
  '妹妹终于抬头看他，像小时候一样无声地叫了一声哥。',
  '陈默伸手去拉她，护士站后的灯却一盏盏熄灭。',
  '电梯里传来新的订单提示音，收货地址正是十三楼护士站。',
  '他回头看见电梯门重新打开，门里站着另一个浑身湿透的自己。'
].join('')

test('debug mode keeps long-story episode video tasks internal', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-video-tasks-'))
  try {
    const result = spawnSync(process.execPath, [
      'src/cli.mjs',
      '--mode',
      'visual',
      '--out',
      out,
      '--emit-internal',
      '--duration',
      '60s',
      '--aspect',
      '9:16',
      longSource
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)

    const internalDir = join(out, '.cine-make-internal')
    const biblePath = join(internalDir, 'continuity-bible.json')
    assert.ok(existsSync(biblePath), 'continuity-bible.json should exist')
    const bible = JSON.parse(await readFile(biblePath, 'utf8'))
    assert.ok(bible.sourceBeats.length >= 10, 'long source beats should be preserved, not compressed away')
    assert.ok(bible.episodes.length >= 2, 'long source should be split into multiple episodes')

    const episodeDir = join(internalDir, 'episodes', 'episode-01')
    const taskPath = join(episodeDir, 'video-tasks', 'S01.md')
    assert.ok(existsSync(join(episodeDir, 'episode.md')), 'episode.md should exist')
    assert.ok(existsSync(join(episodeDir, 'storyboard.md')), 'director storyboard should exist')
    assert.ok(existsSync(join(episodeDir, 'storyboard-images', 'README.md')), 'episode storyboard queue should exist')
    assert.ok(existsSync(taskPath), 'per-shot video task should exist')

    const task = await readFile(taskPath, 'utf8')
    assert.match(task, /start_frame: `storyboard-images\/S01-start\.png`/)
    assert.match(task, /end_frame: `storyboard-images\/S01-end\.png`/)
    assert.match(task, /Frame role: START_FRAME/)
    assert.match(task, /Frame role: END_FRAME/)
    assert.match(task, /Visual delta:/)
    assert.match(task, /## Director storyboard/)
    assert.match(task, /shot_size:/)
    assert.match(task, /composition:/)
    assert.match(task, /performance:/)
    assert.match(task, /Director storyboard:/)
    assert.match(task, /motion:/)
    assert.match(task, /must_keep:/)
    assert.match(task, /avoid:/)
    assert.doesNotMatch(task, /把整段剧情理解成/)

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /完整保留剧情/)
    assert.match(deliverable, /精简分镜/)
    assert.match(deliverable, /景别/)
    assert.doesNotMatch(deliverable, /video-tasks/)
    assert.doesNotMatch(deliverable, /start_frame/)
    assert.doesNotMatch(deliverable, /end_frame/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
