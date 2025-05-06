export default class fase1 extends Phaser.Scene {
  constructor () {
    super('fase1');
    this.speed = 200;
    this.score = 0; // Inicializa a pontuação
  }

  init () { }

  preload () {
    this.load.audio('fire', 'assets/fire.mp3');
    this.load.image('mira', 'assets/mira.png');
    this.load.image('background', 'assets/background.png');
    this.load.image('passaro', 'assets/passaro.png');
  }

  create () {
    this.add.image(400, 190, 'background');
    this.fire = this.sound.add('fire');

    // Mira
    this.mira = this.physics.add.sprite(100, 100, 'mira');
    this.mira.setCollideWorldBounds(true);

    // Grupos
    this.passaros = this.physics.add.group();
    this.tempoParaNovoPassaro = 0;

    // Criar pássaros
    this.spawnPassaro = () => {
      const y = Phaser.Math.Between(50, 550);
      const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const x = direcao === 1 ? -50 : 850;

      const passaro = this.passaros.create(x, y, 'passaro');
      passaro.setVelocityX(Phaser.Math.Between(100, 200) * direcao);
      passaro.direcao = direcao;
      passaro.setCollideWorldBounds(false);
    };

    // Texto para exibir a pontuação
    this.scoreText = this.add.text(16, 16, 'Pontuação: 0', {
      fontSize: '32px',
      fill: '#fff',
    });

    // Gamepad
    this.input.gamepad.once('connected', (pad) => {
      this.gamepad = pad;

      pad.on('down', (index) => {
        console.log(index)

        // Reiniciar fase
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

      // Movimenta a mira
      this.mira.setVelocityX(this.speed * axisH);
      this.mira.setVelocityY(this.speed * axisV);
    }

    // Gera novos pássaros
    this.tempoParaNovoPassaro += delta;
    if (this.tempoParaNovoPassaro > 1500) {
      this.tempoParaNovoPassaro = 0;
      this.spawnPassaro();
    }

    // Checar colisão manual entre tiros e pássaros
    this.passaros.getChildren().forEach(passaro => {
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          this.mira.getBounds(),
          passaro.getBounds()
        ) && this.gamepad.buttons[2].pressed) {
        passaro.destroy();
        this.score += 10; // Adiciona 10 pontos
        this.scoreText.setText('Pontuação: ' + this.score); // Atualiza o texto da pontuação
      }
    });

    // Remove pássaros fora da tela
    this.passaros.getChildren().forEach(passaro => {
      if ((passaro.direcao === 1 && passaro.x > 850) ||
        (passaro.direcao === -1 && passaro.x < -50)) {
        passaro.destroy();
      }
    });
  }
}