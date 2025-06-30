/*global Phaser*/
/*eslint no-undef: "error"*/
export default class fase4 extends Phaser.Scene {
  constructor() {
    super("fase4");
    this.speed = 200;
    this.score = 0;
    this.tirosRestantes = 12;
    this.passarosRestantes = 10; // Quantos precisam ser abatidos
    this.maxPassaros = 10; // Limite total de pombas geradas
    this.totalPassarosGerados = 0;
    this.aguardandoNovaRodada = false;
  }

  init() {
    this.game.cenaAtual = "fase4";
  }

  preload() {
    this.load.audio("fire", "assets/fire.mp3");
    this.load.image("mira", "assets/mira.png");
    this.load.image("background", "assets/background.png");
    this.load.spritesheet("pomba-branca", "assets/pomba-branca.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("pomba-cinza", "assets/pomba-cinza.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("corvo", "assets/corvo.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");
    this.mira = this.physics.add
      .sprite(100, 100, "mira")
      .setCollideWorldBounds(true);
    this.passaros = this.physics.add.group();
    this.tempoParaNovoPassaro = 0;

    // Criação de animações
    this.anims.create({
      key: "voar-branca-f4",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-cinza-f4",
      frames: this.anims.generateFrameNumbers("pomba-cinza", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-corvo-f4",
      frames: this.anims.generateFrameNumbers("corvo", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    // Função para gerar pássaros e corvo
    this.spawnPassaro = () => {
      if (this.totalPassarosGerados >= this.maxPassaros) return;

      const backgroundY = 190;
      const backgroundHeight = 380;
      const topLimit = backgroundY - backgroundHeight / 2;
      const bottomLimit = backgroundY + backgroundHeight / 2;

      const y = Phaser.Math.Between(topLimit + 20, bottomLimit - 20);
      const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const x = direcao === 1 ? -50 : 850;

      // Escolher aleatoriamente entre pomba branca, cinza ou corvo
      const tipoPassaro =
        Phaser.Math.Between(0, 2) === 0
          ? "pomba-branca"
          : Phaser.Math.Between(0, 1) === 0
            ? "pomba-cinza"
            : "corvo";
      const animacao =
        tipoPassaro === "pomba-branca"
          ? "voar-branca-f4"
          : tipoPassaro === "pomba-cinza"
            ? "voar-cinza-f4"
            : "voar-corvo-f4";

      const passaro = this.passaros.create(x, y, tipoPassaro);
      passaro.setVelocity(
        Phaser.Math.Between(100, 150) * direcao,
        Phaser.Math.Between(-80, 80),
      );
      passaro.direcao = direcao;
      passaro.setFlipX(direcao === -1);
      passaro.acertado = false;

      passaro.anims.play(animacao, true);
      this.totalPassarosGerados++;
    };

    // Inicialização de variáveis
    this.score = this.registry.get("score") || 0;
    this.scoreText = this.add.text(16, 16, "Pontuação: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
    });
    this.tirosText = this.add.text(16, 60, "Tiros: " + this.tirosRestantes, {
      fontSize: "28px",
      fill: "#fff",
    });
    this.rodadaText = this.add
      .text(400, 300, "", { fontSize: "40px", fill: "#ffff00" })
      .setOrigin(0.5)
      .setDepth(1);

    // Função para atualizar pontuação
    this.atualizarPontuacao = (valor) => {
      this.score += valor;
      this.registry.set("score", this.score);
      this.scoreText.setText("Pontuação: " + this.score);
    };

    // Controle de gamepad (sem alterações)
    this.input.gamepad.once("connected", (pad) => {
      this.gamepad = pad;
      pad.on("down", (index) => {
        if (index === 9) {
          this.scene.stop();
          this.scene.start("abertura");
        }
      });
    });
  }

  update(time, delta) {
    if (this.input.gamepad.total > 0 && !this.aguardandoNovaRodada) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes[0].getValue();
      const axisV = pad.axes[1].getValue();
      const botaoTiro = pad.buttons[2].pressed;

      this.mira.setVelocity(this.speed * axisH, this.speed * axisV);

      this.passaros.getChildren().forEach((passaro) => {
        const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
          this.mira.getBounds(),
          passaro.getBounds(),
        );

        if (
          colidiu &&
          botaoTiro &&
          !this.ultimoTiro &&
          !passaro.acertado &&
          this.tirosRestantes > 0
        ) {
          passaro.acertado = true;
          passaro.destroy();
          this.fire.play();
          if (passaro.texture.key === "corvo") {
            this.atualizarPontuacao(-5); // Perde pontos ao acertar o corvo
          } else {
            this.atualizarPontuacao(10); // Pontuação normal para as pombas
          }
          this.passarosRestantes--;
          this.tirosRestantes--;
          this.tirosText.setText("Tiros: " + this.tirosRestantes);
          this.ultimoTiro = true;
        }
      });

      if (botaoTiro && !this.ultimoTiro && this.tirosRestantes > 0) {
        this.fire.play();
        this.tirosRestantes--;
        this.tirosText.setText("Tiros: " + this.tirosRestantes);
        this.ultimoTiro = true;
      }

      if (!botaoTiro) this.ultimoTiro = false;
    }

    // Limite no número de pássaros em tela
    if (!this.aguardandoNovaRodada && this.passarosRestantes > 0) {
      this.tempoParaNovoPassaro += delta;
      if (this.tempoParaNovoPassaro > 1500) {
        this.tempoParaNovoPassaro = 0;
        if (this.passaros.countActive(true) < this.maxPassaros) {
          this.spawnPassaro();
        }
      }
    }

    // Remove os pássaros que saem da tela e reduz o contador
    this.passaros.getChildren().forEach((passaro) => {
      if (
        passaro.x < -60 ||
        passaro.x > 860 ||
        passaro.y < -60 ||
        passaro.y > 600
      ) {
        if (!passaro.acertado) {
          this.passarosRestantes--;
        }
        passaro.destroy();
      }
    });

    // Verifica fim da fase
    if (
      this.passarosRestantes === 0 &&
      this.tirosRestantes >= 0 &&
      !this.aguardandoNovaRodada
    ) {
      this.aguardandoNovaRodada = true;
      this.rodadaText.setText("Fase Completa!");
      this.time.delayedCall(2000, () => {
        this.irParaFase5();
      });
    }
  }

  irParaFase5() {
    this.scene.stop("fase4");
    this.scene.start("fase5");
  }
}
