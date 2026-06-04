import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInputContract, parseArgs } from './input-contract.mjs'
import {
  composeAgentHandoff,
  composeImagegenBrief,
  composeProductionBrief,
  composePromptPack,
  composeSourcePackage,
  composeVideoModelPack
} from './artifact-writers.mjs'
import { createAgentPlan } from './agent-plan-writer.mjs'
import { writeAgentPlanArtifacts } from './task-writer.mjs'
import { getReadyTasks, writeTaskPrompt } from './task-runner.mjs'
import { formatValidationResult, validateRunDirectory } from './run-validator.mjs'
import { composeDraftAssets } from './draft-writer.mjs'
import { composeDeliverable, composeStoryboardImagesReadme } from './deliverable-writer.mjs'
import { createEpisodePlan } from './episode-planner.mjs'
import { writeVideoTaskArtifacts } from './video-task-writer.mjs'
import { createNovelProject } from './novel/project-writer.mjs'
import { validateChapterSummary } from './novel/summary-schema.mjs'
import { readNovelTaskPrompt } from './novel/task-prompts.mjs'
import { buildSeriesBible } from './novel/bible-builder.mjs'

function usage() {
  return [
    'Usage:',
    '  node src/cli.mjs [--mode <draft|visual>] [--emit-internal] --out <output-dir> [--input <file>] [--duration <15s|30s|60s>] [--aspect <9:16|16:9|1:1>] [--style <style>] [--platform <jimeng>] [--character-image <path>] [--scene-image <path>] [--style-image <path>] "<story material>"',
    '  node src/cli.mjs novel ingest --input <file> --out <project-dir> [--title <title>] [--style <style>] [--target-chunk-chars <number>]',
    '  node src/cli.mjs novel task --run <project-dir> --id <task-id>',
    '  node src/cli.mjs novel accept-summary --run <project-dir> --file <summary-json>',
    '  node src/cli.mjs novel build-bible --run <project-dir>',
    '  node src/cli.mjs ready --run <output-dir> [--done <task-id>]',
    '  node src/cli.mjs task --run <output-dir> --id <task-id>',
    '  node src/cli.mjs validate --run <output-dir> [--stage <skeleton|production>]',
    '',
    'If --duration is omitted, Cine Make infers total duration from plot density and still splits every video feed card to 15s or less.',
    '',
    'Example:',
    '  node src/cli.mjs --mode draft --out .cine-make-runs/demo --aspect 9:16 --style "动漫二次元，非真人写实，电影感悬疑" "把这段小说片段改成电影感短片：雨夜里，女孩在巷口停下脚步。"',
    '  node src/cli.mjs --mode visual --out .cine-make-runs/demo-visual --character-image refs/hero.png "小说片段..."'
  ].join('\n')
}

function defaultOutDir(cineMakeRoot) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  return resolve(cineMakeRoot, '.cine-make-runs', stamp)
}

async function readAgentPlan(runDir) {
  return JSON.parse(await readFile(join(runDir, 'agent-plan.json'), 'utf8'))
}

async function printReadyTasks(options) {
  if (!options.run) throw new Error('ready requires --run <output-dir>')
  const runDir = resolve(options.run)
  const plan = await readAgentPlan(runDir)
  const readyTasks = getReadyTasks(plan, options.done)

  console.log('Ready tasks:')
  if (!readyTasks.length) {
    console.log('- none')
    return
  }

  for (const task of readyTasks) {
    console.log(`- ${task.id} (${task.role})`)
  }
}

async function writeOneTaskPrompt(options) {
  if (!options.run) throw new Error('task requires --run <output-dir>')
  if (!options.id) throw new Error('task requires --id <task-id>')

  const runDir = resolve(options.run)
  const plan = await readAgentPlan(runDir)
  const promptPath = await writeTaskPrompt({ outDir: runDir, plan, taskId: options.id })
  console.log(`Cine Make wrote task prompt: ${promptPath}`)
}

