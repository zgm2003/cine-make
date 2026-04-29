import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

test('cine-make skill uses YAML-safe block description', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const frontmatter = skill.split('---')[1]

  assert.match(frontmatter, /^name: cine-make$/m)
  assert.match(frontmatter, /^description: >-$/m)
  assert.doesNotMatch(frontmatter, /^description: .*assets:/m)
})

