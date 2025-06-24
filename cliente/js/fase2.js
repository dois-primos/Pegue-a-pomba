/*global Phaser*/
/*eslint no-undef: "error"*/

export default class fase2 extends Phaser.Scene {
  constructor() {
    super("fase2");
    this.speed = 200;
    this.score = 0;
    this.scoreRemoto = 0;
    this.tirosRestantes = 8;
    this.botaoTiroPressionado = false;
    this.maxPassaros = 6;
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

    this.load.spritesheet("queda-passaro", "assets/queda-passaro.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");

    this.anims.create({
      key: "voar-branca",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-cinza",
      frames: this.anims.generateFrameNumbers("pomba-cinza", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "queda",
      frames: this.anims.generateFrameNumbers("queda-passaro", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });

    this.passaros = this.physics.add.group();
    for (let i = 0; i < this.maxPassaros; i++) {
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
        tipoPassaro === "pomba-branca" ? "voar-branca" : "voar-cinza";
      const passaro = this.passaros.create(x, y, tipoPassaro);
      passaro.direcao = direcao;
      passaro.setVelocity(
        direcao * Phaser.Math.Between(100, 150),
        Phaser.Math.Between(-30, 30)
      );
      passaro.anims.play(animacao, true);
    }

    this.initConexao();

    this.scoreText = this.add.text(16, 16, "Pontuação: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
    });

    this.scoreRemotoText = this.add.text(560, 16, "Adversário: 0", {
      fontSize: "28px",
      fill: "#fff",
    });

    this.tirosText = this.add.text(16, 60, "Tiros: " + this.tirosRestantes, {
      fontSize: "28px",
      fill: "#fff",
    });

    // === RELOAD NA PAGINA NO BOTAO 9 DO GAMEPAD ===
    this.input.gamepad.on("down", (pad) => {
      if (pad.buttons[9].pressed) {
        window.location.reload();
      }
    });
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
    this.personagemRemoto = this.add.sprite(700, -100, "mira-remoto");
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
  }

  receberDados(event) {
    const dados = JSON.parse(event.data);
    if (dados.personagem) {
      this.personagemRemoto.x = dados.personagem.x;
      this.personagemRemoto.y = dados.personagem.y;
    }
  }

  update() {
    if (this.input.gamepad && this.input.gamepad.total > 0) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes[0].getValue();
      const axisV = pad.axes[1].getValue();
      const botaoTiro = pad.buttons[2].pressed;

      this.personagemLocal.setVelocity(this.speed * axisH, this.speed * axisV);

      if (botaoTiro && !this.botaoTiroPressionado && this.tirosRestantes > 0) {
        this.fire.play();
        this.passaros.children.entries.forEach((passaro) => {
          if (!passaro.visible || passaro.atingido) return;
          const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
            this.personagemLocal.getBounds(),
            passaro.getBounds()
          );
          if (colidiu) {
            passaro.atingido = true;
            passaro.setTexture("queda-passaro");
            passaro.setVelocity(0, 100);
            passaro.anims.play("queda", true);
            passaro.once("animationcomplete", () => {
              passaro.setVisible(false);
              passaro.atingido = false;
              passaro.setVelocity(0, 0);
            });
            this.score += 100;
            this.scoreText.setText("Pontuação: " + this.score);
          }
        });
        this.tirosRestantes--;
        this.tirosText.setText("Tiros: " + this.tirosRestantes);
        this.botaoTiroPressionado = true;
      }

      if (!botaoTiro) {
        this.botaoTiroPressionado = false;
      }

      if (this.game.dadosJogo && this.game.dadosJogo.readyState === "open") {
        this.game.dadosJogo.send(
          JSON.stringify({
            personagem: {
              x: this.personagemLocal.x,
              y: this.personagemLocal.y,
            },
          })
        );
      }
    }
  }
}
