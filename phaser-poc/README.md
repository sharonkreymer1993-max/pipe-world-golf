# Phaser 3 + Vite proof of concept

A feasibility spike for migrating `pipe-world-golf` off the hand-rolled
canvas engine (`../js/physics.js`, `../js/render.js`) onto Phaser 3 with
Arcade Physics. Only level 1 ("השדה הירוק") is ported — this is not yet a
replacement for the main game.

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
- **Sprites are placeholders**: every texture (`ball`, `hole`, `coin`,
  `wall_N`, `mushroom_R`) is generated procedurally in `src/textures.js`
  from flat-colored `Phaser.GameObjects.Graphics` shapes, not loaded image
  files.

## Swapping in real art later

`src/textures.js` is the single place placeholder textures are generated.
To bring in real sprites:

1. Drop image files into a new `public/assets/` (or `src/assets/`) folder.
2. In `BootScene.preload()`, add `this.load.image(key, url)` calls using
   the **same texture keys** already used by `generatePlaceholderTextures`
   (`ball`, `hole`, `coin`, `wall_0`, `mushroom_26`, …).
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
