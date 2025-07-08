/*global Phaser*/
/*eslint no-undef: "error"*/

export default class sala extends Phaser.Scene {
  constructor() {
    super("sala");
  }

  init() {
    this.game.cenaAtual = "sala";
  }

  create() {
    this.add.text(10, 10, "Aguardando oponente...");

    this.game.sala = 1;
    this.game.socket.emit("entrar-na-sala", globalThis.game.sala);

    // Escutar resposta do servidor para iniciar a fase
    this.game.socket.on("jogadores", (jogadores) => {
      if (jogadores.segundo) {
        this.game.jogadores = jogadores;
        this.scene.stop("sala");
        this.scene.start("fase5");
      }
    });
  }
}
