import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateChapterSummary } from './summary-schema.mjs'

export async function buildSeriesBible({ runDir }) {
  if (!runDir) throw new Error('buildSeriesBible requires runDir')

  const summaries = await readAcceptedSummaries(runDir)
  const bibleDir = join(runDir, 'bible')
  await mkdir(bibleDir, { recursive: true })

  const warnings = findAmbiguousNameWarnings(summaries)
  const characters = buildCharacters(summaries)
  const locations = buildLocations(summaries)

  const seriesBiblePath = join(bibleDir, 'series-bible.md')
  const charactersPath = join(bibleDir, 'characters.json')
  const locationsPath = join(bibleDir, 'locations.json')
  const timelinePath = join(bibleDir, 'timeline.md')

  await writeFile(seriesBiblePath, `${composeSeriesBible({ summaries, warnings })}\n`, 'utf8')
  await writeFile(charactersPath, `${JSON.stringify(characters, null, 2)}\n`, 'utf8')
  await writeFile(locationsPath, `${JSON.stringify(locations, null, 2)}\n`, 'utf8')
  await writeFile(timelinePath, `${composeTimeline(summaries)}\n`, 'utf8')

  return {
    seriesBiblePath,
    charactersPath,
    locationsPath,
    timelinePath,
    counts: {
      summaries: summaries.length,
      characters: characters.length,
      locations: locations.length,
      warnings: warnings.length
    }
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
    const summaryPath = join(summariesDir, file)
    const summary = JSON.parse(await readFile(summaryPath, 'utf8'))
    const validation = validateChapterSummary(summary)
    if (!validation.ok) {
      throw new Error(`Invalid accepted summary ${file}:\n- ${validation.errors.join('\n- ')}`)
    }
    summaries.push({ ...summary, acceptedFile: file })
  }

  return summaries.sort(compareSummaries)
}

function compareSummaries(left, right) {
  return left.chapterId.localeCompare(right.chapterId, 'en') || left.acceptedFile.localeCompare(right.acceptedFile, 'en')
}

function composeSeriesBible({ summaries, warnings }) {
  const lines = [
    '# Series Bible',
    '',
    '## Main Arc'
  ]

  for (const summary of summaries) {
    lines.push(`- ${summary.chapterId}: ${summary.summary}`)
  }

  lines.push('', '## Volume/Chapter Map')
  for (const summary of summaries) {
    lines.push(`- ${summary.chapterId}: ${summary.title}`)
  }

  lines.push('', '## Open Questions/Hooks')
  appendGroupedList(lines, summaries, 'openQuestions')

  lines.push('', '## Adaptation Notes')
  appendGroupedList(lines, summaries, 'adaptationNotes')

  if (warnings.length) {
    lines.push('', '## Warnings')
    for (const warning of warnings) {
      lines.push(`- ${warning}`)
    }
  }

  return lines.join('\n')
}

function appendGroupedList(lines, summaries, field) {
  let wroteAny = false
  for (const summary of summaries) {
    const values = normalizeStringArray(summary[field])
    if (!values.length) continue
    wroteAny = true
    lines.push(`- ${summary.chapterId}:`)
    for (const value of values) {
      lines.push(`  - ${value}`)
    }
  }

  if (!wroteAny) {
    lines.push('- none')
  }
}

function composeTimeline(summaries) {
  const lines = ['# Timeline']

  for (const summary of summaries) {
    lines.push('', `## ${summary.chapterId} - ${summary.title}`)
    summary.beats.forEach((beat, index) => {
      lines.push(`${index + 1}. ${beat.event}`)
    })
  }

  return lines.join('\n')
}

function buildCharacters(summaries) {
  const byName = new Map()

  for (const summary of summaries) {
    for (const character of summary.characters) {
      const existing = byName.get(character.name) ?? {
        name: character.name,
        firstChapter: summary.chapterId,
        appearanceCount: 0,
        roleSignals: [],
        visualHints: [],
        relationshipHints: [],
        chapters: []
      }

      existing.appearanceCount += 1
      pushUnique(existing.chapters, summary.chapterId)
      for (const role of collectValues(character, ['role', 'roleSignal', 'roleSignals'])) {
        pushUnique(existing.roleSignals, role)
      }
      for (const visualHint of collectValues(character, ['visualHint', 'visualHints', 'appearance', 'visual'])) {
        pushUnique(existing.visualHints, visualHint)
      }
      for (const relationshipHint of collectValues(character, ['relationshipHint', 'relationshipHints', 'relationship'])) {
        pushUnique(existing.relationshipHints, relationshipHint)
      }

      byName.set(character.name, existing)
    }
  }

  return [...byName.values()].map((character) => ({
    ...character,
    recommendedTier: recommendCharacterTier(character)
  }))
}

function buildLocations(summaries) {
  const byName = new Map()

  for (const summary of summaries) {
    for (const name of normalizeLocationNames(summary.locations)) {
      const existing = byName.get(name) ?? {
        name,
        firstChapter: summary.chapterId,
        occurrenceCount: 0,
        chapters: []
      }

      existing.occurrenceCount += 1
      pushUnique(existing.chapters, summary.chapterId)
      byName.set(name, existing)
    }
  }

  return [...byName.values()]
}

function recommendCharacterTier(character) {
  const roleText = character.roleSignals.join(' ').toLowerCase()
  if (/protagonist|main character|lead|主角|男主|女主/u.test(roleText) || character.appearanceCount >= 3) {
    return 'S'
  }
  if (/antagonist|villain|mentor|ally|investigator|反派|导师|同伴|搭档|关键/u.test(roleText) && character.appearanceCount >= 2) {
    return 'A'
  }
  if (character.appearanceCount >= 2) {
    return 'B'
  }
  return 'C'
}

function findAmbiguousNameWarnings(summaries) {
  const names = []
  for (const summary of summaries) {
    for (const character of summary.characters) {
      pushUnique(names, character.name)
    }
  }

  const warnings = []
  for (let leftIndex = 0; leftIndex < names.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < names.length; rightIndex += 1) {
      if (normalizeNameForWarning(names[leftIndex]) === normalizeNameForWarning(names[rightIndex])) {
        warnings.push(`Possible duplicate character names kept separate: ${names[leftIndex]} / ${names[rightIndex]}`)
      }
    }
  }
  return warnings
}

function normalizeNameForWarning(name) {
  return name.replace(/\s+/gu, '').toLowerCase()
}

function normalizeLocationNames(locations) {
  if (!Array.isArray(locations)) return []
  const names = []

  for (const location of locations) {
    if (typeof location === 'string') {
      if (location.trim()) names.push(location.trim())
      continue
    }

    if (location && typeof location === 'object' && typeof location.name === 'string' && location.name.trim()) {
      names.push(location.name.trim())
    }
  }

  return names
}

function collectValues(source, keys) {
  const values = []
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      values.push(value.trim())
      continue
    }

    if (Array.isArray(value)) {
      values.push(...normalizeStringArray(value))
    }
  }
  return values
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return []
  return values
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
}

function pushUnique(target, value) {
  if (!target.includes(value)) {
    target.push(value)
  }
}
