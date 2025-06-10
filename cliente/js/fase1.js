/*global Phaser*/
/*eslint no-undef: "error"*/

export default class fase1 extends Phaser.Scene {
  constructor() {
    super("fase1");
    this.speed = 200;
    this.score = 0;
    this.scoreRemoto = 0;
    this.tirosRestantes = 6;
    this.botaoTiroPressionado = false;
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

    this.load.spritesheet(
      "pomba-branca-caindo",
      "assets/pomba-branca-caindo.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    this.load.spritesheet(
      "pomba-branca-caindo",
      "assets/pomba-branca-caindo.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );
  }

  create() {
    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");

    this.anims.create({
      key: "voar",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "impacto",
      frames: this.anims.generateFrameNumbers("pomba-branca-caindo", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
    });

    this.anims.create({
      key: "queda",
      frames: this.anims.generateFrameNumbers("pomba-branca-caindo", {
        start: 0,
        end: 11,
      }),
      frameRate: 12,
      repeat: 0,
    });

    this.passaros = this.physics.add.group();
    for (let i = 0; i < 15; i++) {
      const backgroundY = 190;
      const backgroundHeight = 380;
      const topLimit = backgroundY - backgroundHeight / 2;
      const bottomLimit = backgroundY + backgroundHeight / 2;

      const y = Phaser.Math.Between(topLimit + 20, bottomLimit - 20);
      const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const x = direcao === 1 ? -50 : 850;

      const passaro = this.passaros.create(x, y, "pomba-branca");
      passaro.direcao = direcao;
      passaro.anims.play("voar", true);
    }

    // Conexão WebRTC
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
        this.game.midias.getTracks().forEach((track) => {
          this.game.remoteConnection.addTrack(track, this.game.midias);
        });
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

      this.personagemLocal = this.physics.add
        .sprite(100, 100, "mira")
        .setCollideWorldBounds(true);
      this.personagemRemoto = this.add.sprite(700, 100, "mira-remoto");

      this.contador = this.add.text(400, 200, "5", {
        fontSize: "128px",
        fill: "#fff",
      });

      let i = 5;
      let inicio = setInterval(() => {
        i--;
        this.contador.setText(i.toString());

        if (i <= 0) {
          clearInterval(inicio);
          this.contador.destroy();

          this.passaros.children.entries.forEach((passaro) => {
            passaro.setVelocity(
              Phaser.Math.Between(10, 15) * passaro.direcao,
              Phaser.Math.Between(-8, 8)
            );
            passaro.setFlipX(passaro.direcao === -1);
          });
        }
      }, 1000);
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
        this.game.midias.getTracks().forEach((track) => {
          this.game.localConnection.addTrack(track, this.game.midias);
        });
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

      this.personagemLocal = this.physics.add
        .sprite(700, 100, "mira")
        .setCollideWorldBounds(true);
      this.personagemRemoto = this.add.sprite(100, 100, "mira-remoto");

      this.contador = this.add.text(400, 200, "5", {
        fontSize: "128px",
        fill: "#fff",
      });

      let i = 5;
      let inicio = setInterval(() => {
        i--;
        this.contador.setText(i.toString());

        if (i <= 0) {
          clearInterval(inicio);
          this.contador.destroy();
        }
      }, 1000);
    }

    this.game.dadosJogo.onopen = () => {
      console.log("Conexão de dados aberta");
    };

    this.game.dadosJogo.onmessage = (event) => {
      const dados = JSON.parse(event.data);

      if (dados.personagem) {
        this.personagemRemoto.x = dados.personagem.x;
        this.personagemRemoto.y = dados.personagem.y;
      }

      if (dados.passaros) {
        dados.passaros.forEach((passaro, i) => {
          const p = this.passaros.children.entries[i];
          if (p) {
            p.x = passaro.x;
            p.y = passaro.y;
            p.setVisible(passaro.visible);
          }
        });
      }

      if (dados.passaroAtingido) {
        const p = this.passaros.children.entries[dados.passaroAtingido];
        if (p) {
          p.setVisible(false);
        }
      }

      if (dados.novoScore) {
        this.scoreRemoto = dados.novoScore;
        this.scoreRemotoText.setText("Adversário: " + this.scoreRemoto);
      }
    };

    const scoreAnterior = this.registry.get("score") || 0;
    this.score = scoreAnterior;

    this.scoreText = this.add.text(16, 16, "Pontuação: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
    });

    this.scoreRemotoText = this.add.text(16, 60, "Adversário: 0", {
      fontSize: "28px",
      fill: "#fff",
    });

    this.tirosText = this.add.text(16, 100, "Tiros: 6", {
      fontSize: "28px",
      fill: "#fff",
    });

    this.input.gamepad.on("down", (pad) => {
      if (pad.buttons[9].pressed) {
        window.location.reload();
      }
    });
  }

  update() {
    try {
      if (this.game.dadosJogo.readyState === "open") {
        if (this.personagemLocal) {
          this.game.dadosJogo.send(
            JSON.stringify({
              personagem: {
                x: this.personagemLocal.x,
                y: this.personagemLocal.y,
              },
            })
          );
        }

        if (
          this.passaros &&
          this.game.jogadores.primeiro === this.game.socket.id
        ) {
          this.game.dadosJogo.send(
            JSON.stringify({
              passaros: this.passaros.children.entries.map((p) => ({
                x: p.x,
                y: p.y,
                visible: p.visible,
              })),
            })
          );
        }
      }
    } catch (error) {
      // Silenciar erros de conexão
      console.error("Erro ao enviar dados:", error);
    }

    if (this.input.gamepad) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes[0].getValue();
      const axisV = pad.axes[1].getValue();
      const botaoTiro = pad.buttons[2].pressed;
      this.personagemLocal.setVelocity(this.speed * axisH, this.speed * axisV);

      if (botaoTiro && !this.botaoTiroPressionado && this.tirosRestantes > 0) {
        this.botaoTiroPressionado = true;
        this.fire.play();
        this.tirosRestantes--;
        this.tirosText.setText("Tiros: " + this.tirosRestantes);
      }

      if (!botaoTiro && this.botaoTiroPressionado) {
        this.botaoTiroPressionado = false;
      }

      this.passaros.children.entries.forEach((passaro, i) => {
        const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
          this.personagemLocal.getBounds(),
          passaro.getBounds()
        );

        if (
          colidiu &&
          botaoTiro &&
          !this.botaoTiroPressionado &&
          this.tirosRestantes > 0 &&
          passaro.visible
        ) {
          // Para o movimento do pássaro
          passaro.setVelocity(0, 0);

          // Toca a animação de queda
          passaro.anims.play("queda", true);

          // Faz o pássaro cair com velocidade para baixo
          passaro.setVelocityY(100);

          // Após a animação completa, remove o pássaro
          passaro.once("animationcomplete", () => {
            passaro.setVisible(false);
          });

          this.score += 100;
          this.scoreText.setText("Pontuação: " + this.score);

          if (this.game.dadosJogo.readyState === "open") {
            this.game.dadosJogo.send(
              JSON.stringify({
                passaroAtingido: i,
                novoScore: this.score,
              })
            );
          }
        }
      });
    }
  }
}
