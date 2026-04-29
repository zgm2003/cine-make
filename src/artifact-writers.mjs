function frontMatter(title) {
  return [`# ${title}`, ''].join('\n')
}

function referenceLines(contract) {
  const visual = contract.visualReferences ?? {}
  const lines = []

  for (const item of contract.references ?? []) lines.push(`- general: ${item}`)
  for (const item of visual.characterImages ?? []) lines.push(`- 人物参考图: ${item}`)
  for (const item of visual.sceneImages ?? []) lines.push(`- 场景参考图: ${item}`)
  for (const item of visual.styleImages ?? []) lines.push(`- 风格参考图: ${item}`)

  return lines.length ? lines : ['- none provided']
}

export function composeSourcePackage(contract) {
  return [
    frontMatter('Source package'),
    '## Normalized input',
    '',
    `- mode: ${contract.mode ?? 'draft'}`,
    `- title: ${contract.title}`,
    `- content_type: ${contract.contentType}`,
    `- duration: ${contract.target.durationSeconds}s`,
    `- aspect_ratio: ${contract.target.aspectRatio}`,
    `- style: ${contract.target.style}`,
    `- target_platform: ${contract.target.platform}`,
    `- shot_count: ${contract.target.shotCount}`,
    `- storyboard_count: ${contract.target.storyboardCount}`,
    '',
    '## References',
    '',
    ...referenceLines(contract),
    '',
    '## Source text',
    '',
    contract.sourceText
  ].join('\n')
}

export function composeProductionBrief(contract) {
  return [
    frontMatter('Cine Make production brief'),
    'Cine Make is a pre-production factory. It prepares assets for video tools; it does not render MP4.',
    '',
    '## North star',
    '',
    `Turn the ${contract.contentType.replace(/_/g, ' ')} into a ${contract.target.durationSeconds}s ${contract.target.aspectRatio} ${contract.target.style} short film package.`,
    `Mode: ${contract.mode === 'visual' ? 'visual package mode; image generation may run after the text plan is stable.' : 'draft mode; do not generate images yet.'}`,
    '',
    '## Director constraints',
    '',
    '- Preserve the core event, emotional turn, and subject identity from the source material.',
    '- Convert prose into visible behavior: eye line, breath, hand movement, posture, blocking, and reaction beats.',
    '- Every shot must have a reason. No random beauty shots.',
    '- Keep continuity anchors stable: face, costume, props, screen direction, weather, lighting, and emotional state.',
    '- Write for generated images first, then for external video synthesis.',
    '',
    '## Output assets',
    '',
    '- `director-script.md`: director-grade rewrite with visible actions.',
    '- `characters.json`: character, costume, prop, and scene anchors.',
    '- `shotlist.json`: exact shot contract.',
    '- `storyboard-board.md`: storyboard table with shot image slots.',
    '- `storyboard-prompts.md`: image-generation prompts for keyframes/storyboards.',
    '- `reference-pack.md`: generated image manifest and usage notes.',
    '- `seedance-pack.md` / `jimeng-pack.md`: external video-model prompt packs.',
    '- `continuity-review.md`: continuity and platform-readiness review.',
    '',
    '## Hard boundary',
    '',
    'Codex may generate storyboard/keyframe images. Codex must not claim to generate the final video.'
  ].join('\n')
}

export function composePromptPack(contract) {
  return [
    frontMatter('Prompt pack'),
    'Use this pack as the agent-facing contract for filling the production assets.',
    '',
    '## 1. Director rewrite prompt',
    '',
    'Rewrite the source into a director script. Keep the plot, but express it as filmable beats. For each beat include subject intent, micro-performance, blocking, lens feeling, and emotional transition.',
    '',
    '## 2. Shotlist prompt',
    '',
    `Create ${contract.target.shotCount} shots for a ${contract.target.durationSeconds}s ${contract.target.aspectRatio} video. Each shot must include shot_id, duration_seconds, scene, subject, action, performance_detail, shot_size, camera_movement, composition, lighting, dialogue_or_voiceover, image_prompt, continuity_from_previous, and video_prompt_note.`,
    '',
    '## 3. Storyboard image prompt rules',
    '',
    `Create ${contract.target.storyboardCount} storyboard/keyframe image prompts. Prompts must be visual, stable, and image-generation friendly. Do not ask the image model for motion or video.`,
    '',
    '## 4. External video-model pack rules',
    '',
    `Target platform: ${contract.target.platform}. Produce segment prompts that reference the generated keyframes and describe smooth motion, camera direction, subject action, and transition logic.`,
    '',
    '## 5. Continuity review prompt',
    '',
    'Check identity, costume, props, location, screen direction, lighting, emotional curve, shot duration, and whether any video prompt asks the external model to infer missing story context.'
  ].join('\n')
}

