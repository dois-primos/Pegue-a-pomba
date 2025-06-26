/*global Phaser*/
/*eslint no-undef: "error"*/

export default class sala extends Phaser.Scene {
  constructor() {
    super("sala");
  }

  create() {
    this.add.text(10, 10, "Aguardando oponente...");

    // Definir a sala e emitir evento via socket global
    //  globalThis.game.sala = 1;
    // globalThis.game.socket.emit("entrar-na-sala", globalThis.game.sala);

    this.game.sala = 1;
    this.game.socket.emit("entrar-na-sala", this.game.sala);

    // Escutar resposta do servidor para iniciar a fase
    globalThis.game.socket.on("jogadores", (jogadores) => {
      if (jogadores.segundo) {
        globalThis.game.jogadores = jogadores;
        this.scene.stop("sala");
        this.scene.start("fase1");
      }
    });
  }
}
