/*global Phaser*/
/*eslint no-undef: "error"*/
export default class abertura extends Phaser.Scene {
  constructor() {
    super("abertura");
  }

  init() {
    this.game.cenaAtual = "abertura";
  }

  preload() {
    this.load.image("abertura", "assets/abertura.png");
    this.load.spritesheet("botao", "assets/botao.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.add.image(400, 225, "abertura");

    this.anims.create({
      key: "botaoAnimado",
      frames: this.anims.generateFrameNumbers("botao", {
        start: 0,
        end: 3,
      }),
      frameRate: 4,
      repeat: -1,
    });

    this.add
      .sprite(400, 425, "botao")
      .play("botaoAnimado")
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.stop();
        this.scene.start("precarregamento");
      });

    this.input.gamepad.on("down", (pad) => {
      if (pad.buttons[9].pressed) {
        this.scene.stop();
        this.scene.start("precarregamento");
      }
    });

    this.scene.start("precarregamento");
  }
  update() {}
}
