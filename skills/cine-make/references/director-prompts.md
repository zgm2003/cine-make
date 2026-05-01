# Director prompts

These are compact prompt patterns for turning story material into filmable assets. Use them as scaffolding, not as rigid templates.

## Source diagnosis prompt

```text
Read the source as a director, not as a summarizer.
Identify:
- the visible event;
- the hidden emotional turn;
- the subject whose continuity must be preserved;
- the must-keep object, place, weather, or lighting anchor;
- what is prose-only and must become visible behavior.
Return only production-relevant notes.
```

## Director rewrite prompt

```text
Rewrite the source into a director-grade script for a short video.
Keep the core plot. Remove unfilmable explanation.
For each beat, write:
- visible action;
- micro-performance: eye line, breath, pause, hand tension, posture;
- blocking: where the subject moves in the frame;
- emotional transition;
- continuity anchor carried into the next shot.
Do not add lore unless it is needed on screen.
```

## Performance pass prompt

```text
Strengthen the performance layer.
Replace generic emotion words with playable behavior.
Bad: "she is scared."
Good: "she freezes before the alley mouth, keeps her chin still, but her fingers tighten around the wet sleeve."
Keep the performance subtle enough for cinematic close-ups.
```

## Shotlist prompt

```text
Turn the director script into a shotlist.
Every shot must include:
- shot_id;
- duration_seconds;
- scene;
- subject;
- action;
- performance_detail;
- shot_size;
- camera_movement;
- composition;
- lighting;
- dialogue_or_voiceover;
- image_prompt;
- continuity_from_previous;
- video_prompt_note.
No random beauty shots. Every cut must advance information, emotion, or continuity.
```

## Storyboard image prompt

```text
Create a still-image prompt for this shot.
The prompt must describe a single keyframe, not motion.
Include:
- subject identity anchor;
- costume and prop anchor;
- scene and weather anchor;
- visible action;
- micro-performance;
- shot size and lens feeling;
- composition;
- lighting and color palette;
- continuity anchor from the previous shot;
- "no text overlay, no watermark".
```

## External video-model prompt

```text
Using the generated start/end frame images as hard visual anchors, write an external video-model prompt.
Write it as one task for one visible action, usually 3-6 seconds unless a verified platform limit says otherwise.
Do not ask the video model to understand a whole plot arc; split denser sequences into more tasks.
Describe:
- start_frame and end_frame;
- exact duration, aspect ratio, and visual style;
- subject lock: face, body, costume, props, location, lighting;
- the single visible action this task should animate;
- subject motion;
- camera motion and transition logic;
- transition bridge from previous shot;
- negative constraints: no subtitles, no watermark, no face drift, no random characters, no jump cuts, no story outside this segment.
Do not ask Codex to render video. This prompt is for the external video tool.
```

## Continuity review prompt

```text
Review the whole package for continuity.
Check:
- face and body identity;
- costume;
- props;
- location;
- weather;
- lighting direction;
- screen direction;
- emotional curve;
- action carry-over;
- whether still-image prompts accidentally ask for motion;
- whether video prompts depend on unstated story context.
Return blockers, warnings, and clean handoff notes.
```
