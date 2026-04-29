import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

function taskMarkdown(task) {
  return [
    `# Task ${task.id}`,
    '',
    `Role: ${task.role}`,
    '',
    `Goal: ${task.goal}`,
    '',
    '## Write set',
    '',
    ...task.writeSet.map((file) => `- ${file}`),
    '',
    '## Depends on',
    '',
    ...(task.dependsOn.length ? task.dependsOn.map((id) => `- ${id}`) : ['- none']),
    '',
    '## Agent prompt',
    '',
    task.agentPrompt
  ].join('\n')
}

function reviewMarkdown(kind, plan) {
  if (kind === 'contract-compliance-review') {
    return [
      '# Contract compliance review',
      '',
      'Check whether all generated assets obey the input contract and product boundary.',
      '',
      'Check for:',
      '',
      '- final-video or MP4 claims inside Codex output;',
      '- missing source preservation: event, emotion, subject identity;',
      '- vague film language without visible action;',
      '- mismatch between duration, aspect ratio, style, platform, shot count, and outputs;',
      '- missing character, costume, prop, scene, or lighting anchors.',
      '',
      `Target run: ${plan.feature.slug}`
    ].join('\n')
  }

  if (kind === 'imagegen-readiness-review') {
    return [
      '# Image generation readiness review',
      '',
      'Check whether storyboard/keyframe prompts are ready for still-image generation.',
      '',
      'Check for:',
      '',
      '- prompts request still images, not video;',
      '- stable identity anchors across shots;',
      '- clear scene, action, shot size, composition, lighting, and palette;',
      '- no text overlays or watermarks unless explicitly requested;',
      '- generated image manifest recorded in `reference-pack.md` when images exist.',
      '',
      `Target run: ${plan.feature.slug}`
    ].join('\n')
  }

  if (kind === 'video-pack-readiness-review') {
    return [
      '# Video pack readiness review',
      '',
      'Check whether Seedance/Jimeng/general video-model packs are usable by an external tool.',
      '',
      'Check for:',
      '',
      '- segment prompts reference the right storyboard/keyframe assets;',
      '- motion is described in video terms, while image prompts remain still-image prompts;',
      '- platform limits are handled by segmentation rather than ignored;',
      '- each segment includes continuity bridge from previous segment;',
      '- no claim that Cine Make rendered final video.',
      '',
      `Target run: ${plan.feature.slug}`
    ].join('\n')
  }

  if (kind === 'continuity-review') {
    return [
      '# Continuity review',
      '',
      'Review identity, costume, props, location, screen direction, lighting, weather, screen direction, emotional curve, and action carry-over across all shots.',
      '',
      `Target run: ${plan.feature.slug}`
    ].join('\n')
  }

  return [
    '# Verification review',
    '',
    'Record commands run, files checked, missing assets, failures, and final handoff status.',
    '',
    `Target run: ${plan.feature.slug}`
  ].join('\n')
}

export async function writeAgentPlanArtifacts({ outDir, plan }) {
  const tasksDir = join(outDir, 'tasks')
  const reviewsDir = join(outDir, 'reviews')
  const storyboardDir = join(outDir, 'storyboard-images')
  const exportsDir = join(outDir, 'exports')
  await mkdir(tasksDir, { recursive: true })
  await mkdir(reviewsDir, { recursive: true })
  await mkdir(storyboardDir, { recursive: true })
  await mkdir(exportsDir, { recursive: true })

  await writeFile(join(outDir, 'agent-plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8')

  const taskFiles = []
  for (const task of plan.tasks) {
    const path = join(tasksDir, `${task.id}.md`)
    await writeFile(path, `${taskMarkdown(task)}\n`, 'utf8')
    taskFiles.push(path)
  }

  const reviewKinds = [
    'contract-compliance-review',
    'imagegen-readiness-review',
    'video-pack-readiness-review',
    'continuity-review',
    'verification-review'
  ]
  const reviewFiles = []
  for (const kind of reviewKinds) {
    const path = join(reviewsDir, `${kind}.md`)
    await writeFile(path, `${reviewMarkdown(kind, plan)}\n`, 'utf8')
    reviewFiles.push(path)
  }

  await writeFile(
    join(storyboardDir, 'README.md'),
    ['# Storyboard images', '', 'Store Codex-generated storyboard/keyframe images here when the environment provides image generation.', 'Record every generated asset in `../reference-pack.md`.'].join('\n') + '\n',
    'utf8'
  )

  return { taskFiles, reviewFiles }
}

