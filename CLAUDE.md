# pipe-world-golf — גולף עולם הצינורות

A single-page, canvas-based mini-golf game (6 levels, Hebrew/RTL UI, no build step,
no dependencies). Originally a single `pipe-world-golf.html` file; split into a
plain multi-file structure while keeping behavior byte-for-byte identical.

## Project structure

```
index.html          HTML skeleton, canvas, HUD, start/overlay markup
css/styles.css       All styling (extracted verbatim from the original <style> block)
js/audio.js          WebAudio beep synth + the S sound-effect table
js/levels.js         LEVELS data — the only file to touch to add/edit a level
js/physics.js        Collision helpers, step()/collide() — the simulation
js/render.js         All canvas drawing (draw() + per-entity draw* helpers)
js/main.js           DOM refs, game state, input handling, overlays, game loop
```

There is no bundler and no module system. Every file is a plain classic
`<script src="...">` (no `type="module"`), loaded in this order from
`index.html`:

```
audio.js → levels.js → physics.js → render.js → main.js
```

**Why this works without imports/exports:** classic (non-module) `<script>`
tags on the same page share one global lexical scope. A top-level `let`/`const`
declared in `audio.js` (e.g. `S`, `muted`) is directly visible to code in
`physics.js` or `main.js` loaded afterwards — no `window.` prefixing or
explicit exports needed. This is exactly how the code behaved when it was one
file; splitting it into separate `<script>` tags preserves that behavior
identically as long as **load order is preserved**. Because all the actual
*usage* of cross-file variables happens inside function bodies that only run
later (from `main.js`'s `requestAnimationFrame` loop, after every script has
finished loading), strict ordering between physics/render/audio/levels doesn't
matter — only `main.js` must load last, since it's what starts the game loop
and wires up the DOM.

Do not convert these to ES modules without also adding explicit
imports/exports — the files rely on implicit shared globals.

## Physics model (js/physics.js)

The simulation is a simple 2D circle-vs-shapes engine, advanced once per
animation frame from `main.js`'s `frame()` → `step(dt)`.

- **Ball state**: `{x, y, vx, vy}`, a single circle of radius `BR` (11px).
- **`step(dt)`**: advances flag-wave animation, pipe cooldown, moving obstacle
  (shell) positions, and particles every frame regardless of whether the ball
  is moving. If the ball is moving, it:
  1. Applies friction (`.988` normally, `.93` on sand — `L.sand` rects).
  2. Substeps the integration (`sub = ceil(speed/6)`) so fast shots don't
     tunnel through thin walls, calling `collide()` once per substep.
  3. Stops the ball (snaps velocity to 0, records `lastRest`) once speed
     drops below `.06`.
- **`collide()`** runs, in order, per substep:
  1. Arena border clamp (bounces off the `M=28` margin, damping `*.75`).
  2. `L.walls` rectangles — resolved via `circleRect()` (closest-point
     circle/AABB test), reflects velocity across the contact normal.
  3. `L.shrooms` (mushrooms) — circular bouncers; boosts the ball's speed
     toward a target (`min(speed*1.5+3, 18)`) and triggers a squash-animation
     flag (`m.sq`) plus a sound/particle burst.
  4. `L.shells` — moving circular obstacles (current positions come from
     `shellsPos`, computed each frame in `step()`); bounce the ball away and
     add a kick impulse.
  5. `L.pipes` — teleports the ball between the two ends of a pipe pair when
     within 26px of either end, gated by `pipeCool` (600ms) to avoid instant
     re-entry oscillation.
  6. `L._coins` — collectible circles (pickup radius `14+BR`); marks `.got`,
     increments `coinsGot`.
  7. `L.water` — rectangular hazard; on entry, adds a penalty stroke and
     resets the ball to `lastRest` (its last stopped position, not the tee).
  8. Hole check — sinks the ball if within 15px of `L.hole` and speed is
     below `5.2` (fast shots can lip out/roll past).
- Helpers: `dist(a,b)`, `inRect(p,rect,pad)`, `circleRect(circle,rect,radius)`
  (returns `{nx,ny,pen}` or `null`), `spawnParts(x,y,color,n,sp)` for particle
  bursts (physics owns particle *spawning*; `step()` also owns particle
  *integration/decay* — rendering only reads `particles` in `render.js`).

## Adding a new level

Levels live entirely in `js/levels.js`, in the `LEVELS` array. The game reads
`LEVELS[i]` positionally — `li` (current level index, in `main.js`) just
indexes into this array, and `loadLevel()`/`showLevelDone()` assume levels are
played in array order, so append new levels rather than reordering existing
ones.

