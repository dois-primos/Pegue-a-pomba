export default class abertura extends Phaser.Scene {
  constructor() {
    super("abertura");
  }

  init() {}

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.spritesheet("botao", "assets/botao.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.add.image(400, 190, "background");

    this.anims.create({
      key: "botao",
      frames: this.anims.generateFrameNumbers("botao", { start: 0, end: 7 }),
      frameRate: 30,
    });

    // botão para iniciar o jogo

    this.botao = this.physics.add.sprite(400, 400, "botao");

    this.botao.setInteractive().on("pointerdown", () => {
      this.botao.play("botao");

      navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
          this.game.midias = stream;
        })
        .catch((error) => {
          console.error("Erro ao acessar o microfone:", error);
        });
    });

    this.botao.on("animationcomplete", () => {
      this.scene.stop();
      this.scene.start("precarregamento");
    });
  }

  update() {}
}
