import Phaser from "phaser";
import { generatePlaceholderTextures, bakeRealArtTextures } from "../textures.js";
import { level1 } from "../data/level1.js";

// Real Kenney Sports Pack art for the ball and the mushroom bouncer
// (ball_golf.png, ball_bowling2.png), loaded here as raw source images and
// baked in textures.js under the same texture keys the placeholders used to
// occupy. Everything else (hole/coin/wall_N) is still generated
// procedurally in generatePlaceholderTextures — see that file for the
// remaining swap points.
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("ball_raw", "assets/ball_golf.png");
    this.load.image("mushroom_raw", "assets/ball_bowling2.png");
  }

  create() {
    generatePlaceholderTextures(this, level1);
    bakeRealArtTextures(this, level1);
    this.scene.start("Level1");
  }
}
