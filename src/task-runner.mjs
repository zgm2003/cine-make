import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export function getReadyTasks(plan, completedTaskIds = []) {
  const completed = new Set(completedTaskIds)
  return plan.tasks.filter((task) => {
    if (completed.has(task.id)) return false
    return task.dependsOn.every((dependency) => completed.has(dependency))
  })
}

export function getTask(plan, taskId) {
  const task = plan.tasks.find((entry) => entry.id === taskId)
  if (!task) throw new Error(`Unknown task id: ${taskId}`)
  return task
}

export function composeTaskPrompt({ plan, taskId }) {
  const task = getTask(plan, taskId)

  return [
    `# Cine Make Agent Task: ${task.id}`,
    '',
    'You are a focused pre-production agent for Cine Make.',
    '',
    'You are not alone in this run. Do not edit outside the write set and do not revert edits made by others.',
    '',
    '## Run',
    '',
    plan.outDir,
    '',
    '## Feature',
    '',
    `- slug: ${plan.feature.slug}`,
    `- title: ${plan.feature.title}`,
    '',
    '## Boundary',
    '',
    '- Codex can create text assets and still images.',
    '- Codex cannot create MP4 video.',
    '- External video tools own final synthesis.',
    '',
    '## Task',
    '',
    `- id: ${task.id}`,
    `- role: ${task.role}`,
    `- goal: ${task.goal}`,
    '',
    '## Write set',
    '',
    ...task.writeSet.map((file) => `- ${file}`),
    '',
    '## Depends on',
    '',
    ...(task.dependsOn.length ? task.dependsOn.map((id) => `- ${id}`) : ['- none']),
    '',
    '## Full task prompt',
    '',
    task.agentPrompt
  ].join('\n')
}

export async function writeTaskPrompt({ outDir, plan, taskId }) {
  const promptsDir = join(outDir, 'agent-prompts')
  await mkdir(promptsDir, { recursive: true })
  const promptPath = join(promptsDir, `${taskId}.prompt.md`)
  await writeFile(promptPath, `${composeTaskPrompt({ plan, taskId })}\n`, 'utf8')
  return promptPath
}

