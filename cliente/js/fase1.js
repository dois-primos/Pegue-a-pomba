/*global Phaser*/
/*eslint no-undef: "error"*/
export default class fase1 extends Phaser.Scene {
  constructor() {
    super("fase1");
    this.speed = 200;
    this.tirosRestantes = 8;
    this.passarosRestantes = 6;
    this.scoreRemoto = 0;
    this.maxPassaros = 6;
    this.totalPassarosGerados = 0;
    this.aguardandoNovaRodada = false;
  }

  init() {
    this.game.cenaAtual = "fase1";
    this.score = 0;
  }

  preload() {
    this.load.audio("fire", "assets/fire.mp3");
    this.load.image("mira", "assets/mira.png");
    this.load.image("mira-remoto", "assets/mira-remoto.png");
    this.load.image("background", "assets/background.png");
    this.load.spritesheet("pomba-branca", "assets/pomba-branca.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("pomba-cinza", "assets/pomba-cinza.png", {
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

    this.anims.create({
      key: "voar-branca-f2",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-cinza-f2",
      frames: this.anims.generateFrameNumbers("pomba-cinza", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

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

    this.initConexao();
  }

  initConexao() {
    const isPrimeiro = this.game.jogadores.primeiro === this.game.socket.id;
    const rtc = new RTCPeerConnection(this.game.iceServers);

    this.game.dadosJogo = rtc.createDataChannel("dadosJogo", {
      negotiated: true,
      id: 0,
    });
    this.game.dadosJogo.onopen = () => console.log("Canal de dados aberto");
    this.game.dadosJogo.onmessage = (event) => this.receberDados(event);

    rtc.onicecandidate = ({ candidate }) => {
      if (candidate)
        this.game.socket.emit("candidate", this.game.sala, candidate);
    };

    rtc.ontrack = ({ streams: [stream] }) => {
      this.game.audio.srcObject = stream;
    };

    if (this.game.midias) {
      this.game.midias
        .getTracks()
        .forEach((track) => rtc.addTrack(track, this.game.midias));
    }

    if (isPrimeiro) {
      this.game.remoteConnection = rtc;
      this.configurarPrimeiroJogador();
    } else {
      this.game.localConnection = rtc;
      this.configurarSegundoJogador();
    }
  }

  configurarPrimeiroJogador() {
    this.game.socket.on("offer", (description) => {
      this.game.remoteConnection
        .setRemoteDescription(description)
        .then(() => this.game.remoteConnection.createAnswer())
        .then((answer) =>
          this.game.remoteConnection.setLocalDescription(answer)
        )
        .then(() => {
          this.game.socket.emit(
            "answer",
            this.game.sala,
            this.game.remoteConnection.localDescription
          );
        });
    });

    this.game.socket.on("candidate", (candidate) => {
      this.game.remoteConnection.addIceCandidate(candidate);
    });

    this.personagemLocal = this.physics.add
      .sprite(225, 225, "mira")
      .setCollideWorldBounds(true);
    this.personagemRemoto = this.add.sprite(700, -150, "mira-remoto");
    this.iniciarContagem(() => {
      this.passaros.children.entries.forEach((passaro) => {
        passaro.setVelocity(
          Phaser.Math.Between(50, 80) * passaro.direcao,
          Phaser.Math.Between(-15, 15)
        );
        passaro.anims.play(
          passaro.direcao === 1 ? "voar-direita-f1" : "voar-esquerda-f1",
          true
        );
      });
    });
  }

  configurarSegundoJogador() {
    this.game.localConnection
      .createOffer()
      .then((offer) => this.game.localConnection.setLocalDescription(offer))
      .then(() =>
        this.game.socket.emit(
          "offer",
          this.game.sala,
          this.game.localConnection.localDescription
        )
      );

    this.game.socket.on("answer", (description) => {
      this.game.localConnection.setRemoteDescription(description);
    });

    this.game.socket.on("candidate", (candidate) => {
      this.game.localConnection.addIceCandidate(candidate);
    });

    this.personagemLocal = this.physics.add
      .sprite(700, 100, "mira")
      .setCollideWorldBounds(true);
    this.personagemRemoto = this.add.sprite(100, 100, "mira-remoto");
    this.iniciarContagem();
  }

  iniciarContagem(callback) {
    this.contador = this.add
      .text(400, 200, "5", {
        fontSize: "128px",
        fill: "#fff",
      })
      .setOrigin(0.5);

    let i = 5;
    const intervalo = setInterval(() => {
      i--;
      this.contador.setText(i.toString());

      if (i <= 0) {
        clearInterval(intervalo);
        this.contador.destroy();
        if (callback) callback();
      }
    }, 1000);
  }

  spawnPassaro() {
    if (this.totalPassarosGerados >= this.maxPassaros) return;

    const backgroundY = 190;
    const backgroundHeight = 380;
    const topLimit = backgroundY - backgroundHeight / 2;
    const bottomLimit = backgroundY + backgroundHeight / 2;

    const y = Phaser.Math.Between(topLimit + 20, bottomLimit - 20);
    const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    const x = direcao === 1 ? -50 : 850;

    const tipoPassaro =
      Phaser.Math.Between(0, 1) === 0 ? "pomba-branca" : "pomba-cinza";
    const animacao =
      tipoPassaro === "pomba-branca" ? "voar-branca-f2" : "voar-cinza-f2";

    const passaro = this.passaros.create(x, y, tipoPassaro);
    passaro.setVelocity(
      Phaser.Math.Between(100, 150) * direcao,
      Phaser.Math.Between(-80, 80)
    );
    passaro.direcao = direcao;
    passaro.setFlipX(direcao === -1);
    passaro.acertado = false;

    passaro.anims.play(animacao, true);
    this.totalPassarosGerados++;
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
          passaro.getBounds()
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
          this.score += 10;
          this.passarosRestantes--;
          this.tirosRestantes--;
          this.registry.set("score", this.score); // Atualiza pontuação no registry
          this.scoreText.setText("Pontuação: " + this.score);
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

    if (!this.aguardandoNovaRodada && this.passarosRestantes > 0) {
      this.tempoParaNovoPassaro += delta;
      if (this.tempoParaNovoPassaro > 1500) {
        this.tempoParaNovoPassaro = 0;
        if (this.passaros.countActive(true) < this.maxPassaros) {
          this.spawnPassaro();
        }
      }
    }

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

    if (
      this.passarosRestantes === 0 &&
      this.tirosRestantes >= 0 &&
      !this.aguardandoNovaRodada
    ) {
      this.aguardandoNovaRodada = true;
      this.rodadaText.setText("Fase Completa!");
      this.time.delayedCall(2000, () => {
        this.game.socket.emit("proxima-fase", {
          fase: "fase2",
          score: this.score,
        });
        this.scene.stop(this.game.cenaAtual);
        this.scene.start("fase2");
      });
    }
  }
}
