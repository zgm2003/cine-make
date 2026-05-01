# Platform limits

Treat video-model limits as unstable unless verified from the current official platform docs.

Default safe behavior:

- keep storyboard images as video-control assets, not as a decorative contact sheet;
- prefer one visible action per generation task;
- default each task to 3-6 seconds unless the current platform docs or user instructions prove a different limit;
- use start/end frames as hard anchors whenever the target video tool supports them;
- do not ask one video generation to cover a 30s/60s story in one prompt;
- do not ask one prompt to cover several unrelated story beats;
- record assumptions in `continuity-review.md`;
- never hide platform uncertainty by pretending one giant prompt is safe.
