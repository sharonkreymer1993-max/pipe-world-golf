# Phaser 3 + Vite proof of concept

A feasibility spike for migrating `pipe-world-golf` off the hand-rolled
canvas engine (`../js/physics.js`, `../js/render.js`) onto Phaser 3 with
Arcade Physics. Only level 1 ("השדה הירוק") is ported — this is not yet a
replacement for the main game.

Scene flow: `TitleScene` (name + Start button) → `BootScene` (texture setup)
→ `Level1Scene`. The title screen is intentionally minimal — no menus or
level select, just a Start button.

## Run it

```
cd phaser-poc
npm install
npm run dev
```

## What's real vs. placeholder

- **Physics is real**: the ball is an Arcade Physics circle body. Walls,
  the mushroom bouncer, coins, and the hole are all Arcade static bodies
  with colliders/overlaps — no manual `circleRect`/`dist` math like the
  original `physics.js`.
- **Ball and mushroom are real art**: `public/assets/ball_golf.png` and
  `ball_bowling2.png` from the Kenney Sports Pack, loaded in
  `BootScene.preload()` and baked to the exact pixel size each sprite needs
  (`src/textures.js`'s `bakeRealArtTextures`) so every consuming sprite is
  created at GameObject scale 1 — Arcade body sizing
  (`body.setCircle(radius)` in `Level1Scene`) works exactly like it did for
  the vector-drawn placeholders, unaffected by the source images' native
  pixel dimensions (8x8 and 18x18 respectively).
- **Everything else is still a placeholder**: `hole`, `coin`, and `wall_N`
  textures are generated procedurally in `src/textures.js`'s
  `generatePlaceholderTextures` from flat-colored
  `Phaser.GameObjects.Graphics` shapes, not loaded image files.

## Swapping in real art later

`src/textures.js` is the single place textures are produced. To bring in
real sprites for what's still a placeholder (hole/coin/wall_N):

1. Drop an image file into `public/assets/`.
2. In `BootScene.preload()`, load it under a `*_raw` key (see how
   `ball_raw`/`mushroom_raw` are loaded) and call `bakeSquareTexture` (or a
   new sizing helper, if the shape isn't square) with the **same final
   texture key** already used by `generatePlaceholderTextures` (`hole`,
   `coin`, `wall_0`, …).
3. Delete the corresponding placeholder-generation call in
   `generatePlaceholderTextures`.

Nothing in `Level1Scene.js` needs to change — it only ever references
textures by key, never cares how they were produced.

## Adding another level

Level data lives in `src/data/` as one plain object per level (see
`level1.js`), using the same field shape as `LEVELS[i]` in the original
`js/levels.js` (`tee`, `hole`, `walls`, `coins`, `shrooms`, …). Porting
level 2+ means: add a `level2.js` data file, generate its extra textures,
and build a `Level2Scene` (or generalize `Level1Scene` into a data-driven
`LevelScene` once more levels exist — not done yet, kept as one concrete
scene while the approach is still being validated).
