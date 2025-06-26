/*global Phaser*/
/*eslint no-undef: "error"*/
export default class fase4 extends Phaser.Scene {
  constructor() {
    super("fase4");
    this.speed = 200;
    this.score = 0;
    this.tirosRestantes = 12;
    this.passarosRestantes = 10;
    this.maxPassaros = 10;
    this.totalPassarosGerados = 0;
    this.aguardandoNovaRodada = false;
    this.botaoTiroPressionado = false;
    this.authInstance = null; // Para Google Identity API
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
    // Background e sons
    this.add.image(400, 190, "background");
    this.fire = this.sound.add("fire");

    // Grupo de pássaros
    this.passaros = this.physics.add.group();
    this.tempoParaNovoPassaro = 0;

    // Mira local e remota
    this.personagemLocal = this.physics.add
      .sprite(100, 100, "mira")
      .setCollideWorldBounds(true);
    this.personagemRemoto = this.add.sprite(100, 100, "mira").setAlpha(0.5);

    // Animações
    this.anims.create({
      key: "voar-direita-pomba-branca",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-esquerda",
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

    this.anims.create({
      key: "voar-direita-pomna-cinza",
      frames: this.anims.generateFrameNumbers("pomba-cinza", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-esquerda",
      frames: this.anims.generateFrameNumbers("pomba-cinza", {
        start: 6,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "queda",
      frames: this.anims.generateFrameNumbers("pomba-cinza-caindo", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });

    this.anims.create({
      key: "voar-direita-corvo",
      frames: this.anims.generateFrameNumbers("corvo", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-esquerda",
      frames: this.anims.generateFrameNumbers("corvo", {
        start: 6,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "queda",
      frames: this.anims.generateFrameNumbers("corvo-caindo", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Spawn de pássaros
    this.spawnPassaro = () => {
      if (this.totalPassarosGerados >= this.maxPassaros) return;
      const y = Phaser.Math.Between(20, 360);
      const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const x = direcao === 1 ? -50 : 850;
      const tipoPassaro =
        Phaser.Math.Between(0, 2) === 0
          ? "pomba-branca"
          : Phaser.Math.Between(0, 1) === 0
          ? "pomba-cinza"
          : "corvo";
      const animacao =
        tipoPassaro === "pomba-branca"
          ? "voar-branca"
          : tipoPassaro === "pomba-cinza"
          ? "voar-cinza"
          : "voar-corvo";
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

    // Textos na tela
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

    // Atualiza pontuação
    this.atualizarPontuacao = (valor) => {
      this.score += valor;
      this.registry.set("score", this.score);
      this.scoreText.setText("Pontuação: " + this.score);
    };

    // Evento para reload ao apertar botão 9 do gamepad
    this.input.gamepad.once("connected", (pad) => {
      this.gamepad = pad;
      pad.on("down", (index) => {
        if (index === 9) {
          location.reload(); // Reload da página
        }
      });
    });

    // === INÍCIO DA INTEGRAÇÃO GOOGLE IDENTITY API ===
    if (window.google && google.accounts) {
      google.accounts.id.initialize({
        client_id: "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com",
        callback: this.handleGoogleCredentialResponse.bind(this),
      });
      google.accounts.id.prompt(); // Prompt para login automático se possível
    } else {
      console.warn(
        "Google Identity API não encontrada. Verifique se o script está incluído no HTML."
      );
    }
  }

  handleGoogleCredentialResponse(response) {
    // Aqui você pode tratar o token JWT retornado pela Google Identity API
    console.log("ID Token:", response.credential);
    // Por exemplo, enviar token para sua API externa para créditos, autenticação, etc
    this.enviarTokenParaAPIExterna(response.credential);
  }

  async enviarTokenParaAPIExterna(token) {
    try {
      const resposta = await fetch("https://sua-api-externa.com/creditos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userToken: token }),
      });
      const dados = await resposta.json();
      console.log("Resposta API externa:", dados);
      // Pode atualizar créditos no jogo aqui se quiser
    } catch (erro) {
      console.error("Erro na API externa:", erro);
    }
  }

  update(time, delta) {
    if (!this.personagemLocal || !this.input.gamepad.total) return;
    const pad = this.input.gamepad.getPad(0);
    const axisH = pad.axes[0].getValue();
    const axisV = pad.axes[1].getValue();
    const botaoTiro = pad.buttons[2].pressed;
    this.personagemLocal.setVelocity(this.speed * axisH, this.speed * axisV);

    if (this.game.dadosJogo && this.game.dadosJogo.readyState === "open") {
      this.game.dadosJogo.send(
        JSON.stringify({
          personagem: { x: this.personagemLocal.x, y: this.personagemLocal.y },
          tiro: botaoTiro,
        })
      );
    }

    if (this.jogadorPrincipal === undefined && this.game.socket) {
      this.jogadorPrincipal =
        this.game.jogadores.primeiro === this.game.socket.id;
    }

    if (this.passaros && this.jogadorPrincipal) {
      const colidiuCom = this.passaros.getChildren().find((passaro) => {
        return (
          Phaser.Geom.Intersects.RectangleToRectangle(
            this.personagemLocal.getBounds(),
            passaro.getBounds()
          ) && !passaro.acertado
        );
      });

      if (colidiuCom && botaoTiro && this.tirosRestantes > 0) {
        colidiuCom.acertado = true;
        colidiuCom.destroy();
        this.fire.play();
        if (colidiuCom.texture.key === "corvo") {
          this.atualizarPontuacao(-5);
        } else {
          this.atualizarPontuacao(10);
        }
        this.passarosRestantes--;
        this.tirosRestantes--;
        this.tirosText.setText("Tiros: " + this.tirosRestantes);
      }
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

    if (this.passarosRestantes === 0 && !this.aguardandoNovaRodada) {
      this.aguardandoNovaRodada = true;
      this.rodadaText.setText("Fase Completa!");
      this.time.delayedCall(2000, () => {
        this.irParaFase5();
      });
    }

    if (this.game.dadosJogo && this.game.dadosJogo.readyState === "open") {
      this.game.dadosJogo.onmessage = ({ data }) => {
        const mensagem = JSON.parse(data);
        if (mensagem.personagem) {
          this.personagemRemoto.setPosition(
            mensagem.personagem.x,
            mensagem.personagem.y
          );
        }
        if (mensagem.tiro && !this.botaoTiroPressionado) {
          this.fire.play();
        }
      };
    }
  }

  irParaFase5() {
    this.scene.stop("fase4");
    this.scene.start("fase5");
  }
}
