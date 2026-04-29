import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createInputContract, parseArgs } from '../src/input-contract.mjs'
import { composeDraftAssets } from '../src/draft-writer.mjs'
import { validateRunDirectory } from '../src/run-validator.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = '小说片段：凌晨四点，退役潜水员周祁回到废弃海洋馆。主水箱里没有水，却传来鲸鱼的低鸣。他发现玻璃内侧贴着一张女儿小时候画的蓝鲸，画纸没有被水泡烂。远处的检修门自动打开，门后是一片真实的深海光。'

test('composeDraftAssets creates production assets from a story contract', async () => {
  const contract = await createInputContract(parseArgs(['--duration', '30s', '--aspect', '9:16', '--platform', 'seedance', source]))
  const draft = composeDraftAssets(contract)

  assert.match(draft.directorScript, /# Director script/)
  assert.match(draft.directorScript, /退役潜水员周祁/)
  assert.doesNotMatch(draft.directorScript, /周祁回 enters|让退役潜水员周祁回/)
  assert.match(draft.directorScript, /退役潜水员周祁因/)
  assert.equal(draft.characters.length >= 2, true)
  assert.equal(draft.shotlist.length, contract.target.shotCount)
  assert.equal(draft.shotlist[0].shot_id, 'S01')
  assert.match(draft.storyboardPrompts, /still-image generation prompts/)
  assert.match(draft.seedancePack, /external video synthesis/)
  assert.match(draft.continuityReview, /Codex does not render the final video/)
})

test('cli --draft writes a production-valid run', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cine-make-draft-'))
  try {
    const result = spawnSync(process.execPath, ['src/cli.mjs', '--draft', '--out', out, '--duration', '30s', '--aspect', '9:16', '--style', 'cinematic deep-sea mystery', '--platform', 'seedance', source], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.stderr)
    assert.ok(existsSync(join(out, 'deliverable.md')))
    assert.ok(existsSync(join(out, 'storyboard-images', 'README.md')))
    assert.equal(existsSync(join(out, 'director-script.md')), false)
    assert.equal(existsSync(join(out, 'shotlist.json')), false)
    assert.equal(existsSync(join(out, 'seedance-pack.md')), false)

    const validation = await validateRunDirectory({ runDir: out, stage: 'production' })
    assert.equal(validation.ok, true, validation.errors.join('\n'))

    const deliverable = await readFile(join(out, 'deliverable.md'), 'utf8')
    assert.match(deliverable, /S12/)
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
