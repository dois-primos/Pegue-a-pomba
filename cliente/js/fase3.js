// import axios from "axios"; // Certifique-se que axios está disponível

/*global Phaser*/
/*eslint no-undef: "error"*/
export default class fase3 extends Phaser.Scene {
  constructor() {
    super("fase3");
    this.speed = 200;
    this.score = 0;
    this.scoreRemoto = 0;
    this.tirosRestantes = 10;
    this.passarosRestantes = 8;
    this.maxPassaros = 8;
    this.totalPassarosGerados = 0;
    this.aguardandoNovaRodada = false;
    this.botaoTiroPressionado = false;
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
  }

  create() {
    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");
    this.mira = this.physics.add
      .sprite(100, 100, "mira")
      .setCollideWorldBounds(true);
    this.passaros = this.physics.add.group();
    this.tempoParaNovoPassaro = 0;

    this.personagemLocal = this.mira;
    this.personagemRemoto = this.add.sprite(0, 0, "mira").setAlpha(0.5);
    this.personagemRemoto.visible = false;

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

    this.spawnPassaro = () => {
      if (this.totalPassarosGerados >= this.maxPassaros) return;

      const y = Phaser.Math.Between(100, 280);
      const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const x = direcao === 1 ? -50 : 850;
      const tipoPassaro =
        Phaser.Math.Between(0, 1) === 0 ? "pomba-branca" : "pomba-cinza";
      const animacao =
        tipoPassaro === "pomba-branca" ? "voar-branca" : "voar-cinza";

      const passaro = this.passaros.create(x, y, tipoPassaro);
      passaro.setVelocity(
        Phaser.Math.Between(100, 150) * direcao,
        Phaser.Math.Between(-80, 80)
      );
      passaro.setFlipX(direcao === -1);
      passaro.acertado = false;
      passaro.anims.play(animacao, true);

      this.totalPassarosGerados++;
    };

    this.score = this.registry.get("score") || 0;
    this.scoreText = this.add.text(16, 16, "Pontuação: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
    });
    this.scoreRemotoText = this.add.text(
      16,
      50,
      "Inimigo: " + this.scoreRemoto,
      { fontSize: "28px", fill: "#fff" }
    );
    this.tirosText = this.add.text(16, 84, "Tiros: " + this.tirosRestantes, {
      fontSize: "28px",
      fill: "#fff",
    });
    this.rodadaText = this.add
      .text(400, 300, "", { fontSize: "40px", fill: "#ffff00" })
      .setOrigin(0.5)
      .setDepth(1);

    // === INTEGRAÇÃO GOOGLE IDENTITY API ===
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
                product: 42,
                value: 250,
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

    // === RELOAD NA PAGINA NO BOTAO 9 DO GAMEPAD ===
    this.input.gamepad.once("connected", (pad) => {
      this.gamepad = pad;
      pad.on("down", (index) => {
        if (index === 9) {
          window.location.reload();
        }
      });
    });

    this.atualizarPontuacao = (valor) => {
      this.score += valor;
      this.registry.set("score", this.score);
      this.scoreText.setText("Pontuação: " + this.score);
    };

    this.game.dadosJogo.onmessage = ({ data }) => {
      const mensagem = JSON.parse(data);
      if (mensagem.personagem) {
        this.personagemRemoto.visible = true;
        this.personagemRemoto.x = mensagem.personagem.x;
        this.personagemRemoto.y = mensagem.personagem.y;
      }
      if (mensagem.score) {
        this.scoreRemoto = mensagem.score;
        this.scoreRemotoText.setText("Inimigo: " + this.scoreRemoto);
      }
    };
  }

  update(time, delta) {
    try {
      if (this.game.dadosJogo.readyState === "open") {
        if (this.personagemLocal) {
          this.game.dadosJogo.send(
            JSON.stringify({
              personagem: {
                x: this.personagemLocal.x,
                y: this.personagemLocal.y,
              },
              score: this.score,
            })
          );
        }
      }

      if (
        this.passaros &&
        this.game.jogadores.primeiro === this.game.socket.id
      ) {
        this.tempoParaNovoPassaro += delta;
        if (this.tempoParaNovoPassaro > 1500) {
          this.tempoParaNovoPassaro = 0;
          if (this.passaros.countActive(true) < this.maxPassaros) {
            this.spawnPassaro();
          }
        }
      }

      if (this.input.gamepad.total > 0) {
        const pad = this.input.gamepad.getPad(0);
        const eixoX = pad.axes[0].getValue();
        const eixoY = pad.axes[1].getValue();
        const botaoTiro = pad.buttons[2].pressed;

        this.mira.setVelocity(this.speed * eixoX, this.speed * eixoY);

        if (
          botaoTiro &&
          !this.botaoTiroPressionado &&
          this.tirosRestantes > 0
        ) {
          this.fire.play();
          this.tirosRestantes--;
          this.tirosText.setText("Tiros: " + this.tirosRestantes);

          this.passaros.getChildren().forEach((passaro) => {
            if (
              !passaro.acertado &&
              Phaser.Geom.Intersects.RectangleToRectangle(
                this.mira.getBounds(),
                passaro.getBounds()
              )
            ) {
              passaro.acertado = true;
              passaro.destroy();
              this.atualizarPontuacao(10);
              this.passarosRestantes--;
            }
          });
        }

        this.botaoTiroPressionado = botaoTiro;
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
          this.irParaFase4();
        });
      }
    } catch (erro) {
      console.error("Erro no update:", erro);
    }
  }

  irParaFase4() {
    this.scene.stop("fase3");
    this.scene.start("fase4");
  }
}
