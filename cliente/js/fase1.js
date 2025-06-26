/*global Phaser*/
/*eslint no-undef: "error"*/

export default class fase1 extends Phaser.Scene {
  constructor() {
    super("fase1");
    this.speed = 200;
    this.score = 0;
    this.scoreRemoto = 0;
    this.tirosRestantes = 20;
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
  }

  create() {
    // Entra na sala e espera evento com dados dos jogadores antes de iniciar
    this.passaros = this.physics.add.group();
    this.cenaIniciada = false;
    
    globalThis.game.socket.emit("entrar-na-sala", this.game.sala);

    globalThis.game.socket.once("jogadores", (jogadores) => {
      this.game.jogadores = jogadores;

      if (jogadores.segundo) {
        this.initConexao();
        this.setupScene();
      }
    });
  }

  setupScene () {
    
    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");
    this.cenaIniciada = true;

    // Criação das animações (repita como no seu código original)
    this.anims.create({
      key: "voar-direita-pomba-branca-f1",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-esquerda-pomba-branca-f1",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 6,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "queda",
      frames: this.anims.generateFrameNumbers("pomba-branca-caindo", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });

  
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
    }

    // Textos da UI
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

    // Gamepad reload button
    this.input.gamepad.on("down", (pad) => {
      if (pad.buttons[9].pressed) {
        window.location.reload();
      }
    });
  }

