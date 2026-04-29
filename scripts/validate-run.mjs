#!/usr/bin/env node
import { resolve } from 'node:path'
import { formatValidationResult, validateRunDirectory } from '../src/run-validator.mjs'

function usage() {
  return [
    'Usage:',
    '  node scripts/validate-run.mjs --run <output-dir> [--stage <skeleton|production>]',
    '',
    'Examples:',
    '  node scripts/validate-run.mjs --run .cine-make-runs/demo --stage skeleton',
    '  node scripts/validate-run.mjs --run examples/rain-alley --stage production'
  ].join('\n')
}

function parseArgs(argv) {
  const options = { stage: 'skeleton', run: null }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--run') {
      index += 1
      if (!argv[index]) throw new Error('--run requires a path')
      options.run = argv[index]
      continue
    }

    if (arg === '--stage') {
      index += 1
      if (!argv[index]) throw new Error('--stage requires skeleton or production')
      options.stage = argv[index]
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

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help || !options.run) {
    console.log(usage())
    process.exitCode = options.help ? 0 : 1
    return
  }

  if (!['skeleton', 'production'].includes(options.stage)) {
    throw new Error('--stage must be skeleton or production')
  }

  const result = await validateRunDirectory({ runDir: resolve(options.run), stage: options.stage })
  console.log(formatValidationResult(result))
  if (!result.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

