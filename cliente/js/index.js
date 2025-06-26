// index.js
import abertura from "./abertura.js";
import precarregamento from "./precarregamento.js";
import fase1 from "./fase1.js";
import fase2 from "./fase2.js";
import fase3 from "./fase3.js";
import fase4 from "./fase4.js";
import fase5 from "./fase5.js";
import gameover from "./gameover.js";
import finalfeliz from "./finalfeliz.js";
import sala from "./sala.js";

// Conecta com o servidor Socket.io (já disponível globalmente)
const socket = io();

globalThis.game = {
  jogadores: {},
  sala: null,
  socket: socket,
  // Pode adicionar outras propriedades globais aqui se quiser
};

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    precarregamento,
    abertura,
    sala,
    fase1,
    fase2,
    fase3,
    fase4,
    fase5,
    gameover,
    finalfeliz,
  ],
};

new Phaser.Game(config);
