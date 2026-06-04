import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createInputContract } from '../input-contract.mjs'
import { composeDraftAssets } from '../draft-writer.mjs'
import { composeDeliverable, composeStoryboardImagesReadme } from '../deliverable-writer.mjs'
import { planNovelEpisodes } from './episode-planner.mjs'

const FALLBACK_STYLE = '动漫二次元，非真人写实'
const MAX_REFERENCE_MATERIALS = 12
const MATERIAL_TYPES = new Set(['image', 'video', 'audio'])

export async function exportNovelEpisode({ runDir, episodeNumber = 1, outDir, episodeMinutes, referenceMaterials = [] }) {
  if (!runDir) throw new Error('exportNovelEpisode requires runDir')
  const selectedEpisodeNumber = validateEpisodeNumber(episodeNumber)
  const projectDir = resolve(runDir)
  const episodeOutDir = resolve(outDir ?? join(projectDir, 'episodes', `episode-${String(selectedEpisodeNumber).padStart(4, '0')}`))

  const project = await readOptionalJson(join(projectDir, 'project.json'), {})
  const plan = await readOrCreateEpisodePlan({
    runDir: projectDir,
    episodeMinutes
  })
  const episode = plan.episodes[selectedEpisodeNumber - 1]
  if (!episode) {
    throw new Error(`Episode ${selectedEpisodeNumber} does not exist; planned episodes: ${plan.episodes.length}`)
  }

  const summaries = await readEpisodeSummaries({ runDir: projectDir, episode })
  const characters = await readSelectedCharacters({ runDir: projectDir, episode })
  const continuity = await readContinuity({ runDir: projectDir, episode })
  const style = project.defaultStyle || FALLBACK_STYLE
  const episodeInput = composeEpisodeInput({
    episode,
    summaries,
    characters,
    continuity,
    style
  })
  const sourceText = composeEpisodeSourceText({
    episode,
    summaries,
    characters,
    continuity,
    style
  })

  const durationSeconds = Math.max(30, Math.round(episode.episodeMinutes * 60))
  const contract = await createInputContract({
    mode: 'draft',
    input: null,
    title: `${episode.episodeId}-${episode.title}`,
    duration: `${durationSeconds}s`,
    durationExplicit: true,
    aspect: '9:16',
    style,
    platform: 'jimeng',
    shots: null,
    storyboards: null,
    references: [],
    visualReferences: {
      characterImages: [],
      sceneImages: [],
      styleImages: []
    },
    sourceParts: [sourceText]
  })
  const draft = composeDraftAssets(contract)
  const feedCards = composeJimengFeedCards({
    contract,
    draft,
    episode,
    characters,
    summaries,
    referenceMaterials
  })

  await mkdir(join(episodeOutDir, 'storyboard-images'), { recursive: true })
  const episodeInputPath = join(episodeOutDir, 'episode-input.md')
  const deliverablePath = join(episodeOutDir, 'deliverable.md')
  const storyboardImagesReadmePath = join(episodeOutDir, 'storyboard-images', 'README.md')
  const feedCardsPath = join(episodeOutDir, 'jimeng-feed-cards.json')

  await writeFile(episodeInputPath, `${episodeInput}\n`, 'utf8')
  await writeFile(deliverablePath, `${composeDeliverable({ contract, draft })}\n`, 'utf8')
  await writeFile(storyboardImagesReadmePath, `${composeStoryboardImagesReadme({ contract, draft })}\n`, 'utf8')
  await writeFile(feedCardsPath, `${JSON.stringify(feedCards, null, 2)}\n`, 'utf8')

  return {
    episodeInputPath,
    deliverablePath,
    storyboardImagesReadmePath,
    feedCardsPath,
    episodePackage: {
      episode,
      summaries,
      characters,
      continuity,
      contract,
      feedCards
    }
  }
}

