import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const SKELETON_FILES = [
  'input-contract.json',
  'source-package.md',
  'production-brief.md',
  'prompt-pack.md',
  'imagegen-brief.md',
  'video-model-pack.md',
  'agent-handoff.md',
  'agent-plan.json'
]

const PRODUCTION_FILES = [
  'director-script.md',
  'characters.json',
  'shotlist.json',
  'storyboard-board.md',
  'storyboard-prompts.md',
  'reference-pack.md',
  'seedance-pack.md',
  'jimeng-pack.md',
  'continuity-review.md'
]

const USER_FACING_FILES = [
  'deliverable.md',
  join('storyboard-images', 'README.md')
]

const USER_FACING_DIRECTORIES = []

const SHOT_REQUIRED_FIELDS = [
  'shot_id',
  'duration_seconds',
  'scene',
  'subject',
  'action',
  'performance_detail',
  'shot_size',
  'camera_movement',
  'composition',
  'lighting',
  'dialogue_or_voiceover',
  'image_prompt',
  'continuity_from_previous',
  'video_prompt_note'
]

const FINAL_VIDEO_CLAIM_PATTERNS = [
  /\b(codex|cine make)\b.{0,60}\b(generated|created|rendered|produced|made)\b.{0,60}\b(final video|mp4)\b/i,
  /\b(final video|mp4)\b.{0,60}\b(generated|created|rendered|produced|made)\b.{0,60}\b(codex|cine make)\b/i,
  /\bgenerated the final mp4 video\b/i
]

function ok(errors, warnings = []) {
  return { ok: errors.length === 0, errors, warnings }
}