export function composeImagegenBrief(contract) {
  const hasCharacterReferences = (contract.visualReferences?.characterImages ?? []).length > 0
  const hasSceneReferences = (contract.visualReferences?.sceneImages ?? []).length > 0
  const hasStyleReferences = (contract.visualReferences?.styleImages ?? []).length > 0

  return [
    frontMatter('Image generation brief'),
    'This file defines how Codex should use image generation for this run.',
    '',
    `Mode: ${contract.mode === 'visual' ? 'visual package mode' : 'draft mode'}. In draft mode, prepare prompts only and do not spend time generating images.`,
    '',
    '## What to generate',
    '',
    hasCharacterReferences
      ? `- Use provided character reference image(s): ${(contract.visualReferences.characterImages).join(', ')}.`
      : '- Character reference image(s) when identity is under-specified.',
    hasSceneReferences
      ? `- Use provided scene reference image(s): ${(contract.visualReferences.sceneImages).join(', ')}.`
      : '- Scene reference image(s) when the location needs a stable visual anchor.',
    hasStyleReferences
      ? `- Match provided style reference image(s): ${(contract.visualReferences.styleImages).join(', ')}.`
      : '- Style reference image(s) only when the requested look is ambiguous.',
    `- ${contract.target.storyboardCount} storyboard/keyframe images or fewer if the user wants a text-only pack first.`,
    '',
    '## Rules',
    '',
    '- Generate still images only.',
    '- Use the same character anchors across prompts.',
    '- Keep aspect ratio aligned with the target video unless a contact sheet is requested.',
    '- Store generated image paths or attachment labels in `reference-pack.md`.',
    '- Do not claim final video synthesis happened inside Codex.',
    '',
    '## Prompt skeleton',
    '',
    '```text',
    'Cinematic storyboard keyframe, [subject anchor], [scene anchor], [visible action], [micro-performance], [shot size], [camera/lens feel], [composition], [lighting], [color palette], [continuity anchors], no text overlay, no watermark',
    '```'
  ].join('\n')
}

export function composeVideoModelPack(contract) {
  return [
    frontMatter('Video model export pack'),
    'This is a preparation file for external video synthesis tools. It is not a generated video.',
    '',
    '## Target',
    '',
    `- platform: ${contract.target.platform}`,
    `- duration: ${contract.target.durationSeconds}s`,
    `- aspect_ratio: ${contract.target.aspectRatio}`,
    `- style: ${contract.target.style}`,
    '',
    '## Export shape',
    '',
    '- Segment the story if the target platform cannot consume all storyboard images at once.',
    '- Each segment should reference the relevant keyframe images and contain a compact motion prompt.',
    '- Keep continuity notes next to each segment.',
    '',
    '## Segment prompt skeleton',
    '',
    '```text',
    'Using the provided keyframe(s) as visual reference, create a smooth cinematic shot: [subject] [action] while [camera movement]. Preserve identity, costume, lighting, location, and emotional tone. Transition from previous shot by [continuity bridge].',
    '```'
  ].join('\n')
}

export function composeAgentHandoff({ contract, outDir }) {
  return [
    frontMatter('Agent handoff'),
    'You are operating inside a Cine Make run directory.',
    '',
    `Run directory: ${outDir}`,
    '',
    '## Read first',
    '',
    '1. `input-contract.json`',
    '2. `source-package.md`',
    '3. `production-brief.md`',
    '4. `prompt-pack.md`',
    '',
    '## Non-negotiable boundary',
    '',
    'Codex can write production assets and generate still images. Codex cannot render MP4.',
    '',
    '## Target summary',
    '',
    `- title: ${contract.title}`,
    `- style: ${contract.target.style}`,
    `- duration: ${contract.target.durationSeconds}s`,
    `- aspect_ratio: ${contract.target.aspectRatio}`,
    `- platform: ${contract.target.platform}`,
    '',
    '## Return format',
    '',
    '- files changed',
    '- generated images or image prompts produced',
    '- video pack status',
    '- continuity risks',
    '- verification performed'
  ].join('\n')
}
