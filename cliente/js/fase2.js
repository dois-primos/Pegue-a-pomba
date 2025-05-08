export default class fase2 extends Phaser.Scene {
  constructor () {
    super('fase2');
    this.speed = 200;
    this.score = 0;
    this.ultimoTiro = false;
    this.tirosRestantes = 7;
    this.passarosRestantes = 5;
    this.aguardandoNovaRodada = false;
  }

  preload () {
    this.load.audio('fire', 'assets/fire.mp3');
    this.load.image('mira', 'assets/mira.png');
    this.load.image('background', 'assets/background.png');
    this.load.spritesheet('pomba-branca', 'assets/pomba-branca.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create () {
    this.add.image(400, 190, 'background');
    this.fire = this.sound.add('fire');

    this.mira = this.physics.add.sprite(100, 100, 'mira');
    this.mira.setCollideWorldBounds(true);

    this.passaros = this.physics.add.group();
    this.tempoParaNovoPassaro = 0;

    this.anims.create({
      key: 'voar',
      frames: this.anims.generateFrameNumbers('pomba-branca', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.spawnPassaro = () => {
      const y = Phaser.Math.Between(50, 550);
      const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const x = direcao === 1 ? -50 : 850;

      const passaro = this.passaros.create(x, y, 'pomba-branca');
      passaro.setVelocityX(Phaser.Math.Between(100, 200) * direcao);
      passaro.direcao = direcao;
      passaro.setFlipX(direcao === -1); // Inverter sprite se vier da direita
      passaro.anims.play('voar', true);
    };

    for (let i = 0; i < this.passarosRestantes; i++) {
      this.spawnPassaro();
    }

    this.scoreText = this.add.text(16, 16, 'Pontuação: 0', {
      fontSize: '32px',
      fill: '#fff',
    });

    this.tirosText = this.add.text(16, 60, 'Tiros: 7', {
      fontSize: '28px',
      fill: '#fff',
    });

    this.input.gamepad.once('connected', (pad) => {
      this.gamepad = pad;

      pad.on('down', (index) => {
        if (index === 9) {
          this.scene.stop();
          this.scene.start('abertura');
        }
      });
    });
  }

  update (time, delta) {
    if (this.input.gamepad.total > 0) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes[0].getValue();
      const axisV = pad.axes[1].getValue();

      this.mira.setVelocityX(this.speed * axisH);
      this.mira.setVelocityY(this.speed * axisV);

      const botaoTiro = pad.buttons[2].pressed;

      this.passaros.getChildren().forEach(passaro => {
        const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
          this.mira.getBounds(),
          passaro.getBounds()
        );

        if (
          colidiu &&
          botaoTiro &&
          !this.ultimoTiro &&
          this.tirosRestantes > 0
        ) {
          passaro.destroy();
          this.fire.play();
          this.score += 10;
          this.tirosRestantes--;
          this.passarosRestantes--;
          this.scoreText.setText('Pontuação: ' + this.score);
          this.tirosText.setText('Tiros: ' + this.tirosRestantes);
          this.ultimoTiro = true;
        }
      });

      if (botaoTiro && !this.ultimoTiro && this.tirosRestantes > 0) {
        this.fire.play();
        this.tirosRestantes--;
        this.tirosText.setText('Tiros: ' + this.tirosRestantes);
        this.ultimoTiro = true;
      }

      if (!botaoTiro) {
        this.ultimoTiro = false;
      }
    }

    this.passaros.getChildren().forEach(passaro => {
      if ((passaro.direcao === 1 && passaro.x > 850) ||
          (passaro.direcao === -1 && passaro.x < -50)) {
        // Reposiciona para que o jogador tenha outra chance
        const y = Phaser.Math.Between(50, 550);
        const direcao = passaro.direcao;
        const x = direcao === 1 ? -50 : 850;

        passaro.setPosition(x, y);
        passaro.setVelocityX(Phaser.Math.Between(100, 200) * direcao);
      }
    });

    // Se todos os pássaros foram destruídos
    if (this.passarosRestantes === 0) {
      this.scene.start('fase3'); // Troque para a próxima fase desejada
    }

    // Se tiros acabaram e ainda há pássaros vivos
    if (this.tirosRestantes === 0 && this.passarosRestantes > 0) {
      this.scene.restart(); // Reinicia a fase se o jogador falhar
    }
  }
}
