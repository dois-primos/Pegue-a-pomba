export default class fase1 extends Phaser.Scene {

  constructor () {
    super('fase1');
  }

  init () { }

  preload () {
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
    this.alien = this.physics.add.sprite(100, 100, 'alien');

    this.anims.create({
      key: 'andar-direita',
      frames: this.anims.generateFrameNumbers('alien', { start: 260, end: 267 }),
      frameRate: 10,
      repeat: -1
    })

    this.botao = this.physics.add.sprite(400, 400, 'botao')

    this.anims.create({
      key: 'botao',
      frames: this.anims.generateFrameNumbers('botao', { start: 0, end: 7 }),
      frameRate: 30,
    })

    this.botao
      .setInteractive()
      .on('pointerdown', () => {
        this.botao.play('botao')
        this.alien.play('andar-direita')
        this.alien.setVelocityX(100);

      })
  }

  update () { }
}