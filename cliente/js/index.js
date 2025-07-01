/*global Phaser, io*/
/*eslint no-undef: "error"*/
import config from "./config.js";
import abertura from "./abertura.js";
import precarregamento from "./precarregamento.js";
import fase1 from "./fase1.js";
import fase2 from "./fase2.js";
//import fase3 from "./fase3.js";
//import fase4 from "./fase4.js";
//import fase5 from "./fase5.js";
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
    this.scene.add("fase1", fase1);
    this.scene.add("fase2", fase2);
    this.scene.add("gameover", gameover);
    this.scene.add("finalfeliz", finalfeliz);

    this.scene.start("abertura");
  }
}

window.onload = () => {
  window.game = new Game();
};
