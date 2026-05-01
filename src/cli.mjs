import { mkdir, readFile, writeFile } from 'node:fs/promises'
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

function usage() {
  return [
    'Usage:',
    '  node src/cli.mjs [--mode <draft|visual>] [--emit-internal] --out <output-dir> [--input <file>] [--duration <15s|30s|60s>] [--aspect <9:16|16:9|1:1>] [--style <style>] [--platform <seedance|jimeng|generic>] [--character-image <path>] [--scene-image <path>] [--style-image <path>] "<story material>"',
    '  node src/cli.mjs ready --run <output-dir> [--done <task-id>]',
    '  node src/cli.mjs task --run <output-dir> --id <task-id>',
    '  node src/cli.mjs validate --run <output-dir> [--stage <skeleton|production>]',
    '',
    'Example:',
    '  node src/cli.mjs --mode draft --out .cine-make-runs/demo --duration 30s --aspect 9:16 --style cinematic --platform seedance "把这段小说片段改成电影感短片：雨夜里，女孩在巷口停下脚步。"',
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

async function writeDraftProductionAssets({ outDir, contract }) {
  const draft = composeDraftAssets(contract)
  const files = [
    ['director-script.md', `${draft.directorScript}\n`],
    ['characters.json', `${JSON.stringify(draft.characters, null, 2)}\n`],
    ['shotlist.json', `${JSON.stringify(draft.shotlist, null, 2)}\n`],
    ['storyboard-board.md', `${draft.storyboardBoard}\n`],
    ['storyboard-prompts.md', `${draft.storyboardPrompts}\n`],
    ['reference-pack.md', `${draft.referencePack}\n`],
    ['seedance-pack.md', `${draft.seedancePack}\n`],
    ['jimeng-pack.md', `${draft.jimengPack}\n`],
    ['exports/video-model-pack.md', `${draft.seedancePack}\n---\n\n${draft.jimengPack}\n`],
    ['continuity-review.md', `${draft.continuityReview}\n`]
  ]

  for (const [name, content] of files) {
    await writeFile(join(outDir, name), content, 'utf8')
  }

  return draft
}

async function writeUserFacingArtifacts({ outDir, contract, draft, episodePlan }) {
  await writeFile(join(outDir, 'deliverable.md'), `${composeDeliverable({ contract, draft, episodePlan })}\n`, 'utf8')
  await writeFile(join(outDir, 'storyboard-images', 'README.md'), `${composeStoryboardImagesReadme({ contract, draft, episodePlan })}\n`, 'utf8')
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
  const episodePlan = createEpisodePlan(contract)
  await writeUserFacingArtifacts({ outDir, contract, draft: draftAssets, episodePlan })
  await writeVideoTaskArtifacts({ outDir, plan: episodePlan })

  let internal = null
  if (emitInternal) {
    internal = await writeInternalArtifacts({ outDir: join(outDir, '.cine-make-internal'), contract })
  }

  return { draftAssets, episodePlan, internal }
}

async function main() {
  const currentFile = fileURLToPath(import.meta.url)
  const cineMakeRoot = resolve(dirname(currentFile), '..')
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
  const { draftAssets, episodePlan } = await writeRunArtifacts({ outDir, contract, emitInternal: options.emitInternal })

  console.log(`Cine Make ready (${contract.mode}):`)
  console.log(`- deliverable: ${join(outDir, 'deliverable.md')}`)
  console.log(`- storyboard images: ${join(outDir, 'storyboard-images')}`)
  console.log(`- episodes: ${join(outDir, 'episodes')} (${episodePlan.episodes.length})`)
  console.log(`- continuity bible: ${join(outDir, 'continuity-bible.json')}`)
  console.log(`- video tasks: ${episodePlan.episodes.reduce((total, episode) => total + episode.tasks.length, 0)}`)
  if (options.emitInternal) console.log(`- internal debug artifacts: ${join(outDir, '.cine-make-internal')}`)
  console.log(`- next: ${contract.mode === 'visual' ? 'generate/fill start/end frames, then run each video-tasks/Sxx.md in the external video tool' : 'review deliverable.md; run --mode visual only after the draft is approved'}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
