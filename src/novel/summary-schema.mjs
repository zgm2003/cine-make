const REQUIRED_FIELDS = [
  'schemaVersion',
  'chapterId',
  'sourceSpan',
  'title',
  'summary',
  'beats',
  'characters'
]

const OPTIONAL_ARRAY_FIELDS = [
  'locations',
  'propsOrPowers',
  'openQuestions',
  'adaptationNotes'
]

export function validateChapterSummary(value) {
  const errors = []

  if (!isObject(value)) {
    return { ok: false, errors: ['summary artifact must be an object'] }
  }

  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(value, field)) {
      errors.push(`${field} is required`)
    }
  }

  if (Object.hasOwn(value, 'schemaVersion') && value.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1')
  }

  if (Object.hasOwn(value, 'chapterId') && !isNonEmptyString(value.chapterId)) {
    errors.push('chapterId must be a non-empty string')
  }

  validateSourceSpan(value.sourceSpan, errors)

  if (Object.hasOwn(value, 'title') && typeof value.title !== 'string') {
    errors.push('title must be a string')
  }

  if (Object.hasOwn(value, 'summary')) {
    if (typeof value.summary !== 'string') {
      errors.push('summary must be a string')
    } else if (value.summary.length > 2000) {
      errors.push('summary must not exceed 2000 characters')
    }
  }

  validateBeats(value.beats, errors)
  validateCharacters(value.characters, errors)

  for (const field of OPTIONAL_ARRAY_FIELDS) {
    if (Object.hasOwn(value, field) && !Array.isArray(value[field])) {
      errors.push(`${field} must be an array when present`)
    }
  }

  return { ok: errors.length === 0, errors }
}

function validateSourceSpan(sourceSpan, errors) {
  if (sourceSpan === undefined) {
    return
  }

  if (!isObject(sourceSpan)) {
    errors.push('sourceSpan must be an object')
    return
  }

  if (!Number.isInteger(sourceSpan.startByte)) {
    errors.push('sourceSpan.startByte must be an integer')
  }

  if (!Number.isInteger(sourceSpan.endByte)) {
    errors.push('sourceSpan.endByte must be an integer')
  }

  if (
    Number.isInteger(sourceSpan.startByte) &&
    Number.isInteger(sourceSpan.endByte) &&
    sourceSpan.endByte < sourceSpan.startByte
  ) {
    errors.push('sourceSpan.endByte must not be less than sourceSpan.startByte')
  }
}

function validateBeats(beats, errors) {
  if (beats === undefined) {
    return
  }

  if (!Array.isArray(beats) || beats.length === 0) {
    errors.push('beats must be a non-empty array')
    return
  }

  beats.forEach((beat, index) => {
    if (!isObject(beat)) {
      errors.push(`beats[${index}] must be an object`)
      return
    }

    if (!isNonEmptyString(beat.event)) {
      errors.push(`beats[${index}].event must be a non-empty string`)
      return
    }

    if (beat.event.length > 500) {
      errors.push(`beats[${index}].event must not exceed 500 characters`)
    }
  })
}

function validateCharacters(characters, errors) {
  if (characters === undefined) {
    return
  }

  if (!Array.isArray(characters)) {
    errors.push('characters must be an array')
    return
  }

  characters.forEach((character, index) => {
    if (!isObject(character)) {
      errors.push(`characters[${index}] must be an object`)
      return
    }

    if (!isNonEmptyString(character.name)) {
      errors.push(`characters[${index}].name must be a non-empty string`)
    }
  })
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}
