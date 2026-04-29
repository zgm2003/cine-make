import { readFile } from 'node:fs/promises'

const VALID_ASPECTS = new Set(['9:16', '16:9', '1:1', '4:5', '21:9'])
const VALID_PLATFORMS = new Set(['seedance', 'jimeng', 'generic'])
const VALID_MODES = new Set(['draft', 'visual'])

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
  if (typeof value !== 'string' || !value.trim()) return 30
  const match = value.trim().match(/^(\d+)(s|sec|secs|second|seconds|秒)?$/i)
  if (!match) throw new Error(`Invalid duration: ${value}`)
  const seconds = Number(match[1])
  if (!Number.isInteger(seconds) || seconds < 4 || seconds > 180) {
    throw new Error('duration must be an integer between 4 and 180 seconds')
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
    duration: '30s',
    aspect: '9:16',
    style: 'cinematic',
    platform: 'generic',
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
      index += 1
      if (!argv[index]) throw new Error('--mode requires draft or visual')
      options.mode = argv[index].toLowerCase()
      continue
    }

    if (arg === '--stage') {
      index += 1
      if (!argv[index]) throw new Error('--stage requires skeleton or production')
      options.stage = argv[index]
      continue
    }

    if (arg === '--draft') {
      options.mode = 'draft'
      options.draft = true
      continue
    }

    if (arg === '--visual') {
      options.mode = 'visual'
      options.draft = true
      continue
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
  if (/分镜|镜头|景别|运镜|shot/i.test(text)) return 'rough_shotlist'
  if (/广告|卖点|产品|品牌|转化|投放|campaign/i.test(text)) return 'ad_brief'
  if (/旁白|口播|主播|voiceover|script/i.test(text)) return 'voiceover_script'
  if (/第[一二三四五六七八九十0-9]+章|小说|她|他|雨夜|巷口|抬头|沉默|chapter/i.test(text)) return 'novel_excerpt'
  return 'story_material'
}

function defaultShotCount(seconds) {
  if (seconds <= 15) return 8
  if (seconds <= 30) return 12
  return 15
}

export async function createInputContract(options) {
  const fileText = options.input ? await readFile(options.input, 'utf8') : ''
  const inlineText = options.sourceParts.join(' ').trim()
  const sourceText = [fileText.trim(), inlineText].filter(Boolean).join('\n\n').trim()

  if (!sourceText) throw new Error('Cine Make requires source story material from --input or inline text')

  const seconds = parseSeconds(options.duration)
  const aspectRatio = options.aspect || '9:16'
  if (!VALID_ASPECTS.has(aspectRatio)) throw new Error(`Unsupported aspect ratio: ${aspectRatio}`)

  const targetPlatform = (options.platform || 'generic').toLowerCase()
  if (!VALID_PLATFORMS.has(targetPlatform)) throw new Error(`Unsupported platform: ${targetPlatform}`)

  const mode = (options.mode || 'draft').toLowerCase()
  if (!VALID_MODES.has(mode)) throw new Error(`Unsupported mode: ${mode}`)

  const shotCount = clampInteger(options.shots, defaultShotCount(seconds), 4, 30, 'shots')
  const storyboardCount = clampInteger(options.storyboards, Math.min(15, Math.max(shotCount, 8)), 4, 30, 'storyboards')
  const title = options.title || `${inferContentType(sourceText)}-${slugify(sourceText)}`
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
    contentType: inferContentType(sourceText),
    target: {
      durationSeconds: seconds,
      aspectRatio,
      style: options.style || 'cinematic',
      platform: targetPlatform,
      shotCount,
      storyboardCount
    },
    references: options.references,
    visualReferences,
    boundaries: {
      codexCanGenerate: ['text production assets', 'storyboard/keyframe images through image generation tools', 'review reports'],
      codexCannotGenerate: ['mp4 video', 'guaranteed external model motion fidelity'],
      finalVideoOwner: 'external video model such as Seedance, Jimeng, or another video synthesis tool'
    }
  }
}
