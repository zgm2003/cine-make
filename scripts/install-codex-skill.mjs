#!/usr/bin/env node
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installCodexSkill, installUsage, parseInstallArgs } from '../src/skill-installer.mjs'

async function main() {
  const scriptPath = fileURLToPath(import.meta.url)
  const compilerRoot = resolve(dirname(scriptPath), '..')
  const options = parseInstallArgs(process.argv.slice(2))

  if (options.help) {
    console.log(installUsage('node scripts/install-codex-skill.mjs'))
    return
  }

  const result = await installCodexSkill({ codexHome: options.codexHome, compilerRoot })
  console.log(`Installed cine-make skill to: ${result.targetSkill}`)
  console.log('Restart Codex to pick up new skills.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

