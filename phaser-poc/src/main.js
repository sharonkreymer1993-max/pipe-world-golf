import Phaser from "phaser";
import { WIDTH, HEIGHT } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { Level1Scene } from "./scenes/Level1Scene.js";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#57b94c",
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, Level1Scene],
});
