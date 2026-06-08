# Output contract

User-facing output:

- `deliverable.md`
- `storyboard-images/`

The user should not need to read internal debug artifacts. `deliverable.md` is the product entrypoint; it must explain the film, include the concise director storyboard, list the image-output slots, and include the concrete video-tool feed pack.

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

- `storyboard-images/character-reference.png` only when no user character image is provided; this must be a photoreal white-background / 白底 tri-view character sheet showing character name, height, and core prop without age;
- `storyboard-images/scene-reference.png` only when no user scene image is provided;
- `storyboard-images/segment-01-start.png` for the first 15-second segment start frame;
- `storyboard-images/S01.png` ... `S04.png` for the first 15-second segment AI-storyboard keyframes;
- `storyboard-images/segment-01-end.png` for the first segment end frame;
- for segment 2 and later, reuse the previous segment end frame as the next segment start frame.

No artifact may claim final MP4 generation.

Video-tool feed pack:

- default to about 4 storyboard keyframes per 15-second Jimeng feed card, and split cards so each card uploads at most 9 uploaded images per feed card;
- character, scene, start frame, storyboard keyframes, and end frame all count as uploaded images;
- split longer videos into multiple cards for later external editing/stitching;
- each feed card must state uploaded images, start frame, end frame, subject lock, short action order, camera language, and negative constraints;
- each later feed card must explicitly state `上一段尾帧 = 本段首帧`;
- longer videos are stitched from generated clips outside Cine Make.