async function validateOneRun(options) {
  if (!options.run) throw new Error('validate requires --run <output-dir>')
  if (!['skeleton', 'production'].includes(options.stage)) {
    throw new Error('validate --stage must be skeleton or production')
  }

  const runDir = resolve(options.run)
  const result = await validateRunDirectory({ runDir, stage: options.stage })
  console.log(formatValidationResult(result))
  if (!result.ok) process.exitCode = 1
}

function parseNovelIngestArgs(argv) {
  const options = {
    inputPath: null,
    outDir: null,
    title: null,
    style: null,
    targetChunkChars: undefined
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--input') {
      index += 1
      if (!argv[index]) throw new Error('novel ingest requires --input <file>')
      options.inputPath = argv[index]
      continue
    }

    if (arg === '--out') {
      index += 1
      if (!argv[index]) throw new Error('novel ingest requires --out <dir>')
      options.outDir = argv[index]
      continue
    }

    if (arg === '--title') {
      index += 1
      if (!argv[index]) throw new Error('--title requires text')
      options.title = argv[index]
      continue
    }

    if (arg === '--style') {
      index += 1
      if (!argv[index]) throw new Error('--style requires text')
      options.style = argv[index]
      continue
    }

    if (arg === '--target-chunk-chars') {
      index += 1
      if (!argv[index]) throw new Error('--target-chunk-chars requires a number')
      const value = Number(argv[index])
      if (!Number.isInteger(value) || value < 1) {
        throw new Error('--target-chunk-chars must be a positive integer')
      }
      options.targetChunkChars = value
      continue
    }

    throw new Error(`Unknown argument for novel ingest: ${arg}`)
  }

  if (!options.inputPath) throw new Error('novel ingest requires --input <file>')
  if (!options.outDir) throw new Error('novel ingest requires --out <dir>')
  return options
}

function parseNovelFlagArgs(argv, { command, required, allowed }) {
  const options = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!allowed.includes(arg)) {
      throw new Error(`Unknown argument for novel ${command}: ${arg}`)
    }

    index += 1
    if (!argv[index]) throw new Error(`novel ${command} requires ${arg} <value>`)
    options[arg.slice(2)] = argv[index]
  }

  for (const flag of required) {
    const name = flag.slice(2)
    if (!options[name]) throw new Error(`novel ${command} requires ${flag} <value>`)
  }

  return options
}

async function printNovelTaskPrompt(argv) {
  const options = parseNovelFlagArgs(argv, {
    command: 'task',
    required: ['--run', '--id'],
    allowed: ['--run', '--id']
  })
  const prompt = await readNovelTaskPrompt({
    projectDir: resolve(options.run),
    taskId: options.id
  })
  process.stdout.write(prompt.endsWith('\n') ? prompt : `${prompt}\n`)
}

