# Output contract

User-facing output:

- `deliverable.md`
- `storyboard-images/`

The user should not need to read internal debug artifacts. `deliverable.md` is the product entrypoint; it must explain the film, include the AI-facing storyboard, list the image-output slots, and include the concrete video-tool feed pack.

Normal runs must not expose `continuity-bible.json`, `episodes/`, task trees, or agent handoff files at the run root. Those may exist only under `.cine-make-internal/` when `--emit-internal` is explicitly used for compiler debugging.

Modes:

- `draft`: no image generation; prepare `deliverable.md` and `storyboard-images/README.md` only.
- `visual` / 出图模式: generate or fill still storyboard/keyframe images under `storyboard-images/` when image generation is available.

Optional image-output inputs:

- `--character-image <path>`
- `--scene-image <path>`
- `--style-image <path>`

Character images are optional. If absent, image-output mode may generate `storyboard-images/character-reference.png`.

Image-output package slots:

- `storyboard-images/character-reference.png` only when no user character image is provided;
- `storyboard-images/scene-reference.png` only when no user scene image is provided;
- `storyboard-images/segment-01-start.png` for the first 15-second segment start frame;
- `storyboard-images/S01.png` ... `S07.png` for the first 15-second segment AI-storyboard keyframes;
- `storyboard-images/segment-01-end.png` for the first segment end frame;
- for segment 2 and later, reuse the previous segment end frame as the next segment start frame;
- `storyboard-images/contact-sheet.jpg` for a one-glance overview of all stills.

No artifact may claim final MP4 generation.

Video-tool feed pack:

- default to one feed card per short clip, capped at 15 seconds and 7 AI-storyboard shots;
- split longer videos into multiple cards for later external editing/stitching;
- each feed card must state uploaded images, start frame, end frame, subject lock, timeline, shot size, lens, camera language, composition, blocking, lighting/art direction, continuity, and negative constraints;
- each later feed card must explicitly state `上一段尾帧 = 本段首帧`;
- longer videos are stitched from generated clips outside Cine Make.
