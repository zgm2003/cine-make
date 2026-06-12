import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
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

test('cine-make docs describe novel project mode and Jimeng material budget', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const novelReferencePath = join(root, 'skills', 'cine-make', 'references', 'novel-project-mode.md')
  const novelReference = await readFile(novelReferencePath, 'utf8')
  const readme = await readFile(join(root, 'README.md'), 'utf8')
  const readmeZh = await readFile(join(root, 'README.zh-CN.md'), 'utf8')
  const shareDoc = await readFile(join(root, 'docs', 'share-cine-make.zh-CN.md'), 'utf8')
  const combinedDocs = [readme, readmeZh, shareDoc].join('\n')

  assert.match(skill, /project mode/i)
  assert.match(skill, /whole novel|large `?\.txt`?/i)
  assert.match(skill, /references\/novel-project-mode\.md/)
  assert.doesNotMatch(skill, /(?:read|paste) (?:a )?10MB novel in one prompt/i)
  assert.doesNotMatch(skill, /(?:should|must) paste (?:the )?(?:whole|entire) source into context/i)

  assert.match(novelReference, /never paste the whole source into context/i)
  assert.match(novelReference, /bible planning/i)
  assert.match(novelReference, /S\/A character references/i)

  assert.match(readme, /cine-make novel ingest --input \.\/novel\.txt --out \.cine-make-runs\/my-novel/)
  assert.match(combinedDocs, /Seedance 全能参考投喂包|Seedance all-reference/u)
  assert.match(combinedDocs, /3D国漫|3D guoman/u)
  assert.match(combinedDocs, /9 uploaded images|9 张图片/i)
  assert.match(combinedDocs, /novel accept-summary/)
  assert.match(combinedDocs, /novel visual-bible/)
})

test('public docs avoid stale novel package and material-budget wording', async () => {
  const readme = await readFile(join(root, 'README.md'), 'utf8')
  const readmeZh = await readFile(join(root, 'README.zh-CN.md'), 'utf8')
  const shareDoc = await readFile(join(root, 'docs', 'share-cine-make.zh-CN.md'), 'utf8')
  const publicDocs = [readme, readmeZh, shareDoc].join('\n')

  assert.match(readme, /normal short-script and excerpt runs/i)
  assert.match(readme, /Seedance all-reference feed plus a media-free Canvas import pack/i)
  assert.match(readmeZh, /普通短片和小说片段运行/)
  assert.match(readmeZh, /Seedance 全能参考投喂包 \+ Canvas 无媒体导入包/u)

  assert.doesNotMatch(shareDoc, /continuity-bible\.json \+ episodes\//)
  assert.doesNotMatch(shareDoc, /episodes\/<episode>\/video-tasks/)
  assert.doesNotMatch(shareDoc, /逐镜视频任务卡/)
  assert.doesNotMatch(publicDocs, /12 images/i)
  assert.doesNotMatch(publicDocs, /12 张/)

  assert.match(shareDoc, /cine-make@0\.0\.5/)
  assert.match(shareDoc, /episode-input\.md/)
  assert.match(shareDoc, /jimeng-feed-cards\.json/)
  assert.match(shareDoc, /普通短片和小说片段运行会直接交付/)
  assert.match(shareDoc, /Novel Studio 会暴露项目工作区产物和单集导出包/)
})

test('skill docs use upload-image budget wording consistently', async () => {
  const skillDir = join(root, 'skills', 'cine-make')
  const referencesDir = join(skillDir, 'references')
  const referenceFiles = await readdir(referencesDir)
  const skillDocs = [
    await readFile(join(skillDir, 'SKILL.md'), 'utf8'),
    ...(await Promise.all(
      referenceFiles
        .filter((file) => file.endsWith('.md'))
        .map((file) => readFile(join(referencesDir, file), 'utf8'))
    ))
  ].join('\n')
  const outputContract = await readFile(join(referencesDir, 'output-contract.md'), 'utf8')

  assert.match(outputContract, /5 video text lines equals 15 seconds/i)
  assert.match(skillDocs, /single-line video text/i)
  assert.doesNotMatch(skillDocs, /12-reference-material budget/i)
  assert.doesNotMatch(skillDocs, /12 reference materials/i)
})

test('installed cine-make skill includes novel project mode reference', async () => {
  const codexHome = await mkdtemp(join(tmpdir(), 'cine-make-codex-novel-'))
  try {
    await installCodexSkill({ codexHome, compilerRoot: root })
    assert.ok(existsSync(join(codexHome, 'skills', 'cine-make', 'references', 'novel-project-mode.md')))
  } finally {
    await rm(codexHome, { recursive: true, force: true })
  }
})
