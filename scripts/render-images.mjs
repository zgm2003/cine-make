#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

function usage() {
  return [
    'Usage:',
    '  node scripts/render-images.mjs --run <output-dir> [--task <episode/Sxx>] [--limit <n>] [--quality <high|medium|low|auto>] [--size <auto|WIDTHxHEIGHT>] [--force] [--plan-only]',
    '',
    'Default policy:',
    '  1. Generate still frames through gpt-image-2 CLI first.',
    '  2. Use quality=high by default.',
    '  3. If CLI/API fails, write imagegen-fallback.md/json for built-in $imagegen fallback.',
    '',
    'Environment contract:',
    '  OPENAI_API_KEY  required for the primary CLI/API path; use your official OpenAI key or CPA key.',
    '  OPENAI_BASE_URL  optional OpenAI-compatible base URL; unset means the OpenAI SDK official default.',
    '  Do not put image API credentials in prompts or run artifacts.',
    '',
    'Examples:',
    '  node scripts/render-images.mjs --run .cine-make-runs/demo --limit 2',
    '  node scripts/render-images.mjs --run .cine-make-runs/demo --task episode-01/S01 --force',
    '  node scripts/render-images.mjs --run .cine-make-runs/demo --plan-only --limit 1'
  ].join('\n')
}