Each level object:

```js
{
  name: "שם השלב",           // shown in the HUD
  par: 3,                     // strokes for 3 stars; +2 = 2 stars; more = 1 star
  tee:  {x, y},                // ball start position
  hole: {x, y},                // sink target
  walls:  [{x, y, w, h}, ...],           // solid rectangles (brick, drawn + collided)
  water:  [{x, y, w, h}, ...],           // hazard rectangles (stroke penalty + reset)
  sand:   [{x, y, w, h}, ...],           // friction-only rectangles (no collision)
  coins:  [{x, y}, ...],                 // collectibles
  shrooms:[{x, y, r}, ...],              // circular bouncers
  pipes:  [ [ {x,y}, {x,y} ], ... ],     // list of [entrance, exit] pairs (bidirectional)
  shells: [{x1,y1,x2,y2,r,sp}, ...],     // patrol enemies: linear back-and-forth
                                          // between (x1,y1) and (x2,y2), speed `sp`
                                          // (radians/ms fed into a sine oscillator)
}
```

Rules/gotchas learned from the existing 6 levels:
- Every array key (`walls`, `water`, `sand`, `coins`, `shrooms`, `pipes`,
  `shells`) must be present, even if empty (`[]`) — the physics and render
  loops iterate them unconditionally with `for (const x of L.xxx)`.
- Coordinates are in canvas space, `960×600` (`W`/`H` in `js/main.js`); keep
  everything inside the `M=28` playable margin used by the border-collision
  code in `physics.js`.
- `pipes` entries are `[a, b]` pairs; the physics code checks both
  `[a,b]` and `[b,a]`, so a pipe is always bidirectional — you don't need to
  add a second pair for the return trip.
- `shells` positions are *not* static — `physics.js`'s `step()` recomputes
  `shellsPos` every frame from the level's `x1,y1,x2,y2,sp` via a sine
  oscillator; you only ever author the two patrol endpoints and a speed.
- Don't add a `_coins` key yourself — `loadLevel()` in `main.js` derives it
  from `coins` at runtime (adds `.got`/`.ang` fields for animation/pickup
  state). Author only `coins`.
- To make a level with no mushrooms, use `shrooms: []` (see the last level,
  which zeroes it out after definition as `LEVELS[5].shrooms=[]` for legacy
  reasons — prefer just writing `[]` directly in new levels).

No rendering code needs to change to add a level — `render.js`'s `draw()`
already iterates every field generically. You only need to add a new object
to the `LEVELS` array.

## Rendering (js/render.js)

`draw()` is called once per animation frame (after `step()`) and is a full
repaint — there is no dirty-rect tracking. Draw order (back to front): grass
background → border hedge → sand → water → walls → pipes → hole/flag →
mushrooms → coins → shells → aim line/power bar (if aiming) → ball → particles.
Per-entity animation state (mushroom squash `m.sq`, coin bob `c.ang`, flag
wave `flagWave`) is mutated directly on the level/state objects inside the
draw functions themselves — e.g. `drawShroom()` decrements `m.sq` and
`drawCoin()` increments `c.ang` — so drawing has a (deliberate) side effect on
animation state; don't call these functions more than once per frame per
entity.

## Game loop & state (js/main.js)

- `frame(now)` — the `requestAnimationFrame` loop: computes `dt` (clamped to
  40ms to avoid physics blowups on tab-switch), calls `step(dt)` then
  `draw()`.
- `loadLevel(i)` resets all per-level state (ball, strokes, coinsGot, timers)
  and derives `L._coins`.
- Input is a drag-to-shoot ("slingshot") model: `pointerdown` starts aiming,
  `pointermove` updates the aim point, `pointerup` computes a velocity vector
  from ball position minus aim point, scaled by drag length (capped at 190px
  → max power), and launches the ball.
- `showLevelDone()` computes stars from `strokes` vs `par`, renders the
  overlay card, and advances to `loadLevel(li+1)` or loops back to level 0
  after the final level.

## Audio (js/audio.js)

No audio files — every sound is synthesized on the fly via a WebAudio
oscillator (`beep(freq, duration, type, volume, slide)`). The `S` object maps
game events (`hit`, `wall`, `shroom`, `coin`, `pipe`, `splash`, `shell`,
`sink`, `fanfare`) to specific beep sequences. `ac()` lazily creates the
singleton `AudioContext` (must happen after a user gesture, so it's called
from the `pointerdown` and start-button handlers). The mute toggle
(`js/main.js`'s `#bMute` handler) just flips the shared `muted` flag that
`beep()` checks.
