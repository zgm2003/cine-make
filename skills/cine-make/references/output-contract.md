# Output contract

User-facing output:

- `deliverable.md`
- `storyboard-images/`

The user should not need to read the rest of the run tree.

Internal production-run artifacts:

- `input-contract.json`
- `source-package.md`
- `production-brief.md`
- `prompt-pack.md`
- `deliverable.md`
- `director-script.md`
- `characters.json`
- `shotlist.json`
- `storyboard-board.md`
- `storyboard-prompts.md`
- `reference-pack.md`
- `seedance-pack.md`
- `jimeng-pack.md`
- `continuity-review.md`

Modes:

- `draft`: no image generation; use `storyboard-images/README.md` as the later image queue.
- `visual`: generate or fill still images under `storyboard-images/` when imagegen is available.

Optional visual inputs:

- `--character-image <path>`
- `--scene-image <path>`
- `--style-image <path>`

Character images are optional. If absent, visual mode may generate `storyboard-images/character-reference.png`.

No artifact may claim final MP4 generation.

Video-tool feed pack:

- split generated clips into cards of at most 15 seconds and about 5 shots by default;
- every card must tell the user which reference/keyframe images to upload;
- every card must include a copyable model-facing prompt, not only a human story summary;
- each prompt should specify subject lock, timeline, shot size, camera movement, lighting/art direction, continuity, and negative constraints;
- longer videos are stitched from generated clips outside Cine Make.