async function readOrCreateEpisodePlan({ runDir, episodeMinutes }) {
  const episodesDir = join(runDir, 'episodes')
  const adaptationPlanJsonPath = join(episodesDir, 'adaptation-plan.json')
  const adaptationPlanPath = join(episodesDir, 'adaptation-plan.md')

  try {
    const plan = JSON.parse(await readFile(adaptationPlanJsonPath, 'utf8'))
    validateAdaptationPlanJson(plan)
    if (episodeMinutes !== undefined && episodeMinutes !== plan.episodeMinutes) {
      throw new Error(`Existing adaptation plan uses --episode-minutes ${plan.episodeMinutes}; got ${episodeMinutes}`)
    }
    return {
      adaptationPlanJsonPath,
      adaptationPlanPath,
      episodes: plan.episodes,
      warnings: plan.episodes.flatMap((episode) => episode.warnings)
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  if (await pathExists(adaptationPlanPath)) {
    throw new Error(`Existing adaptation plan is missing machine-readable JSON: ${adaptationPlanJsonPath}. Run novel plan-episodes again before exporting.`)
  }

  return planNovelEpisodes({
    runDir,
    episodeMinutes: episodeMinutes ?? 2
  })
}

function validateAdaptationPlanJson(plan) {
  if (plan?.schemaVersion !== 1) {
    throw new Error('Unsupported adaptation-plan.json schemaVersion')
  }
  if (typeof plan.episodeMinutes !== 'number' || !Number.isFinite(plan.episodeMinutes) || plan.episodeMinutes <= 0) {
    throw new Error('Invalid adaptation-plan.json episodeMinutes')
  }
  if (!Array.isArray(plan.episodes)) {
    throw new Error('Invalid adaptation-plan.json episodes')
  }
}

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

function validateEpisodeNumber(value) {
  const episodeNumber = Number(value)
  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    throw new Error('--episode must be a positive integer')
  }
  return episodeNumber
}

async function readEpisodeSummaries({ runDir, episode }) {
  const includedChapterIds = new Set(episode.includedChapters.map((chapter) => chapter.chapterId))
  const summariesDir = join(runDir, 'summaries')
  const entries = (await readdir(summariesDir)).filter((entry) => entry.endsWith('.summary.json')).sort()
  const summaries = []

  for (const entry of entries) {
    const summary = JSON.parse(await readFile(join(summariesDir, entry), 'utf8'))
    if (includedChapterIds.has(summary.chapterId)) summaries.push(summary)
  }

  return summaries
}

async function readSelectedCharacters({ runDir, episode }) {
  const requiredNames = new Set(episode.requiredCharacters)
  const bibleCharacters = await readOptionalJson(join(runDir, 'bible', 'characters.json'), [])
  if (!Array.isArray(bibleCharacters)) return []

  return bibleCharacters.filter((character) => requiredNames.has(character?.name))
}

async function readContinuity({ runDir, episode }) {
  const continuityLog = await readOptionalText(join(runDir, 'continuity', 'continuity-log.md'), '')
  const unresolvedHooks = await readOptionalJson(join(runDir, 'continuity', 'unresolved-hooks.json'), [])
  const includedChapterIds = new Set(episode.includedChapters.map((chapter) => chapter.chapterId))

  return {
    notes: continuityLog.trim(),
    unresolvedHooks: Array.isArray(unresolvedHooks)
      ? unresolvedHooks.filter((hook) => !hook.status || hook.status === 'active' || hook.status === 'open')
        .filter((hook) => !hook.chapterId || includedChapterIds.has(hook.chapterId))
      : []
  }
}

async function readOptionalJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

async function readOptionalText(path, fallback) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

function composeEpisodeInput({ episode, summaries, characters, continuity, style }) {
  return [
    `# ${episode.title}`,
    '',
    '## Episode Goal',
    episode.goal || 'Review episode goal before production.',
    '',
    '## Episode Summary',
    summaries.map((summary) => `- ${summary.chapterId} - ${summary.title}: ${summary.summary}`).join('\n') || '- none',
    '',
    '## Adaptation Source',
    episode.includedChapters.map((chapter) => `- ${chapter.chapterId} - ${chapter.title}`).join('\n') || '- none',
    '',
    '## Appearance Characters',
    formatCharacters(characters),
    '',
    '## Scene List/Locations',
    formatSceneList(summaries),
    '',
    '## Shot Table',
    formatShotTable(episode),
    '',
    '## Visual Prompts/Context',
    [
      `- Default style: ${style}`,
      '- Keep character appearance and wardrobe stable across every shot.',
      '- Use source chapter beats only; do not import later chapters into this episode.'
    ].join('\n'),
    '',
    '## Ending Hook',
    episode.endingHook || 'No explicit ending hook.',
    '',
    '## Continuity Check',
    formatContinuity(continuity)
  ].join('\n')
}

function composeEpisodeSourceText({ episode, summaries, characters, continuity, style }) {
  return [
    `小说单集改编：${episode.title}`,
    `集目标：${episode.goal}`,
    `默认视觉风格：${style}`,
    '只改编以下章节摘要，不要引入未列出的后续章节。',
    ...summaries.map((summary) => `${summary.chapterId}《${summary.title}》：${summary.summary} 关键节拍：${summary.beats.map((beat) => beat.event).join('；')}`),
    `出场人物：${characters.map((character) => `${character.name}${character.visualHints?.length ? `（${character.visualHints.join('、')}）` : ''}`).join('；') || 'none'}`,
    `当前未解悬念：${continuity.unresolvedHooks.map((hook) => hook.note || hook.question || hook.id).filter(Boolean).join('；') || episode.endingHook || 'none'}`,
    `连续性指令：${continuity.notes || '保持人物外观、地点状态和悬念信息一致；本任务不写回连续性文件。'}`,
    `结尾钩子：${episode.endingHook}`
  ].join('\n')
}

function formatCharacters(characters) {
  if (!characters.length) return '- none'
  return characters.map((character) => {
    const details = [
      character.recommendedTier ? `tier ${character.recommendedTier}` : '',
      ...(character.visualHints ?? []),
      ...(character.relationshipHints ?? [])
    ].filter(Boolean)
    return `- ${character.name}${details.length ? `: ${details.join('；')}` : ''}`
  }).join('\n')
}

function formatSceneList(summaries) {
  const locations = new Set()
  for (const summary of summaries) {
    for (const location of summary.locations ?? []) locations.add(location)
    for (const beat of summary.beats ?? []) {
      if (beat.location) locations.add(beat.location)
    }
  }
  if (!locations.size) return '- derive from selected beats'
  return [...locations].map((location) => `- ${location}`).join('\n')
}

function formatShotTable(episode) {
  if (!episode.beats.length) return '- Placeholder: derive shot table from episode goal.'
  return episode.beats.map((beat, index) => `- S${String(index + 1).padStart(2, '0')}: ${beat}`).join('\n')
}

function formatContinuity(continuity) {
  const lines = []
  if (continuity.notes) lines.push(continuity.notes)
  if (continuity.unresolvedHooks.length) {
    lines.push('Active unresolved hooks:')
    for (const hook of continuity.unresolvedHooks) {
      lines.push(`- ${hook.note || hook.question || hook.id}`)
    }
  }
  return lines.join('\n') || '- No continuity files found. Maintain established appearance and unresolved hooks from selected summaries.'
}

function composeJimengFeedCards({ contract, draft, episode, characters, summaries, referenceMaterials }) {
  const baseMaterials = normalizeReferenceMaterials(referenceMaterials)
  const fallbackMaterials = buildFallbackMaterials({ episode, characters, summaries, draft })
  const materials = capMaterials([...baseMaterials, ...fallbackMaterials])
  const refsByType = groupRefsByType(materials)
  const segments = Math.max(1, Math.ceil(contract.target.durationSeconds / 15))

  return Array.from({ length: segments }, (_, index) => ({
    id: `${episode.episodeId}-jimeng-${String(index + 1).padStart(2, '0')}`,
    renderer: 'jimeng',
    maxReferenceMaterials: MAX_REFERENCE_MATERIALS,
    materials,
    prompt: composeJimengPrompt({ episode, refsByType, segmentIndex: index })
  }))
}

function normalizeReferenceMaterials(materials) {
  const counters = { image: 0, video: 0, audio: 0 }
  return materials
    .filter((material) => MATERIAL_TYPES.has(material?.type) && material.path)
    .map((material) => {
      counters[material.type] += 1
      return {
        type: material.type,
        ref: `@${capitalize(material.type)}${counters[material.type]}`,
        path: material.path,
        label: material.label || material.path
      }
    })
}

function buildFallbackMaterials({ episode, characters, summaries, draft }) {
  const images = []
  for (const character of characters) {
    images.push({ path: `storyboard-images/character-${slugRef(character.name)}.png`, label: `${character.name} character reference` })
  }
  for (const location of collectLocations(summaries)) {
    images.push({ path: `storyboard-images/scene-${slugRef(location)}.png`, label: `${location} scene reference` })
  }
  images.push(
    { path: 'storyboard-images/segment-01-start.png', label: 'episode start frame' },
    { path: 'storyboard-images/segment-01-end.png', label: 'episode end frame' }
  )
  for (const shot of draft.shotlist ?? []) {
    images.push({ path: `storyboard-images/${shot.shot_id}.png`, label: `${shot.shot_id} storyboard reference` })
  }

  return images.map((material) => ({
    type: 'image',
    ...material
  }))
}

function capMaterials(materials) {
  const capped = []
  const counters = { image: 0, video: 0, audio: 0 }

  for (const material of materials) {
    if (capped.length >= MAX_REFERENCE_MATERIALS) break
    counters[material.type] += 1
    capped.push({
      ...material,
      ref: material.ref ?? `@${capitalize(material.type)}${counters[material.type]}`
    })
  }

  return capped
}

function groupRefsByType(materials) {
  return materials.reduce((refs, material) => {
    refs[material.type].push(material.ref)
    return refs
  }, { image: [], video: [], audio: [] })
}

function composeJimengPrompt({ episode, refsByType, segmentIndex }) {
  const parts = []
  if (refsByType.image[0]) parts.push(`${refsByType.image[0]} 保持角色与场景外观`)
  if (refsByType.video[0]) parts.push(`模仿 ${refsByType.video[0]} 的动作节奏`)
  if (refsByType.audio[0]) parts.push(`音色参考 ${refsByType.audio[0]}`)
  parts.push(`生成${episode.title}第${segmentIndex + 1}段，结尾保留悬念：${episode.endingHook}`)
  return parts.join('，')
}

function collectLocations(summaries) {
  const locations = new Set()
  for (const summary of summaries) {
    for (const location of summary.locations ?? []) locations.add(location)
  }
  return [...locations]
}

function slugRef(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'ref'
}

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
}
