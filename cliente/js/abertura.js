/*global Phaser*/
/*eslint no-undef: "error"*/
export default class abertura extends Phaser.Scene {
  constructor() {
    super("abertura");
  }

  init() {}

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.spritesheet("botao", "assets/botao.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.add.image(400, 190, "background");

      this.input.gamepad.on("down", (pad) => {
        if (pad.buttons[9].pressed) {
          this.scene.stop();
          this.scene.start("precarregamento");
        }
      });
  }

  update() {}
}
