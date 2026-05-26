#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

function usage() {
  return [
    'Usage:',
    '  node scripts/render-images.mjs --run <output-dir>',
    '',
    'Cine Make is Codex-only for image generation.',
    'This helper does not call image APIs. It extracts the user-facing still-image queue',
    'from deliverable.md into imagegen-plan.md so Codex can generate the images with $imagegen.'
  ].join('\n')
}

function parseArgs(argv) {
  const options = { run: null, help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--run') {
      index += 1
      if (!argv[index]) throw new Error('--run requires a path')
      options.run = argv[index]
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

function extractImageQueue(deliverable) {
  const lines = deliverable.split('\n')
  const start = lines.findIndex((line) => line.trim() === '## 出图清单')
  if (start === -1) return []

  const queue = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith('## ')) break
    if (/storyboard-images\/[^`]+/.test(line)) queue.push(line)
  }
  return queue
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help || !options.run) {
    console.log(usage())
    process.exitCode = options.help ? 0 : 1
    return
  }

  const runDir = resolve(options.run)
  const deliverable = await readFile(join(runDir, 'deliverable.md'), 'utf8')
  const queue = extractImageQueue(deliverable)
  if (!queue.length) throw new Error('No image queue found in deliverable.md')

  const out = join(runDir, 'imagegen-plan.md')
  await writeFile(out, [
    '# $imagegen plan',
    '',
    'Generate these still images with Codex `$imagegen`, then place the selected files in `storyboard-images/`.',
    '',
    ...queue
  ].join('\n') + '\n', 'utf8')

  console.log(`Wrote $imagegen plan: ${out}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
