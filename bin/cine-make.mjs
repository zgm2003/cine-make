#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installCodexSkill, installUsage, parseInstallArgs } from '../src/skill-installer.mjs'

function usage() {
  return [
    'Usage:',
    '  cine-make install-skill [--codex-home <path>]',
    '  cine-make --out <output-dir> [--input <file>] [--duration <15s|30s|60s>] [--aspect <9:16|16:9|1:1>] [--style <style>] [--platform <seedance|jimeng|generic>] "<story material>"',
    '  cine-make ready --run <output-dir> [--done <task-id>]',
    '  cine-make task --run <output-dir> --id <task-id>',
    '',
    'Install examples:',
    '  npx cine-make install-skill',
    '  npm i -g cine-make',
    '  cine-make install-skill'
  ].join('\n')
}

function runCompilerCli({ compilerRoot, args }) {
  const child = spawn(process.execPath, [join(compilerRoot, 'src', 'cli.mjs'), ...args], {
    stdio: 'inherit'
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exitCode = code ?? 1
  })
}

async function main() {
  const binPath = fileURLToPath(import.meta.url)
  const compilerRoot = resolve(dirname(binPath), '..')
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === '--help' || command === '-h') {
    console.log(usage())
    return
  }

  if (command === 'install-skill') {
    const options = parseInstallArgs(rest)
    if (options.help) {
      console.log(installUsage('cine-make install-skill'))
      return
    }

    const result = await installCodexSkill({ codexHome: options.codexHome, compilerRoot })
    console.log(`Installed cine-make skill to: ${result.targetSkill}`)
    console.log('Restart Codex to pick up new skills.')
    return
  }

  runCompilerCli({ compilerRoot, args: process.argv.slice(2) })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

