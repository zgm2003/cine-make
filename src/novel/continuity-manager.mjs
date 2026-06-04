import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const GENERATED_SECTION_PATTERN = /<!-- cine-make:episode ([^:]+):start -->[\s\S]*?<!-- cine-make:episode \1:end -->\n?/gu

export async function updateProjectContinuity({ runDir, episodeId, episodePackage }) {
  if (!runDir) throw new Error('updateProjectContinuity requires runDir')
  if (!episodeId) throw new Error('updateProjectContinuity requires episodeId')
  if (!episodePackage) throw new Error('updateProjectContinuity requires episodePackage')

  const projectDir = resolve(runDir)
  const continuityDir = join(projectDir, 'continuity')
  const logPath = join(continuityDir, 'continuity-log.md')
  const hooksPath = join(continuityDir, 'unresolved-hooks.json')
  await mkdir(continuityDir, { recursive: true })

  const existingHooks = await readHooks(hooksPath)
  const resolvedHooks = resolveHooks({
    hooks: existingHooks,
    resolvedHookIds: normalizeStringArray(episodePackage.resolvedHooks),
    resolvedHookDescriptions: normalizeStringArray(episodePackage.resolvedHookDescriptions)
  })
  const hookDrafts = collectHookDrafts({ episodeId, episodePackage })
  const nextHookId = createHookIdGenerator(existingHooks)
  const addedHooks = []

  for (const draft of hookDrafts) {
    const duplicate = existingHooks.some((hook) => (
      normalizeDescription(hook.description) === normalizeDescription(draft.description)
    ))
    if (duplicate) continue

    const hook = {
      hookId: nextHookId(),
      introducedIn: episodeId,
      description: draft.description,
      status: 'open',
      suggestedPayoff: draft.suggestedPayoff,
      relatedCharacters: draft.relatedCharacters,
      relatedProps: draft.relatedProps
    }
    existingHooks.push(hook)
    addedHooks.push(hook)
  }

  await writeFile(hooksPath, `${JSON.stringify(existingHooks, null, 2)}\n`, 'utf8')
  await writeFile(logPath, composeContinuityLog({
    currentLog: await readOptionalText(logPath, '# Continuity Log\n'),
    episodeId,
    episodePackage,
    episodeHooks: existingHooks.filter((hook) => hook.introducedIn === episodeId)
  }), 'utf8')

  return {
    logPath,
    hooksPath,
    addedHooks,
    resolvedHooks
  }
}

