import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateChapterSummary } from './summary-schema.mjs'

const DENSE_BEATS_PER_MINUTE = 6

export async function planNovelEpisodes({ runDir, episodeMinutes = 2 }) {
  if (!runDir) throw new Error('planNovelEpisodes requires runDir')
  validateEpisodeMinutes(episodeMinutes)

  const summaries = await readAcceptedSummaries(runDir)
  const bibleCharacters = await readBibleCharacters(runDir)
  const episodes = buildEpisodes({ summaries, bibleCharacters, episodeMinutes })

  const episodesDir = join(runDir, 'episodes')
  await mkdir(episodesDir, { recursive: true })

  const adaptationPlanPath = join(episodesDir, 'adaptation-plan.md')
  const adaptationPlanJsonPath = join(episodesDir, 'adaptation-plan.json')
  await writeFile(adaptationPlanPath, `${composeAdaptationPlan({ episodes, episodeMinutes })}\n`, 'utf8')
  await writeFile(adaptationPlanJsonPath, `${JSON.stringify(composeAdaptationPlanJson({ episodes, episodeMinutes }), null, 2)}\n`, 'utf8')
  await updatePlannedEpisodeCount(runDir, episodes.length)

  return {
    adaptationPlanPath,
    adaptationPlanJsonPath,
    episodes,
    warnings: episodes.flatMap((episode) => episode.warnings)
  }
}

function validateEpisodeMinutes(episodeMinutes) {
  if (typeof episodeMinutes !== 'number' || !Number.isFinite(episodeMinutes) || episodeMinutes <= 0) {
    throw new Error('--episode-minutes must be a positive number')
  }
}

async function readAcceptedSummaries(runDir) {
  const summariesDir = join(runDir, 'summaries')
  let entries
  try {
    entries = await readdir(summariesDir)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`No accepted summaries found in ${summariesDir}`)
    }
    throw error
  }

  const summaryFiles = entries
    .filter((entry) => entry.endsWith('.summary.json'))
    .sort()

  if (!summaryFiles.length) {
    throw new Error(`No accepted summaries found in ${summariesDir}`)
  }

  const summaries = []
  for (const file of summaryFiles) {
    const summary = JSON.parse(await readFile(join(summariesDir, file), 'utf8'))
    const validation = validateChapterSummary(summary)
    if (!validation.ok) {
      throw new Error(`Invalid accepted summary ${file}:\n- ${validation.errors.join('\n- ')}`)
    }
    summaries.push({ ...summary, acceptedFile: file })
  }

  rejectDuplicateChapterIds(summaries)
  rejectNonCanonicalSummaryFiles(summaries)
  return summaries.sort(compareSummaries)
}

function compareSummaries(left, right) {
  return left.chapterId.localeCompare(right.chapterId, 'en') || left.acceptedFile.localeCompare(right.acceptedFile, 'en')
}

function rejectDuplicateChapterIds(summaries) {
  const filesByChapterId = new Map()
  for (const summary of summaries) {
    const files = filesByChapterId.get(summary.chapterId) ?? []
    files.push(summary.acceptedFile)
    filesByChapterId.set(summary.chapterId, files)
  }

  for (const [chapterId, files] of filesByChapterId) {
    if (files.length > 1) {
      throw new Error(`Duplicate chapterId in accepted summaries: ${chapterId} appears in ${files.sort().join(', ')}`)
    }
  }
}

function rejectNonCanonicalSummaryFiles(summaries) {
  for (const summary of summaries) {
    const expectedFile = `${summary.chapterId}.summary.json`
    if (summary.acceptedFile !== expectedFile) {
      throw new Error(`Summary filename mismatch: ${summary.acceptedFile} must be ${expectedFile}`)
    }
  }
}

async function readBibleCharacters(runDir) {
  try {
    const characters = JSON.parse(await readFile(join(runDir, 'bible', 'characters.json'), 'utf8'))
    if (!Array.isArray(characters)) return new Map()
    return new Map(
      characters
        .filter((character) => character && typeof character.name === 'string' && character.name.trim())
        .map((character) => [character.name.trim(), character])
    )
  } catch (error) {
    if (error?.code === 'ENOENT') return new Map()
    throw error
  }
}

function buildEpisodes({ summaries, bibleCharacters, episodeMinutes }) {
  const targetBeats = Math.max(1, Math.floor(episodeMinutes * DENSE_BEATS_PER_MINUTE))
  const targetChapters = Math.max(1, Math.floor(episodeMinutes))
  const groups = []
  let current = []
  let currentBeats = 0

  for (const summary of summaries) {
    const beatCount = summary.beats.length
    if (current.length && (currentBeats + beatCount > targetBeats || current.length >= targetChapters)) {
      groups.push(current)
      current = []
      currentBeats = 0
    }

    current.push(summary)
    currentBeats += beatCount
  }

  if (current.length) groups.push(current)

  return groups.map((group, index) => createEpisode({
    index,
    summaries: group,
    bibleCharacters,
    episodeMinutes
  }))
}

