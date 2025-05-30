/*global Phaser*/
/*eslint no-undef: "error"*/
export default class finalfeliz extends Phaser.Scene {
  constructor() {
    super("finalfeliz");
  }

  init() {}

  preload() {
    // Carregar qualquer imagem, áudio ou outro recurso necessário
    this.load.image("final-feliz", "assets/final-feliz.png"); // Fundo para o final feliz
    this.load.audio("happyMusic", "assets/happy_music.mp3"); // Música alegre (opcional)
  }

  create() {
    this.add.image(400, 230, "final-feliz");

    // Música alegre
    this.happyMusic = this.sound.add("happyMusic");
    this.happyMusic.play({ loop: true });

    // Texto que irá permitir ao jogador voltar para o menu ou reiniciar o jogo
    this.add
      .text(250, 400, "Pressione ENTER para voltar ao menu", {
        fontSize: "32px",
        fill: "#fff",
      })
      .setInteractive()
      .on("pointerdown", () => this.voltarAoMenu()); // Voltar ao menu quando clicado
  }

  update() {}

  voltarAoMenu() {
    this.scene.start("abertura");
  }
}
