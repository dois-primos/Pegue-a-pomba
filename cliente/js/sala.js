/*global Phaser*/
/*eslint no-undef: "error"*/
export default class sala extends Phaser.Scene {
  constructor() {
    super("sala");
  }

  create() {
    this.add.text(10, 10, "Aguardando oponente...");

    this.game.sala = 1;
    this.game.socket.emit("entrar-na-sala", this.game.sala);

    globalThis.game.socket.on("jogadores", (jogadores) => {
      if (jogadores.segundo) {
        globalThis.game.jogadores = jogadores;
        this.scene.stop("sala");
        this.scene.start("fase1");
      }
    });
  }
}
