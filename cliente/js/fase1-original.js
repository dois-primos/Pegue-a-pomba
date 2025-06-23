export default class fase1 extends Phaser.Scene {
  constructor() {
    super("fase1");
    this.speed = 200;
    this.score = 0;
    this.tirosRestantes = 6;
    this.passarosRestantes = 4;
    this.maxPassaros = 4;
    this.totalPassarosGerados = 0;
    this.aguardandoNovaRodada = false;
  }

  preload() {
    this.load.audio("fire", "assets/fire.mp3");
    this.load.image("mira", "assets/mira.png");
    this.load.image("background", "assets/background.png");

    this.load.spritesheet("pomba-branca", "assets/pomba-branca.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("impacto-passaro", "assets/impacto-passaro.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("queda-passaro", "assets/queda-passaro.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    globalThis.google.accounts.id.initialize({
      client_id:
        "331191695151-ku8mdhd76pc2k36itas8lm722krn0u64.apps.googleusercontent.com",
      callback: (res) => {
        if (res.error) {
          console.error(res.error);
        } else {
          axios
            .post(
              "https://feira-de-jogos.dev.br/api/v2/credit",
              {
                product: 42, // id do jogo cadastrado no banco de dados da Feira de Jogos
                value: 250, // crédito em tijolinhos
              },
              {
                headers: {
                  Authorization: `Bearer ${res.credential}`,
                },
              }
            )
            .then((response) => {
              console.log("Crédito adicionado com sucesso:", response.data);
            })
            .catch((error) => {
              console.error("Erro ao adicionar crédito:", error);
            });
        }
      },
      context: "https://feira-de-jogos.dev.br",
    });
    globalThis.google.accounts.id.prompt();
    this.game.socket.emit("entrar-na-sala", this.game.sala);
    this.game.socket.on("jogadores", (jogadores) => {
      this.game.jogadores = jogadores;
      if (jogadores.segundo) {
        this.scene.stop("sala");
        this.scene.start("fase1");
      }
    });

    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");
    this.mira = this.physics.add
      .sprite(100, 100, "mira")
      .setCollideWorldBounds(true);
    this.passaros = this.physics.add.group();
    this.tempoParaNovoPassaro = 0;

    this.anims.create({
      key: "voar",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "impacto",
      frames: this.anims.generateFrameNumbers("impacto-passaro", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
    });

    this.anims.create({
      key: "queda",
      frames: this.anims.generateFrameNumbers("queda-passaro", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
    });

    if (this.game.jogadores.primeiro === this.game.socket.id) {
      this.game.remoteConnection = new RTCPeerConnection(this.game.iceServers);
      this.game.dadosJogo = this.game.remoteConnection.createDataChannel(
        "dadosJogo",
        { negotiated: true, id: 0 }
      );

      this.game.remoteConnection.onicecandidate = ({ candidate }) => {
        candidate &&
          this.game.socket.emit("candidate", this.game.sala, candidate);
      };

      this.game.remoteConnection.ontrack = ({ streams: [stream] }) => {
        this.game.audio.srcObject = stream;
      };

      if (this.game.midias) {
        this.game.midias
          .getTracks()
          .forEach((track) =>
            this.game.remoteConnection.addTrack(track, this.game.midias)
          );
      }

      this.game.socket.on("offer", (description) => {
        this.game.remoteConnection
          .setRemoteDescription(description)
          .then(() => this.game.remoteConnection.createAnswer())
          .then((answer) =>
            this.game.remoteConnection.setLocalDescription(answer)
          )
          .then(() =>
            this.game.socket.emit(
              "answer",
              this.game.sala,
              this.game.remoteConnection.localDescription
            )
          );
      });

      this.game.socket.on("candidate", (candidate) => {
        this.game.remoteConnection.addIceCandidate(candidate);
      });

      this.personagemLocal = this.physics.add.sprite(100, 100, "mira");
      this.personagemRemoto = this.add.sprite(100, 150, "mira");
    } else if (this.game.jogadores.segundo === this.game.socket.id) {
      this.game.localConnection = new RTCPeerConnection(this.game.iceServers);
      this.game.dadosJogo = this.game.localConnection.createDataChannel(
        "dadosJogo",
        {
          negotiated: true,
          id: 0,
        }
      );

      this.game.localConnection.onicecandidate = ({ candidate }) => {
        this.game.socket.emit("candidate", this.game.sala, candidate);
      };

      this.game.localConnection.ontrack = ({ streams: [stream] }) => {
        this.game.audio.srcObject = stream;
      };

      if (this.game.midias) {
        this.game.midias
          .getTracks()
          .forEach((track) =>
            this.game.localConnection.addTrack(track, this.game.midias)
          );
      }

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

      this.personagemLocal = this.physics.add.sprite(100, 100, "mira");
      this.personagemRemoto = this.add.sprite(100, 150, "mira");
    }

    this.game.dadosJogo.onopen = () => {
      console.log("Conexão de dados aberta");
    };
    this.game.dadosJogo.onmessage = (event) => {
      const dados = JSON.parse(event.data);
      if (dados.persongem) {
        this.personagemRemoto.X = dados.personagem.x;
        this.personagemRemoto.Y = dados.personagem.y;
        this.personagemRemoto.setFrame(dados.personagem.frame);
      }
    };

    const scoreAnterior = this.registry.get("score") || 0;
    this.score = scoreAnterior;

    this.scoreText = this.add.text(16, 16, "Pontuação: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
    });
    this.tirosText = this.add.text(16, 60, "Tiros: 6", {
      fontSize: "28px",
      fill: "#fff",
    });
    this.rodadaText = this.add
      .text(400, 300, "", { fontSize: "40px", fill: "#ffff00" })
      .setOrigin(0.5)
      .setDepth(1);

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
    if (
      this.input.gamepad &&
      this.input.gamepad.total > 0 &&
      !this.aguardandoNovaRodada
    ) {
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
          passaro.setVelocity(0, 0);
          passaro.anims.play("impacto");

          passaro.once("animationcomplete", () => {
            passaro.setVelocity(0, 100);
            passaro.anims.play("queda");

            passaro.once("animationcomplete", () => {
              passaro.destroy();
            });
          });

          this.score += 10;
          this.passarosRestantes--;
          this.tirosRestantes--;
          this.registry.set("score", this.score);
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
        this.irParaFase2();
      });
    }

    try {
      if (this.game.dadosJogo.readyState === "open") {
        if (this.personagemLocal) {
          this.game.dadosJogo.send(
            JSON.stringify({
              personagem: {
                x: this.personagemLocal.x,
                y: this.personagemLocal.y,
                frame: this.personagemLocal.frame.name,
              },
            })
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  spawnPassaro = () => {
    if (this.totalPassarosGerados >= this.maxPassaros) return;

    const backgroundY = 190;
    const backgroundHeight = 380;
    const topLimit = backgroundY - backgroundHeight / 2;
    const bottomLimit = backgroundY + backgroundHeight / 2;

    const y = Phaser.Math.Between(topLimit + 20, bottomLimit - 20);
    const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    const x = direcao === 1 ? -50 : 850;

    const passaro = this.passaros.create(x, y, "pomba-branca");
    passaro.setVelocity(
      Phaser.Math.Between(100, 150) * direcao,
      Phaser.Math.Between(-80, 80)
    );
    passaro.direcao = direcao;
    passaro.setFlipX(direcao === -1);
    passaro.acertado = false;

    passaro.anims.play("voar", true);
    this.totalPassarosGerados++;
  };

  irParaFase2() {
    this.scene.stop("fase1");
    this.scene.start("fase2");
  }
}
