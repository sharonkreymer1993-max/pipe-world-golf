import Phaser from "phaser";
import { WIDTH, HEIGHT } from "./config.js";
import { TitleScene } from "./scenes/TitleScene.js";
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
  // Phaser auto-starts the first scene in this list: the title screen,
  // whose Start button hands off to Boot (texture setup) then Level1.
  scene: [TitleScene, BootScene, Level1Scene],
});
