/*global Phaser*/
/*eslint no-undef: "error"*/
export default class gameover extends Phaser.Scene {
  constructor() {
    super("gameover");
  }

  init() {
    this.game.cenaAtual = "gameover";
  }

  preload() {
    this.load.image("gameover", "assets/gameover.png"); // Fundo para o game over
  }

  create() {
    this.add
      .image(400, 225, "gameover")
      .setInteractive()
      .on("pointerdown", () => {
        window.location.reload();
      });

    this.input.gamepad.on("down", (pad) => {
      if (pad.buttons[9].pressed) {
        window.location.reload();
      }
    });

    setTimeout(() => {
      window.location.reload();
    }, 10000);
  }
}
