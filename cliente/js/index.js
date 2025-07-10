/*global Phaser, io*/
/*eslint no-undef: "error"*/
import config from "./config.js";
import abertura from "./abertura.js";
import precarregamento from "./precarregamento.js";
import fase from "./fase.js";
import gameover from "./gameover.js";
import finalfeliz from "./finalfeliz.js";
import sala from "./sala.js";

class Game extends Phaser.Game {
  constructor() {
    super(config);

    this.audio = document.querySelector("audio");
    this.iceServers = {
      iceServers: [
        {
          urls: "stun:feira-de-jogos.dev.br",
        },
        {
          urls: "turns:feira-de-jogos.dev.br",
          username: "adc20251",
          credential: "adc20251",
        },
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };
    this.socket = io();

    this.socket.on("connect", () => {
      console.log(`Usuário ${this.socket.id} conectado no servidor`);
    });

    this.socket.on("proxima-fase", (dados) => {
      console.log("Próxima fase recebida:", dados);
      this.scene.stop(this.cenaAtual);
      this.scene.start(dados.fase, { score: dados.score });
    });

    this.scene.add("abertura", abertura);
    this.scene.add("precarregamento", precarregamento);
    this.scene.add("sala", sala);
    this.scene.add("fase", fase);
    this.scene.add("gameover", gameover);
    this.scene.add("finalfeliz", finalfeliz);

    this.scene.start("abertura");
  }
}

window.onload = () => {
  window.game = new Game();
};
