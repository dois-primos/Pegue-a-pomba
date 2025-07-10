/*global Phaser*/
/*eslint no-undef: "error"*/
export default class gameover extends Phaser.Scene {
  constructor() {
    super("gameover");
  }

  init(data) {
    this.game.cenaAtual = "gameover";
    this.score = data.score || 0;
  }
}
