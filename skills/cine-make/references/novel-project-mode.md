# Novel Project Mode

Use this reference for whole novels and large `.txt` sources. Short excerpts, scripts, ad briefs, and small story fragments stay on the normal draft -> visual flow in `SKILL.md`.

## Core rule

Never paste the whole source into context. Ingest the file, then work from bounded chapter tasks and accepted summaries.

## Command sequence

```bash
cine-make novel ingest --input ./novel.txt --out .cine-make-runs/my-novel
cine-make novel task --run .cine-make-runs/my-novel --id summarize-chapter-0001
cine-make novel accept-summary --run .cine-make-runs/my-novel --file ./chapter-0001.summary.json
cine-make novel build-bible --run .cine-make-runs/my-novel
cine-make novel visual-bible --run .cine-make-runs/my-novel
cine-make novel plan-episodes --run .cine-make-runs/my-novel
cine-make novel episode --run .cine-make-runs/my-novel --episode 1
cine-make novel canvas --run .cine-make-runs/my-novel --episode 1
```

## Workflow

1. Ingest the novel file into a project workspace. Keep the original source in the workspace; do not copy the source into chat.
2. For each generated chapter task, ask the model to summarize only that chapter span. Save the result as JSON.
3. Accept validated chapter summaries with `novel accept-summary`.
4. Build the series bible after enough summaries are accepted. The bible is the continuity source for characters, settings, arcs, and adaptation rules.
5. Run visual-bible planning after bible planning. It produces reference plans and prompts; it does not generate images.
6. Generate S/A character references only after the bible and visual bible are reviewed. Use explicit `$imagegen` only after approval.
7. Plan episodes from the bible, then export one episode at a time into the existing Cine Make draft artifacts.
8. If the user uses the Canvas system, export the episode package with `novel canvas` and import `canvas-project.zip` through the Canvas `导入画布` button.

## Canvas handoff

`novel canvas` writes two files into the episode directory:

```text
canvas-manifest.json
canvas-project.zip
```

- `canvas-manifest.json` is Cine Make's renderer-neutral director handoff. It keeps semantic roles, continuity, warnings, and Jimeng upload-image budget notes.
- `canvas-project.zip` is the current Canvas import adapter. It contains `projects.json` with text-only nodes and no media files.
- Do not treat this as image or video generation. Canvas remains the downstream editing and generation workspace.

## Visual and Jimeng policy

- Default style: 超写实真人电影质感，85mm镜头，4K，高细节服装与道具，克制表演，强角色一致性.
- Novel Studio MVP does not generate images automatically. It plans visual references; `$imagegen` is explicit after visual bible approval.
- Each Jimeng feed card can upload at most 9 images. Character, scene, start frame, storyboard keyframes, and end frame all count as uploaded images.
- Reuse continuity hooks between exported episodes instead of recreating identities from raw text.
