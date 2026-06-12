import { readFile } from 'node:fs/promises'
import { extractScriptProfile, inferScriptProfileSizing } from './script-profile.mjs'

const VALID_ASPECTS = new Set(['9:16', '16:9', '1:1', '4:5', '21:9'])
const VALID_PLATFORMS = new Set(['jimeng'])
const DEFAULT_STYLE = '超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性'
const LIVE_ACTION_STYLE_MARKERS = /(超写实|真人|电影质感|live-action|photoreal|realistic)/i
const ILLUSTRATED_STYLE_MARKERS = /(国漫|漫画|漫剧|动漫|二次元|插画|anime|manhua|comic|toon|webtoon|illustrat)/i
const MAX_VISUAL_REFERENCE_IMAGES = 12
const DEFAULT_MIN_DURATION_SECONDS = 30
const MAX_DURATION_SECONDS = 180
const VIDEO_SEGMENT_SECONDS = 15
const DEFAULT_SHOTS_PER_SEGMENT = 4
const DEFAULT_MIN_SHOTS = Math.ceil(DEFAULT_MIN_DURATION_SECONDS / VIDEO_SEGMENT_SECONDS) * DEFAULT_SHOTS_PER_SEGMENT
const MAX_SHOTS = Math.ceil(MAX_DURATION_SECONDS / VIDEO_SEGMENT_SECONDS) * DEFAULT_SHOTS_PER_SEGMENT
const EXPLICIT_STORYBOARD_MARKER = /(?:^|\n)\s*(?:【\s*分镜\s*(?:\d+|[一二三四五六七八九十百]+)\s*】|分镜\s*(?:\d+|[一二三四五六七八九十百]+)(?=[\s:：、.．-]|$)|镜头\s*(?:\d+|[一二三四五六七八九十百]+)(?=[\s:：、.．-]|$)|shot\s*\d+(?=[\s:：、.．-]|$)|s\d{1,3}(?=[\s:：、.．-]|$))/giu
const REMOVED_DRAFT_VISUAL_MESSAGE = 'draft/visual modes are removed; use seedance-pack or the default Cine Make command for Seedance + Canvas.'
const MODE_ALIASES = new Map([
  ['draft', 'draft'],
  ['visual', 'visual'],
  ['image', 'visual'],
  ['generate', 'visual'],
  ['production', 'visual']
])

function normalizeMode(value) {
  const mode = (value || 'draft').toLowerCase()
  const normalized = MODE_ALIASES.get(mode)
  if (!normalized) throw new Error(`Unsupported mode: ${mode}`)
  return normalized
}

