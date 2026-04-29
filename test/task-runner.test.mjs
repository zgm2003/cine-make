import test from 'node:test'
import assert from 'node:assert/strict'
import { getReadyTasks, composeTaskPrompt } from '../src/task-runner.mjs'

test('ready tasks respect dependencies', () => {
  const plan = {
    outDir: 'run',
    feature: { slug: 'demo', title: 'Demo' },
    tasks: [
      { id: 'a', role: 'one', goal: 'first', writeSet: ['a.md'], dependsOn: [], agentPrompt: 'A' },
      { id: 'b', role: 'two', goal: 'second', writeSet: ['b.md'], dependsOn: ['a'], agentPrompt: 'B' }
    ]
  }

  assert.deepEqual(getReadyTasks(plan).map((task) => task.id), ['a'])
  assert.deepEqual(getReadyTasks(plan, ['a']).map((task) => task.id), ['b'])
})

test('task prompt includes no-mp4 boundary', () => {
  const plan = {
    outDir: 'run',
    feature: { slug: 'demo', title: 'Demo' },
    tasks: [{ id: 'a', role: 'one', goal: 'first', writeSet: ['a.md'], dependsOn: [], agentPrompt: 'A' }]
  }

  assert.match(composeTaskPrompt({ plan, taskId: 'a' }), /cannot create MP4 video/)
})

