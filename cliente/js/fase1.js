export default class fase1 extends Phaser.Scene {
  constructor () {
    super('fase1');

    this.speed = 200
  }

  init () { }

  preload () {
    this.load.audio('fire', 'assets/fire.mp3');

    this.load.spritesheet('alien', 'assets/alien.png', {
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.spritesheet('botao', 'assets/botao.png', {
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.image('background', 'assets/background.png');
  }

  create () {
    this.fire = this.sound.add('fire');

    // Criando o alien
    this.alien = this.physics.add.sprite(100, 100, 'alien');
    this.alien.setCollideWorldBounds(true); // Impede que o alien saia da tela

    // Animação para andar para a direita
    this.anims.create({
      key: 'andar-direita',
      frames: this.anims.generateFrameNumbers('alien', { start: 260, end: 267 }),
      frameRate: 10,
      repeat: -1
    });

    // Criando o botão
    this.botao = this.physics.add.sprite(400, 400, 'botao');

    // Animação para o botão
    this.anims.create({
      key: 'botao',
      frames: this.anims.generateFrameNumbers('botao', { start: 0, end: 7 }),
      frameRate: 30,
    });

    // Inicializar gamepad
    this.gamepad = null;
  }

  update () {
    // Verificar se o gamepad está conectado
    if (this.input.gamepad.total > 0) {
      // Obtém o primeiro gamepad
      const pad = this.input.gamepad.getPad(0);

      // Movimentação horizontal (eixo X)
      const axisH = pad.axes[0].getValue();
      // Movimentação vertical (eixo Y)
      const axisV = pad.axes[1].getValue();

      // Atualizar a posição do alien com base nos eixos
      this.alien.setVelocityX(this.speed * axisH); // Velocidade horizontal
      this.alien.setVelocityY(this.speed * axisV); // Velocidade vertical

      pad.on('down', (index) => {
        // Botão 9 == (re)start
        if (index === 9) {
          this.scene.stop()
          this.scene.start('abertura');
        }

        // Botão 2 == tiro
        if (index === 2) {
          this.fire.play();
        }
      });
    }
    // this.speed += 0.1
  }
}
