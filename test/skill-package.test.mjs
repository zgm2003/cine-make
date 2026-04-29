import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { installCodexSkill } from '../src/skill-installer.mjs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('installs cine-make skill and records compiler path', async () => {
  const codexHome = await mkdtemp(join(tmpdir(), 'cine-make-codex-'))
  try {
    const result = await installCodexSkill({ codexHome, compilerRoot: root })
    assert.ok(result.targetSkill.endsWith(join('skills', 'cine-make')))
    assert.ok(existsSync(join(codexHome, 'skills', 'cine-make', 'SKILL.md')))
    const location = await readFile(join(codexHome, 'skills', 'cine-make', 'references', 'compiler-location.md'), 'utf8')
    assert.match(location, /Compiler root:/)
    assert.match(location, /cine-make/)
  } finally {
    await rm(codexHome, { recursive: true, force: true })
  }
})
