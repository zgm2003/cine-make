import { readFile } from 'node:fs/promises'
import path from 'node:path'

const SUMMARY_TASK_PREFIX = 'summarize-'

export async function readNovelTaskPrompt({ projectDir, taskId }) {
  if (!projectDir) {
    throw new Error('novel task requires --run <project-dir>')
  }
  if (!taskId) {
    throw new Error('novel task requires --id <task-id>')
  }
  if (taskId.includes('/') || taskId.includes('\\') || taskId === '.' || taskId === '..') {
    throw new Error('novel task --id must be a task id, not a path')
  }
  if (!taskId.startsWith(SUMMARY_TASK_PREFIX)) {
    throw new Error(`Unsupported novel task id: ${taskId}`)
  }

  const taskPath = path.join(projectDir, 'tasks', `${taskId}.md`)
  try {
    return await readFile(taskPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Novel task not found: ${taskId}`)
    }
    throw error
  }
}