function stableHash(value) {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function slugify(value) {
  const ascii = value.toLowerCase().match(/[a-z0-9]+/g)
  if (ascii?.length) return ascii.slice(0, 5).join('-')
  return `cine-${stableHash(value).slice(0, 8)}`
}

function parseSeconds(value) {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_MIN_DURATION_SECONDS
  const match = value.trim().match(/^(\d+)(s|sec|secs|second|seconds|秒)?$/i)
  if (!match) throw new Error(`Invalid duration: ${value}`)
  const seconds = Number(match[1])
  if (!Number.isInteger(seconds) || seconds < 4 || seconds > MAX_DURATION_SECONDS) {
    throw new Error(`duration must be an integer between 4 and ${MAX_DURATION_SECONDS} seconds`)
  }
  return seconds
}

function clampInteger(value, fallback, min, max, label) {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}`)
  }
  return parsed
}

export function parseArgs(argv) {
  const command = ['ready', 'task', 'validate'].includes(argv[0]) ? argv[0] : 'make'
  const options = {
    command,
    mode: 'draft',
    out: null,
    run: null,
    done: [],
    id: null,
    input: null,
    title: null,
    duration: null,
    durationExplicit: false,
    aspect: '9:16',
    style: DEFAULT_STYLE,
    platform: 'jimeng',
    stage: 'skeleton',
    draft: true,
    emitInternal: false,
    shots: null,
    storyboards: null,
    references: [],
    visualReferences: {
      characterImages: [],
      sceneImages: [],
      styleImages: []
    },
    sourceParts: []
  }

  for (let index = command === 'make' ? 0 : 1; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--out') {
      index += 1
      if (!argv[index]) throw new Error('--out requires a path')
      options.out = argv[index]
      continue
    }

    if (arg === '--run') {
      index += 1
      if (!argv[index]) throw new Error('--run requires a path')
      options.run = argv[index]
      continue
    }

    if (arg === '--done') {
      index += 1
      if (!argv[index]) throw new Error('--done requires a task id')
      options.done.push(...argv[index].split(',').map((id) => id.trim()).filter(Boolean))
      continue
    }

    if (arg === '--id') {
      index += 1
      if (!argv[index]) throw new Error('--id requires a task id')
      options.id = argv[index]
      continue
    }

    if (arg === '--input') {
      index += 1
      if (!argv[index]) throw new Error('--input requires a file path')
      options.input = argv[index]
      continue
    }

    if (arg === '--title') {
      index += 1
      if (!argv[index]) throw new Error('--title requires text')
      options.title = argv[index]
      continue
    }

    if (arg === '--duration') {
      index += 1
      if (!argv[index]) throw new Error('--duration requires a value')
      options.duration = argv[index]
      options.durationExplicit = true
      continue
    }

    if (arg === '--aspect') {
      index += 1
      if (!argv[index]) throw new Error('--aspect requires a value')
      options.aspect = argv[index]
      continue
    }

    if (arg === '--style') {
      index += 1
      if (!argv[index]) throw new Error('--style requires text')
      options.style = argv[index]
      continue
    }

    if (arg === '--platform') {
      index += 1
      if (!argv[index]) throw new Error('--platform requires a value')
      options.platform = argv[index]
      continue
    }

    if (arg === '--mode') {
      throw new Error(REMOVED_DRAFT_VISUAL_MESSAGE)
    }

    if (arg === '--stage') {
      index += 1
      if (!argv[index]) throw new Error('--stage requires skeleton or production')
      options.stage = argv[index]
      continue
    }

    if (arg === '--draft') {
      throw new Error(REMOVED_DRAFT_VISUAL_MESSAGE)
    }

    if (arg === '--visual') {
      throw new Error(REMOVED_DRAFT_VISUAL_MESSAGE)
    }

    if (arg === '--emit-internal' || arg === '--debug-artifacts') {
      options.emitInternal = true
      continue
    }

    if (arg === '--shots') {
      index += 1
      if (!argv[index]) throw new Error('--shots requires a number')
      options.shots = argv[index]
      continue
    }

    if (arg === '--storyboards') {
      index += 1
      if (!argv[index]) throw new Error('--storyboards requires a number')
      options.storyboards = argv[index]
      continue
    }

    if (arg === '--reference') {
      index += 1
      if (!argv[index]) throw new Error('--reference requires a path or note')
      options.references.push(argv[index])
      continue
    }

    if (arg === '--character-image') {
      index += 1
      if (!argv[index]) throw new Error('--character-image requires a path')
      options.visualReferences.characterImages.push(argv[index])
      continue
    }

    if (arg === '--scene-image') {
      index += 1
      if (!argv[index]) throw new Error('--scene-image requires a path')
      options.visualReferences.sceneImages.push(argv[index])
      continue
    }

    if (arg === '--style-image') {
      index += 1
      if (!argv[index]) throw new Error('--style-image requires a path')
      options.visualReferences.styleImages.push(argv[index])
      continue
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (command !== 'make') throw new Error(`Unknown argument for ${command}: ${arg}`)
    options.sourceParts.push(arg)
  }

  return options
}

function inferContentType(sourceText) {
  const text = sourceText.trim()
  if (countExplicitStoryboardShots(text) > 0) return 'explicit_storyboard'
  if (/第[一二三四五六七八九十0-9]+集剧本|角色设定|^\[场景/mu.test(text) && /\[场景|▲\s*【(?:画面|音效)】/u.test(text)) {
    return 'short_drama_script'
  }
  if (/分镜|镜头|景别|运镜|shot/i.test(text)) return 'rough_shotlist'
  if (/广告|卖点|产品|品牌|转化|投放|campaign/i.test(text)) return 'ad_brief'
  if (/旁白|口播|主播|voiceover|script/i.test(text)) return 'voiceover_script'
  if (/(企业|工厂|车间|技校|电焊工|焊枪|焊花|师傅|劳模|项目|攻坚|制造基地|高质量|转型|传承|奋斗|号声|上班号|下班号|东锅|东方锅炉|锅炉)/u.test(text)) {
    return 'enterprise_documentary'
  }
  if (/(筑基丹|掌天瓶|练气|筑基|结丹|元婴|坊市|黄枫谷|乱星海|韩立|神兵门|天星宗|元武国|魔道|灵根|传送阵|噬金虫|金雷竹|风雷翅)/u.test(text)) {
    return 'cultivation_transmigration'
  }
  if (/(黄皮子|黄皮|讨封|香炉|神龛|祠堂|香火|牌位|老祖|精怪|飨食|供香)/u.test(text)) return 'novel_excerpt'
  if (/第[一二三四五六七八九十0-9]+章|小说|她|他|雨夜|巷口|抬头|沉默|chapter/i.test(text)) return 'novel_excerpt'
  return 'story_material'
}

function defaultShotCount(seconds) {
  const segmentCount = Math.ceil(seconds / VIDEO_SEGMENT_SECONDS)
  return Math.min(MAX_SHOTS, segmentCount * DEFAULT_SHOTS_PER_SEGMENT)
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length
}

function countExplicitStoryboardShots(sourceText) {
  return countMatches(sourceText, EXPLICIT_STORYBOARD_MARKER)
}

function sumExplicitStoryboardDurations(sourceText) {
  const durations = [...sourceText.matchAll(/(?:^|\n)\s*(?:时长|duration)\s*[:：]?\s*(\d+)\s*(?:s|sec|secs|second|seconds|秒)?/giu)]
    .map((match) => Number(match[1]))
    .filter((seconds) => Number.isInteger(seconds) && seconds > 0)
  return durations.reduce((sum, seconds) => sum + seconds, 0)
}

function narrativeUnits(sourceText) {
  return sourceText.replace(/\s+/g, '').length
}

function narrativeSentenceFragments(sourceText) {
  return sourceText
    .split(/[。！？!?；;]+|\n+/u)
    .map((part) => part.trim())
    .filter((part) => narrativeUnits(part) >= 6)
}

function inferPlotShotCount(sourceText, contentType) {
  const units = narrativeUnits(sourceText)
  const sentenceFragments = narrativeSentenceFragments(sourceText)
  const sentenceCount = sentenceFragments.length
  const substantiveSentenceCount = sentenceFragments.filter((part) => narrativeUnits(part) >= 12).length
  const dialogueCount = countMatches(sourceText, /[“"][^”"]{2,120}[”"]/gu)
  const eventCueCount = countMatches(sourceText, /(忽然|突然|倏然|只见|不料|不想|此时|随着|须臾|猛然|原来|终于|后来|结果|可是|但是|竟|却|最后)/gu)

  if (contentType === 'enterprise_documentary') {
    return Math.ceil(Math.max(
      DEFAULT_MIN_SHOTS,
      units / 180,
      sentenceCount * 0.35,
      dialogueCount * 0.55,
      eventCueCount * 0.35
    ))
  }

  return Math.ceil(Math.max(
    DEFAULT_MIN_SHOTS,
    units / 160,
    DEFAULT_MIN_SHOTS + Math.max(0, substantiveSentenceCount - DEFAULT_MIN_SHOTS) * 0.35,
    DEFAULT_MIN_SHOTS + Math.max(0, dialogueCount - 3) * 0.55,
    DEFAULT_MIN_SHOTS + Math.max(0, eventCueCount - 4) * 0.45
  ))
}

function inferTargetSizing({ sourceText, contentType }) {
  if (contentType === 'explicit_storyboard') {
    const shotCount = Math.min(MAX_SHOTS, Math.max(1, countExplicitStoryboardShots(sourceText)))
    const durationFromSource = sumExplicitStoryboardDurations(sourceText)
    const fallbackDuration = Math.ceil(shotCount / DEFAULT_SHOTS_PER_SEGMENT) * VIDEO_SEGMENT_SECONDS
    return {
      durationSeconds: Math.max(4, Math.min(MAX_DURATION_SECONDS, durationFromSource || fallbackDuration)),
      shotCount,
      source: 'explicit_storyboard'
    }
  }

  if (contentType === 'short_drama_script') {
    const scriptSizing = inferScriptProfileSizing(extractScriptProfile(sourceText))
    if (scriptSizing) return { ...scriptSizing, source: 'script_profile' }
  }

  const estimatedShots = Math.min(MAX_SHOTS, inferPlotShotCount(sourceText, contentType))
  const segmentCount = Math.ceil(estimatedShots / DEFAULT_SHOTS_PER_SEGMENT)
  const seconds = segmentCount * VIDEO_SEGMENT_SECONDS
  return {
    durationSeconds: Math.max(DEFAULT_MIN_DURATION_SECONDS, Math.min(MAX_DURATION_SECONDS, seconds)),
    shotCount: estimatedShots
  }
}

function normalizeStyle(value) {
  const style = String(value || DEFAULT_STYLE).trim() || DEFAULT_STYLE
  if (ILLUSTRATED_STYLE_MARKERS.test(style)) return style
  if (LIVE_ACTION_STYLE_MARKERS.test(style)) return style
  return `${style}，超写实真人电影质感`
}

function countVisualReferenceImages(options) {
  return [
    ...(options.references ?? []),
    ...(options.visualReferences?.characterImages ?? []),
    ...(options.visualReferences?.sceneImages ?? []),
    ...(options.visualReferences?.styleImages ?? [])
  ].length
}

export async function createInputContract(options) {
  const fileText = options.input ? await readFile(options.input, 'utf8') : ''
  const inlineText = options.sourceParts.join(' ').trim()
  const sourceText = [fileText.trim(), inlineText].filter(Boolean).join('\n\n').trim()

  if (!sourceText) throw new Error('Cine Make requires source story material from --input or inline text')

  const contentType = inferContentType(sourceText)
  const inferredSizing = inferTargetSizing({ sourceText, contentType })
  const requestedDurationSeconds = options.durationExplicit ? parseSeconds(options.duration) : null
  const usesScriptPacing = inferredSizing.source === 'script_profile'
  const seconds = usesScriptPacing
    ? Math.max(inferredSizing.shotCount, Math.min(requestedDurationSeconds ?? inferredSizing.durationSeconds, inferredSizing.durationSeconds))
    : requestedDurationSeconds ?? inferredSizing.durationSeconds
  const aspectRatio = options.aspect || '9:16'
  if (!VALID_ASPECTS.has(aspectRatio)) throw new Error(`Unsupported aspect ratio: ${aspectRatio}`)

  const targetPlatform = (options.platform || 'jimeng').toLowerCase()
  if (!VALID_PLATFORMS.has(targetPlatform)) throw new Error(`Cine Make only supports jimeng platform, got: ${targetPlatform}`)

  const mode = normalizeMode(options.mode)
  const visualReferenceImageCount = countVisualReferenceImages(options)
  if (visualReferenceImageCount > MAX_VISUAL_REFERENCE_IMAGES) {
    throw new Error(`visual references must include at most ${MAX_VISUAL_REFERENCE_IMAGES} images`)
  }

  const minimumShotCount = Math.max(4, Math.ceil(seconds / VIDEO_SEGMENT_SECONDS))
  const fallbackShotCount = usesScriptPacing ? inferredSizing.shotCount : options.durationExplicit ? defaultShotCount(seconds) : inferredSizing.shotCount
  const shotCount = clampInteger(options.shots, fallbackShotCount, minimumShotCount, MAX_SHOTS, 'shots')
  const storyboardCount = clampInteger(options.storyboards, shotCount, shotCount, MAX_SHOTS, 'storyboards')
  const title = options.title || `${contentType}-${slugify(sourceText)}`
  const visualReferences = {
    characterImages: [...(options.visualReferences?.characterImages ?? [])],
    sceneImages: [...(options.visualReferences?.sceneImages ?? [])],
    styleImages: [...(options.visualReferences?.styleImages ?? [])]
  }

  return {
    schemaVersion: 1,
    mode,
    title,
    slug: slugify(title),
    sourceText,
    contentType,
    target: {
      durationSeconds: seconds,
      requestedDurationSeconds: requestedDurationSeconds ?? undefined,
      durationSource: usesScriptPacing && (!requestedDurationSeconds || requestedDurationSeconds > inferredSizing.durationSeconds)
        ? 'script_paced_from_source'
        : options.durationExplicit ? 'explicit' : 'inferred_from_source',
      aspectRatio,
      style: normalizeStyle(options.style),
      platform: targetPlatform,
      shotCount,
      storyboardCount
    },
    references: options.references,
    visualReferences,
    boundaries: {
      codexCanGenerate: ['text production assets', 'storyboard/keyframe images through image generation tools', 'review reports'],
      codexCannotGenerate: ['mp4 video', 'guaranteed external model motion fidelity'],
      finalVideoOwner: 'Jimeng external video synthesis tool'
    }
  }
}
