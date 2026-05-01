import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('render-images defaults to gpt-image-2, high quality, and aspect-aware high resolution', async () => {
  const runDir = await mkdtemp(join(tmpdir(), 'cine-make-render-ok-'))
  try {
    await writeMinimalRun(runDir)
    const fakeImageGen = join(runDir, 'fake-imagegen.mjs')
    await writeFile(fakeImageGen, [
      "import { writeFileSync } from 'node:fs'",
      "const out = process.argv[process.argv.indexOf('--out') + 1]",
      "writeFileSync(out, JSON.stringify({ argv: process.argv.slice(2), env: { baseUrl: process.env.OPENAI_BASE_URL || null, apiKeyPresent: Boolean(process.env.OPENAI_API_KEY) } }, null, 2))"
    ].join('\n'), 'utf8')

    const result = spawnSync(process.execPath, [
      'scripts/render-images.mjs',
      '--run',
      runDir,
      '--task',
      'episode-01/S01',
      '--image-gen',
      fakeImageGen,
      '--python',
      process.execPath
    ], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        OPENAI_BASE_URL: 'http://localhost:8317/v1',
        OPENAI_API_KEY: 'test-cpa-key'
      }
    })

    assert.equal(result.status, 0, result.stderr || result.stdout)

    const startFrame = JSON.parse(await readFile(join(runDir, 'episodes', 'episode-01', 'storyboard-images', 'S01-start.png'), 'utf8'))
    assert.equal(optionValue(startFrame.argv, '--model'), 'gpt-image-2')
    assert.equal(optionValue(startFrame.argv, '--quality'), 'high')
    assert.equal(optionValue(startFrame.argv, '--size'), '2160x3840')
    assert.equal(optionValue(startFrame.argv, '--prompt'), 'START PROMPT')
    assert.equal(startFrame.env.baseUrl, 'http://localhost:8317/v1')
    assert.equal(startFrame.env.apiKeyPresent, true)
    assert.match(result.stdout, /API base URL: http:\/\/localhost:8317\/v1/)
    assert.match(result.stdout, /API key env: OPENAI_API_KEY is set/)
    assert.ok(existsSync(join(runDir, 'episodes', 'episode-01', 'storyboard-images', 'S01-end.png')))
  } finally {
    await rm(runDir, { recursive: true, force: true })
  }
})

test('render-images writes $imagegen fallback manifests when the primary gpt-image-2 path fails', async () => {
  const runDir = await mkdtemp(join(tmpdir(), 'cine-make-render-fallback-'))
  try {
    await writeMinimalRun(runDir)
    const failingImageGen = join(runDir, 'failing-imagegen.mjs')
    await writeFile(failingImageGen, [
      "process.stderr.write('forced primary gpt-image-2 failure')",
      'process.exit(7)'
    ].join('\n'), 'utf8')

    const result = spawnSync(process.execPath, [
      'scripts/render-images.mjs',
      '--run',
      runDir,
      '--limit',
      '1',
      '--image-gen',
      failingImageGen,
      '--python',
      process.execPath
    ], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 2, result.stderr || result.stdout)

    const fallbackJsonPath = join(runDir, 'imagegen-fallback.json')
    const fallbackMdPath = join(runDir, 'imagegen-fallback.md')
    assert.ok(existsSync(fallbackJsonPath), 'fallback json should be written')
    assert.ok(existsSync(fallbackMdPath), 'fallback md should be written')

    const fallback = JSON.parse(await readFile(fallbackJsonPath, 'utf8'))
    assert.match(fallback.reason, /forced primary gpt-image-2 failure/)
    assert.equal(fallback.jobs.length, 1)
    assert.equal(fallback.jobs[0].id, 'episode-01/S01/start')
    assert.equal(fallback.jobs[0].prompt, 'START PROMPT')

    const fallbackMd = await readFile(fallbackMdPath, 'utf8')
    assert.match(fallbackMd, /built-in `\$imagegen`/)
    assert.match(fallbackMd, /episode-01\/S01\/start/)
    assert.match(fallbackMd, /START PROMPT/)
  } finally {
    await rm(runDir, { recursive: true, force: true })
  }
})

function optionValue(argv, option) {
  const index = argv.indexOf(option)
  assert.notEqual(index, -1, `missing ${option} in ${argv.join(' ')}`)
  return argv[index + 1]
}

async function writeMinimalRun(runDir) {
  await mkdir(join(runDir, 'episodes', 'episode-01', 'storyboard-images'), { recursive: true })
  await writeFile(join(runDir, 'continuity-bible.json'), JSON.stringify({
    schemaVersion: 1,
    mode: 'video-model-first',
    anchors: {
      aspectRatio: '9:16'
    },
    episodes: [
      {
        id: 'episode-01',
        tasks: [
          {
            id: 'S01',
            startFrame: 'storyboard-images/S01-start.png',
            endFrame: 'storyboard-images/S01-end.png',
            startFramePrompt: 'START PROMPT',
            endFramePrompt: 'END PROMPT'
          }
        ]
      }
    ]
  }, null, 2), 'utf8')
}
