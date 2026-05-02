import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateRunDirectory, validateShotlist } from '../src/run-validator.mjs'

test('validates a complete production run', async () => {
  const runDir = await mkdtemp(join(tmpdir(), 'cine-make-valid-run-'))
  try {
    await writeValidProductionRun(runDir)
    const result = await validateRunDirectory({ runDir, stage: 'production' })
    assert.equal(result.ok, true)
    assert.deepEqual(result.errors, [])
  } finally {
    await rm(runDir, { recursive: true, force: true })
  }
})

test('reports missing production assets and invalid shot fields', async () => {
  const runDir = await mkdtemp(join(tmpdir(), 'cine-make-invalid-run-'))
  try {
    await writeFile(join(runDir, 'input-contract.json'), JSON.stringify(baseContract(), null, 2), 'utf8')
    await writeFile(join(runDir, 'shotlist.json'), JSON.stringify([{ shot_id: 'S01' }], null, 2), 'utf8')
    const result = await validateRunDirectory({ runDir, stage: 'production' })

    assert.equal(result.ok, false)
    assert.match(result.errors.join('\n'), /missing required file: director-script\.md/)
    assert.match(result.errors.join('\n'), /shotlist\[0\]\.duration_seconds is required/)
  } finally {
    await rm(runDir, { recursive: true, force: true })
  }
})

test('accepts a clean user-facing package without continuity bible or episode tree', async () => {
  const runDir = await mkdtemp(join(tmpdir(), 'cine-make-public-run-'))
  try {
    await mkdir(join(runDir, 'storyboard-images'), { recursive: true })
    await writeFile(join(runDir, 'deliverable.md'), '# Cine Make Deliverable\n\nCodex 不生成最终视频。', 'utf8')
    await writeFile(join(runDir, 'storyboard-images', 'README.md'), '# Storyboard images\n', 'utf8')

    const result = await validateRunDirectory({ runDir, stage: 'production' })

    assert.equal(result.ok, true, result.errors.join('\n'))
    assert.deepEqual(result.errors, [])
  } finally {
    await rm(runDir, { recursive: true, force: true })
  }
})

test('rejects final video claims in generated assets', async () => {
  const runDir = await mkdtemp(join(tmpdir(), 'cine-make-video-claim-'))
  try {
    await writeValidProductionRun(runDir)
    await writeFile(join(runDir, 'seedance-pack.md'), 'Codex generated the final mp4 video successfully.', 'utf8')
    const result = await validateRunDirectory({ runDir, stage: 'production' })

    assert.equal(result.ok, false)
    assert.match(result.errors.join('\n'), /forbidden final-video claim/)
  } finally {
    await rm(runDir, { recursive: true, force: true })
  }
})