async function readHooks(path) {
  try {
    const value = JSON.parse(await readFile(path, 'utf8'))
    if (!Array.isArray(value)) return []
    return value.map(normalizeExistingHook).filter(Boolean)
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

function normalizeExistingHook(hook) {
  if (!hook || typeof hook !== 'object') return null
  const hookId = cleanText(hook.hookId ?? hook.id)
  const description = cleanText(hook.description ?? hook.note ?? hook.question)
  if (!hookId || !description) return null

  return {
    ...hook,
    hookId,
    introducedIn: cleanText(hook.introducedIn ?? hook.episodeId ?? hook.chapterId),
    description,
    status: cleanText(hook.status) || 'open',
    suggestedPayoff: cleanText(hook.suggestedPayoff ?? hook.payoff),
    relatedCharacters: normalizeStringArray(hook.relatedCharacters),
    relatedProps: normalizeStringArray(hook.relatedProps ?? hook.props ?? hook.propsOrPowers)
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

function resolveHooks({ hooks, resolvedHookIds, resolvedHookDescriptions }) {
  const resolvedIds = new Set(resolvedHookIds)
  const resolvedHooks = []

  for (const hook of hooks) {
    if (resolvedIds.has(hook.hookId)) {
      if (hook.status !== 'resolved') hook.status = 'resolved'
      resolvedHooks.push(hook.hookId)
    }
  }

  for (const description of resolvedHookDescriptions.map(normalizeDescription)) {
    const matches = hooks.filter((hook) => (
      isOpenHook(hook) &&
      normalizeDescription(hook.description) === description
    ))
    if (matches.length !== 1) continue

    matches[0].status = 'resolved'
    resolvedHooks.push(matches[0].hookId)
  }

  return uniqueStrings(resolvedHooks)
}

function isOpenHook(hook) {
  return !hook.status || hook.status === 'open' || hook.status === 'active'
}

function collectHookDrafts({ episodeId, episodePackage }) {
  const episode = episodePackage.episode ?? {}
  const summaries = Array.isArray(episodePackage.summaries) ? episodePackage.summaries : []
  const continuityHooks = Array.isArray(episodePackage.continuity?.unresolvedHooks)
    ? episodePackage.continuity.unresolvedHooks
    : []
  const defaultCharacters = collectEpisodeCharacters(episodePackage)
  const defaultProps = collectEpisodeProps(episodePackage)
  const drafts = []

  addHookDraft(drafts, {
    description: episode.endingHook,
    suggestedPayoff: '',
    relatedCharacters: defaultCharacters,
    relatedProps: defaultProps
  })

  for (const summary of summaries) {
    for (const question of normalizeStringArray(summary.openQuestions)) {
      addHookDraft(drafts, {
        description: question,
        suggestedPayoff: '',
        relatedCharacters: collectSummaryCharacters(summary, defaultCharacters),
        relatedProps: collectSummaryProps(summary, defaultProps)
      })
    }
  }

  for (const hook of continuityHooks) {
    if (cleanText(hook?.hookId ?? hook?.id)) continue
    addHookDraft(drafts, {
      description: hook?.description ?? hook?.note ?? hook?.question,
      suggestedPayoff: cleanText(hook?.suggestedPayoff ?? hook?.payoff),
      relatedCharacters: mergeUnique(defaultCharacters, normalizeStringArray(hook?.relatedCharacters)),
      relatedProps: mergeUnique(defaultProps, normalizeStringArray(hook?.relatedProps ?? hook?.props ?? hook?.propsOrPowers))
    })
  }

  const seen = new Set()
  return drafts.filter((draft) => {
    const key = `${episodeId}:${normalizeDescription(draft.description)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function addHookDraft(drafts, draft) {
  const description = cleanText(draft.description)
  if (!description) return
  drafts.push({
    description,
    suggestedPayoff: cleanText(draft.suggestedPayoff),
    relatedCharacters: uniqueStrings(draft.relatedCharacters),
    relatedProps: uniqueStrings(draft.relatedProps)
  })
}

function collectEpisodeCharacters(episodePackage) {
  const episodeCharacters = normalizeStringArray(episodePackage.episode?.requiredCharacters)
  const cardCharacters = Array.isArray(episodePackage.characters)
    ? episodePackage.characters.map((character) => character?.name)
    : []
  return mergeUnique(episodeCharacters, cardCharacters)
}

function collectEpisodeProps(episodePackage) {
  const summaries = Array.isArray(episodePackage.summaries) ? episodePackage.summaries : []
  return uniqueStrings(summaries.flatMap((summary) => normalizeStringArray(summary.propsOrPowers)))
}

function collectSummaryCharacters(summary, fallback) {
  const characters = Array.isArray(summary.characters)
    ? summary.characters.map((character) => typeof character === 'string' ? character : character?.name)
    : []
  return mergeUnique(characters, fallback)
}

function collectSummaryProps(summary, fallback) {
  return mergeUnique(normalizeStringArray(summary.propsOrPowers), fallback)
}

function createHookIdGenerator(existingHooks) {
  let next = existingHooks.reduce((max, hook) => {
    const match = /^hook-(\d+)$/u.exec(hook.hookId)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0) + 1

  return () => {
    const id = `hook-${String(next).padStart(4, '0')}`
    next += 1
    return id
  }
}

function composeContinuityLog({ currentLog, episodeId, episodePackage, episodeHooks }) {
  const episodeSection = createEpisodeSection({ episodeId, episodePackage, episodeHooks })
  if (hasGeneratedEpisodeSection(currentLog, episodeId)) {
    return replaceGeneratedEpisodeSection(currentLog, episodeId, episodeSection)
  }

  return insertGeneratedEpisodeSection(currentLog, episodeId, episodeSection)
}

function hasGeneratedEpisodeSection(log, episodeId) {
  for (const match of log.matchAll(GENERATED_SECTION_PATTERN)) {
    if (match[1] === episodeId) return true
  }
  return false
}

function replaceGeneratedEpisodeSection(log, episodeId, episodeSection) {
  return log.replace(GENERATED_SECTION_PATTERN, (match, matchedEpisodeId) => {
    return matchedEpisodeId === episodeId ? `${episodeSection}\n` : match
  })
}

function insertGeneratedEpisodeSection(log, episodeId, episodeSection) {
  const baseLog = log.trimEnd() || '# Continuity Log'

  for (const match of baseLog.matchAll(GENERATED_SECTION_PATTERN)) {
    const matchedEpisodeId = match[1]
    if (matchedEpisodeId.localeCompare(episodeId, 'en') <= 0) continue

    const before = baseLog.slice(0, match.index).trimEnd()
    const after = baseLog.slice(match.index).trimStart()
    return `${before}\n\n${episodeSection}\n\n${after}\n`
  }

  return `${baseLog}\n\n${episodeSection}\n`
}

function createEpisodeSection({ episodeId, episodePackage, episodeHooks }) {
  const episode = episodePackage.episode ?? {}
  const episodeNumber = episodeId.replace(/^episode-/u, '')
  const title = cleanText(episode.title) || episodeId
  const lines = [
    `<!-- cine-make:episode ${episodeId}:start -->`,
    `## Episode ${episodeNumber} - ${title}`,
    '',
    `- Goal: ${cleanText(episode.goal) || 'none'}`,
    `- Included chapters: ${formatIncludedChapters(episode.includedChapters)}`,
    `- Required characters: ${formatList(normalizeStringArray(episode.requiredCharacters))}`,
    `- Ending hook: ${cleanText(episode.endingHook) || 'none'}`,
    '',
    '### Character State',
    formatCharacterLines(episodePackage.characters),
    '',
    '### Props / Powers',
    formatPropLines(episodePackage.summaries),
    '',
    '### Episode Hooks',
    formatHookLines(episodeHooks),
    `<!-- cine-make:episode ${episodeId}:end -->`
  ]
  return lines.join('\n')
}

function formatIncludedChapters(chapters) {
  if (!Array.isArray(chapters) || !chapters.length) return 'none'
  return chapters
    .map((chapter) => `${cleanText(chapter?.chapterId)} - ${cleanText(chapter?.title)}`.trim())
    .filter(Boolean)
    .join(', ') || 'none'
}

function formatCharacterLines(characters) {
  if (!Array.isArray(characters) || !characters.length) return '- none'
  const lines = characters
    .map((character) => {
      const name = cleanText(character?.name)
      if (!name) return null
      const details = [
        ...normalizeStringArray(character.visualHints),
        ...normalizeStringArray(character.relationshipHints)
      ]
      return `- ${name}${details.length ? `: ${details.join(', ')}` : ''}`
    })
    .filter(Boolean)
  return lines.length ? lines.join('\n') : '- none'
}

function formatPropLines(summaries) {
  const propsByChapter = []
  if (Array.isArray(summaries)) {
    for (const summary of summaries) {
      const props = normalizeStringArray(summary.propsOrPowers)
      if (!props.length) continue
      propsByChapter.push(`- ${cleanText(summary.chapterId) || 'chapter'}: ${props.join(', ')}`)
    }
  }
  return propsByChapter.length ? propsByChapter.join('\n') : '- none'
}

function formatHookLines(hooks) {
  if (!hooks.length) return '- none'
  return hooks
    .map((hook) => {
      const payoff = hook.suggestedPayoff ? `; suggested payoff: ${hook.suggestedPayoff}` : ''
      return `- ${hook.hookId} [${hook.status}]: ${hook.description}${payoff}`
    })
    .join('\n')
}

function formatList(values) {
  return values.length ? values.join(', ') : 'none'
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return []
  return uniqueStrings(values.map(cleanText).filter(Boolean))
}

function uniqueStrings(values) {
  return [...new Set(values.map(cleanText).filter(Boolean))]
}

function mergeUnique(...groups) {
  return uniqueStrings(groups.flat())
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDescription(value) {
  return cleanText(value).replace(/\s+/gu, ' ').toLocaleLowerCase()
}
