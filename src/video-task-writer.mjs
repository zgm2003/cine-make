import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

function list(items) {
  return items.map((item) => `- ${item}`)
}

function composeEpisodeMarkdown({ episode, plan }) {
  const beatLines = episode.tasks.map((task) => {
    return `- ${task.id} / ${task.durationSeconds}s / ${task.beatId}: ${task.sourceBeat}`
  })

  return [
    `# ${episode.title}`,
    '',
    '这一段保留原剧情顺序，不把长剧情压成一个爆点短片。',
    '',
    '## Continuity anchors',
    '',
    `- 主体：${plan.anchors.protagonist}`,
    `- 关联人物：${plan.anchors.secondary}`,
    `- 关键道具：${plan.anchors.keyObject}`,
    `- 场景：${plan.anchors.location}`,
    `- 异常信号：${plan.anchors.impossibleSign}`,
    '',
    '## Video tasks',
    '',
    ...beatLines,
    '',
    '## Director storyboard',
    '',
    `详见 \`storyboard.md\`。这里的分镜不是图片墙，而是每条视频任务的景别、镜头、构图、调度、表演和光线设计。`,
    '',
    '## Workflow',
    '',
    '1. 先用 `$imagegen` 生成或确认本集所需的 start/end 控制帧。',
    '2. 每个 `video-tasks/Sxx.md` 只喂给视频模型一次。',
    '3. 下一条任务继承上一条任务的 end frame，不让视频模型自己脑补跨段剧情。'
  ].join('\n')
}

function composeDirectorStoryboard({ episode, plan }) {
  const rows = episode.tasks.flatMap((task) => [
    `## ${task.id}｜${task.durationSeconds}s｜${task.beatId}`,
    '',
    `原剧情：${task.sourceBeat}`,
    '',
    `- 景别：${task.storyboard.shotSize}`,
    `- 镜头/焦段：${task.storyboard.lens}`,
    `- 运镜：${task.storyboard.cameraMove}`,
    `- 构图：${task.storyboard.composition}`,
    `- 调度：${task.storyboard.blocking}`,
    `- 表演：${task.storyboard.performance}`,
    `- 光线/色彩：${task.storyboard.lighting}`,
    `- 转场/继承：${task.storyboard.transition}`,
    `- 首尾帧目的：${task.storyboard.framePurpose}`,
    '',
    `首帧：\`${task.startFrame}\``,
    `尾帧：\`${task.endFrame}\``,
    ''
  ])

  return [
    `# Director Storyboard ${episode.id}`,
    '',
    '这个文件是导演分镜层。它先决定镜头怎么拍，再让 `$imagegen` 生成首尾控制帧；首尾帧不是分镜的替代品。',
    '',
    '## Continuity anchors',
    '',
    `- 主体：${plan.anchors.protagonist}`,
    `- 关联人物：${plan.anchors.secondary}`,
    `- 关键道具：${plan.anchors.keyObject}`,
    `- 场景：${plan.anchors.location}`,
    `- 异常信号：${plan.anchors.impossibleSign}`,
    '',
    ...rows
  ].join('\n')
}

function composeStoryboardReadme({ episode }) {
  const frameLines = episode.tasks.flatMap((task) => [
    `- \`${task.startFrame.replace('storyboard-images/', '')}\`：${task.id} 起始帧。`,
    `- \`${task.endFrame.replace('storyboard-images/', '')}\`：${task.id} 结束帧。`
  ])

  return [
    '# Storyboard images',
    '',
    '这里不是给人看的分镜图墙，而是给图生视频模型使用的首尾帧控制队列。',
    '',
    '## Required reference images',
    '',
    '- `character-reference.png`：锁定人物脸、发型、体型、服装。',
    '- `scene-reference.png`：锁定空间结构、光线方向、色彩关系。',
    '',
    '## Start/end frames',
    '',
    ...frameLines,
    '',
    '## Rules',
    '',
    '- 每张图必须是单帧，不要拼图、不要分镜表、不要文字说明。',
    '- `Sxx-start.png` 和 `Sxx-end.png` 只表达同一镜头前后的状态变化。',
    '- 后一条任务的 start frame 应继承上一条任务的 end frame。'
  ].join('\n')
}

function composeTaskMarkdown({ task, episode, plan }) {
  return [
    `# Video Task ${episode.id}/${task.id}`,
    '',
    `source_beat: ${task.beatId}`,
    `duration: ${task.durationSeconds}s`,
    `start_frame: \`${task.startFrame}\``,
    `end_frame: \`${task.endFrame}\``,
    'subject_ref: `storyboard-images/character-reference.png`',
    'scene_ref: `storyboard-images/scene-reference.png`',
    '',
    '## Director storyboard',
    '',
    `shot_size: ${task.storyboard.shotSize}`,
    `lens: ${task.storyboard.lens}`,
    `camera_move: ${task.storyboard.cameraMove}`,
    `composition: ${task.storyboard.composition}`,
    `blocking: ${task.storyboard.blocking}`,
    `performance: ${task.storyboard.performance}`,
    `lighting: ${task.storyboard.lighting}`,
    `transition: ${task.storyboard.transition}`,
    `frame_purpose: ${task.storyboard.framePurpose}`,
    '',
    'motion:',
    task.motion,
    '',
    'camera:',
    task.camera,
    '',
    'must_keep:',
    ...list(task.mustKeep),
    '',
    'avoid:',
    ...list(task.avoid),
    '',
    '## $imagegen prompt: start frame',
    '',
    '```text',
    task.startFramePrompt,
    '```',
    '',
    '## $imagegen prompt: end frame',
    '',
    '```text',
    task.endFramePrompt,
    '```',
    '',
    '## Video model prompt',
    '',
    '```text',
    `Use the start frame and end frame as hard visual anchors. Create a ${task.durationSeconds}s image-to-video clip. Follow the director storyboard: ${task.storyboard.shotSize}; ${task.storyboard.composition}; ${task.storyboard.blocking}; ${task.storyboard.performance}. ${task.motion} ${task.camera}. Preserve ${plan.anchors.protagonist}, ${plan.anchors.location}, ${plan.anchors.keyObject}, lighting direction, costume, face, and screen direction. Do not interpret the whole story; execute only this task.`,
    '```'
  ].join('\n')
}

export async function writeVideoTaskArtifacts({ outDir, plan }) {
  await writeFile(join(outDir, 'continuity-bible.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8')

  for (const episode of plan.episodes) {
    const episodeDir = join(outDir, 'episodes', episode.id)
    const storyboardDir = join(episodeDir, 'storyboard-images')
    const tasksDir = join(episodeDir, 'video-tasks')
    await mkdir(storyboardDir, { recursive: true })
    await mkdir(tasksDir, { recursive: true })

    await writeFile(join(episodeDir, 'episode.md'), `${composeEpisodeMarkdown({ episode, plan })}\n`, 'utf8')
    await writeFile(join(episodeDir, 'storyboard.md'), `${composeDirectorStoryboard({ episode, plan })}\n`, 'utf8')
    await writeFile(join(storyboardDir, 'README.md'), `${composeStoryboardReadme({ episode })}\n`, 'utf8')

    for (const task of episode.tasks) {
      await writeFile(join(tasksDir, `${task.id}.md`), `${composeTaskMarkdown({ task, episode, plan })}\n`, 'utf8')
    }
  }
}
