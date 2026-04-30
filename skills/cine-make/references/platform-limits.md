# Platform limits

Treat video-model limits as unstable unless verified from the current official platform docs.

Default safe behavior:

- keep storyboard images as production planning assets;
- assume a 15-second maximum per generation card unless the current platform docs or user instructions prove a different limit;
- segment video packs by duration, not by arbitrary shot count;
- keep each generation card to about 5 shots unless the user explicitly wants denser cutting;
- do not ask one video generation to cover a 30s/60s story in one prompt;
- record assumptions in `continuity-review.md`;
- never hide platform uncertainty by pretending one giant prompt is safe.
