function task(id, role, goal, writeSet, dependsOn = []) {
  return { id, role, goal, writeSet, dependsOn }
}

function makeAgentPrompt({ task, contract }) {
  return [
    `You are the Cine Make production agent for ${task.id}.`,
    '',
    'You are not alone in the run. Other agents may work on different files. Do not edit outside your write set and do not revert edits made by others.',
    '',
    'Project boundary:',
    '- Cine Make creates pre-production assets, storyboard/keyframe images, and external video-model prompt packs.',
    '- Codex may generate still images when the environment exposes an image generation tool.',
    '- Codex must not claim to generate MP4 video.',
    '',
    `Source title: ${contract.title}`,
    `Content type: ${contract.contentType}`,
    `Target: ${contract.target.durationSeconds}s ${contract.target.aspectRatio} ${contract.target.style} for ${contract.target.platform}`,
    `Shot count: ${contract.target.shotCount}`,
    `Storyboard count: ${contract.target.storyboardCount}`,
    '',
    `Role: ${task.role}`,
    `Goal: ${task.goal}`,
    '',
    'Write set:',
    ...task.writeSet.map((file) => `- ${file}`),
    '',
    'Dependencies:',
    ...(task.dependsOn.length ? task.dependsOn.map((id) => `- ${id}`) : ['- none']),
    '',
    'Quality gates:',
    '- No vague shot descriptions. Every shot needs visible action and continuity anchors.',
    '- No platform fantasy. If an external video model has limits, split into segments.',
    '- No final-video claims. Output only assets and prompts.',
    '- Image prompts are for still images, not video motion.',
    '',
    'Return:',
    '- status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED',
    '- files changed',
    '- image assets generated or image prompts prepared',
    '- continuity risks',
    '- verification notes'
  ].join('\n')
}

export function createAgentPlan({ contract, outDir }) {
  const tasks = [
    task(
      '01-director-script',
      'director-agent',
      'Rewrite the source material into a director-grade, filmable script and extract stable character/scene anchors.',
      ['director-script.md', 'characters.json']
    ),
    task(
      '02-shotlist',
      'shot-planner-agent',
      'Create the exact shot contract and storyboard board from the director script.',
      ['shotlist.json', 'storyboard-board.md'],
      ['01-director-script']
    ),
    task(
      '03-storyboard-prompts',
      'image-prompt-agent',
      'Write still-image prompts for storyboard/keyframe generation using the shotlist and anchors.',
      ['storyboard-prompts.md', 'imagegen-brief.md'],
      ['01-director-script', '02-shotlist']
    ),
    task(
      '04-reference-images',
      'image-generation-agent',
      'Generate or organize storyboard/keyframe image assets and record the image manifest.',
      ['storyboard-images/README.md', 'reference-pack.md'],
      ['03-storyboard-prompts']
    ),
    task(
      '05-video-pack',
      'video-pack-agent',
      'Compose Seedance/Jimeng/general external video-model prompt packs from the storyboards and image manifest.',
      ['seedance-pack.md', 'jimeng-pack.md', 'exports/video-model-pack.md'],
      ['02-shotlist', '03-storyboard-prompts', '04-reference-images']
    ),
    task(
      '06-continuity-review',
      'continuity-agent',
      'Review continuity, asset completeness, segment readiness, and final handoff risks.',
      ['continuity-review.md'],
      ['02-shotlist', '03-storyboard-prompts', '04-reference-images', '05-video-pack']
    )
  ]

  return {
    schemaVersion: 1,
    mode: 'video-preproduction-factory',
    outDir,
    feature: {
      slug: contract.slug,
      title: contract.title
    },
    contract,
    reviewGates: ['contract-compliance', 'imagegen-readiness', 'video-pack-readiness', 'continuity', 'verification'],
    tasks: tasks.map((entry) => ({
      ...entry,
      agentPrompt: makeAgentPrompt({ task: entry, contract })
    }))
  }
}