async function readJson(path, errors, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    errors.push(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function isMissing(value) {
  return value === undefined || value === null || value === ''
}

export function validateShotlist({ shotlist, expectedShotCount }) {
  const errors = []

  if (!Array.isArray(shotlist)) {
    return ok(['shotlist must be an array'])
  }

  if (Number.isInteger(expectedShotCount) && shotlist.length !== expectedShotCount) {
    errors.push(`expected ${expectedShotCount} shots, got ${shotlist.length}`)
  }

  shotlist.forEach((shot, index) => {
    if (!shot || typeof shot !== 'object' || Array.isArray(shot)) {
      errors.push(`shotlist[${index}] must be an object`)
      return
    }

    for (const field of SHOT_REQUIRED_FIELDS) {
      const missing = field === 'dialogue_or_voiceover'
        ? shot[field] === undefined || shot[field] === null
        : isMissing(shot[field])
      if (missing) {
        errors.push(`shotlist[${index}].${field} is required`)
      }
    }

    if (!isMissing(shot.duration_seconds) && (typeof shot.duration_seconds !== 'number' || shot.duration_seconds <= 0)) {
      errors.push(`shotlist[${index}].duration_seconds must be a positive number`)
    }
  })

  return ok(errors)
}

async function scanForbiddenClaims(runDir, errors) {
  const candidates = [
    'director-script.md',
    'storyboard-prompts.md',
    'reference-pack.md',
    'seedance-pack.md',
    'jimeng-pack.md',
    'continuity-review.md',
    'video-model-pack.md'
  ]

  for (const file of candidates) {
    const path = join(runDir, file)
    if (!existsSync(path)) continue
    const text = await readFile(path, 'utf8')
    if (FINAL_VIDEO_CLAIM_PATTERNS.some((pattern) => pattern.test(text))) {
      errors.push(`forbidden final-video claim in ${file}`)
    }
  }
}

function internalRunDir(runDir) {
  const isolated = join(runDir, '.cine-make-internal')
  if (existsSync(join(isolated, 'input-contract.json'))) return isolated
  if (existsSync(join(runDir, 'input-contract.json'))) return runDir
  return null
}

async function directoryExists(path) {
  try {
    const entries = await readdir(path)
    return Array.isArray(entries)
  } catch {
    return false
  }
}

export async function validateRunDirectory({ runDir, stage = 'skeleton' }) {
  const errors = []
  const warnings = []
  const artifactDir = internalRunDir(runDir)

  for (const file of USER_FACING_FILES) {
    if (!existsSync(join(runDir, file))) {
      errors.push(`missing required file: ${file}`)
    }
  }

  for (const directory of USER_FACING_DIRECTORIES) {
    if (!(await directoryExists(join(runDir, directory)))) {
      errors.push(`missing required directory: ${directory}`)
    }
  }

  const biblePath = artifactDir
    ? join(artifactDir, 'continuity-bible.json')
    : join(runDir, 'continuity-bible.json')
  const bible = existsSync(biblePath) ? await readJson(biblePath, errors, 'continuity-bible.json') : null
  if (bible) {
    if (bible.mode !== 'video-model-first') errors.push('continuity-bible.mode must be video-model-first')
    if (!Array.isArray(bible.sourceBeats) || bible.sourceBeats.length === 0) {
      errors.push('continuity-bible.sourceBeats must be a non-empty array')
    }
    if (!Array.isArray(bible.episodes) || bible.episodes.length === 0) {
      errors.push('continuity-bible.episodes must be a non-empty array')
    }
    for (const [episodeIndex, episode] of (bible.episodes ?? []).entries()) {
      for (const [taskIndex, task] of (episode.tasks ?? []).entries()) {
        if (!task.storyboard || typeof task.storyboard !== 'object') {
          errors.push(`continuity-bible.episodes[${episodeIndex}].tasks[${taskIndex}].storyboard is required`)
          continue
        }
        for (const field of ['shotSize', 'lens', 'cameraMove', 'composition', 'blocking', 'performance', 'lighting']) {
          if (isMissing(task.storyboard[field])) {
            errors.push(`continuity-bible.episodes[${episodeIndex}].tasks[${taskIndex}].storyboard.${field} is required`)
          }
        }
      }
    }
  }

  if (!artifactDir) {
    if (stage === 'production') {
      await scanForbiddenClaims(runDir, errors)
    }
    warnings.push('internal debug artifacts are not present; validated the user-facing package only')
    return ok(errors, warnings)
  }

  const requiredFiles = stage === 'production' ? [...SKELETON_FILES, ...PRODUCTION_FILES] : SKELETON_FILES

  for (const file of requiredFiles) {
    if (!existsSync(join(artifactDir, file))) {
      errors.push(`missing required file: ${file}`)
    }
  }

  const contractPath = join(artifactDir, 'input-contract.json')
  const contract = existsSync(contractPath) ? await readJson(contractPath, errors, 'input-contract.json') : null
  if (contract) {
    const mode = contract.mode ?? 'draft'
    if (!['draft', 'visual'].includes(mode)) errors.push('input-contract.mode must be draft or visual')
    if (!contract.target || typeof contract.target !== 'object') errors.push('input-contract.target is required')
    if (!contract.boundaries || typeof contract.boundaries !== 'object') errors.push('input-contract.boundaries is required')
    if (contract.boundaries && !Array.isArray(contract.boundaries.codexCannotGenerate)) {
      errors.push('input-contract.boundaries.codexCannotGenerate must be an array')
    }
  }

  const planPath = join(artifactDir, 'agent-plan.json')
  const plan = existsSync(planPath) ? await readJson(planPath, errors, 'agent-plan.json') : null
  if (plan) {
    if (plan.mode !== 'video-preproduction-factory') errors.push('agent-plan.mode must be video-preproduction-factory')
    if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) errors.push('agent-plan.tasks must be a non-empty array')
  }

  const shotlistPath = join(artifactDir, 'shotlist.json')
  if (stage === 'production' && existsSync(shotlistPath)) {
    const shotlist = await readJson(shotlistPath, errors, 'shotlist.json')
    if (shotlist) {
      const shotResult = validateShotlist({
        shotlist,
        expectedShotCount: contract?.target?.shotCount
      })
      errors.push(...shotResult.errors)
    }
  }

  if (stage === 'production') {
    if (!(await directoryExists(join(runDir, 'storyboard-images')))) {
      warnings.push('storyboard-images directory is missing or empty; image generation may not have run yet')
    }
    await scanForbiddenClaims(runDir, errors)
    if (artifactDir !== runDir) await scanForbiddenClaims(artifactDir, errors)
  }

  return ok(errors, warnings)
}

export function formatValidationResult(result) {
  const lines = [result.ok ? 'Cine Make validation: OK' : 'Cine Make validation: FAILED']

  if (result.errors.length) {
    lines.push('', 'Errors:')
    lines.push(...result.errors.map((error) => `- ${error}`))
  }

  if (result.warnings.length) {
    lines.push('', 'Warnings:')
    lines.push(...result.warnings.map((warning) => `- ${warning}`))
  }

  return lines.join('\n')
}