function parseArgs(argv) {
  const options = {
    run: null,
    task: null,
    limit: null,
    quality: 'high',
    size: 'auto',
    model: 'gpt-image-2',
    force: false,
    planOnly: false,
    imageGen: null,
    python: process.env.PYTHON || 'python'
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--run') {
      index += 1
      if (!argv[index]) throw new Error('--run requires a path')
      options.run = argv[index]
      continue
    }
    if (arg === '--task') {
      index += 1
      if (!argv[index]) throw new Error('--task requires <episode/Sxx>')
      options.task = argv[index]
      continue
    }
    if (arg === '--limit') {
      index += 1
      const limit = Number(argv[index])
      if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit must be a positive integer')
      options.limit = limit
      continue
    }
    if (arg === '--quality') {
      index += 1
      if (!['low', 'medium', 'high', 'auto'].includes(argv[index])) throw new Error('--quality must be low, medium, high, or auto')
      options.quality = argv[index]
      continue
    }
    if (arg === '--size') {
      index += 1
      if (!argv[index]) throw new Error('--size requires auto or WIDTHxHEIGHT')
      options.size = argv[index]
      continue
    }
    if (arg === '--model') {
      index += 1
      if (!argv[index]) throw new Error('--model requires a model name')
      options.model = argv[index]
      continue
    }
    if (arg === '--image-gen') {
      index += 1
      if (!argv[index]) throw new Error('--image-gen requires a path')
      options.imageGen = argv[index]
      continue
    }
    if (arg === '--python') {
      index += 1
      if (!argv[index]) throw new Error('--python requires a command/path')
      options.python = argv[index]
      continue
    }
    if (arg === '--force') {
      options.force = true
      continue
    }
    if (arg === '--plan-only') {
      options.planOnly = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

function defaultImageGenPath() {
  const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex')
  return join(codexHome, 'skills', '.system', 'imagegen', 'scripts', 'image_gen.py')
}

function imageApiBaseUrlForLog() {
  return process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1 (OpenAI SDK default)'
}

function imageApiKeyStateForLog() {
  return process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY is set' : 'OPENAI_API_KEY is missing'
}

function defaultSizeForAspect(aspectRatio) {
  if (aspectRatio === '9:16') return '2160x3840'
  if (aspectRatio === '16:9') return '3840x2160'
  if (aspectRatio === '1:1') return '2048x2048'
  if (aspectRatio === '4:5') return '2048x2560'
  if (aspectRatio === '21:9') return '3840x1648'
  return 'auto'
}

function assertInsideRun(runDir, target) {
  const resolvedRun = resolve(runDir)
  const resolvedTarget = resolve(target)
  if (!resolvedTarget.toLowerCase().startsWith(`${resolvedRun.toLowerCase()}\\`) && resolvedTarget.toLowerCase() !== resolvedRun.toLowerCase()) {
    throw new Error(`Refusing to write outside run directory: ${resolvedTarget}`)
  }
}

function frameJobsFromPlan({ runDir, plan, taskFilter, limit }) {
  const jobs = []
  for (const episode of plan.episodes ?? []) {
    for (const task of episode.tasks ?? []) {
      const taskKey = `${episode.id}/${task.id}`
      if (taskFilter && taskFilter !== taskKey) continue
      const episodeDir = join(runDir, 'episodes', episode.id)
      const frames = [
        { role: 'start', prompt: task.startFramePrompt, relativePath: task.startFrame },
        { role: 'end', prompt: task.endFramePrompt, relativePath: task.endFrame }
      ]
      for (const frame of frames) {
        const out = resolve(episodeDir, frame.relativePath)
        assertInsideRun(runDir, out)
        jobs.push({
          id: `${taskKey}/${frame.role}`,
          episode: episode.id,
          task: task.id,
          role: frame.role,
          out,
          prompt: frame.prompt
        })
        if (limit && jobs.length >= limit) return jobs
      }
    }
  }
  return jobs
}

async function writeFallbackManifest({ runDir, jobs, reason }) {
  const jsonPath = join(runDir, 'imagegen-fallback.json')
  const mdPath = join(runDir, 'imagegen-fallback.md')
  await writeFile(jsonPath, `${JSON.stringify({ reason, jobs }, null, 2)}\n`, 'utf8')

  const lines = [
    '# $imagegen fallback manifest',
    '',
    `Reason: ${reason}`,
    '',
    'Use built-in `$imagegen` for each job below, then copy the generated image to `out`.',
    ''
  ]
  for (const job of jobs) {
    lines.push(`## ${job.id}`, '', `out: \`${job.out}\``, '', '```text', job.prompt, '```', '')
  }
  await writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8')
  return { jsonPath, mdPath }
}

async function runJob({ job, options, size }) {
  if (existsSync(job.out) && !options.force) {
    return { ok: true, skipped: true, job }
  }

  await mkdir(dirname(job.out), { recursive: true })
  const args = [
    options.imageGen,
    'generate',
    '--model',
    options.model,
    '--quality',
    options.quality,
    '--size',
    size,
    '--prompt',
    job.prompt,
    '--out',
    job.out
  ]
  if (options.force) args.push('--force')

  const result = spawnSync(options.python, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  return {
    ok: result.status === 0,
    skipped: false,
    job,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help || !options.run) {
    console.log(usage())
    process.exitCode = options.help ? 0 : 1
    return
  }

  const runDir = resolve(options.run)
  const plan = JSON.parse(await readFile(join(runDir, 'continuity-bible.json'), 'utf8'))
  const size = options.size === 'auto' ? defaultSizeForAspect(plan.anchors?.aspectRatio) : options.size
  const jobs = frameJobsFromPlan({ runDir, plan, taskFilter: options.task, limit: options.limit })

  if (!jobs.length) throw new Error('No frame jobs matched the requested run/task/limit')

  options.imageGen = resolve(options.imageGen || defaultImageGenPath())

  console.log(`Cine Make image render plan:`)
  console.log(`- run: ${runDir}`)
  console.log(`- jobs: ${jobs.length}`)
  console.log(`- primary: ${options.model} via ${options.imageGen}`)
  console.log(`- quality: ${options.quality}`)
  console.log(`- size: ${size}`)
  console.log(`- API base URL: ${imageApiBaseUrlForLog()}`)
  console.log(`- API key env: ${imageApiKeyStateForLog()}`)
  console.log(`- fallback: built-in $imagegen via imagegen-fallback.md/json if primary fails`)

  if (options.planOnly) {
    const manifest = await writeFallbackManifest({ runDir, jobs, reason: 'plan-only preview; no primary image call was made' })
    console.log(`- fallback manifest: ${manifest.mdPath}`)
    return
  }

  if (!existsSync(options.imageGen)) {
    const manifest = await writeFallbackManifest({ runDir, jobs, reason: `gpt-image-2 CLI not found: ${options.imageGen}` })
    console.log(`Primary image path unavailable. Wrote fallback manifest: ${manifest.mdPath}`)
    process.exitCode = 2
    return
  }

  const failed = []
  let generated = 0
  let skipped = 0
  for (const job of jobs) {
    const result = await runJob({ job, options, size })
    if (result.ok) {
      if (result.skipped) skipped += 1
      else generated += 1
      console.log(`OK ${job.id} -> ${job.out}${result.skipped ? ' (exists; skipped)' : ''}`)
      continue
    }
    failed.push(result)
    console.error(`FAILED ${job.id}: ${result.stderr || result.stdout || `exit ${result.status}`}`)
    break
  }

  if (failed.length) {
    const reason = failed[0].stderr || failed[0].stdout || `gpt-image-2 CLI failed with exit ${failed[0].status}`
    const manifest = await writeFallbackManifest({ runDir, jobs: jobs.slice(generated + skipped), reason: reason.trim() })
    console.log(`Wrote fallback manifest for remaining jobs: ${manifest.mdPath}`)
    process.exitCode = 2
    return
  }

  console.log(`Cine Make image render complete: generated=${generated}, skipped=${skipped}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
