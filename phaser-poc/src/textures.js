// Single swap point for visuals: every sprite in the game is created from a
// texture key (ball/hole/coin/mushroom/wall_N) generated here as a flat
// geometric placeholder. To bring in real art later, replace the body of
// this function with `scene.load.image(key, url)` calls in a scene's
// preload() and keep the same keys — no changes needed in the scenes that
// consume them (Level1Scene only ever asks for textures by key).
import { BALL_RADIUS } from "./config.js";

export function generatePlaceholderTextures(scene, level) {
  const g = scene.add.graphics();

  // ball: flat white disc with a grey outline, plus an off-center mark so
  // the rolling-rotation animation is actually visible on a placeholder
  // that would otherwise look identical at every angle
  const bd = BALL_RADIUS * 2;
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS - 1.5);
  g.lineStyle(2, 0xc9c9c9, 1);
  g.strokeCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS - 1.5);
  g.fillStyle(0x8a8a8a, 1);
  g.fillCircle(BALL_RADIUS * 1.5, BALL_RADIUS, BALL_RADIUS * 0.28);
  g.generateTexture("ball", bd, bd);

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

  // one mushroom texture per unique radius used in the level
  const radii = [...new Set(level.shrooms.map((m) => m.r))];
  for (const r of radii) {
    g.clear();
    g.fillStyle(0xff5d5d, 1);
    g.fillCircle(r, r, r - 1.5);
    g.lineStyle(3, 0xb32626, 1);
    g.strokeCircle(r, r, r - 1.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(r * 0.55, r * 0.65, r * 0.2);
    g.fillCircle(r * 1.4, r * 0.75, r * 0.16);
    g.generateTexture(`mushroom_${r}`, r * 2, r * 2);
  }

  g.destroy();
}
