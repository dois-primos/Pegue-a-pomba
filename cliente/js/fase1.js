/*global Phaser*/
/*eslint no-undef: "error"*/
export default class fase1 extends Phaser.Scene {
  constructor() {
    super("fase1");
    this.speed = 200;
    this.score = 0;
    this.tirosRestantes = 6;
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
    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");

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

      this.passaros.children.entries.forEach((passaro) => {
        passaro.setVelocity(
          Phaser.Math.Between(100, 150) * passaro.direcao,
          Phaser.Math.Between(-80, 80)
        );
        passaro.setFlipX(passaro.direcao === -1);
        ("");
      });

      this.personagemLocal = this.physics.add
        .sprite(100, 100, "mira")
        .setCollideWorldBounds(true);
      this.personagemRemoto = this.add.sprite(700, 100, "mira-remoto");
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

      this.personagemLocal = this.physics.add
        .sprite(700, 100, "mira")
        .setCollideWorldBounds(true);
      this.personagemRemoto = this.add.sprite(100, 100, "mira-remoto");
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
          if (this.passaros.children.entries[i]) {
            this.passaros.children.entries[i].x = passaro.x;
            this.passaros.children.entries[i].y = passaro.y;
            if (!passaro.visible) {
              this.passaros.children.entries[i].setVisible(false);
              // recriar o pássaro
            }
          }
        });
      }

      if (dados.passaroAtingido) {
        this.passaros.children.entries[dados.passaroAtingido].setVisible(false);
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

    this.input.gamepad.on("down", (pad) => {
      if (pad.buttons[9].pressed) {
        this.scene.stop();
        this.scene.start("abertura");
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
              passaros: this.passaros.children.entries.map((passaro) =>
                ((passaro) => ({
                  x: passaro.x,
                  y: passaro.y,
                  visible: passaro.visible,
                }))(passaro)
              ),
            })
          );
        }
      }
    } catch (error) {
      // console.error(error);
    }

    if (
      this.input.gamepad &&
      this.input.gamepad.total > 0 &&
      !this.aguardandoNovaRodada
    ) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes[0].getValue();
      const axisV = pad.axes[1].getValue();
      const botaoTiro = pad.buttons[2].pressed;

      if (this.personagemLocal)
        this.personagemLocal.setVelocity(
          this.speed * axisH,
          this.speed * axisV
        );

      this.passaros.getChildren().forEach((passaro, i) => {
        const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
          this.personagemLocal.getBounds(),
          passaro.getBounds()
        );

        if (colidiu && botaoTiro) {
          passaro.setVisible(false);
          this.game.dadosJogo.send(
            JSON.stringify({
              passaroAtingido: i,
            })
          );
        }
      });
    }
  }
}