function createEpisode({ index, summaries, bibleCharacters, episodeMinutes }) {
  const episodeNumber = index + 1
  const lastSummary = summaries.at(-1)
  const requiredCharacters = collectRequiredCharacters({ summaries, bibleCharacters })
  const warnings = summaries.flatMap((summary) => denseChapterWarnings(summary, episodeMinutes))

  return {
    episodeId: `episode-${String(episodeNumber).padStart(4, '0')}`,
    title: `第${episodeNumber}集 - ${summaries[0].title}`,
    episodeMinutes,
    goal: summaries.map((summary) => summary.summary.trim()).filter(Boolean).join(' '),
    includedChapters: summaries.map((summary) => ({
      chapterId: summary.chapterId,
      title: summary.title
    })),
    requiredCharacters,
    endingHook: chooseEndingHook(lastSummary),
    beats: summaries.flatMap((summary) => summary.beats.map((beat) => beat.event)),
    warnings
  }
}

function collectRequiredCharacters({ summaries, bibleCharacters }) {
  const byName = new Map()
  for (const summary of summaries) {
    for (const character of summary.characters) {
      if (!character || typeof character.name !== 'string') continue
      const name = character.name.trim()
      if (!name || byName.has(name)) continue
      byName.set(name, bibleCharacters.get(name) ?? character)
    }
  }
  return [...byName.keys()]
}

function chooseEndingHook(summary) {
  const openQuestion = normalizeStringArray(summary.openQuestions)[0]
  if (openQuestion) return openQuestion

  const adaptationNote = normalizeStringArray(summary.adaptationNotes).find((note) => /hook|cliff|悬念|钩子|反转|结尾/u.test(note))
  if (adaptationNote) return adaptationNote

  const lastBeat = summary.beats.at(-1)?.event
  if (lastBeat) return lastBeat

  return summary.summary
}

function denseChapterWarnings(summary, episodeMinutes) {
  const warnings = []
  const denseBeatLimit = episodeMinutes * DENSE_BEATS_PER_MINUTE
  if (summary.beats.length > denseBeatLimit) {
    warnings.push(`${summary.chapterId} may be too dense for ${episodeMinutes} minute(s); consider splitting manually.`)
  }

  const notesLength = normalizeStringArray(summary.adaptationNotes).join('').length
  if (summary.summary.length + notesLength > episodeMinutes * 800) {
    warnings.push(`${summary.chapterId} has long summary/adaptation notes for ${episodeMinutes} minute(s); review pacing manually.`)
  }
  return warnings
}

function composeAdaptationPlan({ episodes, episodeMinutes }) {
  const lines = [
    '# Novel Adaptation Episode Plan',
    '',
    `Default episode length: ${episodeMinutes} minute(s)`,
    `Planned episodes: ${episodes.length}`
  ]

  for (const episode of episodes) {
    lines.push(
      '',
      `## ${episode.episodeId} - ${episode.title}`,
      `- Episode goal: ${episode.goal}`,
      `- Episode minutes: ${episode.episodeMinutes}`,
      `- Included chapters: ${formatIncludedChapters(episode.includedChapters)}`,
      `- Required characters: ${episode.requiredCharacters.length ? episode.requiredCharacters.join(', ') : 'none'}`,
      `- Ending hook: ${episode.endingHook}`,
      '- Beats:'
    )

    episode.beats.forEach((beat, index) => {
      lines.push(`  ${index + 1}. ${beat}`)
    })

    if (episode.warnings.length) {
      lines.push('- Warnings:')
      for (const warning of episode.warnings) {
        lines.push(`  - ${warning}`)
      }
    }
  }

  return lines.join('\n')
}

function composeAdaptationPlanJson({ episodes, episodeMinutes }) {
  return {
    schemaVersion: 1,
    episodeMinutes,
    episodes: episodes.map((episode) => ({
      episodeId: episode.episodeId,
      title: episode.title,
      episodeMinutes: episode.episodeMinutes,
      goal: episode.goal,
      includedChapters: episode.includedChapters,
      requiredCharacters: episode.requiredCharacters,
      endingHook: episode.endingHook,
      beats: episode.beats,
      warnings: episode.warnings
    }))
  }
}

function formatIncludedChapters(chapters) {
  return chapters.map((chapter) => `${chapter.chapterId} (${chapter.title})`).join(', ')
}

async function updatePlannedEpisodeCount(runDir, plannedEpisodes) {
  const projectPath = join(runDir, 'project.json')
  try {
    const project = JSON.parse(await readFile(projectPath, 'utf8'))
    project.counts = {
      ...project.counts,
      plannedEpisodes
    }
    await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return []
  return values
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
}
