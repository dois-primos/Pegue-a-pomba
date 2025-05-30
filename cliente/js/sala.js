/*global Phaser*/
/*eslint no-undef: "error"*/
export default class sala extends Phaser.Scene {
  constructor() {
    super("sala");
  }

  create() {
    this.sala = [
      { x: 200, y: 200, numero: "1" },
      { x: 300, y: 200, numero: "2" },
      { x: 400, y: 200, numero: "3" },
      { x: 500, y: 200, numero: "4" },
      { x: 600, y: 200, numero: "5" },
    ];

    this.sala.forEach((sala) => {
      sala.botao = this.add
        .text(sala.x, sala.y, sala.numero)
        .setInteractive()
        .on("pointerdown", () => {
          this.game.sala = sala.numero;
          this.game.socket.emit("entrar-na-sala", this.game.sala);
        });
    });

    globalThis.game.socket.on("jogadores", (jogadores) => {
      if (jogadores.segundo) {
        globalThis.game.jogadores = jogadores;
        this.scene.stop("sala");
        this.scene.start("fase1");
      }
    });
  }
}
