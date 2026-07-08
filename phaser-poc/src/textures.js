// Single swap point for visuals: every sprite in the game is created from a
// texture key (ball/hole/coin/mushroom/wall_N) — some now real art loaded in
// BootScene.preload() (ball, mushroom_*), the rest still generated here as
// flat geometric placeholders (hole/coin/wall_N) until real assets for them
// are picked too. To bring in more real art later, add a
// `scene.load.image(key, url)` call in BootScene.preload() and delete the
// matching block below — keep the same keys so nothing else needs to
// change (Level1Scene only ever asks for textures by key).
import { BALL_RADIUS } from "./config.js";

// Kenney Sports Pack art (loaded as "ball_raw"/"mushroom_raw" in
// BootScene.preload()) is nowhere near the pixel size these sprites need to
// render at (ball_golf.png is 8x8, ball_bowling2.png is 18x18). Baking each
// raw image into a fixed-size texture under the *final* key means every
// consuming sprite is created at GameObject scale 1, so Arcade body sizing
// (body.setCircle(radius) in Level1Scene) works exactly like it did for the
// vector-drawn placeholders — no physics code needs to know or care that the
// art is scaled up from a much smaller source image.
export function bakeRealArtTextures(scene, level) {
  bakeSquareTexture(scene, "ball", "ball_raw", BALL_RADIUS * 2);
  const radii = [...new Set(level.shrooms.map((m) => m.r))];
  for (const r of radii) {
    bakeSquareTexture(scene, `mushroom_${r}`, "mushroom_raw", r * 2);
  }
}

function bakeSquareTexture(scene, key, rawKey, size) {
  const temp = scene.add.image(0, 0, rawKey).setDisplaySize(size, size);
  const rt = scene.make.renderTexture({ width: size, height: size }, false);
  rt.draw(temp, size / 2, size / 2);
  rt.saveTexture(key);
  rt.destroy();
  temp.destroy();
}

export function generatePlaceholderTextures(scene, level) {
  const g = scene.add.graphics();

  // hole: flat dark disc
  const holeR = 16;
  g.clear();
  g.fillStyle(0x123312, 1);
  g.fillCircle(holeR, holeR, holeR - 1);
  g.lineStyle(2, 0xffffff, 0.35);
  g.strokeCircle(holeR, holeR, holeR - 1);
  g.generateTexture("hole", holeR * 2, holeR * 2);

  // coin: flat yellow disc
  const coinR = 12;
  g.clear();
  g.fillStyle(0xffd23f, 1);
  g.fillCircle(coinR, coinR, coinR - 1.5);
  g.lineStyle(2.5, 0xc79a12, 1);
  g.strokeCircle(coinR, coinR, coinR - 1.5);
  g.generateTexture("coin", coinR * 2, coinR * 2);

  // one wall texture per rect (placeholder blocks are simple flat rects,
  // sized exactly to the level data — no stretching)
  level.walls.forEach((w, i) => {
    g.clear();
    g.fillStyle(0xc8722e, 1);
    g.fillRect(0, 0, w.w, w.h);
    g.lineStyle(3, 0x7c421a, 1);
    g.strokeRect(1.5, 1.5, w.w - 3, w.h - 3);
    g.generateTexture(`wall_${i}`, w.w, w.h);
  });

  g.destroy();
}
