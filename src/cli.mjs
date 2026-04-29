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

function usage() {
  return [
    'Usage:',
    '  node src/cli.mjs [--draft] --out <output-dir> [--input <file>] [--duration <15s|30s|60s>] [--aspect <9:16|16:9|1:1>] [--style <style>] [--platform <seedance|jimeng|generic>] "<story material>"',
    '  node src/cli.mjs ready --run <output-dir> [--done <task-id>]',
    '  node src/cli.mjs task --run <output-dir> --id <task-id>',
    '  node src/cli.mjs validate --run <output-dir> [--stage <skeleton|production>]',
    '',
    'Example:',
    '  node src/cli.mjs --out .cine-make-runs/demo --duration 30s --aspect 9:16 --style cinematic --platform seedance "把这段小说片段改成电影感短片：雨夜里，女孩在巷口停下脚步。"'
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

async function writeRunArtifacts({ outDir, contract, draft = false }) {
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
  const draftAssets = draft ? await writeDraftProductionAssets({ outDir, contract }) : null
  return { plan, planArtifacts, draftAssets }
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
  const { planArtifacts, draftAssets } = await writeRunArtifacts({ outDir, contract, draft: options.draft })

  console.log(`Cine Make wrote artifacts to: ${outDir}`)
  console.log('- input-contract.json')
  console.log('- source-package.md')
  console.log('- production-brief.md')
  console.log('- prompt-pack.md')
  console.log('- imagegen-brief.md')
  console.log('- video-model-pack.md')
  console.log('- agent-handoff.md')
  console.log('- agent-plan.json')
  console.log(`- tasks/*.md (${planArtifacts.taskFiles.length})`)
  console.log(`- reviews/*.md (${planArtifacts.reviewFiles.length})`)
  console.log('- storyboard-images/README.md')
  console.log('- exports/')
  if (draftAssets) {
    console.log(`- draft production assets (${draftAssets.shotlist.length} shots)`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
