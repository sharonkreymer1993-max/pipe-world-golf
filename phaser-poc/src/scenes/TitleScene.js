import Phaser from "phaser";
import { WIDTH, HEIGHT, MARGIN } from "../config.js";

// A single simple title screen — no menus, no level select. Just the game
// name and a Start button that hands off to BootScene (which generates the
// gameplay textures and launches Level1). Colors match the in-game palette:
// grass green field, gold/yellow for the title (same as the coin color),
// and white/purple for the Start button (the ball and mushroom-bumper
// colors).
export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    this.cameras.main.setBackgroundColor("#57b94c");

    const field = this.add.graphics();
    field.fillStyle(0x4aa842, 1);
    field.fillRect(0, 0, WIDTH, HEIGHT);
    field.lineStyle(4, 0x2f7d2a, 1);
    field.strokeRoundedRect(MARGIN, MARGIN, WIDTH - MARGIN * 2, HEIGHT - MARGIN * 2, 16);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 110, "⛳ גולף עולם הצינורות", {
        fontFamily: "Arial",
        fontSize: "56px",
        fontStyle: "bold",
        color: "#ffd23f",
        stroke: "#2f7d2a",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setShadow(0, 6, "rgba(0,0,0,.35)", 6);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 30, "גררו לאחור כמו רוגטקה, שחררו כדי לחבוט!", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setShadow(0, 2, "rgba(0,0,0,.4)", 2);

    this.createStartButton();
  }

  createStartButton() {
    const btnW = 240;
    const btnH = 76;
    const btnX = WIDTH / 2;
    const btnY = HEIGHT / 2 + 90;
    const purple = 0x7b3fe4;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2 + 6, btnW, btnH, 18);
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 18);
    bg.lineStyle(5, purple, 1);
    bg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 18);

    const label = this.add
      .text(btnX, btnY, "▶ Start", {
        fontFamily: "Arial",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#7b3fe4",
      })
      .setOrigin(0.5);

    const hitZone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });

    hitZone.on("pointerover", () => label.setScale(1.06));
    hitZone.on("pointerout", () => label.setScale(1));
    hitZone.on("pointerdown", () => this.scene.start("Boot"));
  }
}
