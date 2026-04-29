import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateRunDirectory } from '../src/run-validator.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('skill points agents to built-in director prompt references', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const promptRef = join(root, 'skills', 'cine-make', 'references', 'director-prompts.md')

  assert.ok(existsSync(promptRef))
  assert.match(skill, /director-prompts\.md/)

  const promptText = await readFile(promptRef, 'utf8')
  assert.match(promptText, /Director rewrite prompt/)
  assert.match(promptText, /micro-performance/)
  assert.match(promptText, /screen direction/)
})

test('golden rain-alley example is a valid production run', async () => {
  const exampleRun = join(root, 'examples', 'rain-alley')
  const result = await validateRunDirectory({ runDir: exampleRun, stage: 'production' })

  assert.equal(result.ok, true, result.errors.join('\n'))
  assert.deepEqual(result.errors, [])
})