  initConexao() {
    const isPrimeiro =
      this.game.jogadores.primeiro === globalThis.game.socket.id;

    const rtc = new RTCPeerConnection(this.game.iceServers || {});

    this.game.dadosJogo = rtc.createDataChannel("dadosJogo", {
      negotiated: true,
      id: 0,
    });

    this.game.dadosJogo.onopen = () => console.log("Canal de dados aberto");
    this.game.dadosJogo.onmessage = (event) => this.receberDados(event);

    rtc.onicecandidate = ({ candidate }) => {
      if (candidate)
        globalThis.game.socket.emit("candidate", this.game.sala, candidate);
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

  async configurarPrimeiroJogador() {
    globalThis.game.socket.off("offer"); // Remove listeners anteriores para evitar duplicação
    globalThis.game.socket.on("offer", async (description) => {
      try {
        if (!this.game.remoteConnection) return;

        await this.game.remoteConnection.setRemoteDescription(description);

        const state = this.game.remoteConnection.signalingState;
        if (state !== "have-remote-offer" && state !== "stable") {
          console.warn("Estado inesperado para criar answer:", state);
          return;
        }

        const answer = await this.game.remoteConnection.createAnswer();
        await this.game.remoteConnection.setLocalDescription(answer);

        globalThis.game.socket.emit(
          "answer",
          this.game.sala,
          this.game.remoteConnection.localDescription
        );
      } catch (error) {
        console.error("Erro no fluxo offer/answer:", error);
      }
    });

    globalThis.game.socket.off("candidate");
    globalThis.game.socket.on("candidate", (candidate) => {
      if (this.game.remoteConnection && candidate) {
        this.game.remoteConnection.addIceCandidate(candidate).catch((e) => {
          console.error("Erro ao adicionar ICE candidate:", e);
        });
      }
    });

    this.personagemLocal = this.physics.add
      .sprite(225, 225, "mira")
      .setCollideWorldBounds(true);
    this.personagemRemoto = this.add.sprite(700, -100, "mira-remoto");

    this.iniciarContagem(() => {
      this.passaros.children.entries.forEach((passaro) => {
        passaro.setVelocity(
          Phaser.Math.Between(50, 80) * passaro.direcao,
          Phaser.Math.Between(-15, 15)
        );
        passaro.anims.play(
          passaro.direcao === 1
            ? "voar-direita-pomba-branca-f1"
            : "voar-esquerda-pomba-branca-f1",
          true
        );
      });
    });
  }

  configurarSegundoJogador() {
    globalThis.game.socket.off("answer");
    globalThis.game.socket.off("candidate");

    this.game.localConnection
      .createOffer()
      .then((offer) => this.game.localConnection.setLocalDescription(offer))
      .then(() =>
        globalThis.game.socket.emit(
          "offer",
          this.game.sala,
          this.game.localConnection.localDescription
        )
      );

    globalThis.game.socket.on("answer", (description) => {
      this.game.localConnection.setRemoteDescription(description);
    });

    globalThis.game.socket.on("candidate", (candidate) => {
      this.game.localConnection.addIceCandidate(candidate).catch((e) => {
        console.error("Erro ao adicionar ICE candidate no segundo jogador:", e);
      });
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

  receberDados(event) {
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
          p.setTexture(passaro.texture);
          p.setFrame(passaro.frame);
          p.setVisible(passaro.visible);
        }
      });
    }

    if (dados.passaroAtingido !== undefined) {
      const p = this.passaros.children.entries[dados.passaroAtingido];
      if (p && globalThis.game.socket.id === this.game.jogadores.primeiro) {
        p.setVelocity(0, 0);
        p.setTexture("pomba-branca-caindo");
        p.anims.play("queda", true);
        p.setVelocityY(100);
        p.once("animationcomplete", () => {
          p.setVisible(false);
        });
      }
    }

    if (dados.novoScore !== undefined) {
      this.scoreRemoto = dados.novoScore;
      this.scoreRemotoText.setText("Adversário: " + this.scoreRemoto);
    }
  }

  update () {
    
    if (!this.cenaIniciada || !this.passaros) return;
    try {
      // Só envia dados se o canal de dados estiver aberto
      if (this.game.dadosJogo && this.game.dadosJogo.readyState === "open") {
        if (this.personagemLocal) {
          // Envia posição do personagem local
          this.game.dadosJogo.send(
            JSON.stringify({
              personagem: {
                x: this.personagemLocal.x,
                y: this.personagemLocal.y,
              },
            })
          );
        }

        // Só o jogador 1 envia a posição dos pássaros
        if (
          this.passaros &&
          this.game.jogadores.primeiro === globalThis.game.socket.id
        ) {
          this.game.dadosJogo.send(
            JSON.stringify({
              passaros: this.passaros.children.entries.map((p) => ({
                x: p.x,
                y: p.y,
                texture: p.texture.key,
                frame: p.frame.index,
                visible: p.visible,
              })),
            })
          );
        }
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
    }

    // Lógica dos pássaros só para o jogador 1
    if (
      this.game.jogadores &&
      this.game.jogadores.primeiro === globalThis.game.socket.id
    ) {
      const backgroundY = 190;
      const backgroundHeight = 380;
      const topLimit = backgroundY - backgroundHeight / 2;
      const bottomLimit = backgroundY + backgroundHeight / 2;

      this.passaros.children.entries.forEach((passaro) => {
        // Ignora pássaros atingidos ou invisíveis para não interferir
        if (!passaro.visible || passaro.atingido) return;

        // Inverter direção horizontal se sair da tela
        if (passaro.x < -50 || passaro.x > 850) {
          passaro.direcao *= -1;
          passaro.setVelocityX(passaro.direcao * Phaser.Math.Between(100, 150));
          passaro.anims.play(
            passaro.direcao === 1
              ? "voar-direita-pomba-branca-f1"
              : "voar-esquerda-pomba-branca-f1",
            true
          );
        }

        // Rebater verticalmente se bater nos limites do fundo
        if (passaro.y < topLimit || passaro.y > bottomLimit) {
          passaro.setVelocityY(-passaro.body.velocity.y);
        }
      });
    }

    // CONTROLE DO GAMEPAD para o jogador local
    if (this.input.gamepad && this.input.gamepad.total > 0) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
      const axisV = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
      const botaoTiro = pad.buttons[2].pressed;

      this.personagemLocal.setVelocity(this.speed * axisH, this.speed * axisV);

      if (botaoTiro && !this.botaoTiroPressionado && this.tirosRestantes > 0) {
        this.fire.play(); // Som do tiro

        let acertou = false;

        this.passaros.children.entries.forEach((passaro, i) => {
          if (!passaro.visible || passaro.atingido) return; // Ignora pássaros já atingidos

          const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
            this.personagemLocal.getBounds(),
            passaro.getBounds()
          );

          if (colidiu && !acertou) {
            acertou = true;
            passaro.atingido = true; // Marca como atingido para bloquear movimento

            this.score += 100;
            this.scoreText.setText("Pontuação: " + this.score);

            if (globalThis.game.socket.id === this.game.jogadores.primeiro) {
              passaro.setTexture("pomba-branca-caindo"); // Troca o spritesheet
              passaro.setVelocityX(0);
              passaro.setVelocityY(100); // Faz cair para baixo
              passaro.anims.play("queda", true);

              passaro.once("animationcomplete", () => {
                console.log("Animação de queda concluída");
                passaro.setVisible(false);
                passaro.atingido = false; // Opcional, caso queira resetar futuramente
                passaro.setVelocity(0, 0);
              });
            }

            // Envia mensagem para o outro jogador
            if (
              this.game.dadosJogo &&
              this.game.dadosJogo.readyState === "open"
            ) {
              this.game.dadosJogo.send(
                JSON.stringify({
                  passaroAtingido: i,
                  novoScore: this.score,
                })
              );
            }
          }
        });

        if (acertou) {
          this.game.registry.set("score", this.score);
        }

        this.tirosRestantes--;
        this.tirosText.setText("Tiros: " + this.tirosRestantes);
        this.botaoTiroPressionado = true;
      }

      // Reset do botão de tiro quando soltar
      if (!botaoTiro) {
        this.botaoTiroPressionado = false;
      }
    }
  }
}
