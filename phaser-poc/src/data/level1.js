// Ported 1:1 from js/levels.js — LEVELS[0] ("השדה הירוק") in the original
// vanilla-canvas game. Same field shape as the original level format
// (see CLAUDE.md at the repo root) so later levels can be added the same
// way: one data file per level, walls/coins/shrooms as plain arrays.
export const level1 = {
  name: "השדה הירוק",
  par: 2,
  tee: { x: 110, y: 300 },
  hole: { x: 850, y: 300 },
  walls: [{ x: 430, y: 70, w: 44, h: 250 }],
  coins: [
    { x: 480, y: 430 },
    { x: 620, y: 370 },
    { x: 300, y: 200 },
  ],
  shrooms: [{ x: 640, y: 170, r: 26 }],
};
