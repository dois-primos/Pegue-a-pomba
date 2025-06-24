/*global Phaser*/
/*eslint no-undef: "error"*/
export default class precarregamento extends Phaser.Scene {
  constructor() {
    super("precarregamento");
  }

  init() {
    this.add.rectangle(400, 300, 468, 32).setStrokeStyle(1, 0xffffff);
    const progresso = this.add
      .rectangle(400, 300, 468, 32)
      .setFillStyle(0xffffff);
    this.load.on("progress", (progress) => {
      progresso.width = 4 + 460 * progress;
    });
  }

  preload() {
    this.load.setPath("assets/");
    this.load.image("background", "background.png");
    this.load.image("mira", "mira.png");
    this.load.spritesheet("botao", "assets/botao.png", {
      frameWidth: 64,
      frameHeight: 64,
    });


  }

  create() {
    this.scene.start("sala");
  }

  update() {}
}