test('shotlist validator enforces shot count and required fields', () => {
  const result = validateShotlist({
    shotlist: [{ shot_id: 'S01', duration_seconds: 4 }],
    expectedShotCount: 2
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /expected 2 shots, got 1/)
  assert.match(result.errors.join('\n'), /shotlist\[0\]\.scene is required/)
})

function baseContract() {
  return {
    schemaVersion: 1,
    title: 'Rain Alley',
    slug: 'rain-alley',
    sourceText: '雨夜里，女孩在巷口停下脚步。',
    contentType: 'novel_excerpt',
    target: {
      durationSeconds: 30,
      aspectRatio: '9:16',
      style: 'cinematic noir',
      platform: 'seedance',
      shotCount: 2,
      storyboardCount: 2
    },
    references: [],
    boundaries: {
      codexCanGenerate: ['text production assets', 'storyboard/keyframe images through image generation tools'],
      codexCannotGenerate: ['mp4 video'],
      finalVideoOwner: 'external video model'
    }
  }
}

async function writeValidProductionRun(runDir) {
  await mkdir(join(runDir, 'storyboard-images'), { recursive: true })
  await mkdir(join(runDir, 'episodes', 'episode-01', 'storyboard-images'), { recursive: true })
  await mkdir(join(runDir, 'episodes', 'episode-01', 'video-tasks'), { recursive: true })
  await mkdir(join(runDir, 'exports'), { recursive: true })
  await writeFile(join(runDir, 'storyboard-images', 'README.md'), '# Storyboard images\n\nNo images yet.', 'utf8')
  await writeFile(join(runDir, 'continuity-bible.json'), JSON.stringify(validContinuityBible(), null, 2), 'utf8')
  await writeFile(join(runDir, 'episodes', 'episode-01', 'episode.md'), '# Episode 01\n\nS01-S02', 'utf8')
  await writeFile(join(runDir, 'episodes', 'episode-01', 'storyboard.md'), '# Director Storyboard episode-01\n\n## S01', 'utf8')
  await writeFile(join(runDir, 'episodes', 'episode-01', 'storyboard-images', 'README.md'), '# Episode images\n\nUse start/end frames.', 'utf8')
  await writeFile(join(runDir, 'episodes', 'episode-01', 'video-tasks', 'S01.md'), '# Video Task episode-01/S01\n\nstart_frame: `storyboard-images/S01-start.png`\nend_frame: `storyboard-images/S01-end.png`\n', 'utf8')
  await writeFile(join(runDir, 'input-contract.json'), JSON.stringify(baseContract(), null, 2), 'utf8')
  await writeFile(join(runDir, 'source-package.md'), '# Source package\n\n雨夜里，女孩在巷口停下脚步。', 'utf8')
  await writeFile(join(runDir, 'production-brief.md'), '# Production brief\n\nPre-production only.', 'utf8')
  await writeFile(join(runDir, 'prompt-pack.md'), '# Prompt pack\n\nDirector workflow.', 'utf8')
  await writeFile(join(runDir, 'imagegen-brief.md'), '# Image generation brief\n\nGenerate still images only.', 'utf8')
  await writeFile(join(runDir, 'video-model-pack.md'), '# Video model pack\n\nExternal synthesis pack.', 'utf8')
  await writeFile(join(runDir, 'agent-handoff.md'), '# Agent handoff\n\nNo final video claim.', 'utf8')
  await writeFile(join(runDir, 'agent-plan.json'), JSON.stringify({ mode: 'video-preproduction-factory', tasks: [{ id: '01' }] }, null, 2), 'utf8')
  await writeFile(join(runDir, 'deliverable.md'), '# Cine Make Deliverable\n\nCodex 不生成最终视频。', 'utf8')
  await writeFile(join(runDir, 'director-script.md'), '# Director script\n\nA filmable two-shot scene.', 'utf8')
  await writeFile(join(runDir, 'characters.json'), JSON.stringify([{ id: 'A', anchor: 'young woman in black raincoat' }], null, 2), 'utf8')
  await writeFile(join(runDir, 'shotlist.json'), JSON.stringify(validShotlist(), null, 2), 'utf8')
  await writeFile(join(runDir, 'storyboard-board.md'), '# Storyboard board\n\nS01-S02', 'utf8')
  await writeFile(join(runDir, 'storyboard-prompts.md'), '# Storyboard prompts\n\nStill keyframes only.', 'utf8')
  await writeFile(join(runDir, 'reference-pack.md'), '# Reference pack\n\nNo generated images yet.', 'utf8')
  await writeFile(join(runDir, 'seedance-pack.md'), '# Seedance pack\n\nExternal synthesis prompt pack.', 'utf8')
  await writeFile(join(runDir, 'jimeng-pack.md'), '# Jimeng pack\n\nExternal synthesis prompt pack.', 'utf8')
  await writeFile(join(runDir, 'continuity-review.md'), '# Continuity review\n\nNo blocking issues.', 'utf8')
}

function validContinuityBible() {
  return {
    schemaVersion: 1,
    mode: 'video-model-first',
    policy: 'preserve-full-story-and-split-into-episodes',
    anchors: {
      protagonist: 'young woman',
      secondary: 'black umbrella figure',
      keyObject: 'black umbrella',
      location: 'rain alley',
      impossibleSign: 'neon signal'
    },
    sourceBeats: [
      { id: 'B01', text: '雨夜里，女孩在巷口停下脚步。' },
      { id: 'B02', text: '她看见黑伞人影。' }
    ],
    episodes: [
      {
        id: 'episode-01',
        title: '第 1 段',
        beatIds: ['B01', 'B02'],
        durationSeconds: 8,
        tasks: [
          {
            id: 'S01',
            beatId: 'B01',
            durationSeconds: 4,
            storyboard: {
              shotSize: 'medium close-up',
              lens: '40mm natural perspective',
              cameraMove: 'slow push-in',
              composition: 'neon reflection splits the frame',
              blocking: 'young woman stops at the alley mouth',
              performance: 'holds breath and looks back',
              lighting: 'cold rain and red neon'
            },
            startFrame: 'storyboard-images/S01-start.png',
            endFrame: 'storyboard-images/S01-end.png'
          }
        ]
      }
    ]
  }
}

function validShotlist() {
  return [
    {
      shot_id: 'S01',
      duration_seconds: 4,
      scene: 'rain alley',
      subject: 'young woman',
      action: 'stops at the alley mouth',
      performance_detail: 'holds breath and looks back',
      shot_size: 'medium close-up',
      camera_movement: 'slow push-in',
      composition: 'neon reflection splits the frame',
      lighting: 'cold rain and red neon',
      dialogue_or_voiceover: '',
      image_prompt: 'cinematic still keyframe, young woman in rain alley',
      continuity_from_previous: 'opening shot',
      video_prompt_note: 'external video model moves rain and camera only'
    },
    {
      shot_id: 'S02',
      duration_seconds: 4,
      scene: 'rain alley',
      subject: 'black umbrella figure',
      action: 'raises the umbrella under neon light',
      performance_detail: 'face hidden, posture still',
      shot_size: 'long shot',
      camera_movement: 'locked-off',
      composition: 'figure centered at the far end',
      lighting: 'neon silhouette',
      dialogue_or_voiceover: '',
      image_prompt: 'cinematic still keyframe, black umbrella silhouette',
      continuity_from_previous: 'same alley, same rain direction',
      video_prompt_note: 'external video model preserves silhouette'
    }
  ]
}
