import Phaser from "phaser";
import { generatePlaceholderTextures } from "../textures.js";
import { level1 } from "../data/level1.js";

// Real asset loading (this.load.image / this.load.spritesheet) will go in
// preload() once real art exists. For now the placeholder textures are
// generated synchronously in create(), so there's nothing to preload yet.
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    generatePlaceholderTextures(this, level1);
    this.scene.start("Level1");
  }
}
