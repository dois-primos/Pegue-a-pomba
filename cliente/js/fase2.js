export default class fase2 extends Phaser.Scene {
  constructor () {
    super('fase2');
    this.speed = 200;
    this.score = 0;
    this.tirosRestantes = 8;
    this.passarosRestantes = 6;
    this.passarosCriados = 0;
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
    this.load.spritesheet('pomba-cinza', 'assets/pomba-cinza.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create () {
    this.add.image(400, 190, 'background');
    this.fire = this.sound.add('fire');
    this.mira = this.physics.add.sprite(100, 100, 'mira').setCollideWorldBounds(true);
    this.passaros = this.physics.add.group();
    this.tempoParaNovoPassaro = 0;

    this.anims.create({
      key: 'voar-branca',
      frames: this.anims.generateFrameNumbers('pomba-branca', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'voar-cinza',
      frames: this.anims.generateFrameNumbers('pomba-cinza', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.spawnPassaro = () => {
      if (this.passarosCriados >= 6) return;

      const y = Phaser.Math.Between(50, 330);
      const direcaoX = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const direcaoY = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const x = direcaoX === 1 ? -50 : 850;

      const tipo = Phaser.Math.Between(0, 1) === 0 ? 'pomba-branca' : 'pomba-cinza';
      const anim = tipo === 'pomba-branca' ? 'voar-branca' : 'voar-cinza';

      const passaro = this.passaros.create(x, y, tipo);
      passaro.setVelocity(
        Phaser.Math.Between(130, 180) * direcaoX,
        Phaser.Math.Between(60, 100) * direcaoY
      );
      passaro.setFlipX(direcaoX === -1);
      passaro.direcao = direcaoX;
      passaro.acertado = false;

      passaro.anims.play(anim, true);
      this.passarosCriados++;
    };

    this.score = this.registry.get('score');
    this.scoreText = this.add.text(16, 16, 'Pontuação: ' + this.score, { fontSize: '32px', fill: '#fff' });
    this.tirosText = this.add.text(16, 60, 'Tiros: ' + this.tirosRestantes, { fontSize: '28px', fill: '#fff' });
    this.rodadaText = this.add.text(400, 300, '', { fontSize: '40px', fill: '#ffff00' }).setOrigin(0.5).setDepth(1);

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
    if (this.input.gamepad.total > 0 && !this.aguardandoNovaRodada) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes[0].getValue();
      const axisV = pad.axes[1].getValue();
      const botaoTiro = pad.buttons[2].pressed;

      this.mira.setVelocity(this.speed * axisH, this.speed * axisV);

      this.passaros.getChildren().forEach(passaro => {
        const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
          this.mira.getBounds(), passaro.getBounds()
        );
        if (colidiu && botaoTiro && !this.ultimoTiro && !passaro.acertado && this.tirosRestantes > 0) {
          passaro.acertado = true;
          passaro.destroy();
          this.fire.play();
          this.score += 10;
          this.passarosRestantes--;
          this.tirosRestantes--;
          this.registry.set('score', this.score);
          this.scoreText.setText('Pontuação: ' + this.registry.get('score'));
          this.tirosText.setText('Tiros: ' + this.tirosRestantes);
          this.ultimoTiro = true;
        }
      });

      if (botaoTiro && !this.ultimoTiro && this.tirosRestantes > 0) {
        this.fire.play();
        this.tirosRestantes--;
        this.registry.set('score', this.score);
        this.tirosText.setText('Tiros: ' + this.tirosRestantes);
        this.ultimoTiro = true;
      }

      if (!botaoTiro) this.ultimoTiro = false;
    }

    this.tempoParaNovoPassaro += delta;
    if (this.tempoParaNovoPassaro > 1500 && this.passarosCriados < 6 && !this.aguardandoNovaRodada) {
      this.tempoParaNovoPassaro = 0;
      this.spawnPassaro();
    }

    this.passaros.getChildren().forEach(passaro => {
      if (passaro.y < 0 || passaro.y > 380) {
        passaro.setVelocityY(-passaro.body.velocity.y);
      }

      if ((passaro.x < -60 || passaro.x > 860) && !passaro.acertado) {
        passaro.destroy();
        if (this.passarosCriados < 6) {
          this.spawnPassaro();
        }
      }
    });

    if (this.passarosRestantes === 0 && !this.aguardandoNovaRodada) {
      this.aguardandoNovaRodada = true;
      this.rodadaText.setText('Fase Completa!');
      this.time.delayedCall(2000, () => this.finalizar());
    }
  }

  finalizar () {
    this.scene.stop('fase2');
    this.scene.start('finalfeliz'); // ou uma próxima fase
  }
}