async function acceptNovelSummary(argv) {
  const options = parseNovelFlagArgs(argv, {
    command: 'accept-summary',
    required: ['--run', '--file'],
    allowed: ['--run', '--file']
  })
  const projectDir = resolve(options.run)
  const summaryPath = resolve(options.file)
  const summary = JSON.parse(await readFile(summaryPath, 'utf8'))
  const validation = validateChapterSummary(summary)

  if (!validation.ok) {
    throw new Error(`Invalid chapter summary:\n- ${validation.errors.join('\n- ')}`)
  }

  const chapter = await findProjectChapter(projectDir, summary.chapterId)
  const consistencyErrors = validateSummaryAgainstChapter(summary, chapter)
  if (consistencyErrors.length) {
    throw new Error(`Invalid chapter summary:\n- ${consistencyErrors.join('\n- ')}`)
  }

  const summariesDir = join(projectDir, 'summaries')
  await mkdir(summariesDir, { recursive: true })
  const acceptedPath = join(summariesDir, `${chapter.chapterId}.summary.json`)
  await writeFile(acceptedPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  await updateNovelSummaryCount(projectDir)
  console.log(`Cine Make accepted chapter summary: ${acceptedPath}`)
}

async function buildNovelBible(argv) {
  const options = parseNovelFlagArgs(argv, {
    command: 'build-bible',
    required: ['--run'],
    allowed: ['--run']
  })
  const result = await buildSeriesBible({ runDir: resolve(options.run) })

  console.log('Cine Make built novel series bible:')
  console.log(`- series bible: ${result.seriesBiblePath}`)
  console.log(`- characters: ${result.charactersPath}`)
  console.log(`- locations: ${result.locationsPath}`)
  console.log(`- timeline: ${result.timelinePath}`)
  console.log(`- counts: ${result.counts.summaries} summaries, ${result.counts.characters} characters, ${result.counts.locations} locations`)
  if (result.counts.warnings) {
    console.log(`- warnings: ${result.counts.warnings}`)
  }
}

async function findProjectChapter(projectDir, chapterId) {
  const chunks = await readProjectChunks(projectDir)
  return chunks.find((chunk) => chunk.chapterId === chapterId) ?? null
}

async function readProjectChunks(projectDir) {
  const chunksDir = join(projectDir, 'chunks')
  const entries = await readdir(chunksDir)
  const chunkFiles = entries
    .filter((entry) => /^chunk-\d+\.json$/u.test(entry))
    .sort()

  return Promise.all(chunkFiles.map(async (entry) => {
    const chunk = JSON.parse(await readFile(join(chunksDir, entry), 'utf8'))
    return {
      chapterId: chunk.chapterId,
      startByte: chunk.startByte,
      endByte: chunk.endByte
    }
  }))
}

function validateSummaryAgainstChapter(summary, chapter) {
  if (!chapter) {
    return ['chapterId must match a chapter in this project']
  }

  const errors = []
  if (
    summary.sourceSpan.startByte !== chapter.startByte ||
    summary.sourceSpan.endByte !== chapter.endByte
  ) {
    errors.push(`sourceSpan must match ${chapter.chapterId}: startByte ${chapter.startByte}, endByte ${chapter.endByte}`)
  }
  return errors
}

async function updateNovelSummaryCount(projectDir) {
  const projectPath = join(projectDir, 'project.json')
  const project = JSON.parse(await readFile(projectPath, 'utf8'))
  const entries = await readdir(join(projectDir, 'summaries'))
  const summaryCount = entries.filter((entry) => entry.endsWith('.summary.json')).length
  project.counts = {
    ...project.counts,
    summaries: summaryCount
  }
  await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8')
}

async function runNovelCommand(argv) {
  const subcommand = argv[0]
  const args = argv.slice(1)
  const commands = {
    ingest: async () => {
      const options = parseNovelIngestArgs(args)
      const result = await createNovelProject({
        ...options,
        inputPath: resolve(options.inputPath),
        outDir: resolve(options.outDir)
      })

      console.log('Cine Make novel project ready:')
      console.log(`- project: ${result.projectPath}`)
      console.log(`- tasks: ${join(result.outDir, 'tasks')}`)
      console.log(`- chapters: ${result.counts.chapters}`)
      console.log('- next: assign the chapter summary tasks, then continue with later novel workflow commands')
    },
    task: () => printNovelTaskPrompt(args),
    'accept-summary': () => acceptNovelSummary(args),
    'build-bible': () => buildNovelBible(args),
    'plan-episodes': () => failUnimplementedNovelCommand('plan-episodes'),
    episode: () => failUnimplementedNovelCommand('episode')
  }

  if (!subcommand || !Object.hasOwn(commands, subcommand)) {
    throw new Error(`Unknown novel command: ${subcommand ?? '(missing)'}. Supported now: novel ingest, novel task, novel accept-summary`)
  }

  await commands[subcommand]()
}

function failUnimplementedNovelCommand(command) {
  throw new Error(`novel ${command} is not implemented yet`)
}

async function writeDraftProductionAssets({ outDir, contract }) {
  const draft = composeDraftAssets(contract)
  const files = [
    ['director-script.md', `${draft.directorScript}\n`],
    ['characters.json', `${JSON.stringify(draft.characters, null, 2)}\n`],
    ['shotlist.json', `${JSON.stringify(draft.shotlist, null, 2)}\n`],
    ['storyboard-board.md', `${draft.storyboardBoard}\n`],
    ['storyboard-prompts.md', `${draft.storyboardPrompts}\n`],
    ['reference-pack.md', `${draft.referencePack}\n`],
    ['jimeng-pack.md', `${draft.jimengPack}\n`],
    ['exports/video-model-pack.md', `${draft.jimengPack}\n`],
    ['continuity-review.md', `${draft.continuityReview}\n`]
  ]

  for (const [name, content] of files) {
    await writeFile(join(outDir, name), content, 'utf8')
  }

  return draft
}

async function writeUserFacingArtifacts({ outDir, contract, draft }) {
  await writeFile(join(outDir, 'deliverable.md'), `${composeDeliverable({ contract, draft })}\n`, 'utf8')
  await writeFile(join(outDir, 'storyboard-images', 'README.md'), `${composeStoryboardImagesReadme({ contract, draft })}\n`, 'utf8')
}

async function writeInternalArtifacts({ outDir, contract }) {
  await mkdir(outDir, { recursive: true })

  const plan = createAgentPlan({ contract, outDir })
  const artifacts = [
    ['input-contract.json', `${JSON.stringify(contract, null, 2)}\n`],
    ['source-package.md', `${composeSourcePackage(contract)}\n`],
    ['production-brief.md', `${composeProductionBrief(contract)}\n`],
    ['prompt-pack.md', `${composePromptPack(contract)}\n`],
    ['imagegen-brief.md', `${composeImagegenBrief(contract)}\n`],
    ['video-model-pack.md', `${composeVideoModelPack(contract)}\n`],
    ['agent-handoff.md', `${composeAgentHandoff({ contract, outDir })}\n`]
  ]

  for (const [name, content] of artifacts) {
    await writeFile(join(outDir, name), content, 'utf8')
  }

  const planArtifacts = await writeAgentPlanArtifacts({ outDir, plan })
  const draftAssets = await writeDraftProductionAssets({ outDir, contract })
  return { plan, planArtifacts, draftAssets }
}

async function writeRunArtifacts({ outDir, contract, emitInternal = false }) {
  await mkdir(join(outDir, 'storyboard-images'), { recursive: true })

  const draftAssets = composeDraftAssets(contract)
  await writeUserFacingArtifacts({ outDir, contract, draft: draftAssets })

  let internal = null
  let episodePlan = null
  if (emitInternal) {
    const internalDir = join(outDir, '.cine-make-internal')
    episodePlan = createEpisodePlan(contract)
    internal = await writeInternalArtifacts({ outDir: internalDir, contract })
    await writeVideoTaskArtifacts({ outDir: internalDir, plan: episodePlan })
  }

  return { draftAssets, episodePlan, internal }
}

async function main() {
  const currentFile = fileURLToPath(import.meta.url)
  const cineMakeRoot = resolve(dirname(currentFile), '..')

  if (process.argv[2] === 'novel') {
    await runNovelCommand(process.argv.slice(3))
    return
  }

  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    console.log(usage())
    return
  }

  if (options.command === 'ready') {
    await printReadyTasks(options)
    return
  }

  if (options.command === 'task') {
    await writeOneTaskPrompt(options)
    return
  }

  if (options.command === 'validate') {
    await validateOneRun(options)
    return
  }

  const outDir = resolve(options.out ?? defaultOutDir(cineMakeRoot))
  const contract = await createInputContract(options)
  await writeRunArtifacts({ outDir, contract, emitInternal: options.emitInternal })

  console.log(`Cine Make ready (${contract.mode}):`)
  console.log(`- deliverable: ${join(outDir, 'deliverable.md')}`)
  console.log(`- storyboard images: ${join(outDir, 'storyboard-images')}`)
  if (options.emitInternal) console.log(`- internal debug artifacts: ${join(outDir, '.cine-make-internal')}`)
  console.log(`- next: ${contract.mode === 'visual' ? 'generate/fill storyboard images, then use the video feed pack in deliverable.md with Jimeng' : 'review deliverable.md; run --mode visual only after the draft is approved'}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
