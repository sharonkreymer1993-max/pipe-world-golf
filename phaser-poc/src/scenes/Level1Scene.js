import Phaser from "phaser";
import { WIDTH, HEIGHT, MARGIN, BALL_RADIUS } from "../config.js";
import { level1 } from "../data/level1.js";

// The vanilla game's tuning constants (friction .988, launch power *17,
// mushroom boost formula, stop/sink speed gates — see CLAUDE.md's physics
// section) were all authored per ~16.7ms animation frame. Arcade Physics
// works in px/second, so FRAME_TO_SEC converts frame-based constants to
// Phaser's units without re-tuning the feel of the original game.
const FRAME_TO_SEC = 60;
const FRICTION_PER_FRAME = 0.988;
const MAX_DRAG_PX = 190;
const MAX_LAUNCH_PX_PER_FRAME = 17;
const STOP_SPEED = 0.06 * FRAME_TO_SEC; // the original 0.06 px/frame stop threshold, in px/s

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super("Level1");
  }

  create() {
    this.level = level1;
    this.strokes = 0;
    this.coinsGot = 0;
    this.sunk = false;
    this.moving = false;
    this.aiming = false;
    this.aimPoint = { x: 0, y: 0 };

    this.cameras.main.setBackgroundColor("#57b94c");
    this.physics.world.setBounds(MARGIN, MARGIN, WIDTH - MARGIN * 2, HEIGHT - MARGIN * 2);
    this.drawField();

    this.buildBall();
    this.buildWalls();
    this.buildMushrooms();
    this.buildCoins();
    this.buildHole();

    this.aimGfx = this.add.graphics();
    this.hud = this.add
      .text(20, 14, "", { fontFamily: "Arial", fontSize: "18px", color: "#ffffff" })
      .setDepth(10)
      .setShadow(0, 2, "rgba(0,0,0,.5)", 2);
    this.updateHud();

    this.input.on("pointerdown", (p) => this.onPointerDown(p));
    this.input.on("pointermove", (p) => this.onPointerMove(p));
    // dragging the slingshot past the canvas edge fires "pointerupoutside"
    // instead of "pointerup" — handle both so a strong pull still fires
    this.input.on("pointerup", () => this.onPointerUp());
    this.input.on("pointerupoutside", () => this.onPointerUp());
  }

  drawField() {
    const g = this.add.graphics();
    g.lineStyle(4, 0x2f7d2a, 1);
    g.strokeRoundedRect(MARGIN, MARGIN, WIDTH - MARGIN * 2, HEIGHT - MARGIN * 2, 16);
  }

  buildBall() {
    this.ball = this.physics.add.sprite(this.level.tee.x, this.level.tee.y, "ball");
    this.ball.body.setCircle(BALL_RADIUS);
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(0.75);
    this.ball.body.onWorldBounds = true;
    this.physics.world.on("worldbounds", (body) => {
      if (body.gameObject === this.ball) this.punchBall();
    });
  }

  buildWalls() {
    this.walls = this.physics.add.staticGroup();
    this.level.walls.forEach((w, i) => {
      const img = this.add.image(w.x + w.w / 2, w.y + w.h / 2, `wall_${i}`);
      this.walls.add(img);
    });
    this.physics.add.collider(this.ball, this.walls, () => this.punchBall());
  }

  buildMushrooms() {
    this.mushrooms = this.physics.add.staticGroup();
    for (const m of this.level.shrooms) {
      const spr = this.add.image(m.x, m.y, `mushroom_${m.r}`);
      this.physics.add.existing(spr, true);
      spr.body.setCircle(m.r);
      spr.r = m.r;
      this.mushrooms.add(spr);
    }
    this.physics.add.overlap(this.ball, this.mushrooms, (ball, mushroom) => this.onMushroom(mushroom));
  }

  buildCoins() {
    this.coins = this.physics.add.staticGroup();
    for (const c of this.level.coins) {
      const spr = this.add.image(c.x, c.y, "coin");
      this.physics.add.existing(spr, true);
      spr.body.setCircle(12);
      this.coins.add(spr);
    }
    this.physics.add.overlap(this.ball, this.coins, (ball, coin) => this.onCoin(coin));
  }

  buildHole() {
    this.hole = this.add.image(this.level.hole.x, this.level.hole.y, "hole");
    this.physics.add.existing(this.hole, true);
    this.hole.body.setCircle(16);
    this.physics.add.overlap(this.ball, this.hole, () => this.onHole());
  }

  update(time, delta) {
    if (this.sunk) return;
    const body = this.ball.body;

    if (body.speed > 0) {
      const decay = Math.pow(FRICTION_PER_FRAME, delta / (1000 / FRAME_TO_SEC));
      body.velocity.scale(decay);
    }
    this.moving = body.speed > STOP_SPEED;
    if (!this.moving) body.setVelocity(0, 0);

    if (this.moving) {
      // rolling animation: spin the sprite as if it were a wheel, angular
      // speed = linear speed / radius (rolling without slipping)
      this.ball.rotation += (body.velocity.x / BALL_RADIUS) * (delta / 1000);
    }

    if (this.aiming) this.drawAim();
  }

  punchBall() {
    this.tweens.killTweensOf(this.ball);
    this.ball.setScale(1, 1);
    this.tweens.add({
      targets: this.ball,
      scaleX: 1.25,
      scaleY: 0.75,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  onMushroom(mushroom) {
    const body = this.ball.body;
    const dx = this.ball.x - mushroom.x,
      dy = this.ball.y - mushroom.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist,
      ny = dy / dist;
    // push the ball just outside the mushroom so the overlap clears
    // immediately instead of re-triggering every frame of contact
    this.ball.x = mushroom.x + nx * (mushroom.r + BALL_RADIUS + 1);
    this.ball.y = mushroom.y + ny * (mushroom.r + BALL_RADIUS + 1);

    const spFrame = body.speed / FRAME_TO_SEC;
    const wantFrame = Math.min(spFrame * 1.5 + 3, 18);
    body.setVelocity(nx * wantFrame * FRAME_TO_SEC, ny * wantFrame * FRAME_TO_SEC);

    this.tweens.add({ targets: mushroom, scaleX: 1.15, scaleY: 0.8, duration: 90, yoyo: true, ease: "Quad.easeOut" });
    this.punchBall();
  }

  onCoin(coin) {
    coin.destroy();
    this.coinsGot++;
    this.updateHud();
  }

  onHole() {
    if (this.sunk) return;
    const spFrame = this.ball.body.speed / FRAME_TO_SEC;
    if (spFrame < 5.2) this.sinkBall();
  }

  sinkBall() {
    this.sunk = true;
    this.ball.body.setVelocity(0, 0);
    this.ball.body.enable = false;
    this.tweens.add({
      targets: this.ball,
      scale: 0,
      alpha: 0,
      duration: 350,
      ease: "Quad.easeIn",
      onComplete: () => this.showLevelComplete(),
    });
  }

  showLevelComplete() {
    const text = this.add
      .text(
        WIDTH / 2,
        HEIGHT / 2,
        `⛳ השלב הושלם!\n${this.strokes} חבטות (פאר ${this.level.par})  •  🪙 ${this.coinsGot}/${this.level.coins.length}\n\nלחצו כדי לשחק שוב`,
        { fontFamily: "Arial", fontSize: "26px", color: "#ffffff", align: "center", backgroundColor: "rgba(12,45,18,.75)" }
      )
      .setOrigin(0.5)
      .setPadding(24)
      .setDepth(20);
    this.input.once("pointerdown", () => this.scene.restart());
    void text;
  }

  updateHud() {
    this.hud.setText(
      `${this.level.name}  |  חבטות: ${this.strokes} / פאר ${this.level.par}  |  🪙 ${this.coinsGot}/${this.level.coins.length}`
    );
  }

  onPointerDown(p) {
    if (this.sunk || this.moving) return;
    this.aiming = true;
    this.aimPoint = { x: p.worldX, y: p.worldY };
  }

  onPointerMove(p) {
    if (this.aiming) this.aimPoint = { x: p.worldX, y: p.worldY };
  }

  onPointerUp() {
    if (!this.aiming) return;
    this.aiming = false;
    this.aimGfx.clear();

    const dx = this.ball.x - this.aimPoint.x,
      dy = this.ball.y - this.aimPoint.y;
    const len = Math.hypot(dx, dy);
    if (len < 12) return;

    const pw = Math.min(len, MAX_DRAG_PX) / MAX_DRAG_PX;
    const speedFrame = pw * MAX_LAUNCH_PX_PER_FRAME;
    const speed = speedFrame * FRAME_TO_SEC;
    this.ball.body.setVelocity((dx / len) * speed, (dy / len) * speed);

    this.strokes++;
    this.updateHud();
  }

  drawAim() {
    this.aimGfx.clear();
    const dx = this.ball.x - this.aimPoint.x,
      dy = this.ball.y - this.aimPoint.y;
    const len = Math.hypot(dx, dy);
    if (len < 12) return;

    const pw = Math.min(len, MAX_DRAG_PX) / MAX_DRAG_PX;
    const tx = this.ball.x + (dx / len) * pw * 150;
    const ty = this.ball.y + (dy / len) * pw * 150;
    this.aimGfx.lineStyle(3, 0xffffff, 0.85);
    this.aimGfx.lineBetween(this.ball.x, this.ball.y, tx, ty);
    this.aimGfx.fillStyle(0x000000, 0.4);
    this.aimGfx.fillRoundedRect(this.ball.x - 30, this.ball.y + 24, 60, 10, 5);
    this.aimGfx.fillStyle(pw > 0.75 ? 0xff5d5d : pw > 0.4 ? 0xffd23f : 0x7be06f, 1);
    this.aimGfx.fillRoundedRect(this.ball.x - 28, this.ball.y + 26, 56 * pw, 6, 3);
  }
}
