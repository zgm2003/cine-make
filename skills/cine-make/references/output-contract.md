# Output contract

User-facing output:

- `deliverable.md`
- `continuity-bible.json`
- `episodes/`
- root `storyboard-images/README.md` as a compatibility/index file

The user should not need to read internal debug artifacts. The user should use `episodes/<episode>/video-tasks/Sxx.md` as the actual video-model feed unit.

Each episode must also include `episodes/<episode>/storyboard.md`. This is the director storyboard layer: shot size, lens, camera movement, composition, blocking, performance, lighting, transition, and frame purpose. Start/end frames are generated from this layer; they are not a replacement for storyboard design.

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

- `draft`: no image generation; prepare `continuity-bible.json`, `episodes/*/video-tasks/*.md`, and image queues for later rendering.
- `visual` / 出图模式: generate or fill still start/end control frames under `episodes/*/storyboard-images/`. The first render path is local `gpt-image-2` CLI/API with `quality=high`; it uses `OPENAI_API_KEY` plus optional `OPENAI_BASE_URL` for official OpenAI or CPA/OpenAI-compatible proxies. Built-in `$imagegen` is only the fallback when API key, base URL, network, or tooling fails. The frames must follow `episodes/*/storyboard.md`.

Optional image-output inputs:

- `--character-image <path>`
- `--scene-image <path>`
- `--style-image <path>`

Character images are optional. If absent, image-output mode may generate `episodes/<episode>/storyboard-images/character-reference.png`.

No artifact may claim final MP4 generation.

Video-tool feed pack:

- preserve long source stories and split them into episodes instead of compressing them into one teaser;
- split generated clips into one visible action per task, usually 3-6 seconds;
- every task must have a director storyboard before image prompts are written;
- every task must specify `start_frame`, `end_frame`, `motion`, `camera`, `must_keep`, and `avoid`;
- every task must include still-frame prompts for `START_FRAME` and `END_FRAME`;
- each prompt should lock subject identity, scene layout, lighting/art direction, continuity, and negative constraints;
- longer videos are stitched from generated clips outside Cine Make.

